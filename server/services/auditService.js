const db = require('../config/db');
const queries = require('../queries/auditQueries');
const { getRequestContext } = require('../utils/requestContext');

const MODULES = {
  BILLING: 'BILLING',
  JOB_WORK: 'JOB_WORK',
  PAYMENT: 'PAYMENT',
  ITEM: 'ITEM',
  PARTY: 'PARTY',
  JOBBER: 'JOBBER',
  TRANSPORTER: 'TRANSPORTER',
  GROUP: 'GROUP',
  PRICE_LIST: 'PRICE_LIST',
  SYSTEM: 'SYSTEM'
};

const ACTIONS = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  RESTORE: 'RESTORE'
};

// Bookkeeping columns that change on every save and carry no business meaning
const IGNORED_DIFF_FIELDS = ['created_at', 'updated_at', 'order_index'];

const isNumeric = (v) => v !== null && v !== '' && typeof v !== 'boolean' && !isNaN(Number(v));

const sameValue = (a, b) => {
  if ((a === null || a === undefined || a === '') && (b === null || b === undefined || b === '')) return true;
  if (isNumeric(a) && isNumeric(b)) return Number(a) === Number(b);
  return String(a) === String(b);
};

/**
 * Lists scalar fields that differ between two snapshots of a record.
 * Foreign keys are skipped when a matching *_name field exists, since the name change is the readable one.
 *
 * @param {object} before - Snapshot before the change
 * @param {object} after - Snapshot after the change
 * @returns {Array<{field: string, from: any, to: any}>}
 */
const diffFields = (before = {}, after = {}) => {
  const keys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);
  const changes = [];

  keys.forEach(key => {
    if (key === 'id' || IGNORED_DIFF_FIELDS.includes(key)) return;
    const from = before ? before[key] : undefined;
    const to = after ? after[key] : undefined;
    if ((from !== null && typeof from === 'object') || (to !== null && typeof to === 'object')) return;

    if (key.endsWith('_id')) {
      const nameKey = key.replace(/_id$/, '_name');
      if ((before && nameKey in before) || (after && nameKey in after)) return;
    }

    if (!sameValue(from, to)) {
      changes.push({ field: key, from: from ?? null, to: to ?? null });
    }
  });

  return changes;
};

/**
 * Compares line items (bill / job work rows) by row id.
 *
 * @returns {{added: Array, removed: Array, modified: Array<{before, after, changes}>}}
 */
const diffLineItems = (beforeItems = [], afterItems = []) => {
  const beforeById = new Map(beforeItems.map(i => [i.id, i]));
  const afterIds = new Set(afterItems.map(i => i.id));

  const added = afterItems.filter(i => !beforeById.has(i.id));
  const removed = beforeItems.filter(i => !afterIds.has(i.id));
  const modified = [];
  afterItems.forEach(item => {
    const old = beforeById.get(item.id);
    if (!old) return;
    const changes = diffFields(old, item);
    if (changes.length) modified.push({ before: old, after: item, changes });
  });

  return { added, removed, modified };
};

