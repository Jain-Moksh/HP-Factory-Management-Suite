/**
 * Recursively converts string values in an object to uppercase.
 * Handles arrays and nested objects.
 * 
 * @param {any} data - The data to sanitize
 * @returns {any} - The sanitized data with uppercase strings
 */
const toUpperCase = (data) => {
  if (typeof data === 'string') {
    return data.toUpperCase();
  }
  
  if (Array.isArray(data)) {
    return data.map(item => toUpperCase(item));
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized = {};
    Object.keys(data).forEach(key => {
      sanitized[key] = toUpperCase(data[key]);
    });
    return sanitized;
  }
  
  return data;
};

/**
 * Validates bill / job work line items before any stock is touched.
 * A missing or non-positive quantity would turn the item's stock into NULL
 * (stock - NULL = NULL), and every later stock update would keep it NULL.
 *
 * @param {Array} items - Line items with item_id and quantity
 * @throws {Error} 400 error describing the first invalid row
 */
const validateLineItems = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    const err = new Error('Please add at least one item.');
    err.status = 400;
    throw err;
  }

  items.forEach((item, index) => {
    const quantity = Number(item.quantity);
    if (!item.item_id || item.quantity === null || item.quantity === '' || !Number.isFinite(quantity) || quantity <= 0) {
      const err = new Error(`Row ${index + 1}: please select an item and enter a quantity greater than 0.`);
      err.status = 400;
      throw err;
    }
  });
};

module.exports = { toUpperCase, validateLineItems };
