const db = require('../config/db');

async function runMigration() {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    
    console.log("Adding order_index to billing_items...");
    await client.query('ALTER TABLE billing_items ADD COLUMN order_index INT NOT NULL DEFAULT 0;');
    
    console.log("Adding order_index to purchase_items...");
    await client.query('ALTER TABLE purchase_items ADD COLUMN order_index INT NOT NULL DEFAULT 0;');
    
    await client.query('COMMIT');
    console.log("Migration successful!");
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Migration failed:", err);
  } finally {
    client.release();
    process.exit();
  }
}

runMigration();
