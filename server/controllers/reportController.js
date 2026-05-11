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
      const { from, to, client_id } = req.query;
      const data = await reportService.getPartySales(from, to, client_id);
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
  },

  getGroupSalesSummary: async (req, res, next) => {
    try {
      const { group_id, from, to } = req.query;
      if (!group_id) return res.status(400).json({ success: false, message: "group_id is required" });
      const data = await reportService.getGroupSalesSummary(group_id, from, to);
      res.json({ success: true, count: data.length, data });
    } catch (err) {
      next(err);
    }
  },

  getPartyBillingDetail: async (req, res, next) => {
    try {
      const { client_id, from, to } = req.query;
      if (!client_id) return res.status(400).json({ success: false, message: "client_id is required" });
      const data = await reportService.getPartyBillingDetail(client_id, from, to);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  getJobWorkSummary: async (req, res, next) => {
    try {
      const { jobber_id, from, to } = req.query;
      if (!jobber_id) return res.status(400).json({ success: false, message: "jobber_id is required" });
      const data = await reportService.getJobWorkSummary(jobber_id, from, to);
      res.json({ success: true, count: data.length, data });
    } catch (err) {
      next(err);
    }
  },

  getJobWorkDetail: async (req, res, next) => {
    try {
      const { jobber_id, item_id, from, to } = req.query;
      if (!jobber_id || !item_id) return res.status(400).json({ success: false, message: "jobber_id and item_id are required" });
      const data = await reportService.getJobWorkDetail(jobber_id, item_id, from, to);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  getDayBook: async (req, res, next) => {
    try {
      const { date } = req.query;
      if (!date) return res.status(400).json({ success: false, message: "date is required" });
      const data = await reportService.getDayBook(date);
      res.json({ success: true, count: data.length, data });
    } catch (err) {
      next(err);
    }
  },

  getDetailJobReport: async (req, res, next) => {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) return res.status(400).json({ success: false, message: "startDate and endDate are required" });
      const data = await reportService.getDetailJobReport(startDate, endDate);
      res.json({ success: true, count: data.length, data });
    } catch (err) {
      next(err);
    }
  },

  getJobSummaryReport: async (req, res, next) => {
    try {
      const { from, to } = req.query;
      const data = await reportService.getJobSummaryReport(from, to);
      res.json({ success: true, count: data.length, data });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = reportController;
