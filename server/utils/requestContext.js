const { AsyncLocalStorage } = require('async_hooks');
const dns = require('dns');
const os = require('os');

const storage = new AsyncLocalStorage();

// Reverse lookups on a LAN can be slow or fail, so results (including failures) are cached per IP
const HOSTNAME_TTL_MS = 60 * 60 * 1000;
const HOSTNAME_FAIL_TTL_MS = 10 * 60 * 1000;
const HOSTNAME_TIMEOUT_MS = 1500;
const hostnameCache = new Map();

const LOOPBACK_IPS = ['127.0.0.1', '::1', 'localhost'];

const normalizeIp = (ip) => {
  if (!ip) return '';
  return ip.replace(/^::ffff:/, '').trim();
};

/**
 * Resolves the network (computer) name of the machine behind an IP address.
 * Requests from the server machine itself resolve to this computer's own hostname.
 *
 * @param {string} ip - Normalized IP address
 * @returns {Promise<string|null>} Hostname or null if it cannot be resolved
 */
const resolveHostname = async (ip) => {
  if (!ip) return null;
  if (LOOPBACK_IPS.includes(ip)) return os.hostname().toUpperCase();

  const cached = hostnameCache.get(ip);
  if (cached && cached.expiresAt > Date.now()) return cached.hostname;

  const lookup = new Promise((resolve) => {
    // lookupService uses the OS resolver (getnameinfo), which on Windows also resolves NetBIOS/LLMNR LAN names
    dns.lookupService(ip, 0, (err, hostname) => {
      if (err || !hostname || hostname === ip) return resolve(null);
      resolve(hostname.split('.')[0].toUpperCase());
    });
  });
  const timeout = new Promise(resolve => setTimeout(() => resolve(null), HOSTNAME_TIMEOUT_MS));
  const hostname = await Promise.race([lookup, timeout]);

  hostnameCache.set(ip, {
    hostname,
    expiresAt: Date.now() + (hostname ? HOSTNAME_TTL_MS : HOSTNAME_FAIL_TTL_MS)
  });
  return hostname;
};

const parseUserAgent = (ua = '') => {
  let osName = 'Unknown OS';
  if (/Windows NT 10/.test(ua)) osName = 'Windows 10/11';
  else if (/Windows NT 6\.3/.test(ua)) osName = 'Windows 8.1';
  else if (/Windows NT 6\.1/.test(ua)) osName = 'Windows 7';
  else if (/Windows/.test(ua)) osName = 'Windows';
  else if (/Android/.test(ua)) osName = 'Android';
  else if (/iPhone|iPad/.test(ua)) osName = 'iOS';
  else if (/Mac OS X/.test(ua)) osName = 'macOS';
  else if (/Linux/.test(ua)) osName = 'Linux';

  let browser = 'Unknown Browser';
  if (/Edg\//.test(ua)) browser = 'Edge';
  else if (/OPR\//.test(ua)) browser = 'Opera';
  else if (/Chrome\//.test(ua)) browser = 'Chrome';
  else if (/Firefox\//.test(ua)) browser = 'Firefox';
  else if (/Safari\//.test(ua)) browser = 'Safari';

  return { os: osName, browser };
};

const decodeHeader = (value) => {
  if (!value) return null;
  try {
    return decodeURIComponent(value).trim().slice(0, 100) || null;
  } catch (e) {
    return value.toString().trim().slice(0, 100) || null;
  }
};

/**
 * Express middleware that captures who/which device made the request and stores it
 * in AsyncLocalStorage so services can attach it to audit log entries.
 * Only data-changing requests pay the cost of the hostname lookup.
 */
const requestContextMiddleware = async (req, res, next) => {
  let ip = normalizeIp(req.socket.remoteAddress);

  // Trust X-Forwarded-For only when the request arrives through a local proxy
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded && LOOPBACK_IPS.includes(ip)) {
    ip = normalizeIp(forwarded.split(',')[0]);
  }

  const userAgent = req.headers['user-agent'] || '';
  const context = {
    ip,
    userAgent,
    deviceName: decodeHeader(req.headers['x-device-name']),
    hostname: null,
    ...parseUserAgent(userAgent)
  };

  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    context.hostname = await resolveHostname(ip);
  }

  storage.run(context, () => next());
};

const getRequestContext = () => storage.getStore() || {};

module.exports = { requestContextMiddleware, getRequestContext, resolveHostname };
