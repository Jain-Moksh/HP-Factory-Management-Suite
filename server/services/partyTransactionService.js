const db = require('../config/db');
const queries = require('../queries/partyTransactionQueries');
const { getMonthAndFY } = require('../utils/challanGenerator');
const { toUpperCase } = require('../utils/dataSanitizer');

const getFormattedTransactionChallan = async (dateStr, transactionType, dbOrClient, excludeId = null) => {
  const { monthNum, monthName, fyRange } = getMonthAndFY(dateStr);

  // Calculate FY start and end for the query
  const dateObj = new Date(dateStr);
  const startYear = dateObj.getMonth() + 1 >= 4 ? dateObj.getFullYear() : dateObj.getFullYear() - 1;
  const fyStart = `${startYear}-04-01`;
  const fyEnd = `${startYear + 1}-03-31`;

  const queryParams = [transactionType, monthNum, fyStart, fyEnd];
  let queryStr = `
    SELECT MAX(CAST(NULLIF(regexp_replace(split_part(challan_no, '/', 1), '[^0-9]', '', 'g'), '') AS INTEGER)) as max_seq
    FROM party_transactions
    WHERE transaction_type = $1
    AND EXTRACT(MONTH FROM date) = $2
    AND date BETWEEN $3 AND $4
  `;

  if (excludeId) {
    queryStr += ` AND id != $5`;
    queryParams.push(excludeId);
  }

  const res = await dbOrClient.query(queryStr, queryParams);
  const maxSeq = parseInt(res.rows[0].max_seq) || 0;
  const sequence = maxSeq + 1;

  return `${sequence}/${monthName}/${fyRange}`;
};

