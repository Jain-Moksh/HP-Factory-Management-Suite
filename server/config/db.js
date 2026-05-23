const { Pool, types } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Fix for DATE shifted by timezone (treat DATE OID 1082 as string)
types.setTypeParser(1082, (val) => val);

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432', 10),
});

// For simple queries
const query = async (text, params) => {
  try {
    return await pool.query(text, params);
  } catch (err) {
    if (err.code === '42P01') {
      const { autoHealDatabase } = require('../utils/dbHealer');
      autoHealDatabase(pool).catch(e => console.error('Error triggering auto-heal from db.js:', e));
    }
    throw err;
  }
};
// For transactions
const getClient = () => pool.connect();

// Test the connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
  } else {
    console.log('✅ PostgreSQL Database connected successfully');
  }
});

module.exports = {
  query,
  getClient,
  pool
};
