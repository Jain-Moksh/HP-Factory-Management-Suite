/**
 * Stock check: lists every item whose saved stock does not equal
 *   opening stock + all job work - all bills.
 *
 *   node scripts/stock_check.js          -> report only (changes nothing)
 *   node scripts/stock_check.js --fix    -> for each listed item, moves the difference into its
 *                                           opening stock. Current stock is NOT changed, so the
 *                                           physical count stays as it is; only the history is
 *                                           made to add up again. Every change is written to the
 *                                           audit log (module ITEM, device "STOCK CHECK SCRIPT").
 *
 * Take a manual backup before using --fix.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });
const db = require('../config/db');
const queries = require('../queries/masterQueries');

const fix = process.argv.includes('--fix');

(async () => {
  const { rows } = await db.query(queries.getStockCheck, [null]);
  if (rows.length === 0) {
    console.log('All items match their history. Nothing to do.');
    return;
  }

  console.log(`${rows.length} item(s) where saved stock does not match history:\n`);
  console.table(rows.map(r => ({
    id: r.id,
    item: r.name,
    'saved stock': Number(r.stock),
    'opening': Number(r.open_stock),
    'job work': Number(r.inward),
    'bills': Number(r.outward),
    'history says': Number(r.history_stock),
    difference: Number(r.difference)
  })));

  if (!fix) {
    console.log('\nReport only. Run with --fix to move each difference into opening stock (current stock is kept).');
    return;
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    for (const r of rows) {
      const before = (await client.query('SELECT * FROM items WHERE id = $1 FOR UPDATE', [r.id])).rows[0];
      const after = (await client.query(
        'UPDATE items SET open_stock = COALESCE(open_stock, 0) + $1 WHERE id = $2 RETURNING *',
        [r.difference, r.id]
      )).rows[0];
      await client.query(
        `INSERT INTO audit_logs (module, action, record_id, reference, summary, details, device_name)
         VALUES ('ITEM', 'UPDATE', $1, $2, $3, $4, 'STOCK CHECK SCRIPT')`,
        [
          r.id,
          r.name,
          `Item ${r.name}: opening stock ${Number(before.open_stock) || 0} -> ${Number(after.open_stock)} so history matches saved stock ${Number(after.stock)} (stock check)`,
          JSON.stringify({ before, after, changes: [{ field: 'open_stock', from: before.open_stock, to: after.open_stock }] })
        ]
      );
    }
    await client.query('COMMIT');
    console.log(`\nFixed ${rows.length} item(s). Current stock was not changed.`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Nothing was changed:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
  }
})()
  .catch(err => { console.error(err.message); process.exitCode = 1; })
  .finally(() => db.pool.end());
