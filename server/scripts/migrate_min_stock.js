const { query } = require('../config/db');

async function migrate() {
  try {
    console.log('Starting migration: Adding min_stock to items table...');
    await query('ALTER TABLE items ADD COLUMN IF NOT EXISTS min_stock NUMERIC DEFAULT 0;');
    console.log('✅ Migration successful: min_stock column added to items table.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
