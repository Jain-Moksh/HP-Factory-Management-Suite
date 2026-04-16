const db = require('../config/db');
const groupQueries = require('../queries/groupQueries');
const { toUpperCase } = require('../utils/dataSanitizer');

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
    const result = await db.query(groupQueries.deleteGroup, [id]);
    return result.rows[0];
  }
};

module.exports = groupService;
