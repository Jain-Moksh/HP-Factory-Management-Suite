/**
 * Generates a custom challan number based on date and type.
 * Format: <sequence>/<month>/<fy> for Billing
 * Format: P<sequence>/<month>/<fy> for Purchase
 */

const monthsShort = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/**
 * Extracts Month Number, Short Name and Financial Year range from a date string.
 * @param {string} dateStr - ISO Date string (YYYY-MM-DD)
 * @returns {object} - { monthNum, monthName, fyRange }
 */
const getMonthAndFY = (dateStr) => {
  const dateObj = new Date(dateStr);
  const monthNum = dateObj.getMonth() + 1;
  const monthName = monthsShort[dateObj.getMonth()];
  const calendarYear = dateObj.getFullYear();

  let fyRange;
  // Financial Year starts in April
  if (monthNum >= 4) {
    const startYear = calendarYear;
    const endYear = calendarYear + 1;
    fyRange = `${startYear.toString().slice(-2)}-${endYear.toString().slice(-2)}`;
  } else {
    const startYear = calendarYear - 1;
    const endYear = calendarYear;
    fyRange = `${startYear.toString().slice(-2)}-${endYear.toString().slice(-2)}`;
  }
  return { monthNum, monthName, fyRange };
};

/**
 * Core logic to count records and format the challan number.
 * Used for both creation and preview.
 * 
 * @param {string} dateStr - ISO Date string
 * @param {string} type - 'billing' or 'purchase'
 * @param {object} dbOrClient - DB pool or client
 * @param {number} excludeId - ID to exclude (used in edit mode)
 * @returns {Promise<string>} - Formatted challan number
 */
const getFormattedChallan = async (dateStr, type, dbOrClient, excludeId = null) => {
  const { monthNum, monthName, fyRange } = getMonthAndFY(dateStr);
  const tableName = type === 'billing' ? 'billing' : 'purchase';

  // Calculate FY start and end for the query
  const dateObj = new Date(dateStr);
  const startYear = dateObj.getMonth() + 1 >= 4 ? dateObj.getFullYear() : dateObj.getFullYear() - 1;
  const fyStart = `${startYear}-04-01`;
  const fyEnd = `${startYear + 1}-03-31`;

  const queryParams = [monthNum, fyStart, fyEnd];
  let queryStr = `
    SELECT COUNT(*) FROM ${tableName}
    WHERE EXTRACT(MONTH FROM date) = $1
    AND date BETWEEN $2 AND $3
  `;

  if (excludeId) {
    queryStr += ` AND id != $4`;
    queryParams.push(excludeId);
  }

  const countRes = await dbOrClient.query(queryStr, queryParams);
  const count = parseInt(countRes.rows[0].count);
  const sequence = count + 1;
  const prefix = type === 'purchase' ? 'P' : '';

  return `${prefix}${sequence}/${monthName}/${fyRange}`;
};

/**
 * Generates a custom challan number with concurrency protection.
 * Should be called inside a transaction.
 */
const generateChallanNo = async (dateStr, type, client, excludeId = null) => {
  const tableName = type === 'billing' ? 'billing' : 'purchase';

  // Lock table to prevent duplicate sequence numbers during concurrent inserts
  await client.query(`LOCK TABLE ${tableName} IN SHARE ROW EXCLUSIVE MODE`);

  return await getFormattedChallan(dateStr, type, client, excludeId);
};

module.exports = {
  generateChallanNo,
  getFormattedChallan,
  getMonthAndFY
};
