const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backupController');
let multer;
try {
  multer = require('multer');
} catch (e) {
  console.warn('Multer not found. Restore functionality will be limited until npm install multer is run.');
}

// Multer config for restore upload
const upload = multer ? multer({ dest: 'uploads/backups/' }) : { single: () => (req, res, next) => next() };

// Ensure upload directory exists
const uploadDir = 'uploads/backups/';
const fs = require('fs');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

router.get('/manual', backupController.manualBackup);
router.get('/settings', backupController.getSettings);
router.put('/settings', backupController.updateSettings);
router.get('/status', backupController.getStatus);
router.post('/restore', upload.single('backup'), backupController.restore);

module.exports = router;
