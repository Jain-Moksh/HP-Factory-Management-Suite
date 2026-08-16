const db = require('../config/db');
const queries = require('../queries/reportQueries');

const reportService = {
  getPartySales: async (fromDate, toDate, clientId) => {
    const result = await db.query(queries.getPartySales, [fromDate || null, toDate || null, clientId || null]);
    return result.rows;
  },

  getGroupSales: async (fromDate, toDate) => {
    const result = await db.query(queries.getGroupSales, [fromDate || null, toDate || null]);
    return result.rows;
  },

  getJobWork: async (fromDate, toDate) => {
    const result = await db.query(queries.getJobWorkReport, [fromDate || null, toDate || null]);
    return result.rows;
  },

  getPartyStockSummary: async (clientId, fromDate, toDate) => {
    const result = await db.query(queries.getPartyStockSummary, [clientId, fromDate || null, toDate || null]);
    return result.rows;
  },

  getPartyStockDetail: async (clientId, itemId, fromDate, toDate) => {
    const detail = await db.query(queries.getPartyStockDetail, [clientId, itemId, fromDate || null, toDate || null]);
    const item = await db.query('SELECT name FROM items WHERE id = $1', [itemId]);
    
    return {
      item_name: item.rows[0]?.name || 'Unknown',
      transactions: detail.rows,
      total_quantity: detail.rows.reduce((sum, t) => sum + parseFloat(t.quantity), 0)
    };
  },

  getGroupSalesSummary: async (groupId, fromDate, toDate) => {
    const result = await db.query(queries.getGroupSalesSummary, [groupId, fromDate || null, toDate || null]);
    return result.rows;
  },

  getPartyBillingDetail: async (clientId, fromDate, toDate) => {
    const detail = await db.query(queries.getPartyBillingDetail, [clientId, fromDate || null, toDate || null]);
    const client = await db.query('SELECT name FROM clients WHERE id = $1', [clientId]);
    
    return {
      client_name: client.rows[0]?.name || 'Unknown',
      transactions: detail.rows,
      total_amount: detail.rows.reduce((sum, t) => sum + parseFloat(t.amount), 0)
    };
  },

  getJobWorkSummary: async (jobberId, fromDate, toDate) => {
    const result = await db.query(queries.getJobWorkSummary, [jobberId, fromDate || null, toDate || null]);
    return result.rows;
  },

  getJobWorkDetail: async (jobberId, itemId, fromDate, toDate) => {
    const detail = await db.query(queries.getJobWorkDetail, [jobberId, itemId, fromDate || null, toDate || null]);
    const item = await db.query('SELECT name FROM items WHERE id = $1', [itemId]);
    
    return {
      item_name: item.rows[0]?.name || 'Unknown',
      transactions: detail.rows,
      total_quantity: detail.rows.reduce((sum, t) => sum + parseFloat(t.quantity), 0)
    };
  },

  getDayBook: async (date) => {
    const result = await db.query(queries.getDayBook, [date]);
    return result.rows;
  },

  getDetailJobReport: async (startDate, endDate) => {
    const result = await db.query(queries.getDetailJobReport, [startDate, endDate]);
    return result.rows;
  },

  getJobSummaryReport: async (fromDate, toDate) => {
    const result = await db.query(queries.getJobSummaryReport, [fromDate || null, toDate || null]);
    return result.rows;
  },

  getItemSoldSummary: async (fromDate, toDate) => {
    const result = await db.query(queries.getItemSoldSummary, [fromDate || null, toDate || null]);
    return result.rows;
  },

  getGroupSalesPrint: async (groupId, fromDate, toDate) => {
    const result = await db.query(queries.getGroupSalesPrint, [groupId, fromDate || null, toDate || null]);
    const rawRows = result.rows;

    // Group by client
    const grouped = rawRows.reduce((acc, row) => {
      const clientId = row.client_id;
      if (!acc[clientId]) {
        acc[clientId] = {
          client_id: clientId,
          client_name: row.client_name,
          transactions: [],
          party_total: 0
        };
      }
      acc[clientId].transactions.push({
        challan_no: row.challan_no,
        date: row.date,
        amount: row.amount
      });
      acc[clientId].party_total += parseFloat(row.amount);
      return acc;
    }, {});

    return Object.values(grouped);
  },

  getPendingPaymentReport: async (clientId, groupId) => {
    const result = await db.query(queries.getPendingPaymentReport, [
      clientId && clientId !== 'all' ? parseInt(clientId) : null,
      groupId && groupId !== 'all' ? parseInt(groupId) : null
    ]);
    return result.rows;
  },

  getPartyLedgerDetail: async (clientId, fromDate, toDate) => {
    // 1. Get client name and static opening balance
    const clientRes = await db.query('SELECT name, balance FROM clients WHERE id = $1', [clientId]);
    if (clientRes.rows.length === 0) throw new Error('Client not found');
    const clientName = clientRes.rows[0].name;
    const staticBalance = parseFloat(clientRes.rows[0].balance) || 0;

    // 2. Fetch billing total before fromDate
    const billingBeforeRes = await db.query(
      'SELECT COALESCE(SUM(grand_total), 0) as total FROM billing WHERE client_id = $1 AND date < $2',
      [clientId, fromDate]
    );
    const totalBillingBefore = parseFloat(billingBeforeRes.rows[0].total) || 0;

    // 3. Fetch transaction totals before fromDate
    const txBeforeRes = await db.query(
      "SELECT COALESCE(SUM(amount), 0) as total FROM party_transactions WHERE party_type = 'CLIENT' AND party_id = $1 AND date < $2 AND transaction_type IN ('PAYMENT', 'RETURN', 'DISCOUNT')",
      [clientId, fromDate]
    );
    const totalTxBefore = parseFloat(txBeforeRes.rows[0].total) || 0;

    // Calculate dynamic opening balance as of fromDate
    const openingBalance = staticBalance + totalBillingBefore - totalTxBefore;

    // 4. Fetch chronological transactions within period
    const historyQuery = `
      SELECT 
        id,
        transaction_type,
        challan_no,
        date::TEXT,
        amount,
        remark,
        payment_mode,
        created_at
      FROM (
        SELECT 
          id,
          'BILLING' AS transaction_type,
          challan_no,
          date,
          grand_total AS amount,
          short_remark AS remark,
          NULL AS payment_mode,
          created_at
        FROM billing
        WHERE client_id = $1 AND date >= $2 AND date <= $3
        
        UNION ALL
        
        SELECT 
          id,
          transaction_type::TEXT,
          challan_no,
          date,
          amount,
          remark,
          payment_mode,
          created_at
        FROM party_transactions
        WHERE party_type = 'CLIENT' AND party_id = $1 AND date >= $2 AND date <= $3
      ) combined
      ORDER BY date ASC, created_at ASC
    `;

    const historyRes = await db.query(historyQuery, [clientId, fromDate, toDate]);
    const historyRows = historyRes.rows;

    // 5. Construct chronological ledger rows with running closing balance
    let runningBalance = openingBalance;
    const ledger = [];

    // Push the starting Opening Balance row
    ledger.push({
      id: 'opening-bal',
      challan_no: '—',
      transaction_type: 'OPENING BALANCE',
      date: fromDate,
      credit: 0,
      debit: 0,
      closing_balance: openingBalance,
      payment_mode: null,
      remark: null
    });

    for (let i = 0; i < historyRows.length; i++) {
      const row = historyRows[i];
      const amount = parseFloat(row.amount) || 0;
      let credit = 0;
      let debit = 0;

      // Map RETURN to REPLACE for UI consistency
      let type = row.transaction_type;
      if (type === 'RETURN') {
        type = 'REPLACE';
      }

      if (type === 'BILLING') {
        credit = amount;
        runningBalance += amount;
      } else {
        debit = amount;
        runningBalance -= amount;
      }

      ledger.push({
        id: `${type}-${row.id}-${row.created_at}`,
        challan_no: row.challan_no || '—',
        transaction_type: type,
        date: row.date,
        credit,
        debit,
        closing_balance: runningBalance,
        payment_mode: row.payment_mode || null,
        remark: row.remark || null
      });
    }

    return {
      client_name: clientName,
      opening_balance: openingBalance,
      closing_balance: runningBalance,
      ledger
    };
  }
};

module.exports = reportService;
