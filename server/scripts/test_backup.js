const fs = require('fs');
const path = require('path');
const assert = require('assert');

// 1. Mock basic-ftp using require.cache before importing app/db
const mockFtpCalls = {
  access: 0,
  uploadFrom: 0,
  close: 0,
  config: null,
  localPath: null,
  remotePath: null
};

class MockFtpClient {
  constructor() {
    this.ftp = { verbose: false };
  }
  async access(config) {
    mockFtpCalls.access++;
    mockFtpCalls.config = config;
    console.log(`[MOCK-FTP] Client connected to ${config.host}:${config.port}`);
  }
  async ensureDir(dir) {
    console.log(`[MOCK-FTP] Client ensured remote directory: ${dir}`);
  }
  async uploadFrom(localPath, remotePath) {
    mockFtpCalls.uploadFrom++;
    mockFtpCalls.localPath = localPath;
    mockFtpCalls.remotePath = remotePath;
    console.log(`[MOCK-FTP] Client uploaded file: ${localPath} -> ${remotePath}`);
  }
  close() {
    mockFtpCalls.close++;
    console.log('[MOCK-FTP] Client connection closed');
  }
}

require.cache[require.resolve('basic-ftp')] = {
  exports: { Client: MockFtpClient }
};

// 2. Load environment and import app & db
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../config/db');
const backupService = require('../services/backupService');
const app = require('../app');

const TEST_BACKUP_DIR = 'C:/NP-Backups-Test/';

// Helpers for starting server and making fetch calls
let server;
let baseUrl;

function startServer() {
  return new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      baseUrl = `http://127.0.0.1:${port}`;
      console.log(`[TEST-SERVER] Listening on ${baseUrl}`);
      resolve();
    });
  });
}

function stopServer() {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => {
        console.log('[TEST-SERVER] Stopped.');
        resolve();
      });
    } else {
      resolve();
    }
  });
}

// Helper to wait for backup files to appear/settle
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Clean up files in our test backup folder
function cleanTestBackupDir() {
  if (fs.existsSync(TEST_BACKUP_DIR)) {
    const files = fs.readdirSync(TEST_BACKUP_DIR);
    for (const file of files) {
      fs.unlinkSync(path.join(TEST_BACKUP_DIR, file));
    }
    try {
      fs.rmdirSync(TEST_BACKUP_DIR);
    } catch (e) {}
  }
}

// Read the most recent file in test backup folder
function getLatestBackupFileContent() {
  if (!fs.existsSync(TEST_BACKUP_DIR)) return null;
  const files = fs.readdirSync(TEST_BACKUP_DIR).filter(f => f.endsWith('.sql'));
  if (files.length === 0) return null;
  files.sort((a, b) => {
    return fs.statSync(path.join(TEST_BACKUP_DIR, b)).mtime - fs.statSync(path.join(TEST_BACKUP_DIR, a)).mtime;
  });
  return fs.readFileSync(path.join(TEST_BACKUP_DIR, files[0]), 'utf8');
}

