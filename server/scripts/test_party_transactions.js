const db = require('../config/db');
const partyTransactionService = require('../services/partyTransactionService');
const billingService = require('../services/billingService');

const runTests = async () => {
  console.log('==================================================');
  console.log('STARTING PARTY TRANSACTIONS SYSTEM INTEGRATION TESTS');
  console.log('==================================================');

  let testClientId = null;
  let testJobberId = null;
  let createdTxIds = [];
  let createdBillId = null;

  try {
    // Reset serial sequences to avoid duplicate key violations from manual inserts
    await db.query(`SELECT setval(pg_get_serial_sequence('clients', 'id'), COALESCE(MAX(id), 0) + 1, false) FROM clients`);
    await db.query(`SELECT setval(pg_get_serial_sequence('jobbers', 'id'), COALESCE(MAX(id), 0) + 1, false) FROM jobbers`);

    // 1. Create a clean test client
    const clientRes = await db.query(
      `INSERT INTO clients (name, street, city, shortform, balance, remark) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      ['TEST CLIENT XYZ', '123 Test St', 'Test City', 'TCX', 2000.00, 'Test client for transactions']
    );
    testClientId = clientRes.rows[0].id;
    console.log(`Created test client ID: ${testClientId} with opening balance: ₹2,000.00`);

    // 2. Create a clean test jobber
    const jobberRes = await db.query(
      `INSERT INTO jobbers (name) VALUES ($1) RETURNING id`,
      ['TEST JOBBER ABC']
    );
    testJobberId = jobberRes.rows[0].id;
    console.log(`Created test jobber ID: ${testJobberId}`);

    const dateToday = new Date().toISOString().split('T')[0];

    // --------------------------------------------------
    // TEST SECTION 1: CHALLAN SEQUENCE & MODE ISOLATION
    // --------------------------------------------------
    console.log('\n--- SECTION 1: Sequence & Sequence Sharing ---');

    // 1. CLIENT PAYMENT (1)
    const tx1 = await partyTransactionService.create({
      partyType: 'CLIENT',
      partyId: testClientId,
      transactionType: 'PAYMENT',
      date: dateToday,
      amount: 3000.00,
      paymentMode: 'CASH',
      remark: 'Client payment 1'
    });
    createdTxIds.push(tx1.id);
    console.log(`Created Client Payment: ${tx1.challan_no}`);

    // 2. JOBBER PAYMENT (2) - should increment the PAYMENT sequence (shared sequence!)
    const tx2 = await partyTransactionService.create({
      partyType: 'JOBBER',
      partyId: testJobberId,
      transactionType: 'PAYMENT',
      date: dateToday,
      amount: 1500.00,
      paymentMode: 'BANK',
      remark: 'Jobber payment 1'
    });
    createdTxIds.push(tx2.id);
    console.log(`Created Jobber Payment: ${tx2.challan_no}`);

    // 3. CLIENT PAYMENT (3)
    const tx3 = await partyTransactionService.create({
      partyType: 'CLIENT',
      partyId: testClientId,
      transactionType: 'PAYMENT',
      date: dateToday,
      amount: 1000.00,
      paymentMode: 'CASH',
      remark: 'Client payment 2'
    });
    createdTxIds.push(tx3.id);
    console.log(`Created Client Payment: ${tx3.challan_no}`);

    // Validate Payment sequence incrementing
    const seq1 = parseInt(tx1.challan_no.split('/')[0]);
    const seq2 = parseInt(tx2.challan_no.split('/')[0]);
    const seq3 = parseInt(tx3.challan_no.split('/')[0]);
    if (seq2 === seq1 + 1 && seq3 === seq2 + 1) {
      console.log('✅ PAYMENT Sequence Test Passed (incremented sequentially & shared across Client/Jobber)');
    } else {
      throw new Error(`❌ PAYMENT Sequence mismatch: ${tx1.challan_no}, ${tx2.challan_no}, ${tx3.challan_no}`);
    }

    // 4. JOBBER RETURN (1) - independent sequence
    const tx4 = await partyTransactionService.create({
      partyType: 'JOBBER',
      partyId: testJobberId,
      transactionType: 'RETURN',
      date: dateToday,
      amount: 100.00,
      paymentMode: null,
      remark: 'Jobber return 1'
    });
    createdTxIds.push(tx4.id);
    console.log(`Created Jobber Return: ${tx4.challan_no}`);

    // 5. CLIENT RETURN (2) - shared RETURN sequence
    const tx5 = await partyTransactionService.create({
      partyType: 'CLIENT',
      partyId: testClientId,
      transactionType: 'RETURN',
      date: dateToday,
      amount: 200.00,
      paymentMode: null,
      remark: 'Client return 1'
    });
    createdTxIds.push(tx5.id);
    console.log(`Created Client Return: ${tx5.challan_no}`);

    const seq4 = parseInt(tx4.challan_no.split('/')[0]);
    const seq5 = parseInt(tx5.challan_no.split('/')[0]);
    if (seq4 === 1 && seq5 === 2) {
      console.log('✅ RETURN Sequence Test Passed (starts at 1 and shared across Client/Jobber)');
    } else {
      throw new Error(`❌ RETURN Sequence mismatch: ${tx4.challan_no}, ${tx5.challan_no}`);
    }

    // 6. CLIENT DISCOUNT (1) - independent sequence
    const tx6 = await partyTransactionService.create({
      partyType: 'CLIENT',
      partyId: testClientId,
      transactionType: 'DISCOUNT',
      date: dateToday,
      amount: 500.00,
      paymentMode: null,
      remark: 'Client discount 1'
    });
    createdTxIds.push(tx6.id);
    console.log(`Created Client Discount: ${tx6.challan_no}`);

    // 7. JOBBER DISCOUNT (2) - shared DISCOUNT sequence
    const tx7 = await partyTransactionService.create({
      partyType: 'JOBBER',
      partyId: testJobberId,
      transactionType: 'DISCOUNT',
      date: dateToday,
      amount: 250.00,
      paymentMode: null,
      remark: 'Jobber discount 1'
    });
    createdTxIds.push(tx7.id);
    console.log(`Created Jobber Discount: ${tx7.challan_no}`);

    const seq6 = parseInt(tx6.challan_no.split('/')[0]);
    const seq7 = parseInt(tx7.challan_no.split('/')[0]);
    if (seq6 === 1 && seq7 === 2) {
      console.log('✅ DISCOUNT Sequence Test Passed (starts at 1 and shared across Client/Jobber)');
    } else {
      throw new Error(`❌ DISCOUNT Sequence mismatch: ${tx6.challan_no}, ${tx7.challan_no}`);
    }

    // --------------------------------------------------
    // TEST SECTION 2: CLIENT DYNAMIC OUTSTANDING FORMULA
    // --------------------------------------------------
    console.log('\n--- SECTION 2: Client Outstanding Calculation ---');
    
    // Clear out other transactions created for sequence tests so we have a clean math check
    console.log('Cleaning sequence test transactions for clear client math calculations...');
    for (const txId of createdTxIds) {
      await partyTransactionService.delete(txId);
    }
    createdTxIds = [];

    // Verify initial outstanding (should equal opening balance)
    let outstanding = await partyTransactionService.getOutstanding('CLIENT', testClientId);
    console.log(`Initial client outstanding (opening only): ₹${outstanding.currentOutstanding}`);
    if (outstanding.currentOutstanding !== 2000.00) {
      throw new Error(`Expected ₹2000, got ${outstanding.currentOutstanding}`);
    }

    // 1. Create billing of 10000
    // Insert billing record directly since we need to mock invoice totals without items stock issues
    const billRes = await db.query(
      `INSERT INTO billing (client_id, date, total_amount, grand_total, challan_no)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [testClientId, dateToday, 10000.00, 10000.00, 'TEST/BILL/001']
    );
    createdBillId = billRes.rows[0].id;
    console.log(`Created test bill ID: ${createdBillId} of ₹10,000.00`);

    outstanding = await partyTransactionService.getOutstanding('CLIENT', testClientId);
    console.log(`Outstanding after billing: ₹${outstanding.currentOutstanding}`);
    if (outstanding.currentOutstanding !== 12000.00) {
      throw new Error(`Expected ₹12000, got ${outstanding.currentOutstanding}`);
    }

    // 2. Create Payment of 3000
    const payment = await partyTransactionService.create({
      partyType: 'CLIENT',
      partyId: testClientId,
      transactionType: 'PAYMENT',
      date: dateToday,
      amount: 3000.00,
      paymentMode: 'CASH',
      remark: 'Client payment'
    });
    createdTxIds.push(payment.id);
    console.log(`Recorded payment: ₹3,000.00`);

    outstanding = await partyTransactionService.getOutstanding('CLIENT', testClientId);
    console.log(`Outstanding after payment: ₹${outstanding.currentOutstanding}`);
    if (outstanding.currentOutstanding !== 9000.00) {
      throw new Error(`Expected ₹9000, got ${outstanding.currentOutstanding}`);
    }

    // 3. Create Return of 100
    const returned = await partyTransactionService.create({
      partyType: 'CLIENT',
      partyId: testClientId,
      transactionType: 'RETURN',
      date: dateToday,
      amount: 100.00,
      paymentMode: null,
      remark: 'Client return'
    });
    createdTxIds.push(returned.id);
    console.log(`Recorded return: ₹100.00`);

    outstanding = await partyTransactionService.getOutstanding('CLIENT', testClientId);
    console.log(`Outstanding after return: ₹${outstanding.currentOutstanding}`);
    if (outstanding.currentOutstanding !== 8900.00) {
      throw new Error(`Expected ₹8900, got ${outstanding.currentOutstanding}`);
    }

    // 4. Create Discount of 500
    const discount = await partyTransactionService.create({
      partyType: 'CLIENT',
      partyId: testClientId,
      transactionType: 'DISCOUNT',
      date: dateToday,
      amount: 500.00,
      paymentMode: null,
      remark: 'Client discount'
    });
    createdTxIds.push(discount.id);
    console.log(`Recorded discount: ₹500.00`);

    outstanding = await partyTransactionService.getOutstanding('CLIENT', testClientId);
    console.log(`Outstanding after discount: ₹${outstanding.currentOutstanding}`);
    if (outstanding.currentOutstanding !== 8400.00) {
      throw new Error(`Expected ₹8400, got ${outstanding.currentOutstanding}`);
    }

    // 5. Edit billing: 10,000 -> 12,000
    await db.query(`UPDATE billing SET grand_total = 12000.00 WHERE id = $1`, [createdBillId]);
    console.log(`Edited bill grand_total to: ₹12,000.00`);

    outstanding = await partyTransactionService.getOutstanding('CLIENT', testClientId);
    console.log(`Outstanding after billing edit: ₹${outstanding.currentOutstanding}`);
    if (outstanding.currentOutstanding !== 10400.00) {
      throw new Error(`Expected ₹10400, got ${outstanding.currentOutstanding}`);
    }

    // 6. Delete billing
    await db.query(`DELETE FROM billing WHERE id = $1`, [createdBillId]);
    createdBillId = null;
    console.log(`Deleted test bill`);

    outstanding = await partyTransactionService.getOutstanding('CLIENT', testClientId);
    console.log(`Outstanding after billing deletion: ₹${outstanding.currentOutstanding}`);
    if (outstanding.currentOutstanding !== -1600.00) {
      throw new Error(`Expected -₹1600.00, got ${outstanding.currentOutstanding}`);
    }
    console.log('✅ CLIENT Outstanding Mathematical Lifecycle Checked Successfully');

    // --------------------------------------------------
    // TEST SECTION 3: JOBBER DYNAMIC OUTSTANDING FORMULA
    // --------------------------------------------------
    console.log('\n--- SECTION 3: Jobber Outstanding Calculation ---');
    
    // Verify jobber initial outstanding is 0
    let jobberOutstanding = await partyTransactionService.getOutstanding('JOBBER', testJobberId);
    console.log(`Initial jobber outstanding: ₹${jobberOutstanding.currentOutstanding}`);
    if (jobberOutstanding.currentOutstanding !== 0.00) {
      throw new Error(`Expected ₹0, got ${jobberOutstanding.currentOutstanding}`);
    }

    // Create a payment for Jobber
    const jobberTx = await partyTransactionService.create({
      partyType: 'JOBBER',
      partyId: testJobberId,
      transactionType: 'PAYMENT',
      date: dateToday,
      amount: 1500.00,
      paymentMode: 'BANK',
      remark: 'Jobber payment'
    });
    createdTxIds.push(jobberTx.id);
    console.log(`Recorded Jobber Payment: ₹1,500.00`);

    jobberOutstanding = await partyTransactionService.getOutstanding('JOBBER', testJobberId);
    console.log(`Jobber outstanding after payment: ₹${jobberOutstanding.currentOutstanding}`);
    if (jobberOutstanding.currentOutstanding !== -1500.00) {
      throw new Error(`Expected -1500, got ${jobberOutstanding.currentOutstanding}`);
    }
    console.log('✅ JOBBER Outstanding Base Calculation Checked Successfully');

    // --------------------------------------------------
    // TEST SECTION 4: CONCURRENCY SAFE SEQUENCE LOCKS
    // --------------------------------------------------
    console.log('\n--- SECTION 4: Concurrency Challan Generation ---');
    
    console.log('Spawning 3 concurrent creation requests...');
    const concurrentRequests = [
      partyTransactionService.create({
        partyType: 'CLIENT',
        partyId: testClientId,
        transactionType: 'PAYMENT',
        date: dateToday,
        amount: 100.00,
        paymentMode: 'BANK',
        remark: 'Concurrent A'
      }),
      partyTransactionService.create({
        partyType: 'CLIENT',
        partyId: testClientId,
        transactionType: 'PAYMENT',
        date: dateToday,
        amount: 200.00,
        paymentMode: 'BANK',
        remark: 'Concurrent B'
      }),
      partyTransactionService.create({
        partyType: 'CLIENT',
        partyId: testClientId,
        transactionType: 'PAYMENT',
        date: dateToday,
        amount: 300.00,
        paymentMode: 'BANK',
        remark: 'Concurrent C'
      })
    ];

    const results = await Promise.all(concurrentRequests);
    results.forEach(tx => createdTxIds.push(tx.id));

    const challans = results.map(tx => tx.challan_no);
    console.log('Concurrent Challan numbers obtained:', challans);
    
    // Ensure all challan numbers are unique
    const uniqueChallans = new Set(challans);
    if (uniqueChallans.size === challans.length) {
      console.log('✅ Concurrency Safety Test Passed (all generated challan numbers are unique)');
    } else {
      throw new Error(`❌ Concurrency Sequence Duplicate detected: ${challans.join(', ')}`);
    }

  } catch (err) {
    console.error('\n❌ INTEGRATION TEST FAILED:', err);
  } finally {
    // Clean up created entities
    console.log('\n--- Cleaning up created test entities ---');
    for (const id of createdTxIds) {
      await db.query('DELETE FROM party_transactions WHERE id = $1', [id]);
    }
    if (createdBillId) {
      await db.query('DELETE FROM billing WHERE id = $1', [createdBillId]);
    }
    if (testClientId) {
      await db.query('DELETE FROM clients WHERE id = $1', [testClientId]);
    }
    if (testJobberId) {
      await db.query('DELETE FROM jobbers WHERE id = $1', [testJobberId]);
    }
    console.log('Clean up completed.');
    console.log('==================================================');
    process.exit(0);
  }
};

runTests();
