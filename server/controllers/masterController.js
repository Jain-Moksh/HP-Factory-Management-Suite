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
  },

  delete: async (req, res, next) => {
    try {
      const { password } = req.body;
      const { id } = req.params;

      if (!password || password !== process.env.del_pass) {
        return res.status(401).json({ success: false, message: 'Invalid password' });
      }

      const queryKey = `delete${table.charAt(0).toUpperCase() + table.slice(1).replace(/s$/, '')}`;
      const result = await require('../config/db').query(require('../queries/masterQueries')[queryKey], [id]);
      
      if (result.rowCount === 0) {
        return res.status(404).json({ success: false, message: 'Record not found' });
      }

      res.json({ success: true, message: 'Record deleted successfully' });
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
