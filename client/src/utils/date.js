/**
 * Today's date as "YYYY-MM-DD" in this computer's own time zone.
 *
 * new Date().toISOString() gives the date in UTC, which in India is still the previous day
 * between midnight and 5:30 AM, so a bill made then would default to yesterday
 * (and, on the 1st, to last month's challan series).
 *
 * @param {Date} [d] - Date to format (defaults to now)
 * @returns {string}
 */
export const todayLocal = (d = new Date()) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
