const db = require('../config/db');
const queries = require('../queries/purchaseQueries');
const { generateChallanNo, getMonthAndFY } = require('../utils/challanGenerator');
const { toUpperCase, validateLineItems } = require('../utils/dataSanitizer');
const auditService = require('./auditService');
const stockMovementService = require('./stockMovementService');

/**
 * Loads a job work entry with its line items for audit snapshots.
 * Runs on the transaction client, so it sees the transaction's own uncommitted writes.
 */
const loadSnapshot = async (executor, id) => {
  const purchaseRes = await executor.query(queries.getPurchaseById, [id]);
  if (purchaseRes.rows.length === 0) return null;
  const itemsRes = await executor.query(queries.getPurchaseItems, [id]);
  return { ...purchaseRes.rows[0], items: itemsRes.rows };
};

const totalQuantity = (items) => items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);

/**
 * Locks the job work row until COMMIT/ROLLBACK, so a repeated save or delete of the same entry
 * waits for the first one and can never add or remove stock twice.
 *
 * @returns {Promise<boolean>} false when the entry no longer exists
 */
const lockPurchase = async (client, id) => {
  const res = await client.query('SELECT id FROM purchase WHERE id = $1 FOR UPDATE', [id]);
  return res.rows.length > 0;
};

/**
 * Every row id sent with an update must be one of this entry's current rows, at most once;
 * otherwise the row would be skipped silently and lost.
 */
const ensureRowIdsMatch = (items, oldItems) => {
  const oldIds = new Set(oldItems.map(i => Number(i.id)));
  const seen = new Set();
  items.forEach(item => {
    if (item.id === null || item.id === undefined) return;
    const rowId = Number(item.id);
    if (!oldIds.has(rowId) || seen.has(rowId)) {
      const err = new Error('This job work entry was changed (on this or another PC) after you opened it. Please reopen it and make your changes again.');
      err.status = 409;
      throw err;
    }
    seen.add(rowId);
  });
};

