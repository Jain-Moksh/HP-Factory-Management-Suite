const masterService = require('../services/masterService');
const jobberService = require('../services/jobberService');

// Basic CRUD from master logic
const baseController = require('./masterController').jobbers;

const jobberController = {
  ...baseController,

  assignItems: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { item_ids } = req.body;

      if (!Array.isArray(item_ids)) {
        return res.status(400).json({ success: false, message: 'item_ids must be an array' });
      }

      const data = await jobberService.assignItems(id, item_ids);
      res.status(201).json({ 
        success: true, 
        message: 'Items assigned successfully',
        data 
      });
    } catch (err) {
      next(err);
    }
  },

  getAssignedItems: async (req, res, next) => {
    try {
      const { id } = req.params;
      const data = await jobberService.getAssignedItems(id);
      res.json({ success: true, count: data.length, data });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = jobberController;
