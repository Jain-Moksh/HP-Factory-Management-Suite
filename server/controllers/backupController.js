const backupService = require('../services/backupService');
const path = require('path');
const fs = require('fs');

const backupController = {
  getSettings: async (req, res, next) => {
    try {
      const settings = await backupService.getSettings();
      res.json(settings);
    } catch (err) {
      next(err);
    }
  },

  updateSettings: async (req, res, next) => {
    try {
      const settings = await backupService.updateSettings(req.body);
      res.json(settings);
    } catch (err) {
      next(err);
    }
  },

  getFtpSettings: async (req, res, next) => {
    try {
      const settings = await backupService.getFtpSettings();
      res.json(settings);
    } catch (err) {
      next(err);
    }
  },

  updateFtpSettings: async (req, res, next) => {
    try {
      const settings = await backupService.updateFtpSettings(req.body);
      res.json(settings);
    } catch (err) {
      next(err);
    }
  },

  manualBackup: async (req, res, next) => {
    try {
      await backupService.streamManualBackup(res);
    } catch (err) {
      next(err);
    }
  },

  restore: async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No backup file uploaded' });
      }

      const filePath = req.file.path;
      const originalName = req.file.originalname.toLowerCase();
      
      // Validate file extension based on original name
      if (!originalName.endsWith('.sql') && !originalName.endsWith('.backup')) {
        fs.unlinkSync(filePath); // Delete invalid file
        return res.status(400).json({ success: false, message: 'Invalid file type. Only .sql and .backup files are allowed.' });
      }

      await backupService.restore(filePath);
      
      // Clean up uploaded file after restore
      fs.unlinkSync(filePath);

      res.json({ success: true, message: 'Database restored successfully' });
    } catch (err) {
      // Clean up if error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      next(err);
    }
  },

  getStatus: async (req, res, next) => {
    try {
      const settings = await backupService.getSettings();
      res.json({
        last_backup_time: settings.last_backup_time,
        last_backup_file: settings.last_backup_file
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = backupController;
