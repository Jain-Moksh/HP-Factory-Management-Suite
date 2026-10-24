import { API_BASE_URL } from '../config';

const STORAGE_KEY = 'auditDeviceName';
export const DEVICE_HEADER = 'X-Device-Name';

/**
 * Returns the name this PC registered for itself (e.g. "BILLING COUNTER HP"), or '' if none is set.
 * Stored per browser, so each PC on the network keeps its own name.
 */
export const getDeviceName = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) || '';
  } catch {
    return '';
  }
};

export const setDeviceName = (name) => {
  try {
    const clean = (name || '').trim().toUpperCase().slice(0, 100);
    if (clean) {
      localStorage.setItem(STORAGE_KEY, clean);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    return clean;
  } catch {
    return '';
  }
};

const isApiRequest = (url) => {
  if (typeof url !== 'string') return false;
  return url.startsWith(API_BASE_URL) || url.startsWith('/api');
};

/**
 * Wraps window.fetch so every API call carries this device's name, letting the server
 * record which PC made each change in the audit log.
 */
export const installDeviceHeader = () => {
  if (window.__deviceHeaderInstalled) return;
  window.__deviceHeaderInstalled = true;

  const originalFetch = window.fetch.bind(window);
  window.fetch = (input, init = {}) => {
    const deviceName = getDeviceName();
    if (!deviceName || !isApiRequest(input)) {
      return originalFetch(input, init);
    }
    const headers = new Headers(init.headers || {});
    // Header values must be ASCII, so the name is URI-encoded and decoded on the server
    headers.set(DEVICE_HEADER, encodeURIComponent(deviceName));
    return originalFetch(input, { ...init, headers });
  };
};
