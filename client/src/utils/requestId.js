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
