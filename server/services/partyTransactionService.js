const db = require('../config/db');
const queries = require('../queries/partyTransactionQueries');
const { getMonthAndFY, parseYearMonth } = require('../utils/challanGenerator');
const { toUpperCase } = require('../utils/dataSanitizer');
const auditService = require('./auditService');

// Error carrying the HTTP status the controller should answer with
const httpError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

// RETURN is shown as REPLACE everywhere in the UI
const TX_LABELS = { PAYMENT: 'Payment', RETURN: 'Replace', DISCOUNT: 'Discount' };

const formatAmount = (value) => Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const loadSnapshot = async (executor, id) => {
  const res = await executor.query(queries.getTransactionById, [id]);
  return res.rows[0] || null;
};

const describeTransaction = (tx) => {
  const mode = tx.payment_mode ? ` (${tx.payment_mode})` : '';
  return `${TX_LABELS[tx.transaction_type] || tx.transaction_type} ${tx.challan_no} of ₹${formatAmount(tx.amount)}${mode} for ${tx.party_name}`;
};

const getFormattedTransactionChallan = async (dateStr, transactionType, dbOrClient, excludeId = null) => {
  const { monthNum, monthName, fyRange } = getMonthAndFY(dateStr);

  // Calculate FY start and end for the query
  const { year, month } = parseYearMonth(dateStr);
  const startYear = month >= 4 ? year : year - 1;
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

      const { partyType, partyId, transactionType, date, amount, paymentMode, remark, request_id, entries } = txData;

      // 1. Verify party exists
      if (partyType === 'CLIENT') {
        const clientCheck = await client.query('SELECT id FROM clients WHERE id = $1', [partyId]);
        if (clientCheck.rows.length === 0) {
          throw httpError(404, `Client ID ${partyId} not found. It may have been deleted on another PC.`);
        }
      } else if (partyType === 'JOBBER') {
        const jobberCheck = await client.query('SELECT id FROM jobbers WHERE id = $1', [partyId]);
        if (jobberCheck.rows.length === 0) {
          throw httpError(404, `Jobber ID ${partyId} not found. It may have been deleted on another PC.`);
        }
      } else {
        throw httpError(400, `Invalid party type: ${partyType}`);
      }

      // 2. Lock party_transactions table to serialize sequence generation
      await client.query('LOCK TABLE party_transactions IN SHARE ROW EXCLUSIVE MODE');

      // A repeated save of the same form (double-click, retry) returns the payment it already created.
      // Checked after the table lock, so two simultaneous requests cannot both pass.
      if (request_id) {
        const existing = await client.query(queries.getByRequestIds, [[request_id]]);
        if (existing.rows.length > 0) {
          await client.query('ROLLBACK');
          return { ...existing.rows[0], duplicate: true };
        }
      }

      // 3. Generate sequential challan number
      const challan_no = await getFormattedTransactionChallan(date, transactionType, client);

      // 4. Determine finalPaymentMode and finalAmount (supporting multi-entry on one challan)
      let finalPaymentMode = null;
      let finalAmount = parseFloat(amount);
      let entriesJson = null;

      if (Array.isArray(entries) && entries.length > 0) {
        entriesJson = JSON.stringify(entries);
        finalAmount = entries.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
        if (transactionType === 'PAYMENT') {
          const modes = new Set(entries.map(e => (e.paymentMode || 'CASH').toUpperCase()));
          finalPaymentMode = modes.size > 1 ? 'MIXED' : Array.from(modes)[0];
        }
      } else {
        finalPaymentMode = ['PAYMENT', 'RETURN', 'DISCOUNT'].includes(transactionType) && transactionType !== 'PAYMENT' ? null : toUpperCase(paymentMode || 'CASH');
      }

      const insertRes = await client.query(queries.insertTransaction, [
        partyType,
        partyId,
        transactionType,
        date,
        challan_no,
        finalAmount,
        finalPaymentMode,
        toUpperCase(remark),
        request_id || null,
        entriesJson
      ]);

      const snapshot = await loadSnapshot(client, insertRes.rows[0].id);
      await auditService.record(client, {
        module: auditService.MODULES.PAYMENT,
        action: auditService.ACTIONS.CREATE,
        recordId: snapshot.id,
        reference: snapshot.challan_no,
        summary: `${describeTransaction(snapshot)} created`,
        details: { after: snapshot }
      });

      await client.query('COMMIT');
      return insertRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  createBulk: async (bulkData) => {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const { transactionType, date, transactions, request_id } = bulkData;
      const results = [];

      // Lock table to prevent race conditions during bulk insert
      await client.query('LOCK TABLE party_transactions IN SHARE ROW EXCLUSIVE MODE');

      // A repeated save of the same bulk form returns the payments it already created
      const rowRequestId = (index) => (request_id ? `${request_id}#${index}` : null);
      if (request_id) {
        const existing = await client.query(queries.getByRequestIds, [transactions.map((_, i) => rowRequestId(i))]);
        if (existing.rows.length > 0) {
          await client.query('ROLLBACK');
          return existing.rows.map(row => ({ ...row, duplicate: true }));
        }
      }

      for (const [index, tx] of transactions.entries()) {
        const { partyType, partyId, amount, paymentMode, remark } = tx;

        // 1. Verify party exists
        if (partyType === 'CLIENT') {
          const clientCheck = await client.query('SELECT id FROM clients WHERE id = $1', [partyId]);
          if (clientCheck.rows.length === 0) {
            throw httpError(404, `Client ID ${partyId} not found. It may have been deleted on another PC.`);
          }
        } else if (partyType === 'JOBBER') {
          const jobberCheck = await client.query('SELECT id FROM jobbers WHERE id = $1', [partyId]);
          if (jobberCheck.rows.length === 0) {
            throw httpError(404, `Jobber ID ${partyId} not found. It may have been deleted on another PC.`);
          }
        } else {
          throw httpError(400, `Invalid party type: ${partyType}`);
        }

        // 2. Generate sequential challan number
        const challan_no = await getFormattedTransactionChallan(date, transactionType, client);

        // 3. Insert transaction
        const finalPaymentMode = ['PAYMENT', 'RETURN', 'DISCOUNT'].includes(transactionType) && transactionType !== 'PAYMENT' ? null : toUpperCase(paymentMode || 'CASH');

        const insertRes = await client.query(queries.insertTransaction, [
          partyType,
          partyId,
          transactionType,
          date,
          challan_no,
          amount,
          finalPaymentMode,
          toUpperCase(remark || ''),
          rowRequestId(index),
          null
        ]);

        // One log entry per party so each payment can be found by its own challan / party
        const snapshot = await loadSnapshot(client, insertRes.rows[0].id);
        await auditService.record(client, {
          module: auditService.MODULES.PAYMENT,
          action: auditService.ACTIONS.CREATE,
          recordId: snapshot.id,
          reference: snapshot.challan_no,
          summary: `${describeTransaction(snapshot)} created (bulk entry of ${transactions.length})`,
          details: { after: snapshot, bulk: true }
        });

        results.push(insertRes.rows[0]);
      }

      await client.query('COMMIT');
      return results;
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

      const { transactionType, date, amount, paymentMode, remark, entries } = txData;

      // 1. Fetch and lock the existing record, so two saves of the same payment run one after the other
      const oldTxRes = await client.query('SELECT * FROM party_transactions WHERE id = $1 FOR UPDATE', [id]);
      if (oldTxRes.rows.length === 0) {
        const err = new Error('This payment no longer exists. It may have been deleted on another PC.');
        err.status = 404;
        throw err;
      }
      const oldTx = oldTxRes.rows[0];
      const before = await loadSnapshot(client, id);

      // 2. Re-evaluate Challan No if date shifted or type changed
      let final_challan_no = oldTx.challan_no;
      const oldDateData = getMonthAndFY(oldTx.date);
      const newDateData = getMonthAndFY(date);

      if (oldTx.transaction_type !== transactionType || oldDateData.monthNum !== newDateData.monthNum || oldDateData.fyRange !== newDateData.fyRange) {
        await client.query('LOCK TABLE party_transactions IN SHARE ROW EXCLUSIVE MODE');
        final_challan_no = await getFormattedTransactionChallan(date, transactionType, client, id);
      }

      // 3. Determine finalPaymentMode and finalAmount (supporting multi-entry on one challan)
      let finalPaymentMode = null;
      let finalAmount = parseFloat(amount);
      let entriesJson = null;

      if (Array.isArray(entries) && entries.length > 0) {
        entriesJson = JSON.stringify(entries);
        finalAmount = entries.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
        if (transactionType === 'PAYMENT') {
          const modes = new Set(entries.map(e => (e.paymentMode || 'CASH').toUpperCase()));
          finalPaymentMode = modes.size > 1 ? 'MIXED' : Array.from(modes)[0];
        }
      } else {
        finalPaymentMode = transactionType === 'PAYMENT' ? toUpperCase(paymentMode || 'CASH') : null;
      }

      const updateRes = await client.query(queries.updateTransaction, [
        transactionType,
        date,
        finalAmount,
        finalPaymentMode,
        toUpperCase(remark),
        final_challan_no,
        entriesJson,
        id
      ]);

      const after = await loadSnapshot(client, id);
      const changes = auditService.diffFields(before, after);
      if (!auditService.isUnchanged(changes)) await auditService.record(client, {
        module: auditService.MODULES.PAYMENT,
        action: auditService.ACTIONS.UPDATE,
        recordId: Number(id),
        reference: after.challan_no,
        summary: `${describeTransaction(after)} updated: ${auditService.describeUpdate(changes)}`,
        details: { before, after, changes }
      });

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
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // Lock first: a repeated delete waits here, then finds the payment gone and changes nothing
      const lockRes = await client.query('SELECT id FROM party_transactions WHERE id = $1 FOR UPDATE', [id]);
      if (lockRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return false;
      }

      // Full copy of the transaction is archived instead of being lost
      const snapshot = await loadSnapshot(client, id);
      if (!snapshot) {
        await client.query('ROLLBACK');
        return false;
      }

      const deleted = await client.query(queries.deleteTransaction, [id]);
      if (deleted.rowCount !== 1) {
        await client.query('ROLLBACK');
        return false;
      }

      await auditService.archiveAndRecord(client, {
        module: auditService.MODULES.PAYMENT,
        recordId: snapshot.id,
        reference: snapshot.challan_no,
        partyName: snapshot.party_name,
        recordDate: snapshot.date,
        amount: snapshot.amount,
        summary: `${describeTransaction(snapshot)} deleted and archived`,
        snapshot
      });

      await client.query('COMMIT');
      return true;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  getNextChallan: async (date, transactionType) => {
    return await getFormattedTransactionChallan(date, transactionType, db);
  },

  getOutstanding: async (partyType, partyId) => {
    if (partyType === 'CLIENT') {
      // 1. Fetch Client Master info
      const clientRes = await db.query('SELECT name, balance FROM clients WHERE id = $1', [partyId]);
      if (clientRes.rows.length === 0) {
        throw httpError(404, `Client ID ${partyId} not found.`);
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
        throw httpError(404, `Jobber ID ${partyId} not found.`);
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
      throw httpError(400, `Invalid party type: ${partyType}`);
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
        throw httpError(404, `Client ID ${partyId} not found.`);
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
        throw httpError(404, `Jobber ID ${partyId} not found.`);
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
      throw httpError(400, `Invalid party type: ${partyType}`);
    }
  }
};

module.exports = partyTransactionService;
