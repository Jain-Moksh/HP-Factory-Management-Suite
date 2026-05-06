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
const getFormattedChallan = async (dateStr, type, dbOrClient, excludeId = null) => {
  const dateObj = new Date(dateStr);
  const monthsShort = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  return monthsShort[dateObj.getMonth()];
};

/**
 * Core logic to get sequence number from challan_sequences table.
 * Uses atomic INSERT ... ON CONFLICT for concurrency safety.
 */
const getSequenceData = async (dateStr, type, dbOrClient, increment = false) => {
  const dateObj = new Date(dateStr);
  const monthName = monthsShort[dateObj.getMonth()];
  const monthNum = dateObj.getMonth() + 1;
  const calendarYear = dateObj.getFullYear();

  // Financial Year Logic (April to March)
  let fyRange;
  let fyStart, fyEnd;
  if (monthNum >= 4) {
    const startYear = calendarYear;
    const endYear = calendarYear + 1;
    fyRange = `${startYear.toString().slice(-2)}-${endYear.toString().slice(-2)}`;
    fyStart = `${startYear}-04-01`;
    fyEnd = `${endYear}-03-31`;
  } else {
    const startYear = calendarYear - 1;
    const endYear = calendarYear;
    fyRange = `${startYear.toString().slice(-2)}-${endYear.toString().slice(-2)}`;
    fyStart = `${startYear}-04-01`;
    fyEnd = `${endYear}-03-31`;
  }

  const tableName = type === 'billing' ? 'billing' : 'purchase';
  
  // MANDATORY SQL LOGIC: Count existing records for SAME MONTH and SAME FINANCIAL YEAR
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
 * Generates a custom challan number based on date and type.
 * Uses LOCK TABLE for concurrency safety during creation.
 */
const generateChallanNo = async (dateStr, type, client, excludeId = null) => {
  const tableName = type === 'billing' ? 'billing' : 'purchase';
  
  // CRITICAL: Concurrency safety
  await client.query(`LOCK TABLE ${tableName} IN SHARE ROW EXCLUSIVE MODE`);

  return await getFormattedChallan(dateStr, type, client, excludeId);
};

<<<<<<< HEAD
module.exports = { generateChallanNo, getFormattedChallan, getMonthAndFY };
module.exports = { generateChallanNo, getFormattedChallan };

=======
module.exports = { generateChallanNo, getFormattedChallan };
>>>>>>> parent of 31a0af9 (numbering solved)
