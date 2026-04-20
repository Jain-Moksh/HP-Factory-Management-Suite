const { pool } = require('../config/db');

async function createIndexes() {
  const client = await pool.connect();
  try {
    console.log('--- Creating Indexes for Party Wise Stock Report ---');
    
    // 1. idx_billing_client_date
    try {
      await client.query('CREATE INDEX idx_billing_client_date ON billing(client_id, date)');
      console.log('✅ Created idx_billing_client_date');
    } catch (err) {
      if (err.code === '42P07') {
        console.log('ℹ️ Index idx_billing_client_date already exists');
      } else {
        throw err;
      }
    }

    // 2. idx_billing_items_item
    try {
      await client.query('CREATE INDEX idx_billing_items_item ON billing_items(item_id)');
      console.log('✅ Created idx_billing_items_item');
    } catch (err) {
      if (err.code === '42P07') {
        console.log('ℹ️ Index idx_billing_items_item already exists');
      } else {
        throw err;
      }
    }

    // 3. idx_billing_items_billing
    try {
      await client.query('CREATE INDEX idx_billing_items_billing ON billing_items(billing_id)');
      console.log('✅ Created idx_billing_items_billing');
    } catch (err) {
      if (err.code === '42P07') {
        console.log('ℹ️ Index idx_billing_items_billing already exists');
      } else {
        throw err;
      }
    }

    console.log('--- Finished Index Creation ---');
  } catch (err) {
    console.error('❌ Error creating indexes:', err.message);
  } finally {
    client.release();
    process.exit();
  }
}

createIndexes();
