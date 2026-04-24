const db = require('../config/db');
const queries = require('../queries/purchaseQueries');
const { generateChallanNo } = require('../utils/challanGenerator');
const { toUpperCase } = require('../utils/dataSanitizer');

const purchaseService = {
  create: async (purchaseData) => {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const { jobber_id, date, remark, items } = purchaseData;

      // 1. Generate custom challan number
      const challan_no = await generateChallanNo(date, 'purchase', client);

      // 2. Insert purchase record
      const purchaseRes = await client.query(queries.createPurchase, [jobber_id, date, toUpperCase(remark), challan_no]);
      const purchase = purchaseRes.rows[0];

      // 2. Insert items and update stock
      const purchaseItems = [];
      for (const item of items) {
        const itemRes = await client.query(queries.createPurchaseItem, [
          purchase.id, item.item_id, item.quantity, toUpperCase(item.unit)
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
    return await getFormattedChallan(date, 'purchase', db);
  },

  delete: async (id) => {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // 1. Get items to reverse stock
      const itemsRes = await client.query(queries.getPurchaseItems, [id]);
      const items = itemsRes.rows;

      // 2. Reverse stock updates (decrement since it was a purchase)
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
  },

  update: async (id, purchaseData) => {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const { jobber_id, date, remark, items, challan_no } = purchaseData;

      // 1. Get old items to reverse stock
      const oldItemsRes = await client.query(queries.getPurchaseItems, [id]);
      const oldItems = oldItemsRes.rows;

      // 2. Reverse stock updates (Subtract back original quantities added during purchase)
      for (const item of oldItems) {
        await client.query(queries.reverseStockUpdate, [item.quantity, item.item_id]);
      }

      // 3. Delete old purchase items
      await client.query(queries.deletePurchaseItems, [id]);

      // 4. Update the purchase record
      const purchaseRes = await client.query(queries.updatePurchase, [jobber_id, date, toUpperCase(remark), challan_no, id]);
      const purchase = purchaseRes.rows[0];

      // 5. Insert new purchase items and update stock
      const purchaseItems = [];
      for (const item of items) {
        const itemRes = await client.query(queries.createPurchaseItem, [
          id, item.item_id, item.quantity, toUpperCase(item.unit)
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
  }
};

module.exports = purchaseService;
