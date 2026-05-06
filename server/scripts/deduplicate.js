const db = require('../config/db');

async function runDeduplication() {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    
    console.log("Deduplicating billing...");
    // Find duplicates and append '-1', '-2'
    await client.query(`
      WITH duplicates AS (
        SELECT id, challan_no, ROW_NUMBER() OVER (PARTITION BY challan_no ORDER BY id) as rn
        FROM billing
      )
      UPDATE billing
      SET challan_no = billing.challan_no || '-' || duplicates.rn
      FROM duplicates
      WHERE billing.id = duplicates.id AND duplicates.rn > 1;
    `);

    console.log("Deduplicating purchase...");
    await client.query(`
      WITH duplicates AS (
        SELECT id, challan_no, ROW_NUMBER() OVER (PARTITION BY challan_no ORDER BY id) as rn
        FROM purchase
      )
      UPDATE purchase
      SET challan_no = purchase.challan_no || '-' || duplicates.rn
      FROM duplicates
      WHERE purchase.id = duplicates.id AND duplicates.rn > 1;
    `);

    await client.query('COMMIT');
    console.log("Deduplication successful!");
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Deduplication failed:", err);
  } finally {
    client.release();
    process.exit();
  }
}

runDeduplication();
