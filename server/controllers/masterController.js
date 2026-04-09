const masterService = require('../services/masterService');

const masterController = (table) => ({
  list: async (req, res, next) => {
    try {
      const { search } = req.query;
      const data = await masterService.list(table, search);
      res.json({ success: true, count: data.length, data });
    } catch (err) {
      next(err);
    }
  },

  getById: async (req, res, next) => {
    try {
      const data = await masterService.getById(table, req.params.id);
      if (!data) {
        return res.status(404).json({ success: false, message: 'Record not found' });
      }
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  create: async (req, res, next) => {
    try {
      const data = await masterService.create(table, req.body);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  update: async (req, res, next) => {
    try {
      const data = await masterService.update(table, req.params.id, req.body);
      if (!data) {
        return res.status(404).json({ success: false, message: 'Record not found' });
      }
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
});

module.exports = {
  items: masterController('items'),
  clients: masterController('clients'),
  jobbers: masterController('jobbers'),
  transporters: masterController('transporters')
};
