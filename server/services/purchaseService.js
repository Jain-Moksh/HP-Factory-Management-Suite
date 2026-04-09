const db = require('../config/db');
const queries = require('../queries/purchaseQueries');

const purchaseService = {
  create: async (purchaseData) => {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const { jobber_id, date, remark, items } = purchaseData;

      // 1. Insert purchase record
      const purchaseRes = await client.query(queries.createPurchase, [jobber_id, date, remark]);
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
  }
};

module.exports = purchaseService;
