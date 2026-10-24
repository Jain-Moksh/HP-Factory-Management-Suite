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

      // 1. Create the Group
      const groupRes = await client.query(groupQueries.createGroup, [toUpperCase(name), toUpperCase(description)]);
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
      await auditService.record(client, {
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

      const snapshot = await loadSnapshot(client, id);
      if (!snapshot) {
        await client.query('ROLLBACK');
        return null;
      }

      const result = await client.query(groupQueries.deleteGroup, [id]);

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
