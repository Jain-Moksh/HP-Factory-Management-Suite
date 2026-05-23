const fs = require('fs');
const path = require('path');

let isHealing = false;

/**
 * Automatically creates any missing tables or indexes by running the db.md schema.
 * It executes statements individually to safely ignore "already exists" errors.
 * 
 * @param {import('pg').Pool} pool - The database pool instance
 */
const autoHealDatabase = async (pool) => {
  if (isHealing) return;
  isHealing = true;
  console.log('🛠️ Auto-healing database: Checking for and recreating missing tables...');
  
  const client = await pool.connect();
  try {
    const dbSchema = fs.readFileSync(path.join(__dirname, '../db.md'), 'utf8');
    
    // Split the schema by semicolons to execute statements individually
    const statements = dbSchema.split(';').map(s => s.trim()).filter(s => s.length > 0);
    
    for (const stmt of statements) {
      try {
        await client.query(stmt);
      } catch (err) {
        // 42P07: relation already exists (table, index)
        // 42710: duplicate_object (enum type)
        if (err.code === '42P07' || err.code === '42710') {
          continue; // Safely ignore existing structures
        }
        console.error('Error during auto-heal statement:', err.message);
      }
    }
    console.log('✅ Database auto-healing complete.');
  } catch (err) {
    console.error('❌ Database auto-healing failed:', err);
  } finally {
    client.release();
    isHealing = false;
  }
};

module.exports = { autoHealDatabase };
