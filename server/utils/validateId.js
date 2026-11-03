// Largest value a PostgreSQL INT / SERIAL column can hold
const MAX_INT = 2147483647;

/**
 * router.param handler that only lets whole positive record numbers through.
 * Anything else (/billing/abc, /billing/1.5, /billing/99999999999) is answered with a clear 400
 * instead of reaching the database and coming back as a 500 with a raw database error.
 */
const validateIdParam = (req, res, next, value) => {
  const id = Number(value);
  if (/^\d+$/.test(String(value)) && id >= 1 && id <= MAX_INT) return next();
  return res.status(400).json({ success: false, status: 400, message: 'Invalid record id. It must be a whole number.' });
};

module.exports = { validateIdParam };
