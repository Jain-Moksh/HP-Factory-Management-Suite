/**
 * Generates a custom challan number based on date and type.
 * Format: <sequence>/<month>/<fy> for Billing
 * Format: P<sequence>/<month>/<fy> for Purchase
 * 
 * @param {string} dateStr - ISO Date string
 * @param {string} type - 'billing' or 'purchase'
 * @param {object} client - DB client for query
 * @param {boolean} increment - Whether to increment the sequence (true for creation)
 * @returns {Promise<string>} - Generated challan number
 */

const getMonthName = (dateStr) => {
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
  const monthNum = dateObj.getMonth() + 1;
  const calendarYear = dateObj.getFullYear();

  // Financial Year Logic (April to March)
  let fyRange;
  if (monthNum >= 4) {
    fyRange = `${calendarYear.toString().slice(-2)}-${(calendarYear + 1).toString().slice(-2)}`;
  } else {
    fyRange = `${(calendarYear - 1).toString().slice(-2)}-${calendarYear.toString().slice(-2)}`;
  }

  if (increment) {
    // ATOMIC INCREMENT: Insert if not exists, else increment and return
    const res = await dbOrClient.query(
      `INSERT INTO challan_sequences (type, month, financial_year, last_number)
       VALUES ($1, $2, $3, 1)
       ON CONFLICT (type, month, financial_year) 
       DO UPDATE SET last_number = challan_sequences.last_number + 1
       RETURNING last_number`,
      [type, monthNum, fyRange]
    );
    return { sequence: res.rows[0].last_number, fyRange };
  } else {
    // PREVIEW MODE: Just fetch last number without incrementing
    const res = await dbOrClient.query(
      `SELECT last_number FROM challan_sequences 
       WHERE type = $1 AND month = $2 AND financial_year = $3`,
      [type, monthNum, fyRange]
    );
    const lastNumber = res.rows.length > 0 ? parseInt(res.rows[0].last_number) : 0;
    return { sequence: lastNumber + 1, fyRange };
  }
};

/**
 * Returns a formatted challan string without incrementing (for preview).
 */
const getFormattedChallan = async (dateStr, type, dbOrClient) => {
  const monthName = getMonthName(dateStr);
  const { sequence, fyRange } = await getSequenceData(dateStr, type, dbOrClient, false);
  const prefix = type === 'purchase' ? 'P' : '';
  return `${prefix}${sequence}/${monthName}/${fyRange}`;
};

/**
 * Generates and increments a custom challan number (for creation).
 * MUST be called within a transaction.
 */
const generateChallanNo = async (dateStr, type, client) => {
  const monthName = getMonthName(dateStr);
  const { sequence, fyRange } = await getSequenceData(dateStr, type, client, true);
  const prefix = type === 'purchase' ? 'P' : '';
  return `${prefix}${sequence}/${monthName}/${fyRange}`;
};

module.exports = { generateChallanNo, getFormattedChallan };