const partyTransactionService = {
  create: async (txData) => {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const { partyType, partyId, transactionType, date, amount, paymentMode, remark } = txData;

      // 1. Verify party exists
      if (partyType === 'CLIENT') {
        const clientCheck = await client.query('SELECT id FROM clients WHERE id = $1', [partyId]);
        if (clientCheck.rows.length === 0) {
          throw new Error(`Client ID ${partyId} not found in database.`);
        }
      } else if (partyType === 'JOBBER') {
        const jobberCheck = await client.query('SELECT id FROM jobbers WHERE id = $1', [partyId]);
        if (jobberCheck.rows.length === 0) {
          throw new Error(`Jobber ID ${partyId} not found in database.`);
        }
      } else {
        throw new Error(`Invalid party type: ${partyType}`);
      }

      // 2. Lock party_transactions table to serialize sequence generation
      await client.query('LOCK TABLE party_transactions IN SHARE ROW EXCLUSIVE MODE');

      // 3. Generate sequential challan number
      const challan_no = await getFormattedTransactionChallan(date, transactionType, client);

      // 4. Insert transaction
      const finalPaymentMode = ['PAYMENT', 'RETURN', 'DISCOUNT'].includes(transactionType) && transactionType !== 'PAYMENT' ? null : toUpperCase(paymentMode);
      
      const insertRes = await client.query(queries.insertTransaction, [
        partyType,
        partyId,
        transactionType,
        date,
        challan_no,
        amount,
        finalPaymentMode,
        toUpperCase(remark)
      ]);

      await client.query('COMMIT');
      return insertRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  getAll: async () => {
    const res = await db.query(queries.getTransactionList);
    return res.rows;
  },

  getById: async (id) => {
    const res = await db.query(queries.getTransactionById, [id]);
    if (res.rows.length === 0) return null;
    return res.rows[0];
  },

  update: async (id, txData) => {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const { date, amount, paymentMode, remark } = txData;

      // 1. Fetch existing transaction record
      const oldTxRes = await client.query('SELECT * FROM party_transactions WHERE id = $1', [id]);
      if (oldTxRes.rows.length === 0) {
        throw new Error(`Transaction ID ${id} not found.`);
      }
      const oldTx = oldTxRes.rows[0];

      // 2. Re-evaluate Challan No if date shifted
      let final_challan_no = oldTx.challan_no;
      const oldDateData = getMonthAndFY(oldTx.date);
      const newDateData = getMonthAndFY(date);

      if (oldDateData.monthNum !== newDateData.monthNum || oldDateData.fyRange !== newDateData.fyRange) {
        await client.query('LOCK TABLE party_transactions IN SHARE ROW EXCLUSIVE MODE');
        final_challan_no = await getFormattedTransactionChallan(date, oldTx.transaction_type, client, id);
      }

      // 3. Update transaction record
      const finalPaymentMode = oldTx.transaction_type === 'PAYMENT' ? toUpperCase(paymentMode) : null;
      const updateRes = await client.query(queries.updateTransaction, [
        date,
        amount,
        finalPaymentMode,
        toUpperCase(remark),
        final_challan_no,
        id
      ]);

      await client.query('COMMIT');
      return updateRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  delete: async (id) => {
    const res = await db.query(queries.deleteTransaction, [id]);
    if (res.rows.length === 0) return false;
    return true;
  },

  getNextChallan: async (date, transactionType) => {
    return await getFormattedTransactionChallan(date, transactionType, db);
  },

  getOutstanding: async (partyType, partyId) => {
    if (partyType === 'CLIENT') {
      // 1. Fetch Client Master info
      const clientRes = await db.query('SELECT name, balance FROM clients WHERE id = $1', [partyId]);
      if (clientRes.rows.length === 0) {
        throw new Error(`Client ID ${partyId} not found.`);
      }
      const client = clientRes.rows[0];
      const openingAmount = parseFloat(client.balance) || 0;

      // 2. Fetch total billing/challans
      const billRes = await db.query(queries.getClientBillingTotal, [partyId]);
      const totalBilling = parseFloat(billRes.rows[0].total) || 0;

      // 3. Fetch total payments/returns/discounts
      const txRes = await db.query(queries.getClientTransactionTotals, [partyId]);
      const txTotals = txRes.rows[0];
      const totalPayments = parseFloat(txTotals.total_payments) || 0;
      const totalReturns = parseFloat(txTotals.total_returns) || 0;
      const totalDiscounts = parseFloat(txTotals.total_discounts) || 0;

      // Current Client Outstanding Formula
      const currentOutstanding = openingAmount + totalBilling - totalPayments - totalReturns - totalDiscounts;

      return {
        partyType,
        partyId,
        partyName: client.name,
        openingAmount,
        totalBilling,
        totalPayments,
        totalReturns,
        totalDiscounts,
        currentOutstanding
      };
    } else if (partyType === 'JOBBER') {
      // 1. Fetch Jobber info
      const jobberRes = await db.query('SELECT name FROM jobbers WHERE id = $1', [partyId]);
      if (jobberRes.rows.length === 0) {
        throw new Error(`Jobber ID ${partyId} not found.`);
      }
      const jobber = jobberRes.rows[0];

      // 2. Fetch total payments/returns/discounts
      const txRes = await db.query(queries.getJobberTransactionTotals, [partyId]);
      const txTotals = txRes.rows[0];
      const totalPayments = parseFloat(txTotals.total_payments) || 0;
      const totalReturns = parseFloat(txTotals.total_returns) || 0;
      const totalDiscounts = parseFloat(txTotals.total_discounts) || 0;

      // Jobber Outstanding starts with 0 financial base as Job Work has no monetary totals
      const currentOutstanding = 0 - totalPayments - totalReturns - totalDiscounts;

      return {
        partyType,
        partyId,
        partyName: jobber.name,
        openingAmount: 0,
        totalBilling: 0,
        totalPayments,
        totalReturns,
        totalDiscounts,
        currentOutstanding
      };
    } else {
      throw new Error(`Invalid party type: ${partyType}`);
    }
  },

  getHistory: async (partyType, partyId, from, to) => {
    // 1. Calculate dynamic date defaults in server local time
    const today = new Date();
    const prevMonthFirstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    
    const formatDate = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const defaultFrom = formatDate(prevMonthFirstDay);
    const defaultTo = formatDate(today);

    const finalFrom = from || defaultFrom;
    const finalTo = to || defaultTo;

    if (partyType === 'CLIENT') {
      const clientRes = await db.query('SELECT name, balance FROM clients WHERE id = $1', [partyId]);
      if (clientRes.rows.length === 0) {
        throw new Error(`Client ID ${partyId} not found.`);
      }
      const clientName = clientRes.rows[0].name;
      const masterOpening = parseFloat(clientRes.rows[0].balance) || 0;

      // Calculate pre-range balance (reconciled outstanding before finalFrom)
      const preBillingRes = await db.query(
        'SELECT COALESCE(SUM(grand_total), 0) AS total FROM billing WHERE client_id = $1 AND date < $2',
        [partyId, finalFrom]
      );
      const preTxRes = await db.query(
        `SELECT 
            COALESCE(SUM(CASE WHEN transaction_type = 'PAYMENT' THEN amount ELSE 0 END), 0) AS total_payments,
            COALESCE(SUM(CASE WHEN transaction_type = 'RETURN' THEN amount ELSE 0 END), 0) AS total_returns,
            COALESCE(SUM(CASE WHEN transaction_type = 'DISCOUNT' THEN amount ELSE 0 END), 0) AS total_discounts
         FROM party_transactions
         WHERE party_type = 'CLIENT' AND party_id = $1 AND date < $2`,
        [partyId, finalFrom]
      );

      const preBilling = parseFloat(preBillingRes.rows[0].total) || 0;
      const prePayments = parseFloat(preTxRes.rows[0].total_payments) || 0;
      const preReturns = parseFloat(preTxRes.rows[0].total_returns) || 0;
      const preDiscounts = parseFloat(preTxRes.rows[0].total_discounts) || 0;

      const rangeOpeningAmount = masterOpening + preBilling - prePayments - preReturns - preDiscounts;

      // Fetch history records within the range
      const historyRes = await db.query(queries.getClientHistory, [partyId, finalFrom, finalTo]);
      const rows = historyRes.rows.map(r => ({
        challan_no: r.challan_no,
        transaction_type: r.transaction_type,
        date: r.date,
        amount: parseFloat(r.amount) || 0
      }));

      // Prepend range opening balance
      rows.unshift({
        challan_no: '—',
        transaction_type: `OPENING BALANCE (AS OF ${finalFrom})`,
        date: '—',
        amount: rangeOpeningAmount
      });

      const calculatedOutstanding = rangeOpeningAmount + rows.reduce((sum, r) => {
        if (r.transaction_type.startsWith('OPENING BALANCE')) return 0;
        if (r.transaction_type === 'BILLING') {
          return sum + r.amount;
        } else {
          return sum - r.amount;
        }
      }, 0);

      return {
        partyName: clientName,
        currentOutstanding: calculatedOutstanding,
        history: rows
      };
    } else if (partyType === 'JOBBER') {
      const jobberRes = await db.query('SELECT name FROM jobbers WHERE id = $1', [partyId]);
      if (jobberRes.rows.length === 0) {
        throw new Error(`Jobber ID ${partyId} not found.`);
      }
      const jobberName = jobberRes.rows[0].name;

      // Calculate pre-range balance (outstanding before finalFrom, starting with zero baseline)
      const preTxRes = await db.query(
        `SELECT 
            COALESCE(SUM(CASE WHEN transaction_type = 'PAYMENT' THEN amount ELSE 0 END), 0) AS total_payments,
            COALESCE(SUM(CASE WHEN transaction_type = 'RETURN' THEN amount ELSE 0 END), 0) AS total_returns,
            COALESCE(SUM(CASE WHEN transaction_type = 'DISCOUNT' THEN amount ELSE 0 END), 0) AS total_discounts
         FROM party_transactions
         WHERE party_type = 'JOBBER' AND party_id = $1 AND date < $2`,
        [partyId, finalFrom]
      );

      const prePayments = parseFloat(preTxRes.rows[0].total_payments) || 0;
      const preReturns = parseFloat(preTxRes.rows[0].total_returns) || 0;
      const preDiscounts = parseFloat(preTxRes.rows[0].total_discounts) || 0;

      const rangeOpeningAmount = 0 - prePayments - preReturns - preDiscounts;

      // Fetch history records within the range
      const historyRes = await db.query(queries.getJobberHistory, [partyId, finalFrom, finalTo]);
      const rows = historyRes.rows.map(r => ({
        challan_no: r.challan_no,
        transaction_type: r.transaction_type,
        date: r.date,
        amount: parseFloat(r.amount) || 0
      }));

      // Prepend range opening balance
      rows.unshift({
        challan_no: '—',
        transaction_type: `OPENING BALANCE (AS OF ${finalFrom})`,
        date: '—',
        amount: rangeOpeningAmount
      });

      const calculatedOutstanding = rangeOpeningAmount - rows.reduce((sum, r) => {
        if (r.transaction_type.startsWith('OPENING BALANCE')) return 0;
        return sum + r.amount;
      }, 0);

      return {
        partyName: jobberName,
        currentOutstanding: calculatedOutstanding,
        history: rows
      };
    } else {
      throw new Error(`Invalid party type: ${partyType}`);
    }
  }
};

module.exports = partyTransactionService;
