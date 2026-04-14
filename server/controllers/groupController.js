const groupService = require('../services/groupService');

const groupController = {
  getAll: async (req, res, next) => {
    try {
      const data = await groupService.getAllGroups();
      res.json({ success: true, count: data.length, data });
    } catch (err) {
      next(err);
    }
  },

  getSingle: async (req, res, next) => {
    try {
      const { id } = req.params;
      const data = await groupService.getGroupById(id);
      if (!data) return res.status(404).json({ success: false, message: 'Group not found' });
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  create: async (req, res, next) => {
    try {
      const { name, description, members } = req.body;
      if (!name) return res.status(400).json({ success: false, message: 'Group name is required' });
      
      const data = await groupService.createGroup(name, description, members);
      res.status(201).json({ success: true, message: 'Group created successfully', data });
    } catch (err) {
      next(err);
    }
  },

  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { name, description, members } = req.body;
      if (!name) return res.status(400).json({ success: false, message: 'Group name is required' });
      
      const data = await groupService.updateGroup(id, name, description, members);
      res.json({ success: true, message: 'Group updated successfully', data });
    } catch (err) {
      next(err);
    }
  },

  delete: async (req, res, next) => {
    try {
      const { id } = req.params;
      const data = await groupService.deleteGroup(id);
      if (!data) return res.status(404).json({ success: false, message: 'Group not found' });
      res.json({ success: true, message: 'Group deleted successfully', data });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = groupController;
