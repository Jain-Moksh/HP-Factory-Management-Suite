const { Pool, types } = require('pg');
require('dotenv').config();

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
const query = (text, params) => pool.query(text, params);

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
