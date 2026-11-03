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
      const cleanName = (toUpperCase(name) || '').trim();
      if (!cleanName) {
        const err = new Error('Group name is required.');
        err.status = 400;
        throw err;
      }
      const existing = await client.query('SELECT id FROM groups WHERE UPPER(TRIM(name)) = $1 LIMIT 1', [cleanName]);
      if (existing.rows.length > 0) {
        const err = new Error(`A group named ${cleanName} already exists.`);
        err.status = 400;
        throw err;
      }

      // 1. Create the Group
      const groupRes = await client.query(groupQueries.createGroup, [cleanName, toUpperCase(description)]);
      const group = groupRes.rows[0];

      // 2. Add Members
      if (members && Array.isArray(members)) {
        for (const member of members) {
          const { member_type, member_id } = member;
          
          // Validation
          if (member_type === 'jobber') {
            const check = await client.query(groupQueries.checkJobberExists, [member_id]);
            if (check.rows.length === 0) throw new Error(`Jobber with ID ${member_id} does not exist`);
          } else if (member_type === 'client') {
            const check = await client.query(groupQueries.checkClientExists, [member_id]);
            if (check.rows.length === 0) throw new Error(`Client with ID ${member_id} does not exist`);
          } else {
            throw new Error(`Invalid member type: ${member_type}`);
          }

          // Insert Member
          await client.query(groupQueries.addMember, [group.id, member_type, member_id]);
        }
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
      throw err;
    } finally {
      client.release();
    }
  },

  updateGroup: async (id, name, description, members) => {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // Lock the group so two saves of it run one after the other
      await client.query('SELECT id FROM groups WHERE id = $1 FOR UPDATE', [id]);
      const before = await loadSnapshot(client, id);

      // 1. Update Group Info
      const groupRes = await client.query(groupQueries.updateGroup, [toUpperCase(name), toUpperCase(description), id]);
      if (groupRes.rows.length === 0) throw new Error(`Group with ID ${id} not found`);
      const group = groupRes.rows[0];

      // 2. Delete Old Members
      await client.query(groupQueries.deleteMembersByGroupId, [id]);

      // 3. Add New Members
      if (members && Array.isArray(members)) {
        for (const member of members) {
          const { member_type, member_id } = member;
          
          // Validation
          if (member_type === 'jobber') {
            const check = await client.query(groupQueries.checkJobberExists, [member_id]);
            if (check.rows.length === 0) throw new Error(`Jobber with ID ${member_id} does not exist`);
          } else if (member_type === 'client') {
            const check = await client.query(groupQueries.checkClientExists, [member_id]);
            if (check.rows.length === 0) throw new Error(`Client with ID ${member_id} does not exist`);
          } else {
            throw new Error(`Invalid member type: ${member_type}`);
          }

          // Insert Member
          await client.query(groupQueries.addMember, [id, member_type, member_id]);
        }
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
      throw err;
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