const purchaseService = {
  create: async (purchaseData) => {
    validateLineItems(purchaseData.items);
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const { jobber_id, date, remark, items, request_id } = purchaseData;

      // 1. Generate custom challan number (also locks the purchase table until COMMIT)
      const challan_no = await generateChallanNo(date, 'purchase', client);

      // A repeated save of the same form (double-click, retry) returns the entry it already created.
      // Checked after the table lock, so two simultaneous requests cannot both pass.
      if (request_id) {
        const existing = await client.query(queries.getPurchaseIdByRequestId, [request_id]);
        if (existing.rows.length > 0) {
          await client.query('ROLLBACK');
          const purchase = await purchaseService.getById(existing.rows[0].id);
          return { ...purchase, duplicate: true };
        }
      }

      // 2. Insert purchase record
      const purchaseRes = await client.query(queries.createPurchase, [jobber_id, date, toUpperCase(remark), challan_no, request_id || null]);
      const purchase = purchaseRes.rows[0];

      // 2. Insert items and update stock
      await stockMovementService.setContext(client, {
        source: stockMovementService.SOURCES.JOB_WORK, action: 'CREATE', referenceId: purchase.id, reference: challan_no
      });
      const purchaseItems = [];
      let orderIndexCounter = 0;
      for (const item of items) {
        const itemRes = await client.query(queries.createPurchaseItem, [
          purchase.id, item.item_id, item.quantity, toUpperCase(item.unit), orderIndexCounter++
        ]);
        purchaseItems.push(itemRes.rows[0]);

        // Stock Update (Increment)
        await client.query(queries.updateItemStock, [item.quantity, item.item_id]);
      }

      const snapshot = await loadSnapshot(client, purchase.id);
      await auditService.record(client, {
        module: auditService.MODULES.JOB_WORK,
        action: auditService.ACTIONS.CREATE,
        recordId: purchase.id,
        reference: challan_no,
        summary: `Job work ${challan_no} created for ${snapshot.jobber_name}: ${items.length} item${items.length === 1 ? '' : 's'}, total qty ${totalQuantity(items)} added to stock`,
        details: { after: snapshot }
      });

      await client.query('COMMIT');
      return { ...purchase, items: purchaseItems };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  getById: async (id) => {
    const purchaseRes = await db.query(queries.getPurchaseById, [id]);
    if (purchaseRes.rows.length === 0) return null;

    const itemsRes = await db.query(queries.getPurchaseItems, [id]);
    return { ...purchaseRes.rows[0], items: itemsRes.rows };
  },

  getAll: async () => {
    const res = await db.query(queries.getAllPurchases);
    return res.rows;
  },

  getNextId: async (date, purchase_id = null) => {
    const { getFormattedChallan } = require('../utils/challanGenerator');
    if (date) {
      return await getFormattedChallan(date, 'purchase', db);
    }
    const res = await db.query(queries.getNextPurchaseId);
    return res.rows[0].next_id;
  },

  getNextChallan: async (date, purchase_id = null) => {
    const { getFormattedChallan } = require('../utils/challanGenerator');
    return await getFormattedChallan(date, 'purchase', db, purchase_id || null);
  },

  delete: async (id) => {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // Lock first: a repeated delete waits here, then finds the entry gone and changes nothing
      if (!(await lockPurchase(client, id))) {
        await client.query('ROLLBACK');
        return false;
      }

      // Full copy of the job work is archived instead of being lost
      const snapshot = await loadSnapshot(client, id);
      if (!snapshot) {
        await client.query('ROLLBACK');
        return false;
      }

      // 1. Get items to reverse stock
      const itemsRes = await client.query(queries.getPurchaseItems, [id]);
      const items = itemsRes.rows;

      // 2. Reverse stock updates (decrement since it was a purchase)
      await stockMovementService.setContext(client, {
        source: stockMovementService.SOURCES.JOB_WORK, action: 'DELETE', referenceId: Number(id), reference: snapshot.challan_no
      });
      for (const item of items) {
        await client.query(queries.reverseStockUpdate, [item.quantity, item.item_id]);
      }

      // 3. Delete purchase items
      await client.query(queries.deletePurchaseItems, [id]);

      // 4. Delete purchase record (stock above is only kept if the entry really was deleted)
      const deleted = await client.query(queries.deletePurchase, [id]);
      if (deleted.rowCount !== 1) {
        await client.query('ROLLBACK');
        return false;
      }

      await auditService.archiveAndRecord(client, {
        module: auditService.MODULES.JOB_WORK,
        recordId: snapshot.id,
        reference: snapshot.challan_no,
        partyName: snapshot.jobber_name,
        recordDate: snapshot.date,
        amount: null,
        summary: `Job work ${snapshot.challan_no} of ${snapshot.jobber_name} deleted and archived: total qty ${totalQuantity(items)} removed from stock`,
        snapshot
      });

      await client.query('COMMIT');
      return true;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  update: async (id, purchaseData) => {
    validateLineItems(purchaseData.items);
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const { jobber_id, date, remark, items } = purchaseData; // Ignore challan_no from frontend

      // Lock first: a second save of the same entry waits, then works from the first save's result
      const exists = await lockPurchase(client, id);
      const before = exists ? await loadSnapshot(client, id) : null;
      if (!before) {
        const err = new Error('This job work entry no longer exists. It may have been deleted on another PC.');
        err.status = 404;
        throw err;
      }

      // 1. Get old purchase to check date and get items for stock reversal
      const oldPurchaseRes = await client.query('SELECT date, challan_no FROM purchase WHERE id = $1', [id]);
      const oldPurchase = oldPurchaseRes.rows[0];

      let final_challan_no = oldPurchase.challan_no;
      const oldDateData = getMonthAndFY(oldPurchase.date);
      const newDateData = getMonthAndFY(date);

      if (oldDateData.monthNum !== newDateData.monthNum || oldDateData.fyRange !== newDateData.fyRange) {
          final_challan_no = await generateChallanNo(date, 'purchase', client);
      }

      const oldItemsRes = await client.query(queries.getPurchaseItems, [id]);
      const oldItems = oldItemsRes.rows;
      ensureRowIdsMatch(items, oldItems);

      await stockMovementService.setContext(client, {
        source: stockMovementService.SOURCES.JOB_WORK, action: 'UPDATE', referenceId: Number(id), reference: final_challan_no
      });

      // 2. Identify items to delete, update, and insert
      const newIds = items.map(i => i.id).filter(id => id !== null && id !== undefined).map(Number);
      const itemsToDelete = oldItems.filter(old => !newIds.includes(Number(old.id)));
      
      // Delete old items that are no longer present and reverse their stock
      for (const oldItem of itemsToDelete) {
        await client.query(queries.reverseStockUpdate, [oldItem.quantity, oldItem.item_id]);
        await client.query(queries.deleteSinglePurchaseItem, [oldItem.id]);
      }

      // 4. Update the purchase record
      const purchaseRes = await client.query(queries.updatePurchase, [jobber_id, date, toUpperCase(remark), final_challan_no, id]);
      const purchase = purchaseRes.rows[0];

      // 5. Update/Insert purchase items and update stock differentially
      let maxOrderIndex = Math.max(...oldItems.map(i => i.order_index), -1);
      const purchaseItems = [];

      for (const item of items) {
        if (item.id) {
          const oldItem = oldItems.find(i => Number(i.id) === Number(item.id));
          if (oldItem) {
            if (Number(oldItem.item_id) !== Number(item.item_id)) {
              // Product changed on this row: remove full qty from old product, add full qty to new product
              await client.query(queries.reverseStockUpdate, [oldItem.quantity, oldItem.item_id]);
              await client.query(queries.updateItemStock, [item.quantity, item.item_id]);
            } else {
              // Calculate stock difference
              const qtyDiff = parseFloat(item.quantity) - parseFloat(oldItem.quantity);
              if (qtyDiff > 0) {
                await client.query(queries.updateItemStock, [qtyDiff, item.item_id]); // Add more stock
              } else if (qtyDiff < 0) {
                await client.query(queries.reverseStockUpdate, [Math.abs(qtyDiff), item.item_id]); // Revert stock
              }
            }

            const itemRes = await client.query(queries.updatePurchaseItem, [
              item.item_id, item.quantity, toUpperCase(item.unit), oldItem.order_index, item.id
            ]);
            purchaseItems.push(itemRes.rows[0]);
          }
        } else {
          maxOrderIndex++;
          const itemRes = await client.query(queries.createPurchaseItem, [
            id, item.item_id, item.quantity, toUpperCase(item.unit), maxOrderIndex
          ]);
          await client.query(queries.updateItemStock, [item.quantity, item.item_id]); // Add stock
          purchaseItems.push(itemRes.rows[0]);
        }
      }

      const after = await loadSnapshot(client, id);
      const changes = auditService.diffFields(before, after);
      const itemDiff = auditService.diffLineItems(before.items, after.items);
      if (!auditService.isUnchanged(changes, itemDiff)) await auditService.record(client, {
        module: auditService.MODULES.JOB_WORK,
        action: auditService.ACTIONS.UPDATE,
        recordId: Number(id),
        reference: after.challan_no,
        summary: `Job work ${after.challan_no} of ${after.jobber_name} updated: ${auditService.describeUpdate(changes, itemDiff)}`,
        details: { before, after, changes, itemDiff }
      });

      await client.query('COMMIT');
      return { ...purchase, items: purchaseItems };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  getByChallanNo: async (challanNo) => {
    const res = await db.query('SELECT id FROM purchase WHERE challan_no = $1', [challanNo]);
    if (res.rows.length === 0) return null;
    return await purchaseService.getById(res.rows[0].id);
  }
};

module.exports = purchaseService;
