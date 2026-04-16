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
  }
};

module.exports = reportController;
