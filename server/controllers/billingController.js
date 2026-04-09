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
  }
};

module.exports = billingController;
