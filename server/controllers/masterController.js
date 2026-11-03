const masterService = require('../services/masterService');
const { isValidDeletePassword } = require('../utils/deletePassword');
const auditService = require('../services/auditService');

// Audit module of each master table
const TABLE_MODULES = {
  items: auditService.MODULES.ITEM,
  clients: auditService.MODULES.PARTY,
  jobbers: auditService.MODULES.JOBBER,
  transporters: auditService.MODULES.TRANSPORTER
};

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
      const { password } = req.body || {};
      const { id } = req.params;

      if (!isValidDeletePassword(password)) {
        await auditService.recordDeniedDelete(TABLE_MODULES[table], id);
        return res.status(401).json({ success: false, message: 'Invalid password' });
      }

      const deleted = await masterService.delete(table, id);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Record not found' });
      }

      res.json({ success: true, message: 'Record deleted and archived successfully' });
    } catch (err) {
      if (err.code === '23503') {
        return res.status(400).json({ 
          success: false, 
          message: `Cannot delete this ${table.replace(/s$/, '')} as it is currently being used in existing transactions (Bills/Purchases).` 
        });
      }
      next(err);
    }
  }
});

const getItemTransactions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { from, to } = req.query;
    const data = await masterService.getItemTransactions(id, from, to);
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    next(err);
  }
};

// GET /items/stock-check (all mismatched items) or /items/:id/stock-check (one item)
const getStockCheck = async (req, res, next) => {
  try {
    const itemId = req.params.id ? parseInt(req.params.id, 10) : null;
    if (req.params.id && isNaN(itemId)) {
      return res.status(400).json({ success: false, message: 'Invalid item id' });
    }
    const data = await masterService.getStockCheck(itemId);
    res.json({ success: true, count: data.length, data: itemId ? (data[0] || null) : data });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  items: masterController('items'),
  clients: masterController('clients'),
  jobbers: masterController('jobbers'),
  transporters: masterController('transporters'),
  getItemTransactions,
  getStockCheck
};
