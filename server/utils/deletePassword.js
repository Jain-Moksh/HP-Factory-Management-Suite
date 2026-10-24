/**
 * Checks the master delete password sent with a delete request.
 * Reads DEL_PASS (falling back to del_pass) so it works on any OS, and an unset
 * password never matches, so a missing setting cannot allow deletes without a password.
 *
 * @param {any} password - Password from the request body
 * @returns {boolean}
 */
const isValidDeletePassword = (password) => {
  const expected = (process.env.DEL_PASS ?? process.env.del_pass ?? '').toString().trim();
  if (!expected || password === undefined || password === null) return false;
  return password.toString().trim() === expected;
};

module.exports = { isValidDeletePassword };
