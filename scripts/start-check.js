/**
 * Used by start.bat to skip work that is already done.
 * Exit code 0 = up to date (skip), 1 = needs to run. Any unexpected error also exits 1,
 * so when in doubt start.bat installs / builds instead of starting with stale files.
 *
 *   node scripts/start-check.js install <client|server>
 *     Packages are installed if node_modules is missing, or package.json / package-lock.json
 *     changed after the last install (npm writes node_modules/.package-lock.json on every install).
 *
 *   node scripts/start-check.js build
 *     The website is rebuilt if client/dist is missing, or any source or config file is newer than
 *     the last build (dist/index.html is written at the end of every successful build).
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const mtime = (p) => {
  try { return fs.statSync(p).mtimeMs; } catch { return null; }
};

// Newest modification time of a file, or of every file inside a folder
const newest = (p) => {
  let stat;
  try { stat = fs.statSync(p); } catch { return 0; }
  if (!stat.isDirectory()) return stat.mtimeMs;
  let latest = stat.mtimeMs; // also catches deleted files
  for (const entry of fs.readdirSync(p)) latest = Math.max(latest, newest(path.join(p, entry)));
  return latest;
};

const needsInstall = (dir) => {
  const appDir = path.join(root, dir);
  const marker = mtime(path.join(appDir, 'node_modules', '.package-lock.json'));
  if (marker === null) return 'packages not installed yet';
  const changed = ['package.json', 'package-lock.json'].find(f => (mtime(path.join(appDir, f)) || 0) > marker);
  return changed ? `${changed} changed` : null;
};

const needsBuild = () => {
  const client = path.join(root, 'client');
  const built = mtime(path.join(client, 'dist', 'index.html'));
  if (built === null) return 'website not built yet';
  const inputs = [
    'src', 'public', 'index.html', '.env', 'package.json', 'package-lock.json',
    'vite.config.js', 'tailwind.config.js', 'postcss.config.js'
  ];
  const changed = inputs.find(f => newest(path.join(client, f)) > built);
  return changed ? `${changed} changed since last build` : null;
};

try {
  const [mode, dir] = process.argv.slice(2);
  let reason;
  if (mode === 'install' && ['client', 'server'].includes(dir)) reason = needsInstall(dir);
  else if (mode === 'build') reason = needsBuild();
  else throw new Error(`unknown arguments: ${process.argv.slice(2).join(' ')}`);

  if (reason) console.log(`   (${reason})`);
  process.exit(reason ? 1 : 0);
} catch (err) {
  console.log(`   (check failed: ${err.message})`);
  process.exit(1);
}
