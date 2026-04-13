const db = require('../config/db');
const queries = require('../queries/masterQueries');

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
      clean[key] = data[key] === '' ? null : data[key];
    });

    let queryKey, params;
    switch (table) {
      case 'items':
        queryKey = 'createItem';
        params = [clean.name, clean.rate, clean.stock, clean.conversion, clean.unit, clean.min_stock];
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
      clean[key] = data[key] === '' ? null : data[key];
    });

    let queryKey, params;
    switch (table) {
      case 'items':
        queryKey = 'updateItem';
        params = [clean.name, clean.rate, clean.stock, clean.conversion, clean.unit, clean.min_stock, id];
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
  }
};

module.exports = masterService;
