const purchaseService = require('../services/purchaseService');

const purchaseController = {
  create: async (req, res, next) => {
    try {
      const data = await purchaseService.create(req.body);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  getById: async (req, res, next) => {
    try {
      const data = await purchaseService.getById(req.params.id);
      if (!data) {
        return res.status(404).json({ success: false, message: 'Purchase record not found' });
      }
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  getAll: async (req, res, next) => {
    try {
      const data = await purchaseService.getAll();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  getNextId: async (req, res, next) => {
    try {
      const { date } = req.query;
      const data = await purchaseService.getNextId(date);
      res.json({ success: true, nextId: data });
    } catch (err) {
      next(err);
    }
  },

  delete: async (req, res, next) => {
    try {
      await purchaseService.delete(req.params.id);
      res.json({ success: true, message: 'Purchase record deleted successfully' });
    } catch (err) {
      next(err);
    }
  },

  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      const data = await purchaseService.update(id, req.body);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = purchaseController;
