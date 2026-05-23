const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { Client } = require('pg');

async function initializeDatabase() {
  const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: 'postgres', // Connect to default database
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432', 10),
  });

  try {
    await client.connect();
    const dbName = process.env.DB_NAME;
    if (!dbName) {
      console.error("DB_NAME is not defined in environment variables.");
      return;
    }
    const res = await client.query(`SELECT datname FROM pg_catalog.pg_database WHERE datname = $1`, [dbName]);
    if (res.rowCount === 0) {
      console.log(`Database "${dbName}" not found. Creating it...`);
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`Database "${dbName}" created successfully.`);
    }

    // Now connect to the actual database to check if tables exist
    const dbClient = new Client({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: dbName,
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT || '5432', 10),
    });

    try {
      await dbClient.connect();
      // Check if tables exist (e.g., check for 'items' table)
      const tableCheck = await dbClient.query(`SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'items'
      )`);

      if (!tableCheck.rows[0].exists) {
        console.log(`Tables not found in database "${dbName}". Initializing schema...`);
        const fs = require('fs');
        const dbSchema = fs.readFileSync(path.join(__dirname, 'db.md'), 'utf8');
        await dbClient.query(dbSchema);
        console.log(`All tables initialized successfully.`);
      }
    } catch (dbErr) {
      console.error("Error checking or creating tables:", dbErr.message);
    } finally {
      await dbClient.end();
    }

  } catch (err) {
    console.error("Error during database initialization:", err.message);
  } finally {
    await client.end();
  }
}

initializeDatabase().then(() => {
  const app = require('./app');
  const os = require('os');
  const { exec } = require('child_process');
  
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, '0.0.0.0', () => {
      let localIp = 'localhost';
      const interfaces = os.networkInterfaces();
      for (const name of Object.keys(interfaces)) {
          for (const iface of interfaces[name]) {
              if (iface.family === 'IPv4' && !iface.internal) {
                  localIp = iface.address;
                  break;
              }
          }
          if (localIp !== 'localhost') break;
      }
      
      const url = `http://${localIp}:${PORT}`;
      console.log(`Server is running on ${url}`);
      
      const startCommand = process.platform === 'win32' ? 'start' : (process.platform === 'darwin' ? 'open' : 'xdg-open');
      exec(`${startCommand} ${url}`);
  });
});