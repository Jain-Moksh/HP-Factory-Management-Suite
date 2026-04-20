const billingService = require('../services/billingService');

const billingController = {
  create: async (req, res, next) => {
    try {
      const data = await billingService.create(req.body);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  getById: async (req, res, next) => {
    try {
      const data = await billingService.getById(req.params.id);
      if (!data) {
        return res.status(404).json({ success: false, message: 'Bill not found' });
      }
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  getAll: async (req, res, next) => {
    try {
      const data = await billingService.getAll();
      res.json({ success: true, count: data.length, data });
    } catch (err) {
      next(err);
    }
  },

  delete: async (req, res, next) => {
    try {
      const { password } = req.body;
      if (password !== process.env.del_pass) {
        return res.status(401).json({ success: false, message: 'Fail to delete' });
      }
      const data = await billingService.delete(req.params.id);
      if (!data) {
        return res.status(404).json({ success: false, message: 'Bill not found' });
      }
      res.json({ success: true, message: 'Bill deleted successfully', data });
    } catch (err) {
      next(err);
    }
  },

  getNextId: async (req, res, next) => {
    try {
      const { date, billing_id } = req.query;
      const nextId = await billingService.getNextId(date, billing_id);
      res.json({ success: true, nextId });
    } catch (err) {
      next(err);
    }
  },

  getNextChallan: async (req, res, next) => {
    try {
      const { date, billing_id } = req.query;
      const challan_no = await billingService.getNextChallan(date, billing_id);
      res.json({ success: true, challan_no });
    } catch (err) {
      next(err);
    }
  },

  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      const data = await billingService.update(id, req.body);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = billingController;
