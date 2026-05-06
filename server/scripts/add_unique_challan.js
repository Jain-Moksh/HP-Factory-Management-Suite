const db = require('../config/db');

async function runMigration() {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    
    console.log("Adding UNIQUE constraint to billing.challan_no...");
    await client.query('ALTER TABLE billing ADD CONSTRAINT unique_billing_challan UNIQUE (challan_no);');
    
    console.log("Adding UNIQUE constraint to purchase.challan_no...");
    await client.query('ALTER TABLE purchase ADD CONSTRAINT unique_purchase_challan UNIQUE (challan_no);');
    
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
