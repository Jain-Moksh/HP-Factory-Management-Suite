const db = require('../config/db');
const queries = require('../queries/billingQueries');

const billingService = {
  create: async (billData) => {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const {
        client_id, transporter_id, date, transport_charge, packing_charge,
        discount_percent, discount_amount, total_amount, short_remark,
        long_remark, grand_total, items
      } = billData;

      // 1. Insert billing record
      const billRes = await client.query(queries.createBill, [
        client_id, transporter_id, date, transport_charge, packing_charge,
        discount_percent, discount_amount, total_amount, short_remark,
        long_remark, grand_total
      ]);
      const bill = billRes.rows[0];

      // 2. Insert billing items and update stock
      const billingItems = [];
      for (const item of items) {
        const itemRes = await client.query(queries.createBillItem, [
          bill.id, item.item_id, item.rate, item.discount_percent, item.discount_amount,
          item.unit, item.quantity, item.bundle, item.total_amount
        ]);
        billingItems.push(itemRes.rows[0]);

        // Stock Update (Decrement)
        await client.query(queries.updateItemStock, [item.quantity, item.item_id]);
      }

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
  }
};

module.exports = billingService;
