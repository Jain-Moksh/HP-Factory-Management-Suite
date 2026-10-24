const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Tables every backup of this system contains. A file without them is not a real backup,
// so the restore is cancelled before the existing data is replaced.
const REQUIRED_TABLES = ['items', 'clients', 'jobbers', 'transporters', 'billing', 'billing_items', 'purchase', 'purchase_items'];

const DUMP_HEADER = '-- PostgreSQL database dump';
const DUMP_FOOTER = '-- PostgreSQL database dump complete';

const PRE_RESTORE_KEEP = 5;

/**
 * Runs a command and resolves only when it exits with code 0.
 * No stderr text is treated as harmless: the exit code alone decides success.
 */
const runStrict = (cmd, args, env) => new Promise((resolve, reject) => {
  const child = spawn(cmd, args, { env });
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (d) => { stdout += d.toString(); });
  child.stderr.on('data', (d) => { stderr += d.toString(); });
  child.on('error', reject);
  child.on('close', (code) => {
    if (stderr) console.log(`[RESTORE] ${path.basename(cmd)} output:\n${stderr}`);
    if (code !== 0) {
      const err = new Error(`${path.basename(cmd)} exited with code ${code}`);
      err.stderr = stderr;
      return reject(err);
    }
    resolve({ stdout, stderr });
  });
});

const readSlice = (filePath, start, length) => {
  const fd = fs.openSync(filePath, 'r');
  try {
    const buffer = Buffer.alloc(length);
    const bytes = fs.readSync(fd, buffer, 0, length, start);
    return buffer.toString('utf8', 0, bytes);
  } finally {
    fs.closeSync(fd);
  }
};

/**
 * Checks that a plain .sql file is a complete pg_dump. pg_dump writes a fixed header and,
 * only when it finishes, a "dump complete" footer, so a cut-off file has no footer.
 */
const validatePlainDump = (filePath) => {
  const size = fs.statSync(filePath).size;
  const head = readSlice(filePath, 0, Math.min(size, 4096));
  const tail = readSlice(filePath, Math.max(0, size - 4096), Math.min(size, 4096));

  if (!head.includes(DUMP_HEADER)) {
    throw new Error('This file is not a database backup made by this system (pg_dump header missing).');
  }
  if (!tail.includes(DUMP_FOOTER)) {
    throw new Error('This backup file is incomplete. It looks cut off before the end, so it cannot be restored safely.');
  }
};

// Matches the drop statements pg_dump --clean writes without --if-exists, e.g.
//   DROP TABLE public.billing;
//   ALTER TABLE ONLY public.billing_items DROP CONSTRAINT billing_items_billing_id_fkey;
//   ALTER TABLE public.billing ALTER COLUMN id DROP DEFAULT;
// Object names are lowercase or quoted and keywords are uppercase, which separates the two.
const DROP_OBJECT = /^DROP ([A-Z][A-Z ]*?) (?=["a-z_])/;
const ALTER_TABLE = /^ALTER TABLE (ONLY )?(?=["a-z_])/;
const DROP_CONSTRAINT = / DROP CONSTRAINT (?=["a-z_])/;

const addIfExists = (line) => {
  if (line.includes(' IF EXISTS ')) return line;
  if (DROP_OBJECT.test(line)) return line.replace(DROP_OBJECT, 'DROP $1 IF EXISTS ');
  if (ALTER_TABLE.test(line) && /( DROP CONSTRAINT | DROP DEFAULT;)/.test(line)) {
    return line
      .replace(ALTER_TABLE, (m, only) => `ALTER TABLE IF EXISTS ${only || ''}`)
      .replace(DROP_CONSTRAINT, ' DROP CONSTRAINT IF EXISTS ');
  }
  return line;
};

/**
 * Copies a plain dump to outPath, making the leading "drop old objects" statements of
 * --clean backups safe to run on a freshly cleared schema (DROP ... IF EXISTS).
 * Only the section before the first CREATE / COPY is touched, so table data is never altered.
 */
const prepareSqlFile = (inPath, outPath) => new Promise((resolve, reject) => {
  const input = fs.createReadStream(inPath, { encoding: 'utf8' });
  const output = fs.createWriteStream(outPath, { encoding: 'utf8' });
  let pending = '';
  let inDropSection = true;

  const fail = (err) => {
    input.destroy();
    output.destroy();
    reject(err);
  };

  input.on('data', (chunk) => {
    if (!inDropSection) {
      if (!output.write(chunk)) {
        input.pause();
        output.once('drain', () => input.resume());
      }
      return;
    }

    const lines = (pending + chunk).split('\n');
    pending = lines.pop();
    const out = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (inDropSection && (line.startsWith('CREATE ') || line.startsWith('COPY '))) {
        inDropSection = false;
      }
      out.push(inDropSection ? addIfExists(line.replace(/\r$/, '')) + (line.endsWith('\r') ? '\r' : '') : line);
    }
    let text = out.join('\n') + '\n';
    if (!inDropSection) {
      // Rest of this chunk is passed through untouched
      text += pending;
      pending = '';
    }
    if (!output.write(text)) {
      input.pause();
      output.once('drain', () => input.resume());
    }
  });
  input.on('end', () => {
    output.end(pending, () => resolve());
  });
  input.on('error', fail);
  output.on('error', fail);
});

// Runs inside the restore transaction after the import: if the core tables are missing,
// the exception rolls back everything, including the DROP SCHEMA.
const requiredTablesCheck = () => {
  const conditions = REQUIRED_TABLES.map(t => `to_regclass('public.${t}') IS NULL`).join(' OR ');
  return `DO $restore_check$ BEGIN IF ${conditions} THEN RAISE EXCEPTION 'Backup does not contain the required tables (${REQUIRED_TABLES.join(', ')})'; END IF; END $restore_check$;`;
};

/**
 * Turns psql output into a short message, e.g.
 * "psql:C:/x.sql:120: ERROR:  syntax error at or near "INSER"" -> 'line 120: syntax error at or near "INSER"'
 */
const describeSqlError = (stderr = '') => {
  const line = stderr.split('\n').find(l => l.includes('ERROR:'));
  if (!line) return stderr.trim().split('\n').pop() || 'unknown error';
  const match = line.match(/:(\d+): ERROR:\s+(.*)$/);
  if (match) return `line ${match[1]}: ${match[2].trim()}`;
  return line.replace(/^.*ERROR:\s+/, '').trim();
};

/**
 * Deletes older pre-restore safety backups, keeping the newest few.
 */
const prunePreRestoreBackups = (dir) => {
  try {
    const files = fs.readdirSync(dir)
      .filter(f => f.startsWith('PreRestore-') && f.endsWith('.sql'))
      .map(f => ({ f, t: fs.statSync(path.join(dir, f)).mtimeMs }))
      .sort((a, b) => b.t - a.t);
    files.slice(PRE_RESTORE_KEEP).forEach(({ f }) => {
      try { fs.unlinkSync(path.join(dir, f)); } catch (e) { /* locked file, try next time */ }
    });
  } catch (err) {
    console.warn('[RESTORE] Could not prune old pre-restore backups:', err.message);
  }
};

module.exports = {
  REQUIRED_TABLES,
  runStrict,
  validatePlainDump,
  prepareSqlFile,
  addIfExists,
  requiredTablesCheck,
  describeSqlError,
  prunePreRestoreBackups
};