async function runTests() {
  console.log('\n==================================================');
  console.log('STARTING BACKUP SYSTEM INTEGRATION TESTS');
  console.log('==================================================\n');

  // Save original settings to restore after tests
  const origSettingsRes = await db.query('SELECT * FROM backup_settings WHERE id = 1');
  const origSettings = origSettingsRes.rows[0];

  // Set up test settings
  await db.query(
    `UPDATE backup_settings 
     SET auto_backup_enabled = true, auto_backup_path = $1, ftp_backup_enabled = false
     WHERE id = 1`,
    [TEST_BACKUP_DIR]
  );

  cleanTestBackupDir();
  await startServer();

  // Pre-test clean up of any legacy test records from aborted runs
  await db.query("DELETE FROM billing_items WHERE billing_id IN (SELECT id FROM billing WHERE short_remark = 'MOCK CHALLAN REMARK')");
  await db.query("DELETE FROM billing WHERE short_remark = 'MOCK CHALLAN REMARK'");
  await db.query("DELETE FROM items WHERE name = 'BILL_TEST_ITEM'");
  await db.query("DELETE FROM clients WHERE name IN ('TEST_CLIENT_CREATE_999', 'TEST_CLIENT_EDITED_999', 'BILL_TEST_CLIENT', 'RAPID_CLIENT_A', 'RAPID_CLIENT_B', 'RAPID_CLIENT_C', 'TEST_CLIENT_DISABLED', 'TEST_CLIENT_FTP')");

  let createdClientId;
  let createdItemId;
  let createdBillId;

  try {
    // ----------------------------------------------------
    // TEST 1 — CREATE
    // ----------------------------------------------------
    console.log('\n--- TEST 1: Create Client ---');
    cleanTestBackupDir();
    
    const createRes = await fetch(`${baseUrl}/api/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'TEST_CLIENT_CREATE_999',
        street: 'Test Street',
        city: 'Test City',
        shortform: 'TCC',
        balance: 1000,
        remark: 'Initial creation test'
      })
    });
    const createData = await createRes.json();
    assert.strictEqual(createRes.status, 201);
    createdClientId = createData.data.id;
    console.log(`Created client ID: ${createdClientId}`);

    // Wait for async backup process to finish
    await sleep(2000);

    let backupContent = getLatestBackupFileContent();
    assert.ok(backupContent, 'Backup file should have been created');
    assert.ok(backupContent.includes('TEST_CLIENT_CREATE_999'), 'Backup should contain created client name');
    console.log('✅ TEST 1 PASSED: Create triggered backup successfully.');

    // ----------------------------------------------------
    // TEST 2 — EDIT
    // ----------------------------------------------------
    console.log('\n--- TEST 2: Edit Client ---');
    cleanTestBackupDir();

    const editRes = await fetch(`${baseUrl}/api/clients/${createdClientId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'TEST_CLIENT_EDITED_999',
        street: 'Test Street Edited',
        city: 'Test City Edited',
        shortform: 'TCE',
        balance: 1500,
        remark: 'Edited client test'
      })
    });
    assert.strictEqual(editRes.status, 200);

    await sleep(2000);

    backupContent = getLatestBackupFileContent();
    assert.ok(backupContent, 'Backup file should have been created');
    assert.ok(backupContent.includes('TEST_CLIENT_EDITED_999'), 'Backup should contain edited client name');
    console.log('✅ TEST 2 PASSED: Edit triggered backup successfully.');

    // ----------------------------------------------------
    // TEST 3 — DELETE
    // ----------------------------------------------------
    console.log('\n--- TEST 3: Delete Client ---');
    cleanTestBackupDir();

    const deleteRes = await fetch(`${baseUrl}/api/clients/${createdClientId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: process.env.del_pass || '2243' })
    });
    assert.strictEqual(deleteRes.status, 200);

    await sleep(2000);

    backupContent = getLatestBackupFileContent();
    assert.ok(backupContent, 'Backup file should have been created');
    assert.ok(!backupContent.includes('TEST_CLIENT_EDITED_999'), 'Backup should reflect deleted state');
    console.log('✅ TEST 3 PASSED: Delete triggered backup successfully.');

    // ----------------------------------------------------
    // TEST 4 — MULTIPLE SQL QUERIES (Transaction Bill Creation)
    // ----------------------------------------------------
    console.log('\n--- TEST 4: Multiple SQL Queries (Billing Challan Creation) ---');
    
    // Create new test client and item first
    const clientRes = await fetch(`${baseUrl}/api/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'BILL_TEST_CLIENT', shortform: 'BTC' })
    });
    const clientData = await clientRes.json();
    createdClientId = clientData.data.id;

    const itemRes = await fetch(`${baseUrl}/api/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'BILL_TEST_ITEM', rate: 200, stock: 50, open_stock: 50, conversion: 1, unit: 'PCS', min_stock: 5 })
    });
    const itemData = await itemRes.json();
    createdItemId = itemData.data.id;

    await sleep(2000); // clear any active backups
    cleanTestBackupDir();

    // Create billing challan (executes transaction containing BEGIN, SELECT, INSERT, INSERT, UPDATE, COMMIT)
    const billRes = await fetch(`${baseUrl}/api/billing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: createdClientId,
        transporter_id: null,
        date: new Date().toISOString().split('T')[0],
        transport_charge: 0,
        packing_charge: 0,
        discount_percent: 0,
        discount_amount: 0,
        adjustment_percent: 0,
        adjustment_amount: 0,
        total_amount: 200,
        short_remark: 'MOCK CHALLAN REMARK',
        long_remark: 'MOCK CHALLAN DETAIL REMARK',
        grand_total: 200,
        items: [{
          item_id: createdItemId,
          rate: 200,
          discount_percent: 0,
          discount_amount: 0,
          unit: 'PCS',
          quantity: 1,
          bundle: 1,
          total_amount: 200
        }]
      })
    });
    const billData = await billRes.json();
    assert.strictEqual(billRes.status, 201);
    createdBillId = billData.data.id;

    await sleep(2500);

    // Verify only ONE backup was created for the whole transaction
    const files = fs.readdirSync(TEST_BACKUP_DIR).filter(f => f.endsWith('.sql'));
    assert.strictEqual(files.length, 1, 'Only one backup file should be generated for the transaction');
    
    backupContent = getLatestBackupFileContent();
    assert.ok(backupContent.includes('MOCK CHALLAN REMARK'), 'Backup should contain the committed challan data');
    console.log('✅ TEST 4 PASSED: Single backup produced for multi-query transaction.');

    // ----------------------------------------------------
    // TEST 5 — RAPID CONSECUTIVE CHANGES (Queuing / Concurrency)
    // ----------------------------------------------------
    console.log('\n--- TEST 5: Rapid Consecutive Changes ---');
    cleanTestBackupDir();

    // Fire 3 creation requests in parallel/rapid succession
    const req1 = fetch(`${baseUrl}/api/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'RAPID_CLIENT_A' })
    });
    const req2 = fetch(`${baseUrl}/api/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'RAPID_CLIENT_B' })
    });
    const req3 = fetch(`${baseUrl}/api/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'RAPID_CLIENT_C' })
    });

    const results = await Promise.all([req1, req2, req3]);
    const jsonA = await results[0].json();
    const jsonB = await results[1].json();
    const jsonC = await results[2].json();

    const clientIds = [jsonA.data.id, jsonB.data.id, jsonC.data.id];

    // Wait for the sequential queue to finish (may take 2 backups to complete the cycles)
    await sleep(6000);

    backupContent = getLatestBackupFileContent();
    assert.ok(backupContent.includes('RAPID_CLIENT_A'), 'Final backup must contain Client A');
    assert.ok(backupContent.includes('RAPID_CLIENT_B'), 'Final backup must contain Client B');
    assert.ok(backupContent.includes('RAPID_CLIENT_C'), 'Final backup must contain Client C');
    console.log('✅ TEST 5 PASSED: Consecutive changes sequentially queued and latest state preserved.');

    // Clean up rapid clients
    for (const cId of clientIds) {
      await fetch(`${baseUrl}/api/clients/${cId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: process.env.del_pass || '2243' })
      });
    }

    // ----------------------------------------------------
    // TEST 6 — GET REQUEST
    // ----------------------------------------------------
    console.log('\n--- TEST 6: GET Request ---');
    await sleep(2000);
    cleanTestBackupDir();

    const getRes = await fetch(`${baseUrl}/api/clients`);
    assert.strictEqual(getRes.status, 200);
    await sleep(2000);

    const getFiles = fs.existsSync(TEST_BACKUP_DIR) ? fs.readdirSync(TEST_BACKUP_DIR) : [];
    assert.strictEqual(getFiles.length, 0, 'No backups should be triggered on GET requests');
    console.log('✅ TEST 6 PASSED: GET request did not trigger backup.');

    // ----------------------------------------------------
    // TEST 7 — RESTORE
    // ----------------------------------------------------
    console.log('\n--- TEST 7: Restore Database ---');
    await sleep(2000);
    cleanTestBackupDir();

    // Trigger restore (this will drop schema and run healing logic, modifying DB state)
    const manualFileRes = await fetch(`${baseUrl}/api/backup/manual`);
    const backupSqlText = await manualFileRes.text();
    const tempRestorePath = path.join(__dirname, '../temp_restore_test.sql');
    fs.writeFileSync(tempRestorePath, backupSqlText);

    // Make multipart/form-data upload using standard fetch FormData
    const formData = new FormData();
    const fileBlob = new Blob([backupSqlText], { type: 'text/plain' });
    formData.append('backup', fileBlob, 'temp_restore_test.sql');

    const restoreRes = await fetch(`${baseUrl}/api/backup/restore`, {
      method: 'POST',
      body: formData
    });
    const restoreData = await restoreRes.json();
    assert.strictEqual(restoreRes.status, 200);
    assert.strictEqual(restoreData.success, true);
    
    fs.unlinkSync(tempRestorePath);

    await sleep(2000);
    
    // During restore, even though database writes occurred, auto backup must be suppressed
    const restoreBackupFiles = fs.existsSync(TEST_BACKUP_DIR) ? fs.readdirSync(TEST_BACKUP_DIR) : [];
    assert.strictEqual(restoreBackupFiles.length, 0, 'No automatic backups should be triggered during restore');
    console.log('✅ TEST 7 PASSED: Restore suppressed automatic backups.');

    // ----------------------------------------------------
    // TEST 8 — MANUAL BACKUP
    // ----------------------------------------------------
    console.log('\n--- TEST 8: Manual Backup ---');
    cleanTestBackupDir();

    const manualRes = await fetch(`${baseUrl}/api/backup/manual`);
    assert.strictEqual(manualRes.status, 200);
    
    const disposition = manualRes.headers.get('Content-Disposition');
    assert.ok(disposition.includes('attachment; filename=ManualBackup-'), 'Manual filename should follow ManualBackup- pattern');
    
    const manualContent = await manualRes.text();
    assert.ok(manualContent.includes('CREATE TABLE'), 'Manual backup should download valid SQL commands');
    
    // Check that it didn't write an auto-backup file
    const manualAutoFiles = fs.existsSync(TEST_BACKUP_DIR) ? fs.readdirSync(TEST_BACKUP_DIR) : [];
    assert.strictEqual(manualAutoFiles.length, 0, 'No automatic backup should be created by manual backup request');
    console.log('✅ TEST 8 PASSED: Manual Backup behavior remains completely unchanged.');

    // ----------------------------------------------------
    // TEST 9 — AUTO BACKUP DISABLED
    // ----------------------------------------------------
    console.log('\n--- TEST 9: Auto Backup Disabled ---');
    await db.query('UPDATE backup_settings SET auto_backup_enabled = false WHERE id = 1');
    cleanTestBackupDir();

    // Perform a database change
    const disabledClientRes = await fetch(`${baseUrl}/api/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'TEST_CLIENT_DISABLED' })
    });
    const disabledClientData = await disabledClientRes.json();
    assert.strictEqual(disabledClientRes.status, 201);

    await sleep(2000);

    const disabledFiles = fs.existsSync(TEST_BACKUP_DIR) ? fs.readdirSync(TEST_BACKUP_DIR) : [];
    assert.strictEqual(disabledFiles.length, 0, 'No auto backup should be generated when auto_backup_enabled is false');
    console.log('✅ TEST 9 PASSED: Auto backup disabled setting respected.');

    // Clean up disabled client
    await fetch(`${baseUrl}/api/clients/${disabledClientData.data.id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: process.env.del_pass || '2243' })
    });

    // ----------------------------------------------------
    // TEST 10 — FTP
    // ----------------------------------------------------
    console.log('\n--- TEST 10: FTP Upload Trigger ---');
    await db.query(
      `UPDATE backup_settings 
       SET auto_backup_enabled = true, ftp_backup_enabled = true, ftp_host = '127.0.0.1', ftp_username = 'test_user', ftp_password = 'pass' 
       WHERE id = 1`
    );
    await sleep(1000);
    cleanTestBackupDir();

    mockFtpCalls.access = 0;
    mockFtpCalls.uploadFrom = 0;
    mockFtpCalls.close = 0;

    // Trigger backup via database change
    const ftpClientRes = await fetch(`${baseUrl}/api/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'TEST_CLIENT_FTP' })
    });
    const ftpClientData = await ftpClientRes.json();
    
    await sleep(2500);

    // Verify FTP mock functions were called
    assert.strictEqual(mockFtpCalls.access, 1, 'FTP access should have been called');
    assert.strictEqual(mockFtpCalls.uploadFrom, 1, 'FTP uploadFrom should have been called');
    assert.strictEqual(mockFtpCalls.close, 1, 'FTP close should have been called');
    console.log('✅ TEST 10 PASSED: FTP upload triggered and completed correctly.');

    // Clean up FTP client
    await fetch(`${baseUrl}/api/clients/${ftpClientData.data.id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: process.env.del_pass || '2243' })
    });

  } catch (err) {
    console.error('\n❌ A TEST FAILED!');
    console.error(err.stack);
    process.exitCode = 1;
  } finally {
    // ----------------------------------------------------
    // CLEANUP & RECOVERY
    // ----------------------------------------------------
    console.log('\nCleaning up database modifications...');
    
    // Delete created challan, items, clients
    if (createdBillId) {
      await fetch(`${baseUrl}/api/billing/${createdBillId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: process.env.del_pass || '2243' })
      });
    }
    if (createdItemId) {
      await fetch(`${baseUrl}/api/items/${createdItemId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: process.env.del_pass || '2243' })
      });
    }
    if (createdClientId) {
      await fetch(`${baseUrl}/api/clients/${createdClientId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: process.env.del_pass || '2243' })
      });
    }

    // Restore original backup settings
    if (origSettings) {
      await db.query(
        `UPDATE backup_settings 
         SET auto_backup_enabled = $1, auto_backup_path = $2, ftp_backup_enabled = $3, ftp_host = $4, ftp_port = $5, ftp_username = $6, ftp_password = $7, ftp_path = $8
         WHERE id = 1`,
        [
          origSettings.auto_backup_enabled,
          origSettings.auto_backup_path,
          origSettings.ftp_backup_enabled,
          origSettings.ftp_host,
          origSettings.ftp_port,
          origSettings.ftp_username,
          origSettings.ftp_password,
          origSettings.ftp_path
        ]
      );
    }

    await stopServer();
    cleanTestBackupDir();
    
    console.log('\n==================================================');
    if (process.exitCode === 1) {
      console.log('BACKUP SYSTEM TESTS COMPLETED WITH FAILURES');
    } else {
      console.log('ALL 10 BACKUP SYSTEM TESTS PASSED SUCCESSFULLY!');
    }
    console.log('==================================================\n');
    process.exit(process.exitCode || 0);
  }
}

runTests();
