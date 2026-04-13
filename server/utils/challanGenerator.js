/**
 * Generates a custom challan number based on date and type.
 * Format: <sequence>/<month>/<fy> for Billing
 * Format: P<sequence>/<month>/<fy> for Purchase
 * 
 * @param {string} dateStr - ISO Date string
 * @param {string} type - 'billing' or 'purchase'
 * @param {object} client - DB client for query
 * @returns {Promise<string>} - Generated challan number
 */
/**
 * Core logic to count records and format the challan number.
 * Can be used for both creation (inside transaction) and preview.
 */
const getFormattedChallan = async (dateStr, type, dbOrClient) => {
  const dateObj = new Date(dateStr);
  const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthName = monthsShort[dateObj.getMonth()];
  const monthNum = dateObj.getMonth() + 1;
  const calendarYear = dateObj.getFullYear();

  // Financial Year Logic (April to March)
  let fy;
  if (monthNum >= 4) {
    const currentYear = calendarYear.toString().slice(-2);
    const nextYear = (calendarYear + 1).toString().slice(-2);
    fy = `${currentYear}-${nextYear}`;
  } else {
    const prevYear = (calendarYear - 1).toString().slice(-2);
    const currentYear = calendarYear.toString().slice(-2);
    fy = `${prevYear}-${currentYear}`;
  }

  const tableName = type === 'billing' ? 'billing' : 'purchase';
  
  // MANDATORY SQL LOGIC: Count existing records for SAME MONTH and SAME FINANCIAL YEAR
  const countRes = await dbOrClient.query(
    `SELECT COUNT(*) FROM ${tableName}
     WHERE EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM $1::DATE)
     AND (
       (EXTRACT(MONTH FROM $1::DATE) >= 4 AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM $1::DATE))
       OR
       (EXTRACT(MONTH FROM $1::DATE) < 4 AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM $1::DATE))
     )`,
    [dateStr]
  );
  
  const count = parseInt(countRes.rows[0].count);
  const sequence = count + 1;
  const prefix = type === 'purchase' ? 'P' : '';

  return `${prefix}${sequence}/${monthName}/${fy}`;
};

/**
 * Generates a custom challan number based on date and type.
 * Uses LOCK TABLE for concurrency safety during creation.
 */
const generateChallanNo = async (dateStr, type, client) => {
  const tableName = type === 'billing' ? 'billing' : 'purchase';
  
  // CRITICAL: Concurrency safety
  await client.query(`LOCK TABLE ${tableName} IN SHARE ROW EXCLUSIVE MODE`);

  return await getFormattedChallan(dateStr, type, client);
};

module.exports = { generateChallanNo, getFormattedChallan };

