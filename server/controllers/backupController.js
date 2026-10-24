const backupService = require('../services/backupService');
const auditService = require('../services/auditService');

const pick = (obj, keys) => keys.reduce((acc, k) => ({ ...acc, [k]: obj ? obj[k] : null }), {});

const BACKUP_FIELDS = ['auto_backup_enabled', 'auto_backup_path', 'auto_backup_interval'];
const FTP_FIELDS = ['ftp_backup_enabled', 'ftp_host', 'ftp_port', 'ftp_username', 'ftp_password', 'ftp_path'];

// The FTP password is never written to the audit log, only whether it changed
const maskFtp = (settings) => ({ ...settings, ftp_password: settings.ftp_password ? '********' : null });
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
      const before = pick(await backupService.getSettingsInternal(), BACKUP_FIELDS);
      const settings = await backupService.updateSettings(req.body);
      const after = pick(settings, BACKUP_FIELDS);
      const changes = auditService.diffFields(before, after);
      await auditService.recordSafe({
        module: auditService.MODULES.SYSTEM,
        action: auditService.ACTIONS.UPDATE,
        recordId: 1,
        reference: 'AUTO BACKUP SETTINGS',
        summary: `Auto backup settings updated: ${auditService.describeUpdate(changes)}`,
        details: { before, after, changes }
      });
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
      const rawBefore = pick(await backupService.getSettingsInternal(), FTP_FIELDS);
      const settings = await backupService.updateFtpSettings(req.body);
      const rawAfter = pick(settings, FTP_FIELDS);
      const before = maskFtp(rawBefore);
      const after = maskFtp(rawAfter);
      const changes = auditService.diffFields(before, after);
      if (rawBefore.ftp_password !== rawAfter.ftp_password) {
        changes.push({ field: 'ftp_password', from: '********', to: 'changed' });
      }
      await auditService.recordSafe({
        module: auditService.MODULES.SYSTEM,
        action: auditService.ACTIONS.UPDATE,
        recordId: 1,
        reference: 'FTP BACKUP SETTINGS',
        summary: `FTP backup settings updated: ${auditService.describeUpdate(changes)}`,
        details: { before, after, changes }
      });
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

      // Logged after the restore, since restoring replaces audit_logs with the backup's copy
      await auditService.recordSafe({
        module: auditService.MODULES.SYSTEM,
        action: auditService.ACTIONS.RESTORE,
        reference: req.file.originalname,
        summary: `Database restored from backup file ${req.file.originalname}`,
        details: { after: { file_name: req.file.originalname, file_size_bytes: req.file.size } }
      });

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
