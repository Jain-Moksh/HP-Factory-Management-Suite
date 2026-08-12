const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const backupService = require('./services/backupService');


const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Auto Backup Trigger Middleware
app.use((req, res, next) => {
  res.on('finish', () => {
    // Suppress backups completely if a restore is currently running
    if (global.isBackupRestoreRunning) {
      return;
    }
    // Trigger auto backup on successful POST, PUT, DELETE requests
    if (['POST', 'PUT', 'DELETE'].includes(req.method) && res.statusCode >= 200 && res.statusCode < 300) {
      // Avoid triggering when the request is already related to backup
      if (!req.originalUrl.startsWith('/api/backup')) {
        console.log('[AUTO-BACKUP] Database-changing request completed successfully');
        backupService.triggerAutoBackup(true).catch(err => console.error('Auto backup trigger error:', err));
      }
    }
  });
  next();
});


// Trigger initial self-healing check on startup
// This ensures that if the server starts and no backup is present, it's created immediately
backupService.triggerAutoBackup(false).catch(err => console.error('Startup auto-backup check failed:', err));


// Routes
app.use('/api/items', require('./routes/itemRoutes'));
app.use('/api/clients', require('./routes/clientRoutes'));
app.use('/api/jobbers', require('./routes/jobberRoutes'));
app.use('/api/transporters', require('./routes/transporterRoutes'));
app.use('/api/billing', require('./routes/billingRoutes'));
app.use('/api/purchase', require('./routes/purchaseRoutes'));
app.use('/api/groups', require('./routes/groupRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/backup', require('./routes/backupRoutes'));
app.use('/api/party-transactions', require('./routes/partyTransactionRoutes'));
app.use('/api/price-list', require('./routes/priceListRoutes'));


// Verify login password
app.post('/api/verify-login-pass', (req, res) => {
  const { password } = req.body;
  const expectedPassword = process.env.login_pass ? process.env.login_pass.toString().trim() : '';
  if (expectedPassword && password && password.toString().trim() === expectedPassword) {
    return res.json({ success: true });
  }
  return res.json({ success: false, message: 'Invalid password' });
});


// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});


// Serve frontend build
const frontendPath = path.resolve(__dirname, '../client/dist');

app.use(express.static(frontendPath));

app.use((req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // 42P01: undefined_table (Table does not exist)
  if (err.code === '42P01' && !global.isBackupRestoreRunning) {
    const { autoHealDatabase } = require('./utils/dbHealer');
    const { pool } = require('./config/db');
    autoHealDatabase(pool).catch(e => console.error('Error triggering auto-heal:', e));
    
    return res.status(500).json({
      success: false,
      message: 'A missing database table was detected. The system is automatically recreating it in the background. Please try your action again in a few seconds.'
    });
  }

  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({
    success: false,
    status,
    message
  });
});

module.exports = app;
