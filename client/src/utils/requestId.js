/**
 * Creates a random id that identifies one invoice / job work form, so the server can
 * recognise a repeated save of the same form and return the record it already created.
 * crypto.randomUUID() is unavailable over plain http on the LAN, so getRandomValues is used.
 */
export const createRequestId = () => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
};

let lastTempRowId = 0;

/**
 * Id for a row that has not been saved yet (invoice / job work / bulk payment rows).
 * It is based on the current time, so it is always 13+ digits: the save code relies on that
 * (`id.toString().length < 13`) to tell a new row apart from a saved row's database id.
 * Unlike plain Date.now(), two rows added in the same millisecond never get the same id,
 * which would make editing or deleting one of them also hit the other.
 */
export const createTempRowId = () => {
  const now = Date.now();
  lastTempRowId = now > lastTempRowId ? now : lastTempRowId + 1;
  return lastTempRowId;
};
