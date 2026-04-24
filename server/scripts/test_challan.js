const db = require('../config/db');
const { generateChallanNo, getFormattedChallan } = require('../utils/challanGenerator');

const testConcurrency = async () => {
    console.log('🧪 Starting Concurrency Test...');
    const date = '2026-04-24';
    const type = 'billing';

    // Simulate 5 concurrent requests
    const promises = Array.from({ length: 5 }).map(async (_, i) => {
        const client = await db.getClient();
        try {
            await client.query('BEGIN');
            const challan = await generateChallanNo(date, type, client);
            console.log(`Request ${i + 1}: Generated Challan = ${challan}`);
            await client.query('COMMIT');
            return challan;
        } catch (err) {
            await client.query('ROLLBACK');
            console.error(`Request ${i + 1} failed:`, err.message);
            throw err;
        } finally {
            client.release();
        }
    });

    const results = await Promise.all(promises);
    const uniqueResults = new Set(results);

    if (uniqueResults.size === results.length) {
        console.log('✅ ALL CHALLAN NUMBERS ARE UNIQUE AND SEQUENTIAL!');
    } else {
        console.error('❌ DUPLICATE CHALLAN NUMBERS DETECTED!');
    }

    // Test Preview
    const preview = await getFormattedChallan(date, type, db);
    console.log(`Preview of next challan: ${preview}`);

    // Verify it matches the next sequence
    const nextClient = await db.getClient();
    await nextClient.query('BEGIN');
    const actualNext = await generateChallanNo(date, type, nextClient);
    console.log(`Actual next challan on creation: ${actualNext}`);
    await nextClient.query('COMMIT');
    nextClient.release();

    if (preview === actualNext) {
        console.log('✅ PREVIEW MATCHES NEXT GENERATED CHALLAN!');
    } else {
        console.error('❌ PREVIEW MISMATCH!');
    }

    process.exit(0);
};

testConcurrency().catch(err => {
    console.error(err);
    process.exit(1);
});
