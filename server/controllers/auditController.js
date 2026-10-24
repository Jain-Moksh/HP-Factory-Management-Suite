const auditService = require('../services/auditService');

const auditController = {
  list: async (req, res, next) => {
    try {
      const data = await auditService.list(req.query);
      res.json({ success: true, ...data });
    } catch (err) {
      next(err);
    }
  },

  getModuleCounts: async (req, res, next) => {
    try {
      const data = await auditService.getModuleCounts(req.query);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  getDevices: async (req, res, next) => {
    try {
      const data = await auditService.getDevices();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  getById: async (req, res, next) => {
    try {
      const data = await auditService.getById(req.params.id);
      if (!data) {
        return res.status(404).json({ success: false, message: 'Audit log entry not found' });
      }
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  listArchived: async (req, res, next) => {
    try {
      const data = await auditService.listArchived(req.query);
      res.json({ success: true, count: data.length, data });
    } catch (err) {
      next(err);
    }
  },

  getArchivedById: async (req, res, next) => {
    try {
      const data = await auditService.getArchivedById(req.params.id);
      if (!data) {
        return res.status(404).json({ success: false, message: 'Archived record not found' });
      }
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  // Lets the Audit page show which name this device is currently recorded under
  whoAmI: async (req, res) => {
    const { getRequestContext, resolveHostname } = require('../utils/requestContext');
    const ctx = getRequestContext();
    const hostname = await resolveHostname(ctx.ip);
    res.json({ success: true, data: { ...ctx, hostname, userAgent: undefined } });
  }
};

module.exports = auditController;