const toLabel = (field) => field.replace(/_/g, ' ');

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Adds created_at range conditions. Accepts plain dates (inclusive, in the database's timezone)
 * or ISO timestamps (from inclusive, to exclusive), which the Audit page sends so that
 * "today" means the viewer's local day regardless of the database timezone.
 */
const addDateRange = (conditions, params, column, from, to) => {
  if (from) {
    params.push(from);
    conditions.push(DATE_ONLY.test(from) ? `${column} >= $${params.length}::date` : `${column} >= $${params.length}::timestamptz`);
  }
  if (to) {
    params.push(to);
    conditions.push(DATE_ONLY.test(to) ? `${column} < ($${params.length}::date + 1)` : `${column} < $${params.length}::timestamptz`);
  }
};

/**
 * Builds the human-readable part of an update summary, e.g. "date, grand total; items +1 / -0 / ~2".
 */
const describeUpdate = (changes, itemDiff) => {
  const parts = [];
  if (changes.length) parts.push(changes.map(c => toLabel(c.field)).join(', '));
  if (itemDiff && (itemDiff.added.length || itemDiff.removed.length || itemDiff.modified.length)) {
    const itemParts = [];
    if (itemDiff.added.length) itemParts.push(`${itemDiff.added.length} added`);
    if (itemDiff.removed.length) itemParts.push(`${itemDiff.removed.length} removed`);
    if (itemDiff.modified.length) itemParts.push(`${itemDiff.modified.length} changed`);
    parts.push(`items ${itemParts.join(', ')}`);
  }
  return parts.length ? parts.join('; ') : 'no field changes';
};

const auditService = {
  MODULES,
  ACTIONS,
  diffFields,
  diffLineItems,
  describeUpdate,

  /**
   * Writes an audit log entry. Pass the transaction client so the entry commits or rolls back with the change.
   *
   * @param {object} executor - pg client inside a transaction, or the db module
   * @param {object} entry - { module, action, recordId, reference, summary, details }
   * @returns {Promise<number>} The audit log id
   */
  record: async (executor, { module, action, recordId = null, reference = null, summary = null, details = null }) => {
    const ctx = getRequestContext();
    const res = await executor.query(queries.insertLog, [
      module,
      action,
      recordId,
      reference,
      summary,
      details ? JSON.stringify(details) : null,
      ctx.deviceName || null,
      ctx.hostname || null,
      ctx.ip || null,
      ctx.os || null,
      ctx.browser || null,
      ctx.userAgent || null
    ]);
    return res.rows[0].id;
  },

  /**
   * Writes an audit log entry for a change that has already been saved outside a transaction.
   * A logging failure is reported but never fails the user's request.
   */
  recordSafe: async (entry) => {
    try {
      return await auditService.record(db, entry);
    } catch (err) {
      console.error('[AUDIT] Failed to write audit log:', err.message);
      return null;
    }
  },

  /**
   * Keeps a full copy of a deleted record. Archived records live outside the live tables,
   * so no stock, ledger or report query ever counts them.
   *
   * @param {object} executor - pg client inside the delete transaction
   * @param {object} record - { entityType, originalId, reference, partyName, recordDate, amount, data }
   * @returns {Promise<number>} The archive id
   */
  archive: async (executor, { entityType, originalId, reference = null, partyName = null, recordDate = null, amount = null, data }) => {
    const ctx = getRequestContext();
    const res = await executor.query(queries.insertArchive, [
      entityType,
      originalId,
      reference,
      partyName,
      recordDate,
      amount,
      JSON.stringify(data),
      ctx.deviceName || null,
      ctx.hostname || null,
      ctx.ip || null
    ]);
    return res.rows[0].id;
  },

  /**
   * Moves a deleted record into the archive and logs the deletion in one step.
   * Must be called inside the same transaction as the DELETE.
   */
  archiveAndRecord: async (executor, { module, recordId, reference, partyName, recordDate, amount, summary, snapshot }) => {
    const archiveId = await auditService.archive(executor, {
      entityType: module,
      originalId: recordId,
      reference,
      partyName,
      recordDate,
      amount,
      data: snapshot
    });
    await auditService.record(executor, {
      module,
      action: ACTIONS.DELETE,
      recordId,
      reference,
      summary,
      details: { before: snapshot, archive_id: archiveId }
    });
    return archiveId;
  },

  list: async ({ module, action, search, from, to, device, page = 1, limit = 50 } = {}) => {
    const conditions = [];
    const params = [];

    if (module) {
      params.push(module.split(','));
      conditions.push(`module = ANY($${params.length})`);
    }
    if (action) {
      params.push(action);
      conditions.push(`action = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(reference ILIKE $${params.length} OR summary ILIKE $${params.length})`);
    }
    addDateRange(conditions, params, 'created_at', from, to);
    if (device) {
      params.push(device);
      conditions.push(`COALESCE(device_name, hostname, ip_address) = $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 500);
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);

    const countRes = await db.query(`SELECT COUNT(*)::INT AS total FROM audit_logs ${where}`, params);
    const listRes = await db.query(
      `SELECT id, module, action, record_id, reference, summary, device_name, hostname, ip_address, os, browser, created_at
       FROM audit_logs ${where}
       ORDER BY created_at DESC, id DESC
       LIMIT ${pageSize} OFFSET ${(pageNum - 1) * pageSize}`,
      params
    );

    return { total: countRes.rows[0].total, page: pageNum, limit: pageSize, rows: listRes.rows };
  },

  getModuleCounts: async ({ from, to } = {}) => {
    const conditions = [];
    const params = [];
    addDateRange(conditions, params, 'created_at', from, to);
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const logRes = await db.query(`SELECT module, COUNT(*)::INT AS total FROM audit_logs ${where} GROUP BY module`, params);
    const archiveRes = await db.query('SELECT COUNT(*)::INT AS total FROM archived_records');

    const counts = {};
    logRes.rows.forEach(r => { counts[r.module] = r.total; });
    return { modules: counts, archived: archiveRes.rows[0].total };
  },

  getById: async (id) => {
    const res = await db.query(queries.getLogById, [id]);
    return res.rows[0] || null;
  },

  getDevices: async () => {
    const res = await db.query(queries.getDevices);
    return res.rows;
  },

  listArchived: async ({ entityType, search } = {}) => {
    const conditions = [];
    const params = [];
    if (entityType) {
      params.push(entityType);
      conditions.push(`entity_type = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(reference ILIKE $${params.length} OR party_name ILIKE $${params.length})`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const res = await db.query(
      `SELECT id, entity_type, original_id, reference, party_name, record_date, amount, device_name, hostname, ip_address, archived_at
       FROM archived_records ${where}
       ORDER BY archived_at DESC, id DESC
       LIMIT 1000`,
      params
    );
    return res.rows;
  },

  getArchivedById: async (id) => {
    const res = await db.query(queries.getArchivedById, [id]);
    return res.rows[0] || null;
  }
};

module.exports = auditService;
