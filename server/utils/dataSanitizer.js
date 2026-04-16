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

module.exports = { toUpperCase };
