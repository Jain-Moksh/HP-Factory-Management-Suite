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
  }
};

module.exports = purchaseController;
