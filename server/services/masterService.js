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
    // Sanitize: convert empty strings to null
    const clean = {};
    Object.keys(data).forEach(key => {
      let value = data[key] === '' ? null : data[key];
      // Convert to uppercase if it's a string
      clean[key] = typeof value === 'string' ? toUpperCase(value) : value;
    });

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
        params = [data.name];
        break;
      case 'transporters':
        queryKey = 'createTransporter';
        params = [data.name];
        break;
    }
    const result = await db.query(queries[queryKey], params);
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
    // Sanitize: convert empty strings to null
    const clean = {};
    Object.keys(data).forEach(key => {
      let value = data[key] === '' ? null : data[key];
      // Convert to uppercase if it's a string
      clean[key] = typeof value === 'string' ? toUpperCase(value) : value;
    });

    const before = await masterService.getById(table, id);

    let queryKey, params;
    switch (table) {
      case 'items':
        queryKey = 'updateItem';

        // Fetch old item to calculate stock difference based on open_stock change
        const oldItem = before;
        if (!oldItem) throw new Error('Item not found');
        
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
        params = [data.name, id];
        break;
      case 'transporters':
        queryKey = 'updateTransporter';
        params = [data.name, id];
        break;
    }
    const result = await db.query(queries[queryKey], params);
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
   * Records still used by bills / job work fail with a foreign key error (23503) and nothing is archived.
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
