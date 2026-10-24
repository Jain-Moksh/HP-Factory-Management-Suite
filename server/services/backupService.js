const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const db = require('../config/db');
const ftp = require('basic-ftp');
const {
  runStrict, validatePlainDump, prepareSqlFile, requiredTablesCheck, describeSqlError, prunePreRestoreBackups
} = require('../utils/restoreHelpers');
require('dotenv').config();

// Concurrency lock to prevent multiple backups at once
let isBackupRunning = false;
let backupPending = false;

// Errors whose message is safe and useful to show on the restore screen
const userError = (message) => {
  const err = new Error(message);
  err.status = 400;
  return err;
};

// Helper to check if file is a binary backup format
const isBinaryBackup = (filePath) => {
  try {
    const buffer = Buffer.alloc(5);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 5, 0);
    fs.closeSync(fd);
    return buffer.toString() === 'PGDMP';
  } catch (err) {
    console.error('Error checking file format:', err);
    return false;
  }
};

const backupService = {
  getSettings: async () => {
    const settings = await backupService.getSettingsInternal();

    if (settings && settings.auto_backup_enabled) {
      const filePath = settings.last_backup_file ? path.join(settings.auto_backup_path, settings.last_backup_file) : null;
      
      // If no file name exists OR the file is physically missing from the folder
      if (!filePath || !fs.existsSync(filePath)) {
        if (isBackupRunning) {
          return {
            ...settings,
            last_backup_time: settings.last_backup_time,
            last_backup_file: 'Backup in progress...'
          };
        }

        // Trigger backup in background (triggerAutoBackup now handles the missing file check internally)
        backupService.triggerAutoBackup().catch(err => console.error('Self-healing backup failed:', err));
        
        // Return a temporary state so the UI knows one is being made
        return {
          ...settings,
          last_backup_time: null,
          last_backup_file: 'Creating fresh backup...'
        };
      }
    }
    return settings;
  },

  updateSettings: async (settings) => {
    const { auto_backup_enabled, auto_backup_path, auto_backup_interval } = settings;
    const result = await db.query(
      `UPDATE backup_settings 
       SET auto_backup_enabled = $1, auto_backup_path = $2, auto_backup_interval = $3, updated_at = CURRENT_TIMESTAMP 
       WHERE id = 1 
       RETURNING *`,
      [auto_backup_enabled, auto_backup_path, auto_backup_interval || 60]
    );
    return result.rows[0];
  },

  getFtpSettings: async () => {
    const settings = await backupService.getSettingsInternal();
    return {
      ftp_backup_enabled: settings.ftp_backup_enabled,
      ftp_host: settings.ftp_host,
      ftp_port: settings.ftp_port,
      ftp_username: settings.ftp_username,
      ftp_password: settings.ftp_password,
      ftp_path: settings.ftp_path
    };
  },

  updateFtpSettings: async (settings) => {
    const { ftp_backup_enabled, ftp_host, ftp_port, ftp_username, ftp_password, ftp_path } = settings;
    const result = await db.query(
      `UPDATE backup_settings 
       SET ftp_backup_enabled = $1, ftp_host = $2, ftp_port = $3, ftp_username = $4, ftp_password = $5, ftp_path = $6, updated_at = CURRENT_TIMESTAMP 
       WHERE id = 1 
       RETURNING ftp_backup_enabled, ftp_host, ftp_port, ftp_username, ftp_password, ftp_path`,
      [ftp_backup_enabled, ftp_host, ftp_port, ftp_username, ftp_password, ftp_path]
    );
    return result.rows[0];
  },

  streamManualBackup: async (res) => {
    if (isBackupRunning) {
      return res.status(429).json({ success: false, message: 'Another backup or restore is already in progress. Please wait.' });
    }

    isBackupRunning = true;
    const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '').replace(/:/g, '-').replace(/ /g, '--');
    const filename = `ManualBackup-${timestamp}.sql`;

    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Type', 'text/plain');

    const { DB_USER, DB_NAME, DB_PASSWORD, DB_HOST, DB_PORT, PG_BIN_PATH } = process.env;
    
    const pgDumpPath = PG_BIN_PATH ? path.join(PG_BIN_PATH, 'pg_dump') : 'pg_dump';
    const env = { ...process.env, PGPASSWORD: DB_PASSWORD };
    
    // Using spawn is better for streaming large files than exec
    const args = ['-U', DB_USER, '-h', DB_HOST, '-p', DB_PORT, DB_NAME];
    const child = spawn(pgDumpPath, args, { env });

    child.stdout.pipe(res);

    child.on('error', (err) => {
      isBackupRunning = false;
      console.error('pg_dump spawn error:', err);
      if (!res.headersSent) {
        res.status(500).send('Backup failed');
      }
      if (backupPending) {
        backupPending = false;
        console.log('[AUTO-BACKUP] Pending database change detected; starting next backup');
        setImmediate(() => {
          backupService.triggerAutoBackup(true).catch(err => console.error('Pending backup trigger failed:', err));
        });
      }
    });

    child.stderr.on('data', (data) => {
      console.error(`pg_dump stderr: ${data}`);
    });

    child.on('close', (code) => {
      isBackupRunning = false;
      if (code !== 0) {
        console.error(`pg_dump process exited with code ${code}`);
      }
      if (backupPending) {
        backupPending = false;
        console.log('[AUTO-BACKUP] Pending database change detected; starting next backup');
        setImmediate(() => {
          backupService.triggerAutoBackup(true).catch(err => console.error('Pending backup trigger failed:', err));
        });
      }
    });
  },

  triggerAutoBackup: async (isChangeTrigger = false) => {
    // If a restore is running, silently ignore any backup requests
    if (global.isBackupRestoreRunning) {
      return;
    }

    if (isBackupRunning) {
      if (isChangeTrigger) {
        backupPending = true;
        console.log('[AUTO-BACKUP] Backup already running; pending backup marked');
      } else {
        console.log('Skipping auto-backup check: another backup process is already running.');
      }
      return;
    }

    console.log('[AUTO-BACKUP] Automatic backup requested');

    try {
      isBackupRunning = true;
      const settings = await backupService.getSettingsInternal();
      if (!settings || !settings.auto_backup_enabled) {
        isBackupRunning = false;
        return;
      }

      // Check if file physically exists
      const filePath = settings.last_backup_file ? path.join(settings.auto_backup_path, settings.last_backup_file) : null;
      const fileExists = filePath && fs.existsSync(filePath);

      // If this is a check (startup or settings check) and the file already exists, skip creating a new backup
      if (!isChangeTrigger && fileExists) {
        isBackupRunning = false;
        console.log('🛡️ Auto-backup skipped: Backup file already exists and no database changes occurred.');
        return;
      }

      if (!fileExists) {
        console.log('🛡️ Self-Healing: No backup detected or file missing. Actively creating fresh backup...');
      }

      const backupDir = settings.auto_backup_path;
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const timestamp = new Date().toLocaleString('en-GB', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: false
      }).replace(/[/, :]/g, '-');

      const newFilename = `AutoBackup-${timestamp}.sql`;
      const newFilePath = path.join(backupDir, newFilename);

      const { DB_USER, DB_NAME, DB_PASSWORD, DB_HOST, DB_PORT, PG_BIN_PATH } = process.env;
      const env = { ...process.env, PGPASSWORD: DB_PASSWORD };
      
      const pgDumpPath = PG_BIN_PATH ? path.join(PG_BIN_PATH, 'pg_dump') : 'pg_dump';

      console.log('[AUTO-BACKUP] Backup started');

      // Use spawn to be quote-safe and pipe stdout directly to the file stream
      const out = fs.createWriteStream(newFilePath);
      const args = ['-U', DB_USER, '-h', DB_HOST, '-p', DB_PORT, '--clean', '--if-exists', DB_NAME];
      const child = spawn(pgDumpPath, args, { env });

      child.stdout.pipe(out);

      let stderr = '';
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('error', (err) => {
        isBackupRunning = false;
        console.error('Auto backup failed to start:', err);
        if (backupPending) {
          backupPending = false;
          console.log('[AUTO-BACKUP] Pending database change detected; starting next backup');
          setImmediate(() => {
            backupService.triggerAutoBackup(true).catch(err => console.error('Pending backup trigger failed:', err));
          });
        }
      });

      child.on('close', async (code) => {
        isBackupRunning = false;
        if (code !== 0) {
          console.error(`Auto backup process exited with code ${code}. Error: ${stderr}`);
          if (fs.existsSync(newFilePath)) {
            try { fs.unlinkSync(newFilePath); } catch (e) {}
          }
          if (backupPending) {
            backupPending = false;
            console.log('[AUTO-BACKUP] Pending database change detected; starting next backup');
            setImmediate(() => {
              backupService.triggerAutoBackup(true).catch(err => console.error('Pending backup trigger failed:', err));
            });
          }
          return;
        }

        console.log('[AUTO-BACKUP] Backup completed');

        // FTP Upload Logic
        if (settings.ftp_backup_enabled && settings.ftp_host && settings.ftp_username) {
          const client = new ftp.Client();
          client.ftp.verbose = true;
          try {
            console.log('Initiating FTP upload for:', newFilename);
            await client.access({
              host: settings.ftp_host,
              port: settings.ftp_port || 21,
              user: settings.ftp_username,
              password: settings.ftp_password,
              secure: false
            });
            const remoteDir = settings.ftp_path || '/';
            await client.ensureDir(remoteDir);
            await client.uploadFrom(newFilePath, path.join(remoteDir, newFilename).replace(/\\/g, '/'));
            console.log('[AUTO-BACKUP] FTP upload completed');
          } catch (ftpError) {
            console.error('FTP upload failed:', ftpError);
          } finally {
            client.close();
          }
        }

        // Handle Retention: Delete old backup only if it's different from the new one
        const oldFilename = settings.last_backup_file;
        if (oldFilename && oldFilename !== newFilename) {
          const oldFilePath = path.join(backupDir, oldFilename);
          if (fs.existsSync(oldFilePath)) {
            try {
              fs.unlinkSync(oldFilePath);
              console.log('Deleted old auto backup:', oldFilename);
            } catch (err) {
              console.warn('Failed to delete old backup (permission or lock issues):', err.message);
            }
          }
        }

        // Update settings with new backup info
        await db.query(
          `UPDATE backup_settings 
           SET last_backup_time = CURRENT_TIMESTAMP, last_backup_file = $1 
           WHERE id = 1`,
          [newFilename]
        );
        
        console.log('[AUTO-BACKUP] Backup metadata updated');
        console.log(`Auto backup created successfully: ${newFilename}`);

        if (backupPending) {
          backupPending = false;
          console.log('[AUTO-BACKUP] Pending database change detected; starting next backup');
          setImmediate(() => {
            backupService.triggerAutoBackup(true).catch(err => console.error('Pending backup trigger failed:', err));
          });
        }
      });

    } catch (error) {
      isBackupRunning = false;
      console.error('Auto backup failed:', error);
      if (backupPending) {
        backupPending = false;
        console.log('[AUTO-BACKUP] Pending database change detected; starting next backup');
        setImmediate(() => {
          backupService.triggerAutoBackup(true).catch(err => console.error('Pending backup trigger failed:', err));
        });
      }
    }
  },

  getSettingsInternal: async () => {
    try {
      let result = await db.query('SELECT * FROM backup_settings WHERE id = 1');
      if (result.rows.length === 0) {
        // Table exists but no settings row, create it
        await db.query('INSERT INTO backup_settings (id, auto_backup_enabled) VALUES (1, true) ON CONFLICT (id) DO NOTHING');
        result = await db.query('SELECT * FROM backup_settings WHERE id = 1');
      }

      // Column check: ensure auto_backup_interval exists (for users with older table schema)
      if (result.rows[0] && result.rows[0].auto_backup_interval === undefined) {
        console.log('🛡️ System Recovery: Column "auto_backup_interval" missing. Updating table...');
        await db.query('ALTER TABLE backup_settings ADD COLUMN IF NOT EXISTS auto_backup_interval INT DEFAULT 60');
        result = await db.query('SELECT * FROM backup_settings WHERE id = 1');
      }

      // Column check for FTP settings
      if (result.rows[0] && result.rows[0].ftp_backup_enabled === undefined) {
        console.log('🛡️ System Recovery: FTP columns missing. Updating table...');
        await db.query(`
          ALTER TABLE backup_settings 
          ADD COLUMN IF NOT EXISTS ftp_backup_enabled BOOLEAN DEFAULT FALSE,
          ADD COLUMN IF NOT EXISTS ftp_host TEXT,
          ADD COLUMN IF NOT EXISTS ftp_port INT DEFAULT 21,
          ADD COLUMN IF NOT EXISTS ftp_username TEXT,
          ADD COLUMN IF NOT EXISTS ftp_password TEXT,
          ADD COLUMN IF NOT EXISTS ftp_path TEXT DEFAULT '/'
        `);
        result = await db.query('SELECT * FROM backup_settings WHERE id = 1');
      }

      return result.rows[0];
    } catch (error) {
      if (error.code === '42P01') { // relation "backup_settings" does not exist
        console.log('🛡️ System Recovery: Table "backup_settings" missing. Recreating table...');
        await db.query(`
          CREATE TABLE IF NOT EXISTS backup_settings (
              id SERIAL PRIMARY KEY,
              auto_backup_enabled BOOLEAN DEFAULT TRUE,
              auto_backup_path TEXT DEFAULT 'C:/NP-Backups/',
              auto_backup_interval INT DEFAULT 60,
              ftp_backup_enabled BOOLEAN DEFAULT FALSE,
              ftp_host TEXT,
              ftp_port INT DEFAULT 21,
              ftp_username TEXT,
              ftp_password TEXT,
              ftp_path TEXT DEFAULT '/',
              last_backup_time TIMESTAMP WITH TIME ZONE,
              last_backup_file TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
          INSERT INTO backup_settings (id, auto_backup_enabled) VALUES (1, true) ON CONFLICT (id) DO NOTHING;
        `);
        const retryResult = await db.query('SELECT * FROM backup_settings WHERE id = 1');
        return retryResult.rows[0];
      }
      throw error;
    }
  },

  /**
   * Restores the database from a .sql or .backup file, all or nothing.
   *
   * The schema wipe, the import and a required-tables check run in ONE transaction
   * (psql --single-transaction with ON_ERROR_STOP), so any error rolls everything back,
   * including DROP SCHEMA, and the existing data stays exactly as it was.
   * A safety copy of the current database is saved before anything is changed.
   *
   * @param {string} filePath - Uploaded backup file
   * @returns {Promise<{safetyBackup: string, counts: object}>}
   */
  restore: async (filePath) => {
    if (isBackupRunning) {
      throw new Error('Another backup or restore is already in progress. Please wait.');
    }

    console.log(`[RESTORE] 📂 Backup file detected: ${filePath}`);
    isBackupRunning = true;
    global.isBackupRestoreRunning = true;

    const { DB_USER, DB_NAME, DB_PASSWORD, DB_HOST, DB_PORT, PG_BIN_PATH } = process.env;
    const psqlPath = PG_BIN_PATH ? path.join(PG_BIN_PATH, 'psql') : 'psql';
    const pgRestorePath = PG_BIN_PATH ? path.join(PG_BIN_PATH, 'pg_restore') : 'pg_restore';
    const pgDumpPath = PG_BIN_PATH ? path.join(PG_BIN_PATH, 'pg_dump') : 'pg_dump';
    const env = { ...process.env, PGPASSWORD: DB_PASSWORD };
    const conn = ['-U', DB_USER, '-h', DB_HOST, '-p', DB_PORT];
    const preparedPath = `${filePath}.prepared.sql`;

    try {
      // Step 1: Ensure database exists
      console.log('[RESTORE] 🔍 Checking if database exists...');
      const checkDbRes = await runStrict(psqlPath, [...conn, '-d', 'postgres', '-tA', '-c', `SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'`], env);
      if (checkDbRes.stdout.trim() !== '1') {
        console.log(`[RESTORE] 🛠️ Database ${DB_NAME} not found. Creating...`);
        await runStrict(psqlPath, [...conn, '-d', 'postgres', '-c', `CREATE DATABASE "${DB_NAME}"`], env);
      }

      // Step 2: Validate the backup file and convert it to a complete SQL script on disk.
      // The import only starts once the whole script exists, so it can never be fed a partial stream.
      console.log('[RESTORE] 🛡️ Validating backup file...');
      if (isBinaryBackup(filePath)) {
        try {
          await runStrict(pgRestorePath, ['--list', filePath], env);
          await runStrict(pgRestorePath, ['--clean', '--if-exists', '-f', preparedPath, filePath], env);
        } catch (err) {
          throw userError('This .backup file is damaged or incomplete, so it cannot be restored.');
        }
      } else {
        try {
          validatePlainDump(filePath);
        } catch (err) {
          throw userError(err.message);
        }
        await prepareSqlFile(filePath, preparedPath);
      }

      // Step 3: Safety copy of the current data, in case the wrong file is restored
      const settings = await backupService.getSettingsInternal().catch(() => null);
      const safetyDir = (settings && settings.auto_backup_path) || path.join(__dirname, '..', 'uploads', 'backups');
      if (!fs.existsSync(safetyDir)) fs.mkdirSync(safetyDir, { recursive: true });
      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}--${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
      let safetyBackup = path.join(safetyDir, `PreRestore-${stamp}.sql`);
      // Never overwrite an earlier safety copy taken in the same second
      if (fs.existsSync(safetyBackup)) safetyBackup = path.join(safetyDir, `PreRestore-${stamp}-${now.getMilliseconds()}.sql`);
      console.log(`[RESTORE] 💾 Saving safety copy of current data: ${safetyBackup}`);
      try {
        await runStrict(pgDumpPath, [...conn, '--clean', '--if-exists', '-f', safetyBackup, DB_NAME], env);
      } catch (err) {
        throw userError(`Could not save a safety copy of the current data (${describeSqlError(err.stderr)}). Restore cancelled; nothing was changed.`);
      }
      prunePreRestoreBackups(safetyDir);

      // Step 4: Wipe + import + verify in a single transaction
      console.log('[RESTORE] 📥 Data import started (single transaction).');
      try {
        await runStrict(psqlPath, [
          ...conn, '-d', DB_NAME,
          '-X', '-q',
          '-v', 'ON_ERROR_STOP=1',
          '--single-transaction',
          '-c', 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;',
          '-f', preparedPath,
          '-c', requiredTablesCheck()
        ], env);
      } catch (err) {
        throw userError(`The backup file has an error (${describeSqlError(err.stderr)}). Nothing was restored and your existing data has not been changed.`);
      }
      console.log('[RESTORE] 📥 Data import completed and committed.');

      // Step 5: Post-restore initialization (adds tables newer than the backup, e.g. audit_logs)
      console.log('[RESTORE] 🔄 Cache refresh started.');
      await db.refreshPool();
      const { autoHealDatabase } = require('../utils/dbHealer');
      await autoHealDatabase(db.pool);
      console.log('[RESTORE] ⚙️ Post-restore initialization completed.');

      // Step 6: Record counts so the result can be shown to the user
      const tables = ['items', 'clients', 'jobbers', 'transporters', 'billing', 'billing_items', 'purchase', 'purchase_items', 'party_transactions', 'groups', 'group_members', 'price_lists', 'price_list_categories', 'price_list_items'];
      const counts = {};
      await Promise.all(tables.map(t => db.query('SELECT COUNT(*) FROM ' + t)
        .then(res => { counts[t] = Number(res.rows[0].count); })
        .catch(() => { counts[t] = null; })));
      console.log('[RESTORE] 📊 Final record counts:', JSON.stringify(counts));

      console.log('[RESTORE] 🎉 Restore success confirmation.');
      return { safetyBackup, counts };
    } catch (err) {
      console.error('[RESTORE] ❌ Restore process failed:', err.message);
      throw err;
    } finally {
      if (fs.existsSync(preparedPath)) {
        try { fs.unlinkSync(preparedPath); } catch (e) { /* removed on next restore */ }
      }
      isBackupRunning = false;
      global.isBackupRestoreRunning = false;
    }
  },
};

module.exports = backupService;
