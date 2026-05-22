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
      
      console.log(`Connecting to new database "${dbName}" to initialize tables...`);
      const newClient = new Client({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: dbName,
        password: process.env.DB_PASSWORD,
        port: parseInt(process.env.DB_PORT || '5432', 10),
      });
      await newClient.connect();
      
      const fs = require('fs');
      try {
        console.log(`Running schema from db.md...`);
        const dbSchema = fs.readFileSync(path.join(__dirname, 'db.md'), 'utf8');
        await newClient.query(dbSchema);
        
        console.log(`All tables initialized successfully.`);
      } catch (scriptErr) {
        console.error("Error running initialization scripts:", scriptErr.message);
      } finally {
        await newClient.end();
      }
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