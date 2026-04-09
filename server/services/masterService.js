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
    let queryKey, params;
    switch (table) {
      case 'items':
        queryKey = 'createItem';
        params = [data.name, data.rate, data.stock, data.conversion, data.unit];
        break;
      case 'clients':
        queryKey = 'createClient';
        params = [data.name, data.street, data.city, data.shortform, data.balance, data.remark];
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
    let queryKey, params;
    switch (table) {
      case 'items':
        queryKey = 'updateItem';
        params = [data.name, data.rate, data.stock, data.conversion, data.unit, id];
        break;
      case 'clients':
        queryKey = 'updateClient';
        params = [data.name, data.street, data.city, data.shortform, data.balance, data.remark, id];
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
