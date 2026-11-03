const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
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

/**
 * Starts the backup that was asked for while another one was running.
 * Called once a backup / restore finishes, whether it succeeded or not.
 */
const runPendingBackup = () => {
  if (!backupPending) return;
  backupPending = false;
  console.log('[AUTO-BACKUP] Pending database change detected; starting next backup');
  setImmediate(() => {
    backupService.triggerAutoBackup(true).catch(err => console.error('Pending backup trigger failed:', err));
  });
};

/**
 * Local time down to the millisecond, e.g. "04-11-2026--14-32-05-123".
 * Two backups in the same minute (common, since every save triggers one) get different names,
 * so a new backup can never overwrite the previous good file.
 */
const fileTimestamp = (d = new Date()) => {
  const pad = (n, len = 2) => String(n).padStart(len, '0');
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}--` +
    `${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}-${pad(d.getMilliseconds(), 3)}`;
};

/**
 * Runs pg_dump into `finalPath`, all or nothing.
 * The dump goes to "<finalPath>.partial" first and is renamed only after BOTH pg_dump exited
 * successfully AND every byte has been flushed to disk. A failed dump leaves no file behind and
 * never touches an existing backup, and the caller can safely upload / send the file afterwards.
 *
 * @param {string[]} extraArgs - pg_dump options placed before the database name
 * @param {string} finalPath - Where the finished backup should end up
 * @returns {Promise<void>} Rejects with pg_dump's error output if the dump failed
 */
const dumpDatabaseToFile = (extraArgs, finalPath) => new Promise((resolve, reject) => {
  const { DB_USER, DB_NAME, DB_PASSWORD, DB_HOST, DB_PORT, PG_BIN_PATH } = process.env;
  const pgDumpPath = PG_BIN_PATH ? path.join(PG_BIN_PATH, 'pg_dump') : 'pg_dump';
  const env = { ...process.env, PGPASSWORD: DB_PASSWORD };
  const args = ['-U', DB_USER, '-h', DB_HOST, '-p', DB_PORT, ...extraArgs, DB_NAME];
  const tempPath = `${finalPath}.partial`;

  let stderr = '';
  let exitCode = null;
  let flushed = false;
  let settled = false;

  const out = fs.createWriteStream(tempPath);
  const child = spawn(pgDumpPath, args, { env });

  const fail = (err) => {
    if (settled) return;
    settled = true;
    out.destroy();
    fs.rm(tempPath, { force: true }, () => reject(err));
  };

  // Called after each of the two events; finishes only once both have happened
  const finishIfDone = () => {
    if (settled || exitCode === null || !flushed) return;
    if (exitCode !== 0) {
      return fail(new Error(`pg_dump exited with code ${exitCode}${stderr.trim() ? `: ${stderr.trim()}` : ''}`));
    }
    fs.rename(tempPath, finalPath, (err) => {
      if (err) return fail(err);
      settled = true;
      resolve();
    });
  };

  child.stdout.pipe(out);
  child.stderr.on('data', (data) => { stderr += data.toString(); });
  child.on('error', fail); // pg_dump could not be started (wrong PG_BIN_PATH etc.)
  out.on('error', fail);   // disk full, folder not writable etc.
  out.on('finish', () => { flushed = true; finishIfDone(); });
  child.on('close', (code) => { exitCode = code; finishIfDone(); });
});

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

  /**
   * Makes a complete manual backup in the temp folder and returns where it is.
   * The caller sends the file to the browser and deletes it afterwards. Because the file is only
   * returned once pg_dump has finished successfully, a failed backup becomes an error message
   * instead of a cut-off .sql download that looks fine.
   *
   * @returns {Promise<{filePath: string, filename: string}>}
   * @throws {Error} 429 when another backup / restore is running, 500 when pg_dump fails
   */
  createManualBackupFile: async () => {
    if (isBackupRunning || global.isBackupRestoreRunning) {
      const err = new Error('Another backup or restore is already in progress. Please wait a moment and try again.');
      err.status = 429;
      throw err;
    }

    isBackupRunning = true;
    try {
      // Local time (not UTC), same style as the auto backups, e.g. ManualBackup-04-11-2026--14-32-05-123.sql
      const filename = `ManualBackup-${fileTimestamp()}.sql`;
      const filePath = path.join(os.tmpdir(), `${Date.now()}-${filename}`);
      try {
        await dumpDatabaseToFile([], filePath);
      } catch (err) {
        console.error('Manual backup failed:', err.message);
        const userErr = new Error('The backup could not be created, so nothing was downloaded. Please try again; if it keeps failing, check that PostgreSQL is running.');
        userErr.status = 500;
        throw userErr;
      }
      return { filePath, filename };
    } finally {
      isBackupRunning = false;
      runPendingBackup();
    }
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
    isBackupRunning = true;

    try {
      const settings = await backupService.getSettingsInternal();
      if (!settings || !settings.auto_backup_enabled) {
        return;
      }

      // Check if file physically exists
      const filePath = settings.last_backup_file ? path.join(settings.auto_backup_path, settings.last_backup_file) : null;
      const fileExists = filePath && fs.existsSync(filePath);

      // If this is a check (startup or settings check) and the file already exists, skip creating a new backup
      if (!isChangeTrigger && fileExists) {
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

      // Unique to the millisecond, so the previous backup is never overwritten
      const newFilename = `AutoBackup-${fileTimestamp()}.sql`;
      const newFilePath = path.join(backupDir, newFilename);

      console.log('[AUTO-BACKUP] Backup started');
      try {
        await dumpDatabaseToFile(['--clean', '--if-exists'], newFilePath);
      } catch (err) {
        // The previous backup file is untouched, so it is still the latest good backup
        console.error(`Auto backup failed; previous backup kept (${settings.last_backup_file || 'none'}):`, err.message);
        return;
      }
      console.log('[AUTO-BACKUP] Backup completed');

      // FTP upload: the file is complete on disk at this point
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

      // Record the new backup first, so the saved file name always points to a file that exists
      await db.query(
        `UPDATE backup_settings
         SET last_backup_time = CURRENT_TIMESTAMP, last_backup_file = $1
         WHERE id = 1`,
        [newFilename]
      );
      console.log('[AUTO-BACKUP] Backup metadata updated');

      // Retention: only now that the new backup is safe is the old one removed
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

      console.log(`Auto backup created successfully: ${newFilename}`);
    } catch (error) {
      console.error('Auto backup failed:', error);
    } finally {
      isBackupRunning = false;
      runPendingBackup();
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
   * @param {string} [originalName] - File name as uploaded, shown in the stock movement log
   * @returns {Promise<{safetyBackup: string, counts: object}>}
   */
  restore: async (filePath, originalName) => {
    if (isBackupRunning || global.isBackupRestoreRunning) {
      const err = new Error('Another backup or restore is already in progress. Please wait a minute and try again.');
      err.status = 409;
      throw err;
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

      // Stock as it is now, so the stock movement log can show what the restore changed
      const stockBeforeRestore = await db.query('SELECT id, name, unit, stock FROM items')
        .then(res => res.rows)
        .catch(() => null);

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

      // The restored database carries the backup's movement history; record how the restore itself moved stock
      if (stockBeforeRestore) {
        try {
          const stockMovementService = require('./stockMovementService');
          const written = await stockMovementService.recordRestore(
            stockBeforeRestore,
            `Restored from ${originalName || path.basename(filePath)}`
          );
          console.log(`[RESTORE] 📦 Stock movement log: ${written} item(s) changed by the restore.`);
        } catch (err) {
          console.error('[RESTORE] Could not record stock movements for the restore:', err.message);
        }
      }

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
