const db = require('../config/db');
const queries = require('../queries/masterQueries');
const { toUpperCase } = require('../utils/dataSanitizer');

const masterService = {
  // Generic list/search helper
  list: async (table, search) => {
    if (search) {
      const queryKey = `search${table.charAt(0).toUpperCase() + table.slice(1)}`;
      const result = await db.query(queries[queryKey], [`%${search}%`]);
      return result.rows;
    }
    const queryKey = `getAll${table.charAt(0).toUpperCase() + table.slice(1)}`;
    const result = await db.query(queries[queryKey]);
    return result.rows;
  },

  getById: async (table, id) => {
    const queryKey = `get${table.charAt(0).toUpperCase() + table.slice(1).replace(/s$/, '')}ById`;
    const result = await db.query(queries[queryKey], [id]);
    return result.rows[0];
  },

  create: async (table, data) => {
    // Sanitize: convert empty strings to null
    const clean = {};
    Object.keys(data).forEach(key => {
      let value = data[key] === '' ? null : data[key];
      // Convert to uppercase if it's a string
      clean[key] = typeof value === 'string' ? toUpperCase(value) : value;
    });

    let queryKey, params;
    switch (table) {
      case 'items':
        queryKey = 'createItem';
        params = [clean.name, clean.rate, clean.stock, clean.open_stock, clean.conversion, clean.unit, clean.min_stock];
        break;
      case 'clients':
        queryKey = 'createClient';
        params = [clean.name, clean.street, clean.city, clean.shortform, clean.balance, clean.remark];
        break;
      case 'jobbers':
        queryKey = 'createJobber';
        params = [data.name];
        break;
      case 'transporters':
        queryKey = 'createTransporter';
        params = [data.name];
        break;
    }
    const result = await db.query(queries[queryKey], params);
    return result.rows[0];
  },

  update: async (table, id, data) => {
    // Sanitize: convert empty strings to null
    const clean = {};
    Object.keys(data).forEach(key => {
      let value = data[key] === '' ? null : data[key];
      // Convert to uppercase if it's a string
      clean[key] = typeof value === 'string' ? toUpperCase(value) : value;
    });

    let queryKey, params;
    switch (table) {
      case 'items':
        queryKey = 'updateItem';
        
        // Fetch old item to calculate stock difference based on open_stock change
        const oldItem = await masterService.getById('items', id);
        if (!oldItem) throw new Error('Item not found');
        
        const oldOpenStock = Number(oldItem.open_stock) || 0;
        const currentStock = Number(oldItem.stock) || 0;
        const newOpenStock = Number(clean.open_stock) || 0;
        
        const difference = newOpenStock - oldOpenStock;
        const updatedStock = currentStock + difference;

        params = [clean.name, clean.rate, updatedStock, clean.open_stock, clean.conversion, clean.unit, clean.min_stock, id];
        break;
      case 'clients':
        queryKey = 'updateClient';
        params = [clean.name, clean.street, clean.city, clean.shortform, clean.balance, clean.remark, id];
        break;
      case 'jobbers':
        queryKey = 'updateJobber';
        params = [data.name, id];
        break;
      case 'transporters':
        queryKey = 'updateTransporter';
        params = [data.name, id];
        break;
    }
    const result = await db.query(queries[queryKey], params);
    return result.rows[0];
  },

  getItemTransactions: async (itemId, startDate, endDate) => {
    let query = queries.getItemTransactions;
    let params = [itemId];

    const result = await db.query(query, params);
    let transactions = result.rows;

    // Filter by date if provided
    if (startDate || endDate) {
      transactions = transactions.filter(t => {
        const date = t.date.toISOString().split('T')[0];
        const matchesStart = !startDate || date >= startDate;
        const matchesEnd = !endDate || date <= endDate;
        return matchesStart && matchesEnd;
      });
    }

    return transactions;
  }
};

module.exports = masterService;
