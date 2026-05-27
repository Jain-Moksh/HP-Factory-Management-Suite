const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const db = require('../config/db');
require('dotenv').config();

// Concurrency lock to prevent multiple backups at once
let isBackupRunning = false;

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
    });

    child.stderr.on('data', (data) => {
      console.error(`pg_dump stderr: ${data}`);
    });

    child.on('close', (code) => {
      isBackupRunning = false;
      if (code !== 0) {
        console.error(`pg_dump process exited with code ${code}`);
      }
    });
  },

  triggerAutoBackup: async (force = false) => {
    if (isBackupRunning) {
      console.log('Skipping auto-backup: another backup process is already running.');
      return;
    }

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

      // THROTTLE: Only backup once every X minutes (User Defined)
      // BYPASS if 'force' is true OR if the file is physically missing (Self-Healing)
      if (!force && fileExists && settings.last_backup_time) {
        const lastBackup = new Date(settings.last_backup_time);
        const now = new Date();
        const diffMins = (now - lastBackup) / (1000 * 60);
        const interval = settings.auto_backup_interval || 60;

        if (diffMins < interval) {
          isBackupRunning = false;
          console.log(`🛡️ Auto-backup skipped: Last backup was only ${Math.round(diffMins)} minutes ago. (Interval: ${interval}m)`);
          return;
        }
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

      // Use spawn to be quote-safe and pipe stdout directly to the file stream
      const out = fs.createWriteStream(newFilePath);
      const args = ['-U', DB_USER, '-h', DB_HOST, '-p', DB_PORT, '--clean', DB_NAME];
      const child = spawn(pgDumpPath, args, { env });

      child.stdout.pipe(out);

      let stderr = '';
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('error', (err) => {
        isBackupRunning = false;
        console.error('Auto backup failed to start:', err);
      });

      child.on('close', async (code) => {
        isBackupRunning = false;
        if (code !== 0) {
          console.error(`Auto backup process exited with code ${code}. Error: ${stderr}`);
          if (fs.existsSync(newFilePath)) {
            try { fs.unlinkSync(newFilePath); } catch (e) {}
          }
          return;
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
        
        console.log(`Auto backup created successfully: ${newFilename}`);
      });

    } catch (error) {
      isBackupRunning = false;
      console.error('Auto backup failed:', error);
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

  restore: async (filePath) => {
    if (isBackupRunning) {
      throw new Error('Another backup or restore is already in progress. Please wait.');
    }

    return new Promise((resolve, reject) => {
      isBackupRunning = true;
      const { DB_USER, DB_NAME, DB_PASSWORD, DB_HOST, DB_PORT, PG_BIN_PATH } = process.env;
      
      const psqlPath = PG_BIN_PATH ? path.join(PG_BIN_PATH, 'psql') : 'psql';
      const pgRestorePath = PG_BIN_PATH ? path.join(PG_BIN_PATH, 'pg_restore') : 'pg_restore';
      const env = { ...process.env, PGPASSWORD: DB_PASSWORD };

      // Step 1: Ensure the database exists (connect to 'postgres' to do this)
      const checkDbArgs = ['-U', DB_USER, '-h', DB_HOST, '-p', DB_PORT, '-d', 'postgres', '-c', `SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'`];
      const checkDb = spawn(psqlPath, checkDbArgs, { env });
      
      let stdout = '';
      let stderr = '';
      checkDb.stdout.on('data', (data) => { stdout += data.toString(); });
      checkDb.stderr.on('data', (data) => { stderr += data.toString(); });

      checkDb.on('error', (err) => {
        isBackupRunning = false;
        console.error('Failed to start DB existence check:', err);
        return reject(err);
      });

      checkDb.on('close', (code) => {
        if (code !== 0 && !stderr.includes('already exists')) {
          console.warn(`Warning checking database existence (code ${code}): ${stderr}`);
        }

        if (!stdout.includes('1')) {
          console.log(`Database ${DB_NAME} not found. Creating...`);
          const mkDbArgs = ['-U', DB_USER, '-h', DB_HOST, '-p', DB_PORT, '-d', 'postgres', '-c', `CREATE DATABASE ${DB_NAME}`];
          const mkDb = spawn(psqlPath, mkDbArgs, { env });
          
          let mkStderr = '';
          mkDb.stderr.on('data', (data) => { mkStderr += data.toString(); });

          mkDb.on('error', (err) => {
            isBackupRunning = false;
            return reject(err);
          });

          mkDb.on('close', (mkCode) => {
            if (mkCode !== 0) {
              console.warn(`Database creation warning (might already exist): ${mkStderr}`);
            }
            proceedWithRestore();
          });
        } else {
          proceedWithRestore();
        }
      });

      const proceedWithRestore = () => {
        const isBinary = isBinaryBackup(filePath);
        let child;
        
        if (isBinary) {
          console.log('Restoring using pg_restore (Binary format)...');
          const args = ['-U', DB_USER, '-h', DB_HOST, '-p', DB_PORT, '-d', DB_NAME, '--clean', filePath];
          child = spawn(pgRestorePath, args, { env });
        } else {
          console.log('Restoring using psql (Plain text format)...');
          const args = ['-U', DB_USER, '-h', DB_HOST, '-p', DB_PORT, '-d', DB_NAME, '-f', filePath];
          child = spawn(psqlPath, args, { env });
        }

        let restoreStderr = '';
        child.stderr.on('data', (data) => {
          restoreStderr += data.toString();
        });

        child.on('error', (err) => {
          isBackupRunning = false;
          console.error('Restore spawn error:', err);
          return reject(err);
        });

        child.on('close', (restoreCode) => {
          isBackupRunning = false;
          if (restoreCode !== 0) {
            console.error(`Restore process exited with code ${restoreCode}. Error: ${restoreStderr}`);
            return reject(new Error(`Restore process exited with code ${restoreCode}: ${restoreStderr}`));
          }
          console.log('Database restored successfully');
          resolve();
        });
      };
    });
  },
};

module.exports = backupService;
