const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const backupService = require('./services/backupService');
const { requestContextMiddleware } = require('./utils/requestContext');


const app = express();

// Middleware
// Content-Disposition is exposed so the backup screen can read the download's file name
app.use(cors({ exposedHeaders: ['Content-Disposition'] }));
app.use(express.json());

// Captures the requesting device for audit logging
app.use(requestContextMiddleware);

const WRITE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

// Password checks are POST requests but change no business data, so they never start a backup
// and are still answered while a restore runs
const PASSWORD_CHECK_PATHS = ['/api/verify-login-pass', '/api/verify-delete-pass'];
const isPasswordCheck = (req) => PASSWORD_CHECK_PATHS.includes(req.path);

// While a restore replaces the database, every save is refused. A save made after the restore's
// safety copy was taken would otherwise be in neither the safety copy nor the restored data.
app.use((req, res, next) => {
  if (
    global.isBackupRestoreRunning &&
    WRITE_METHODS.includes(req.method) &&
    !req.path.startsWith('/api/backup') &&
    !isPasswordCheck(req)
  ) {
    return res.status(503).json({
      success: false,
      status: 503,
      error: 'The system is being restored from a backup. Nothing was saved. Please wait a minute and try again.',
      message: 'The system is being restored from a backup. Nothing was saved. Please wait a minute and try again.'
    });
  }
  next();
});

// Auto Backup Trigger Middleware
app.use((req, res, next) => {
  res.on('finish', () => {
    // Suppress backups completely if a restore is currently running
    if (global.isBackupRestoreRunning) {
      return;
    }
    // Trigger auto backup on successful POST, PUT, DELETE requests
    if (['POST', 'PUT', 'DELETE'].includes(req.method) && res.statusCode >= 200 && res.statusCode < 300) {
      // Avoid triggering when the request is already related to backup, or only checked a password
      if (!req.originalUrl.startsWith('/api/backup') && !isPasswordCheck(req)) {
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
app.use('/api/audit-logs', require('./routes/auditRoutes'));


// Verify login password
app.post('/api/verify-login-pass', async (req, res) => {
  const auditService = require('./services/auditService');
  const { password } = req.body || {};
  const expectedPassword = process.env.login_pass ? process.env.login_pass.toString().trim() : '';
  const ok = Boolean(expectedPassword && password && password.toString().trim() === expectedPassword);
  // The typed password is never logged
  await auditService.recordSafe({
    module: auditService.MODULES.SYSTEM,
    action: ok ? auditService.ACTIONS.LOGIN : auditService.ACTIONS.LOGIN_FAILED,
    reference: 'LOGIN',
    summary: ok ? 'Logged in' : 'Login failed: wrong password'
  });
  if (ok) {
    return res.json({ success: true });
  }
  return res.status(401).json({ success: false, message: 'Invalid password' });
});

// Checks the delete password without deleting anything, for removing a row from an unsaved
// bill on screen. The screens no longer hold a copy of the password; only the server knows it.
app.post('/api/verify-delete-pass', (req, res) => {
  const { isValidDeletePassword } = require('./utils/deletePassword');
  const { password } = req.body || {};
  if (isValidDeletePassword(password)) {
    return res.json({ success: true });
  }
  return res.status(401).json({ success: false, message: 'Invalid password' });
});


// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});


// Any /api address not matched above is a mistake in the request, not a page:
// answer with a clear 404 instead of the website's HTML (which the screens could only report as "Network error")
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    status: 404,
    error: `Unknown API address: ${req.method} ${req.originalUrl}`,
    message: `Unknown API address: ${req.method} ${req.originalUrl}`
  });
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

  // 22P02 invalid_text_representation / 22003 numeric_value_out_of_range / 22007 invalid date:
  // the request sent a bad value (e.g. text where a number belongs), so it is the caller's mistake, not a server failure
  if (['22P02', '22003', '22007', '22008'].includes(err.code)) {
    return res.status(400).json({
      success: false,
      status: 400,
      message: 'One of the values sent is not valid (for example, text where a number or date was expected). Please check the form and try again.'
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
