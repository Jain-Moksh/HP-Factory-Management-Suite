const fs = require('fs');
const path = require('path');
const db = require('../config/db');

const runMigration = async () => {
    const sqlPath = path.join(__dirname, 'create_challan_sequences.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    try {
        console.log('🚀 Running migration: create_challan_sequences.sql...');
        await db.query(sql);
        console.log('✅ Migration completed successfully!');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        process.exit(1);
    } finally {
        process.exit(0);
    }
};

runMigration();
