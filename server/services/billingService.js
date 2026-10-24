const db = require('../config/db');
const queries = require('../queries/billingQueries');
const { generateChallanNo, getMonthAndFY } = require('../utils/challanGenerator');
const { toUpperCase, validateLineItems } = require('../utils/dataSanitizer');
const auditService = require('./auditService');

const formatAmount = (value) => Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Loads a bill with its line items for audit snapshots. Runs on the transaction client,
 * so it sees the transaction's own uncommitted writes.
 */
const loadSnapshot = async (executor, id) => {
  const billRes = await executor.query(queries.getBillById, [id]);
  if (billRes.rows.length === 0) return null;
  const { address1, address2, client_shortform, ...bill } = billRes.rows[0];
  const itemsRes = await executor.query(queries.getBillItems, [id]);
  return { ...bill, items: itemsRes.rows.map(({ conversion, ...item }) => item) };
};

const billingService = {
  create: async (billData) => {
    validateLineItems(billData.items);
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const {
        client_id, transporter_id, date, transport_charge, packing_charge,
        discount_percent, discount_amount, adjustment_percent, adjustment_amount, total_amount, short_remark,
        long_remark, grand_total, items, request_id
      } = billData;

      // 1. Generate custom challan number (also locks the billing table until COMMIT)
      const challan_no = await generateChallanNo(date, 'billing', client);

      // A repeated save of the same form (double-click, retry) returns the bill it already created.
      // Checked after the table lock, so two simultaneous requests cannot both pass.
      if (request_id) {
        const existing = await client.query(queries.getBillIdByRequestId, [request_id]);
        if (existing.rows.length > 0) {
          await client.query('ROLLBACK');
          const bill = await billingService.getById(existing.rows[0].id);
          return { ...bill, duplicate: true };
        }
      }

      // 2. Insert billing record
      const billRes = await client.query(queries.createBill, [
        client_id, transporter_id, date, transport_charge, packing_charge,
        discount_percent, discount_amount, adjustment_percent, adjustment_amount, total_amount, toUpperCase(short_remark),
        toUpperCase(long_remark), grand_total, challan_no, request_id || null
      ]);
      const bill = billRes.rows[0];

      // 3. Bulk Insert billing items and Bulk Update stock
      const itemValues = [];
      const stockValues = [];
      const itemParams = [bill.id];
      let paramIndex = 2;

      items.forEach((item, index) => {
        itemValues.push(`($1, $${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6}, $${paramIndex + 7}, $${paramIndex + 8})`);
        itemParams.push(
          item.item_id, item.rate, item.discount_percent, item.discount_amount,
          toUpperCase(item.unit), item.quantity, item.bundle, item.total_amount, index
        );
        paramIndex += 9;

        stockValues.push(`($${index * 2 + 1}::numeric, $${index * 2 + 2}::int)`);
      });

      // Execute Bulk Insert
      const insertQuery = `
        INSERT INTO billing_items (
          billing_id, item_id, rate, discount_percent, discount_amount, 
          unit, quantity, bundle, total_amount, order_index
        ) VALUES ${itemValues.join(',')}
        RETURNING *
      `;
      const billingItemsRes = await client.query(insertQuery, itemParams);
      const billingItems = billingItemsRes.rows;

      // Execute Bulk Stock Update
      // Quantities are summed per item: UPDATE ... FROM applies only one source row per target row,
      // so the same item on two rows would otherwise be deducted only once
      const stockParams = items.flatMap(item => [item.quantity, item.item_id]);
      const stockQuery = `
        UPDATE items SET stock = items.stock - v.qty
        FROM (
          SELECT id, SUM(qty) AS qty
          FROM (VALUES ${stockValues.join(',')}) AS t(qty, id)
          GROUP BY id
        ) AS v
        WHERE items.id = v.id
      `;
      await client.query(stockQuery, stockParams);

      const snapshot = await loadSnapshot(client, bill.id);
      await auditService.record(client, {
        module: auditService.MODULES.BILLING,
        action: auditService.ACTIONS.CREATE,
        recordId: bill.id,
        reference: challan_no,
        summary: `Bill ${challan_no} created for ${snapshot.client_name}: ₹${formatAmount(grand_total)} (${items.length} item${items.length === 1 ? '' : 's'})`,
        details: { after: snapshot }
      });

      await client.query('COMMIT');
      return { ...bill, items: billingItems };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  getById: async (id) => {
    const billRes = await db.query(queries.getBillById, [id]);
    if (billRes.rows.length === 0) return null;

    const itemsRes = await db.query(queries.getBillItems, [id]);
    return { ...billRes.rows[0], items: itemsRes.rows };
  },

  getAll: async (filters = {}) => {
    const { searchChallan, searchClient, startDate, endDate, month, year } = filters;
    let queryStr = `
      SELECT 
        b.*,
        c.name as client_name,
        c.shortform as client_shortform
      FROM billing b
      JOIN clients c ON b.client_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (searchChallan) {
      params.push(`%${searchChallan}%`);
      queryStr += ` AND b.challan_no ILIKE $${params.length}`;
    }

    if (searchClient) {
      params.push(`%${searchClient}%`);
      queryStr += ` AND c.name ILIKE $${params.length}`;
    }

    if (startDate) {
      params.push(startDate);
      queryStr += ` AND b.date >= $${params.length}`;
    }

    if (endDate) {
      params.push(endDate);
      queryStr += ` AND b.date <= $${params.length}`;
    }

    if (month !== undefined && month !== null && month !== '') {
      params.push(parseInt(month) + 1); // JS months are 0-11, SQL EXTRACT(MONTH) is 1-12
      queryStr += ` AND EXTRACT(MONTH FROM b.date) = $${params.length}`;
    }

    if (year) {
      params.push(year);
      queryStr += ` AND EXTRACT(YEAR FROM b.date) = $${params.length}`;
    }

    queryStr += ` ORDER BY b.date DESC, b.id DESC`;

    const result = await db.query(queryStr, params);
    return result.rows;
  },

  delete: async (id) => {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // Full copy of the bill is archived instead of being lost
      const snapshot = await loadSnapshot(client, id);
      if (!snapshot) {
        await client.query('ROLLBACK');
        return null;
      }

      // 1. Get items to reverse stock
      const itemsRes = await client.query(queries.getBillItems, [id]);
      const items = itemsRes.rows;

      // 2. Reverse stock updates in Bulk
      if (items.length > 0) {
        const stockValues = items.map((_, i) => `($${i * 2 + 1}::numeric, $${i * 2 + 2}::int)`);
        const stockParams = items.flatMap(item => [item.quantity, item.item_id]);
        // Quantities are summed per item so the same item on two rows is fully restored
        const stockQuery = `
          UPDATE items SET stock = items.stock + v.qty
          FROM (
            SELECT id, SUM(qty) AS qty
            FROM (VALUES ${stockValues.join(',')}) AS t(qty, id)
            GROUP BY id
          ) AS v
          WHERE items.id = v.id
        `;
        await client.query(stockQuery, stockParams);
      }

      // 3. Delete billing items
      await client.query(queries.deleteBillItems, [id]);

      // 4. Delete billing record
      const result = await client.query(queries.deleteBill, [id]);

      await auditService.archiveAndRecord(client, {
        module: auditService.MODULES.BILLING,
        recordId: snapshot.id,
        reference: snapshot.challan_no,
        partyName: snapshot.client_name,
        recordDate: snapshot.date,
        amount: snapshot.grand_total,
        summary: `Bill ${snapshot.challan_no} of ${snapshot.client_name} deleted and archived: ₹${formatAmount(snapshot.grand_total)}, stock returned for ${items.length} item${items.length === 1 ? '' : 's'}`,
        snapshot
      });

      await client.query('COMMIT');
      return result.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  getNextId: async (date, billing_id = null) => {
    const { getFormattedChallan } = require('../utils/challanGenerator');
    if (date) {
      return await getFormattedChallan(date, 'billing', db, billing_id);
    }
    const result = await db.query(queries.getNextBillId);
    return result.rows[0].next_id;
  },

  getNextChallan: async (date, billing_id = null) => {
    const { getFormattedChallan } = require('../utils/challanGenerator');
    return await getFormattedChallan(date, 'billing', db, billing_id);
  },

  update: async (id, billData) => {
    validateLineItems(billData.items);
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const {
        client_id, transporter_id, date, transport_charge, packing_charge,
        discount_percent, discount_amount, adjustment_percent, adjustment_amount, total_amount, short_remark,
        long_remark, grand_total, items
      } = billData; // Ignored challan_no from frontend

      const before = await loadSnapshot(client, id);

      // 1. Get old bill to check date and get items for stock reversal
      const oldBillRes = await client.query('SELECT date, challan_no FROM billing WHERE id = $1', [id]);
      const oldBill = oldBillRes.rows[0];

      let final_challan_no = oldBill.challan_no;
      const oldDateData = getMonthAndFY(oldBill.date);
      const newDateData = getMonthAndFY(date);

      if (oldDateData.monthNum !== newDateData.monthNum || oldDateData.fyRange !== newDateData.fyRange) {
        final_challan_no = await generateChallanNo(date, 'billing', client);
      }

      const oldItemsRes = await client.query(queries.getBillItems, [id]);
      const oldItems = oldItemsRes.rows;

      // 2. Identify items to delete, update, and insert
      const newIds = items.map(i => i.id).filter(id => id !== null && id !== undefined);
      const itemsToDelete = oldItems.filter(old => !newIds.includes(old.id));

      // Delete old items that are no longer present and reverse their stock
      for (const oldItem of itemsToDelete) {
        await client.query(queries.reverseStockUpdate, [oldItem.quantity, oldItem.item_id]);
        await client.query(queries.deleteSingleBillItem, [oldItem.id]);
      }

      // 4. Update the billing record
      const billRes = await client.query(queries.updateBill, [
        client_id, transporter_id, date, transport_charge, packing_charge,
        discount_percent, discount_amount, adjustment_percent, adjustment_amount, total_amount, toUpperCase(short_remark),
        toUpperCase(long_remark), grand_total, final_challan_no, id
      ]);
      const bill = billRes.rows[0];

      // 5. Update/Insert billing items and update stock differentially
      let maxOrderIndex = Math.max(...oldItems.map(i => i.order_index), -1);
      const billingItems = [];

      for (const item of items) {
        if (item.id) {
          const oldItem = oldItems.find(i => i.id === item.id);
          if (oldItem) {
            if (Number(oldItem.item_id) !== Number(item.item_id)) {
              // Product changed on this row: return full qty to old product, deduct full qty from new product
              await client.query(queries.reverseStockUpdate, [oldItem.quantity, oldItem.item_id]);
              await client.query(queries.updateItemStock, [item.quantity, item.item_id]);
            } else {
              // Calculate stock difference
              const qtyDiff = parseFloat(item.quantity) - parseFloat(oldItem.quantity);
              if (qtyDiff > 0) {
                await client.query(queries.updateItemStock, [qtyDiff, item.item_id]); // Deduct more stock
              } else if (qtyDiff < 0) {
                await client.query(queries.reverseStockUpdate, [Math.abs(qtyDiff), item.item_id]); // Add back stock
              }
            }

            const itemRes = await client.query(queries.updateBillItem, [
              item.item_id, item.rate, item.discount_percent, item.discount_amount,
              toUpperCase(item.unit), item.quantity, item.bundle, item.total_amount, oldItem.order_index, item.id
            ]);
            billingItems.push(itemRes.rows[0]);
          }
        } else {
          maxOrderIndex++;
          const itemRes = await client.query(queries.createBillItem, [
            id, item.item_id, item.rate, item.discount_percent, item.discount_amount,
            toUpperCase(item.unit), item.quantity, item.bundle, item.total_amount, maxOrderIndex
          ]);
          await client.query(queries.updateItemStock, [item.quantity, item.item_id]); // Deduct stock
          billingItems.push(itemRes.rows[0]);
        }
      }

      const after = await loadSnapshot(client, id);
      const changes = auditService.diffFields(before, after);
      const itemDiff = auditService.diffLineItems(before.items, after.items);
      await auditService.record(client, {
        module: auditService.MODULES.BILLING,
        action: auditService.ACTIONS.UPDATE,
        recordId: Number(id),
        reference: after.challan_no,
        summary: `Bill ${after.challan_no} of ${after.client_name} updated: ${auditService.describeUpdate(changes, itemDiff)}`,
        details: { before, after, changes, itemDiff }
      });

      await client.query('COMMIT');
      return { ...bill, items: billingItems };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  getByChallanNo: async (challanNo) => {
    const res = await db.query('SELECT id FROM billing WHERE challan_no = $1', [challanNo]);
    if (res.rows.length === 0) return null;
    return await billingService.getById(res.rows[0].id);
  }
};

module.exports = billingService;
