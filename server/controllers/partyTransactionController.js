const partyTransactionService = require('../services/partyTransactionService');

const mapTxTypeResponse = (tx) => {
  if (!tx) return tx;
  if (Array.isArray(tx)) {
    return tx.map(mapTxTypeResponse);
  }
  const cloned = { ...tx };
  if (cloned.transaction_type === 'RETURN') {
    cloned.transaction_type = 'REPLACE';
  }
  if (cloned.transactionType === 'RETURN') {
    cloned.transactionType = 'REPLACE';
  }
  return cloned;
};

const mapHistoryData = (data) => {
  if (!data) return data;
  const cloned = { ...data };
  if (Array.isArray(cloned.history)) {
    cloned.history = cloned.history.map(row => {
      const clonedRow = { ...row };
      if (clonedRow.transaction_type === 'RETURN') {
        clonedRow.transaction_type = 'REPLACE';
      }
      return clonedRow;
    });
  }
  return cloned;
};

const partyTransactionController = {
  create: async (req, res) => {
    try {
      const { partyType, partyId, transactionType, date, amount, paymentMode, remark } = req.body;

      // 1. Basic Server Side Validations
      if (!partyType || !['CLIENT', 'JOBBER'].includes(partyType)) {
        return res.status(400).json({ success: false, error: 'Invalid or missing partyType (must be CLIENT or JOBBER).' });
      }

      if (!partyId || isNaN(parseInt(partyId))) {
        return res.status(400).json({ success: false, error: 'Invalid or missing partyId.' });
      }

      if (!transactionType || !['PAYMENT', 'REPLACE', 'DISCOUNT'].includes(transactionType)) {
        return res.status(400).json({ success: false, error: 'Invalid or missing transactionType (must be PAYMENT, REPLACE, or DISCOUNT).' });
      }

      if (!date || isNaN(Date.parse(date))) {
        return res.status(400).json({ success: false, error: 'Invalid or missing date.' });
      }

      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ success: false, error: 'Amount must be a valid number greater than 0.' });
      }

      if (transactionType === 'PAYMENT') {
        if (!paymentMode || !['BANK', 'CASH'].includes(paymentMode.toUpperCase())) {
          return res.status(400).json({ success: false, error: 'paymentMode must be BANK or CASH for PAYMENT transaction types.' });
        }
      }

      // Map REPLACE to RETURN for database / service consistency
      const mappedTxType = transactionType === 'REPLACE' ? 'RETURN' : transactionType;

      // 2. Call service layer
      const tx = await partyTransactionService.create({
        partyType,
        partyId: parseInt(partyId),
        transactionType: mappedTxType,
        date,
        amount: parsedAmount,
        paymentMode: transactionType === 'PAYMENT' ? paymentMode.toUpperCase() : null,
        remark: remark || ''
      });

      res.status(201).json({ success: true, data: mapTxTypeResponse(tx) });
    } catch (err) {
      console.error('Error in partyTransactionController.create:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  getAll: async (req, res) => {
    try {
      const list = await partyTransactionService.getAll();
      res.json({ success: true, data: mapTxTypeResponse(list) });
    } catch (err) {
      console.error('Error in partyTransactionController.getAll:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  getById: async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, error: 'Invalid transaction ID.' });
      }

      const tx = await partyTransactionService.getById(id);
      if (!tx) {
        return res.status(404).json({ success: false, error: 'Transaction not found.' });
      }

      res.json({ success: true, data: mapTxTypeResponse(tx) });
    } catch (err) {
      console.error('Error in partyTransactionController.getById:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  update: async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, error: 'Invalid transaction ID.' });
      }

      const { date, amount, paymentMode, remark } = req.body;

      if (!date || isNaN(Date.parse(date))) {
        return res.status(400).json({ success: false, error: 'Invalid or missing date.' });
      }

      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ success: false, error: 'Amount must be a valid number greater than 0.' });
      }

      const tx = await partyTransactionService.update(id, {
        date,
        amount: parsedAmount,
        paymentMode: paymentMode ? paymentMode.toUpperCase() : null,
        remark: remark || ''
      });

      res.json({ success: true, data: mapTxTypeResponse(tx) });
    } catch (err) {
      console.error('Error in partyTransactionController.update:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  delete: async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, error: 'Invalid transaction ID.' });
      }

      const success = await partyTransactionService.delete(id);
      if (!success) {
        return res.status(404).json({ success: false, error: 'Transaction not found.' });
      }

      res.json({ success: true, message: 'Transaction deleted successfully.' });
    } catch (err) {
      console.error('Error in partyTransactionController.delete:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  getNextChallan: async (req, res) => {
    try {
      const { transactionType, date } = req.query;

      if (!transactionType || !['PAYMENT', 'REPLACE', 'DISCOUNT'].includes(transactionType)) {
        return res.status(400).json({ success: false, error: 'Query param transactionType must be PAYMENT, REPLACE, or DISCOUNT.' });
      }

      if (!date || isNaN(Date.parse(date))) {
        return res.status(400).json({ success: false, error: 'Query param date is invalid or missing.' });
      }

      const mappedType = transactionType === 'REPLACE' ? 'RETURN' : transactionType;
      const challan_no = await partyTransactionService.getNextChallan(date, mappedType);
      res.json({ success: true, challan_no });
    } catch (err) {
      console.error('Error in partyTransactionController.getNextChallan:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  getOutstanding: async (req, res) => {
    try {
      const { partyType, partyId } = req.query;

      if (!partyType || !['CLIENT', 'JOBBER'].includes(partyType)) {
        return res.status(400).json({ success: false, error: 'Query param partyType must be CLIENT or JOBBER.' });
      }

      const id = parseInt(partyId);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, error: 'Query param partyId is invalid or missing.' });
      }

      const report = await partyTransactionService.getOutstanding(partyType, id);
      res.json({ success: true, data: report });
    } catch (err) {
      console.error('Error in partyTransactionController.getOutstanding:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  getHistory: async (req, res) => {
    try {
      const { partyType, partyId, from, to } = req.query;

      if (!partyType || !['CLIENT', 'JOBBER'].includes(partyType)) {
        return res.status(400).json({ success: false, error: 'Query param partyType must be CLIENT or JOBBER.' });
      }

      const id = parseInt(partyId);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, error: 'Query param partyId is invalid or missing.' });
      }

      const historyData = await partyTransactionService.getHistory(partyType, id, from, to);
      res.json({ success: true, data: mapHistoryData(historyData) });
    } catch (err) {
      console.error('Error in partyTransactionController.getHistory:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
};

module.exports = partyTransactionController;
