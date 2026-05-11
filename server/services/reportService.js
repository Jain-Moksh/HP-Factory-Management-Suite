const db = require('../config/db');
const queries = require('../queries/reportQueries');

const reportService = {
  getPartyStock: async () => {
    const result = await db.query(queries.getPartyStock);
    return result.rows;
  },

  getPartySales: async (fromDate, toDate, clientId) => {
    const result = await db.query(queries.getPartySales, [fromDate || null, toDate || null, clientId || null]);
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
  },

  getJobWorkSummary: async (jobberId, fromDate, toDate) => {
    const result = await db.query(queries.getJobWorkSummary, [jobberId, fromDate || null, toDate || null]);
    return result.rows;
  },

  getJobWorkDetail: async (jobberId, itemId, fromDate, toDate) => {
    const detail = await db.query(queries.getJobWorkDetail, [jobberId, itemId, fromDate || null, toDate || null]);
    const item = await db.query('SELECT name FROM items WHERE id = $1', [itemId]);
    
    return {
      item_name: item.rows[0]?.name || 'Unknown',
      transactions: detail.rows,
      total_quantity: detail.rows.reduce((sum, t) => sum + parseFloat(t.quantity), 0)
    };
  },

  getDayBook: async (date) => {
    const result = await db.query(queries.getDayBook, [date]);
    return result.rows;
  },

  getDetailJobReport: async (startDate, endDate) => {
    const result = await db.query(queries.getDetailJobReport, [startDate, endDate]);
    return result.rows;
  },

  getJobSummaryReport: async (fromDate, toDate) => {
    const result = await db.query(queries.getJobSummaryReport, [fromDate || null, toDate || null]);
    return result.rows;
  },

  getItemSoldSummary: async (fromDate, toDate) => {
    const result = await db.query(queries.getItemSoldSummary, [fromDate || null, toDate || null]);
    return result.rows;
  }
};

module.exports = reportService;
