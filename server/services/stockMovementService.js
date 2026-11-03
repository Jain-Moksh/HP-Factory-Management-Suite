const db = require('../config/db');
const { getRequestContext } = require('../utils/requestContext');

/**
 * Stock movements are written by the database trigger trg_items_stock_movement (see utils/stockMovementSetup.js),
 * so every change to items.stock is recorded, including ones made outside the app.
 * This service only tags the app's own changes with where they came from, and reads the history.
 */

const SOURCES = {
  BILL: 'BILL',
  JOB_WORK: 'JOB_WORK',
  ITEM_MASTER: 'ITEM_MASTER',
  RESTORE: 'RESTORE',
  DIRECT_DB: 'DIRECT_DB'
};

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

const addDateRange = (conditions, params, from, to) => {
  if (from) {
    params.push(from);
    conditions.push(DATE_ONLY.test(from) ? `created_at >= $${params.length}::date` : `created_at >= $${params.length}::timestamptz`);
  }
  if (to) {
    params.push(to);
    conditions.push(DATE_ONLY.test(to) ? `created_at < ($${params.length}::date + 1)` : `created_at < $${params.length}::timestamptz`);
  }
};

const buildContext = ({ source, action = null, referenceId = null, reference = null, note = null }) => {
  const req = getRequestContext();
  return JSON.stringify({
    source,
    action,
    reference_id: referenceId === null || referenceId === undefined ? null : String(referenceId),
    reference,
    note,
    device_name: req.deviceName || null,
    hostname: req.hostname || null,
    ip_address: req.ip || null
  });
};

const stockMovementService = {
  SOURCES,

  /**
   * Tags the stock changes that follow in this transaction with their source.
   * The setting is transaction-local, so it never leaks to the next request on a pooled connection.
   * Call again to change the tag for later statements in the same transaction.
   *
   * @param {object} client - pg client inside BEGIN ... COMMIT
   * @param {object} ctx - { source, action, referenceId, reference, note }
   */
  setContext: async (client, ctx) => {
    await client.query("SELECT set_config('app.stock_ctx', $1, true)", [buildContext(ctx)]);
  },

  /**
   * Runs a single change that would otherwise be autocommitted inside a short transaction,
   * so the stock tag applies to it.
   *
   * @param {object} ctx - Same as setContext
   * @param {(client) => Promise<any>} fn
   */
  withContext: async (ctx, fn) => {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      await stockMovementService.setContext(client, ctx);
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * After a restore, records how each item's stock changed compared with just before the restore.
   * The restored database carries the backup's own movement history, so these rows explain the jump.
   *
   * @param {Array<{id, name, unit, stock}>} beforeRows - items as they were before the restore
   * @param {string} note - e.g. the backup file name
   * @returns {Promise<number>} Number of rows written
   */
  recordRestore: async (beforeRows, note) => {
    const afterRes = await db.query('SELECT id, name, unit, stock FROM items');
    const before = new Map(beforeRows.map(r => [Number(r.id), r]));
    const after = new Map(afterRes.rows.map(r => [Number(r.id), r]));
    const ids = new Set([...before.keys(), ...after.keys()]);
    const req = getRequestContext();

    const rows = [];
    ids.forEach(id => {
      const b = before.get(id);
      const a = after.get(id);
      const oldStock = b ? b.stock : null;
      const newStock = a ? a.stock : null;
      if (b && a && Number(oldStock || 0) === Number(newStock || 0)) return;
      rows.push({
        id,
        name: (a || b).name,
        unit: (a || b).unit,
        oldStock,
        newStock,
        change: Number(newStock || 0) - Number(oldStock || 0)
      });
    });
    if (rows.length === 0) return 0;

    const values = [];
    const params = [];
    rows.forEach(r => {
      const base = params.length;
      params.push(r.id, r.name, r.unit, r.oldStock, r.newStock, r.change, note, req.deviceName || null, req.hostname || null, req.ip || null);
      values.push(`(${Array.from({ length: 10 }, (_, i) => `$${base + i + 1}`).join(', ')}, 'RESTORE', 'RESTORE', session_user)`);
    });
    await db.query(
      `INSERT INTO stock_movements (
         item_id, item_name, unit, old_stock, new_stock, change, note, device_name, hostname, ip_address,
         source, action, db_user
       ) VALUES ${values.join(', ')}`,
      params
    );
    return rows.length;
  },

  list: async ({ item_id, source, search, from, to, device, direction, page = 1, limit = 50 } = {}) => {
    const conditions = [];
    const params = [];

    if (item_id) {
      params.push(Number(item_id));
      conditions.push(`item_id = $${params.length}`);
    }
    if (source) {
      params.push(source.split(','));
      conditions.push(`source = ANY($${params.length})`);
    }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(item_name ILIKE $${params.length} OR reference ILIKE $${params.length} OR note ILIKE $${params.length})`);
    }
    if (device) {
      params.push(device);
      conditions.push(`COALESCE(device_name, hostname, ip_address, db_client_addr) = $${params.length}`);
    }
    if (direction === 'IN') conditions.push('change > 0');
    if (direction === 'OUT') conditions.push('change < 0');
    addDateRange(conditions, params, from, to);

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 500);
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);

    const totalsRes = await db.query(
      `SELECT COUNT(*)::INT AS total,
              COALESCE(SUM(change) FILTER (WHERE change > 0), 0) AS total_in,
              COALESCE(-SUM(change) FILTER (WHERE change < 0), 0) AS total_out,
              COALESCE(SUM(change), 0) AS net,
              COUNT(*) FILTER (WHERE source = 'DIRECT_DB')::INT AS direct_count
       FROM stock_movements ${where}`,
      params
    );
    const listRes = await db.query(
      `SELECT * FROM stock_movements ${where}
       ORDER BY created_at DESC, id DESC
       LIMIT ${pageSize} OFFSET ${(pageNum - 1) * pageSize}`,
      params
    );

    const t = totalsRes.rows[0];
    return {
      total: t.total,
      page: pageNum,
      limit: pageSize,
      totals: { in: Number(t.total_in), out: Number(t.total_out), net: Number(t.net), direct: t.direct_count },
      rows: listRes.rows
    };
  },

  count: async ({ from, to } = {}) => {
    const conditions = [];
    const params = [];
    addDateRange(conditions, params, from, to);
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const res = await db.query(`SELECT COUNT(*)::INT AS total FROM stock_movements ${where}`, params);
    return res.rows[0].total;
  },

  getDevices: async () => {
    const res = await db.query(`
      SELECT COALESCE(device_name, hostname, ip_address, db_client_addr) AS device, COUNT(*)::INT AS total
      FROM stock_movements
      WHERE COALESCE(device_name, hostname, ip_address, db_client_addr) IS NOT NULL
      GROUP BY 1
      ORDER BY MAX(created_at) DESC
    `);
    return res.rows;
  }
};

module.exports = stockMovementService;
