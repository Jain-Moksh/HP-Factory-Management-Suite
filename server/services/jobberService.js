const db = require('../config/db');
const masterQueries = require('../queries/masterQueries');

const jobberService = {
  assignItems: async (jobberId, itemIds) => {
    // Bulk insert with duplicate prevention
    const query = `
      INSERT INTO jobber_items (jobber_id, item_id)
      SELECT $1, t.item_id
      FROM unnest($2::int[]) AS t(item_id)
      WHERE NOT EXISTS (
          SELECT 1 FROM jobber_items ji 
          WHERE ji.jobber_id = $1 AND ji.item_id = t.item_id
      )
      RETURNING *
    `;
    const result = await db.query(query, [jobberId, itemIds]);
    return result.rows;
  },

  getAssignedItems: async (jobberId) => {
    const result = await db.query(masterQueries.getJobberItems, [jobberId]);
    return result.rows;
  }
};

module.exports = jobberService;
