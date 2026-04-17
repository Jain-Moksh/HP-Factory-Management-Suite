const reportService = require('../services/reportService');

const reportController = {
  getPartyStock: async (req, res, next) => {
    try {
      const data = await reportService.getPartyStock();
      res.json({ success: true, count: data.length, data });
    } catch (err) {
      next(err);
    }
  },

  getPartySales: async (req, res, next) => {
    try {
      const { from, to } = req.query;
      const data = await reportService.getPartySales(from, to);
      res.json({ success: true, count: data.length, data });
    } catch (err) {
      next(err);
    }
  },

  getGroupSales: async (req, res, next) => {
    try {
      const { from, to } = req.query;
      const data = await reportService.getGroupSales(from, to);
      res.json({ success: true, count: data.length, data });
    } catch (err) {
      next(err);
    }
  },

  getJobWork: async (req, res, next) => {
    try {
      const { from, to } = req.query;
      const data = await reportService.getJobWork(from, to);
      res.json({ success: true, count: data.length, data });
    } catch (err) {
      next(err);
    }
  },

  getPartyStockSummary: async (req, res, next) => {
    try {
      const { client_id, from, to } = req.query;
      if (!client_id) return res.status(400).json({ success: false, message: "client_id is required" });
      const data = await reportService.getPartyStockSummary(client_id, from, to);
      res.json({ success: true, count: data.length, data });
    } catch (err) {
      next(err);
    }
  },

  getPartyStockDetail: async (req, res, next) => {
    try {
      const { client_id, item_id, from, to } = req.query;
      if (!client_id || !item_id) return res.status(400).json({ success: false, message: "client_id and item_id are required" });
      const data = await reportService.getPartyStockDetail(client_id, item_id, from, to);
      // Construct the response as expected
      const result = {
        item_name: data.length > 0 ? "" : "", // We can fetch item_name separately if needed, but for now just send data
        transactions: data,
        total_quantity: data.reduce((sum, t) => sum + parseFloat(t.quantity), 0)
      };
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = reportController;
