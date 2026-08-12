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
      const { date, purchase_id } = req.query;
      const data = await purchaseService.getNextId(date, purchase_id);
      res.json({ success: true, nextId: data });
    } catch (err) {
      next(err);
    }
  },

  getNextChallan: async (req, res, next) => {
    try {
      const { date, purchase_id } = req.query;
      const challan_no = await purchaseService.getNextChallan(date, purchase_id);
      res.json({ success: true, challan_no });
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
  },

  getByChallanNo: async (req, res, next) => {
    try {
      const { challanNo } = req.query;
      const data = await purchaseService.getByChallanNo(challanNo);
      if (!data) {
        return res.status(404).json({ success: false, message: 'Purchase record not found for this challan number.' });
      }
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = purchaseController;
