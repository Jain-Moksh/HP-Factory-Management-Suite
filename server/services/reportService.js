const db = require('../config/db');
const queries = require('../queries/reportQueries');

const reportService = {
  getPartyStock: async () => {
    const result = await db.query(queries.getPartyStock);
    return result.rows;
  },

  getPartySales: async (fromDate, toDate) => {
    const result = await db.query(queries.getPartySales, [fromDate || null, toDate || null]);
    return result.rows;
  },

  getGroupSales: async (fromDate, toDate) => {
    const result = await db.query(queries.getGroupSales, [fromDate || null, toDate || null]);
    return result.rows;
  },

  getJobWork: async (fromDate, toDate) => {
    const result = await db.query(queries.getJobWorkReport, [fromDate || null, toDate || null]);
    return result.rows;
  },

  getPartyStockSummary: async (clientId, fromDate, toDate) => {
    const result = await db.query(queries.getPartyStockSummary, [clientId, fromDate || null, toDate || null]);
    return result.rows;
  },

  getPartyStockDetail: async (clientId, itemId, fromDate, toDate) => {
    const result = await db.query(queries.getPartyStockDetail, [clientId, itemId, fromDate || null, toDate || null]);
    return result.rows;
  },

  getGroupSalesSummary: async (groupId, fromDate, toDate) => {
    const result = await db.query(queries.getGroupSalesSummary, [groupId, fromDate || null, toDate || null]);
    return result.rows;
  },

  getPartyBillingDetail: async (clientId, fromDate, toDate) => {
    const detail = await db.query(queries.getPartyBillingDetail, [clientId, fromDate || null, toDate || null]);
    const client = await db.query('SELECT name FROM clients WHERE id = $1', [clientId]);
    
    return {
      client_name: client.rows[0]?.name || 'Unknown',
      transactions: detail.rows,
      total_amount: detail.rows.reduce((sum, t) => sum + parseFloat(t.amount), 0)
    };
  }
};

module.exports = reportService;
