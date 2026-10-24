const db = require('../config/db');
const queries = require('../queries/masterQueries');
const { toUpperCase } = require('../utils/dataSanitizer');
const auditService = require('./auditService');

const AUDIT_MODULES = {
  items: { module: auditService.MODULES.ITEM, label: 'Item' },
  clients: { module: auditService.MODULES.PARTY, label: 'Party' },
  jobbers: { module: auditService.MODULES.JOBBER, label: 'Jobber' },
  transporters: { module: auditService.MODULES.TRANSPORTER, label: 'Transporter' }
};

/**
 * Cleans master form data: empty strings become null, strings are uppercased,
 * and the name is trimmed and required.
 *
 * @throws {Error} 400 error when the name is missing or only spaces
 */
const cleanMasterData = (table, data) => {
  const clean = {};
  Object.keys(data || {}).forEach(key => {
    const value = data[key] === '' ? null : data[key];
    clean[key] = typeof value === 'string' ? toUpperCase(value) : value;
  });

  clean.name = typeof clean.name === 'string' ? clean.name.trim() : clean.name;
  if (!clean.name) {
    const err = new Error(`${AUDIT_MODULES[table].label} name is required.`);
    err.status = 400;
    throw err;
  }
  return clean;
};

// Party / jobber records referenced by payments and group memberships (polymorphic, no foreign key)
const PAYMENT_PARTY_TYPE = { clients: 'CLIENT', jobbers: 'JOBBER' };
const GROUP_MEMBER_TYPE = { clients: 'client', jobbers: 'jobber' };

const duplicateNameError = (table, name) => {
  const err = new Error(`${AUDIT_MODULES[table].label === 'Item' ? 'An' : 'A'} ${AUDIT_MODULES[table].label.toLowerCase()} named ${name} already exists.`);
  err.status = 400;
  return err;
};

/**
 * Refuses a name already used by another record of the same type, ignoring case and spaces.
 * The unique indexes in db.md enforce the same rule if two saves race past this check.
 */
const ensureUniqueName = async (table, name, excludeId = null) => {
  const res = await db.query(
    `SELECT 1 FROM ${table} WHERE UPPER(TRIM(name)) = UPPER(TRIM($1)) AND ($2::INT IS NULL OR id <> $2) LIMIT 1`,
    [name, excludeId]
  );
  if (res.rows.length > 0) throw duplicateNameError(table, name);
};

// 23505 = unique_violation: another PC saved the same name between the check and the insert
const runNameQuery = async (table, name, text, params) => {
  try {
    return await db.query(text, params);
  } catch (err) {
    if (err.code === '23505') throw duplicateNameError(table, name);
    throw err;
  }
};

