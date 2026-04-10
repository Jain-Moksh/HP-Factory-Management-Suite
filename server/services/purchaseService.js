const db = require('../config/db');
const queries = require('../queries/purchaseQueries');
const { generateChallanNo } = require('../utils/challanGenerator');

const purchaseService = {
  create: async (purchaseData) => {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const { jobber_id, date, remark, items } = purchaseData;

      // 1. Generate custom challan number
      const challan_no = await generateChallanNo(date, 'purchase', client);

      // 2. Insert purchase record
      const purchaseRes = await client.query(queries.createPurchase, [jobber_id, date, remark, challan_no]);
      const purchase = purchaseRes.rows[0];

      // 2. Insert items and update stock
      const purchaseItems = [];
      for (const item of items) {
        const itemRes = await client.query(queries.createPurchaseItem, [
          purchase.id, item.item_id, item.quantity, item.unit
        ]);
        purchaseItems.push(itemRes.rows[0]);

        // Stock Update (Increment)
        await client.query(queries.updateItemStock, [item.quantity, item.item_id]);
      }

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

  getNextId: async (date) => {
    const { getFormattedChallan } = require('../utils/challanGenerator');
    if (date) {
      return await getFormattedChallan(date, 'purchase', db);
    }
    const res = await db.query(queries.getNextPurchaseId);
    return res.rows[0].next_id;
  },

  delete: async (id) => {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // 1. Get items to reverse stock
      const itemsRes = await client.query(queries.getPurchaseItems, [id]);
      const items = itemsRes.rows;

      // 2. Reverse stock updates (decrement)
      for (const item of items) {
        await client.query(queries.reverseStockUpdate, [item.quantity, item.item_id]);
      }

      // 3. Delete purchase items
      await client.query(queries.deletePurchaseItems, [id]);

      // 4. Delete purchase record
      await client.query(queries.deletePurchase, [id]);

      await client.query('COMMIT');
      return true;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
};

module.exports = purchaseService;
