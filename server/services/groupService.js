const db = require('../config/db');
const groupQueries = require('../queries/groupQueries');
const { toUpperCase } = require('../utils/dataSanitizer');
const auditService = require('./auditService');

const loadSnapshot = async (executor, id) => {
  const res = await executor.query(groupQueries.getGroupById, [id]);
  if (res.rows.length === 0) return null;
  const { members, ...group } = res.rows[0];
  // Member list is kept as readable names so the diff shows who joined / left
  return { ...group, members: members.map(m => `${m.name} (${m.member_type})`).sort().join(', ') };
};

const httpError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

// 23505 unique_violation: the name index caught a duplicate that another PC saved at the same moment
const duplicateNameToBadRequest = (err) => (
  err.code === '23505' ? httpError(400, 'A group with this name already exists.') : err
);

/**
 * Uppercased, trimmed group name; refuses an empty one.
 * @throws {Error} 400 when the name is missing or only spaces
 */
const cleanGroupName = (name) => {
  const cleanName = (toUpperCase(typeof name === 'string' ? name : '') || '').trim();
  if (!cleanName) throw httpError(400, 'Group name is required.');
  return cleanName;
};

/**
 * Refuses a name already used by another group, ignoring case and spaces.
 * Called after LOCK TABLE groups, so two saves on different PCs check one after the other.
 */
const ensureUniqueGroupName = async (client, cleanName, excludeId = null) => {
  const existing = await client.query(
    'SELECT id FROM groups WHERE UPPER(TRIM(name)) = $1 AND ($2::INT IS NULL OR id <> $2) LIMIT 1',
    [cleanName, excludeId]
  );
  if (existing.rows.length > 0) throw httpError(400, `A group named ${cleanName} already exists.`);
};

/**
 * Checks every member before any is saved: known type, record exists, and not listed twice.
 * @throws {Error} 400 naming the first bad member
 */
const validateMembers = async (client, members) => {
  if (members === undefined || members === null) return [];
  if (!Array.isArray(members)) throw httpError(400, 'Members must be a list.');

  const seen = new Set();
  for (const member of members) {
    const { member_type, member_id } = member || {};
    if (member_type === 'jobber') {
      const check = await client.query(groupQueries.checkJobberExists, [member_id]);
      if (check.rows.length === 0) throw httpError(400, `Jobber with ID ${member_id} does not exist.`);
    } else if (member_type === 'client') {
      const check = await client.query(groupQueries.checkClientExists, [member_id]);
      if (check.rows.length === 0) throw httpError(400, `Client with ID ${member_id} does not exist.`);
    } else {
      throw httpError(400, `Invalid member type: ${member_type}`);
    }

    const key = `${member_type}:${Number(member_id)}`;
    if (seen.has(key)) throw httpError(400, `The same ${member_type} (ID ${member_id}) is listed twice in this group.`);
    seen.add(key);
  }
  return members;
};

const groupService = {
  getAllGroups: async () => {
    const result = await db.query(groupQueries.getAllGroups);
    return result.rows;
  },

  getGroupById: async (id) => {
    const result = await db.query(groupQueries.getGroupById, [id]);
    return result.rows[0];
  },

  createGroup: async (name, description, members) => {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // A double-clicked Save (or the same name typed on two PCs) must not create two groups.
      // The lock makes simultaneous creates check the name one after the other.
      await client.query('LOCK TABLE groups IN SHARE ROW EXCLUSIVE MODE');
      const cleanName = cleanGroupName(name);
      await ensureUniqueGroupName(client, cleanName);
      const validMembers = await validateMembers(client, members);

      // 1. Create the Group
      const groupRes = await client.query(groupQueries.createGroup, [cleanName, toUpperCase(description)]);
      const group = groupRes.rows[0];

      // 2. Add Members
      for (const { member_type, member_id } of validMembers) {
        await client.query(groupQueries.addMember, [group.id, member_type, member_id]);
      }

      const snapshot = await loadSnapshot(client, group.id);
      const memberCount = (members || []).length;
      await auditService.record(client, {
        module: auditService.MODULES.GROUP,
        action: auditService.ACTIONS.CREATE,
        recordId: group.id,
        reference: group.name,
        summary: `Group ${group.name} created with ${memberCount} member${memberCount === 1 ? '' : 's'}`,
        details: { after: snapshot }
      });

      await client.query('COMMIT');
      return group;
    } catch (err) {
      await client.query('ROLLBACK');
      throw duplicateNameToBadRequest(err);
    } finally {
      client.release();
    }
  },

  updateGroup: async (id, name, description, members) => {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // Same table lock as create, so a rename and a create of the same name can't both pass the check
      await client.query('LOCK TABLE groups IN SHARE ROW EXCLUSIVE MODE');
      const lockRes = await client.query('SELECT id FROM groups WHERE id = $1 FOR UPDATE', [id]);
      if (lockRes.rows.length === 0) throw httpError(404, 'This group no longer exists. It may have been deleted on another PC.');
      const before = await loadSnapshot(client, id);

      // Renaming follows the same rules as creating: trimmed, not empty, not used by another group
      const cleanName = cleanGroupName(name);
      await ensureUniqueGroupName(client, cleanName, id);
      const validMembers = await validateMembers(client, members);

      // 1. Update Group Info
      const groupRes = await client.query(groupQueries.updateGroup, [cleanName, toUpperCase(description), id]);
      const group = groupRes.rows[0];

      // 2. Delete Old Members
      await client.query(groupQueries.deleteMembersByGroupId, [id]);

      // 3. Add New Members
      for (const { member_type, member_id } of validMembers) {
        await client.query(groupQueries.addMember, [id, member_type, member_id]);
      }

      const after = await loadSnapshot(client, id);
      const changes = auditService.diffFields(before, after);
      if (!auditService.isUnchanged(changes)) await auditService.record(client, {
        module: auditService.MODULES.GROUP,
        action: auditService.ACTIONS.UPDATE,
        recordId: Number(id),
        reference: after.name,
        summary: `Group ${after.name} updated: ${auditService.describeUpdate(changes)}`,
        details: { before, after, changes }
      });

      await client.query('COMMIT');
      return group;
    } catch (err) {
      await client.query('ROLLBACK');
      throw duplicateNameToBadRequest(err);
    } finally {
      client.release();
    }
  },

  deleteGroup: async (id) => {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const lockRes = await client.query('SELECT id FROM groups WHERE id = $1 FOR UPDATE', [id]);
      const snapshot = lockRes.rows.length ? await loadSnapshot(client, id) : null;
      if (!snapshot) {
        await client.query('ROLLBACK');
        return null;
      }

      const result = await client.query(groupQueries.deleteGroup, [id]);
      if (result.rowCount !== 1) {
        await client.query('ROLLBACK');
        return null;
      }

      await auditService.archiveAndRecord(client, {
        module: auditService.MODULES.GROUP,
        recordId: snapshot.id,
        reference: snapshot.name,
        partyName: snapshot.name,
        summary: `Group ${snapshot.name} deleted and archived`,
        snapshot
      });

      await client.query('COMMIT');
      return result.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
};

module.exports = groupService;