const masterService = {
  // Generic list/search helper
  list: async (table, search) => {
    if (search) {
      const queryKey = `search${table.charAt(0).toUpperCase() + table.slice(1)}`;
      const result = await db.query(queries[queryKey], [`%${search}%`]);
      return result.rows;
    }
    const queryKey = `getAll${table.charAt(0).toUpperCase() + table.slice(1)}`;
    const result = await db.query(queries[queryKey]);
    return result.rows;
  },

  getById: async (table, id) => {
    const queryKey = `get${table.charAt(0).toUpperCase() + table.slice(1).replace(/s$/, '')}ById`;
    const result = await db.query(queries[queryKey], [id]);
    return result.rows[0];
  },

  create: async (table, data) => {
    const clean = cleanMasterData(table, data);

    let queryKey, params;
    switch (table) {
      case 'items':
        queryKey = 'createItem';
        params = [clean.name, clean.rate, clean.stock, clean.open_stock, clean.conversion, clean.unit, clean.min_stock, clean.packing];
        break;
      case 'clients':
        queryKey = 'createClient';
        params = [clean.name, clean.street, clean.city, clean.shortform, clean.balance, clean.remark];
        break;
      case 'jobbers':
        queryKey = 'createJobber';
        params = [clean.name];
        break;
      case 'transporters':
        queryKey = 'createTransporter';
        params = [clean.name];
        break;
    }
    await ensureUniqueName(table, clean.name);
    const result = await runNameQuery(table, clean.name, queries[queryKey], params);
    const created = result.rows[0];

    const { module, label } = AUDIT_MODULES[table];
    await auditService.recordSafe({
      module,
      action: auditService.ACTIONS.CREATE,
      recordId: created.id,
      reference: created.name,
      summary: table === 'items'
        ? `${label} ${created.name} created with opening stock ${Number(created.open_stock) || 0}`
        : `${label} ${created.name} created`,
      details: { after: created }
    });

    return created;
  },

  update: async (table, id, data) => {
    const clean = cleanMasterData(table, data);

    const before = await masterService.getById(table, id);

    let queryKey, params;
    switch (table) {
      case 'items':
        queryKey = 'updateItem';

        // Fetch old item to calculate stock difference based on open_stock change
        const oldItem = before;
        if (!oldItem) {
          const err = new Error('Item not found');
          err.status = 404;
          throw err;
        }
        
        const oldOpenStock = Number(oldItem.open_stock) || 0;
        const currentStock = Number(oldItem.stock) || 0;
        const newOpenStock = Number(clean.open_stock) || 0;
        
        const difference = newOpenStock - oldOpenStock;
        const updatedStock = currentStock + difference;

        params = [clean.name, clean.rate, updatedStock, clean.open_stock, clean.conversion, clean.unit, clean.min_stock, clean.packing, id];
        break;
      case 'clients':
        queryKey = 'updateClient';
        params = [clean.name, clean.street, clean.city, clean.shortform, clean.balance, clean.remark, id];
        break;
      case 'jobbers':
        queryKey = 'updateJobber';
        params = [clean.name, id];
        break;
      case 'transporters':
        queryKey = 'updateTransporter';
        params = [clean.name, id];
        break;
    }
    await ensureUniqueName(table, clean.name, id);
    const result = await runNameQuery(table, clean.name, queries[queryKey], params);
    const after = result.rows[0];

    if (after) {
      const { module, label } = AUDIT_MODULES[table];
      const changes = auditService.diffFields(before, after);
      await auditService.recordSafe({
        module,
        action: auditService.ACTIONS.UPDATE,
        recordId: after.id,
        reference: after.name,
        summary: `${label} ${after.name} updated: ${auditService.describeUpdate(changes)}`,
        details: { before, after, changes }
      });
    }

    return after;
  },

  /**
   * Deletes a master record and keeps an archived copy of it.
   * Records still used by bills / job work fail with a foreign key error (23503), and parties /
   * jobbers that still have payments are refused (400); in both cases nothing is changed.
   * Group memberships of a deleted party / jobber are removed with it.
   *
   * @returns {Promise<object|null>} The deleted record, or null if it did not exist
   */
  delete: async (table, id) => {
    const getKey = `get${table.charAt(0).toUpperCase() + table.slice(1).replace(/s$/, '')}ById`;
    const deleteKey = `delete${table.charAt(0).toUpperCase() + table.slice(1).replace(/s$/, '')}`;
    const { module, label } = AUDIT_MODULES[table];

    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const existing = await client.query(queries[getKey], [id]);
      if (existing.rows.length === 0) {
        await client.query('ROLLBACK');
        return null;
      }
      const snapshot = existing.rows[0];

      if (PAYMENT_PARTY_TYPE[table]) {
        // Payments point to the party without a foreign key, so the database would not stop this delete
        const payRes = await client.query(
          'SELECT COUNT(*)::INT AS total FROM party_transactions WHERE party_type = $1 AND party_id = $2',
          [PAYMENT_PARTY_TYPE[table], id]
        );
        const paymentCount = payRes.rows[0].total;
        if (paymentCount > 0) {
          const err = new Error(`${snapshot.name} has ${paymentCount} payment${paymentCount === 1 ? '' : 's'}. Delete ${paymentCount === 1 ? 'that payment' : 'those payments'} first.`);
          err.status = 400;
          throw err;
        }

        const groupRes = await client.query(
          `DELETE FROM group_members gm USING groups g
           WHERE gm.group_id = g.id AND gm.member_type = $1 AND gm.member_id = $2
           RETURNING g.name`,
          [GROUP_MEMBER_TYPE[table], id]
        );
        if (groupRes.rows.length > 0) {
          snapshot.groups = groupRes.rows.map(r => r.name).sort().join(', ');
        }
      }

      await client.query(queries[deleteKey], [id]);

      await auditService.archiveAndRecord(client, {
        module,
        recordId: snapshot.id,
        reference: snapshot.name,
        partyName: snapshot.name,
        summary: `${label} ${snapshot.name} deleted and archived`,
        snapshot
      });

      await client.query('COMMIT');
      return snapshot;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  getItemTransactions: async (itemId, startDate, endDate) => {
    let query = queries.getItemTransactions;
    let params = [itemId];

    const result = await db.query(query, params);
    let transactions = result.rows;

    // Filter by date if provided
    if (startDate || endDate) {
      transactions = transactions.filter(t => {
        const date = t.date.toISOString().split('T')[0];
        const matchesStart = !startDate || date >= startDate;
        const matchesEnd = !endDate || date <= endDate;
        return matchesStart && matchesEnd;
      });
    }

    return transactions;
  }
};

module.exports = masterService;
