const dns = require('dns').promises;
const { URL } = require('url');

// Checks if an IPv4 is in private/loopback/link-local/reserved ranges
function isPrivateIPv4(ip) {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) return false;

  // 127.0.0.0/8 (Loopback)
  if (parts[0] === 127) return true;
  // 10.0.0.0/8 (Private network)
  if (parts[0] === 10) return true;
  // 172.16.0.0/12 (Private network: 172.16.0.0 – 172.31.255.255)
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  // 192.168.0.0/16 (Private network)
  if (parts[0] === 192 && parts[1] === 168) return true;
  // 169.254.0.0/16 (Link-local / Cloud metadata: e.g. AWS/GCP 169.254.169.254)
  if (parts[0] === 169 && parts[1] === 254) return true;
  // 0.0.0.0/8 (Broadcast/Current network)
  if (parts[0] === 0) return true;
  // 100.64.0.0/10 (Carrier-grade NAT)
  if (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) return true;
  // 224.0.0.0/4 (Multicast)
  if (parts[0] >= 224) return true;

  return false;
}

function isPrivateIPv6(ip) {
  const normalized = ip.toLowerCase();
  if (normalized === '::1' || normalized === '::') return true;
  if (normalized.startsWith('fe80:')) return true; // Link-local
  if (normalized.startsWith('fc00:') || normalized.startsWith('fd00:')) return true; // Unique local
  return false;
}

/**
 * Validates a target URL for safe auditing.
 * Protects against SSRF, internal port scanning, and cloud metadata access.
 * Allows local demo site paths for local sandboxed testing.
 */
async function validateAuditUrl(inputUrl, localPort = 3001) {
  let parsed;
  try {
    parsed = new URL(inputUrl);
  } catch (err) {
    return { valid: false, error: 'Invalid URL format. Please include protocol (e.g. https://example.com)' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { valid: false, error: `Protocol "${parsed.protocol}" not supported. Only http: and https: are allowed.` };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Allow explicit testing of our internal local demo site
  const isLocalDemo = (hostname === 'localhost' || hostname === '127.0.0.1') && 
                      (parsed.pathname.startsWith('/api/demo-site') || parsed.pathname.startsWith('/api/demo-site-fixed'));
  
  if (isLocalDemo) {
    return { valid: true, url: parsed.toString(), isDemo: true };
  }

  // Block localhost and standard loopback hostnames for external audits
  if (hostname === 'localhost' || hostname === 'localhost.localdomain' || hostname.endsWith('.localhost')) {
    return { valid: false, error: 'Auditing local loopback addresses is prohibited for safety reasons (SSRF Protection).' };
  }

  // Check if hostname is raw IP
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(hostname)) {
    if (isPrivateIPv4(hostname)) {
      return { valid: false, error: `Access to private/internal IP address (${hostname}) is blocked.` };
    }
  }

  // Resolve DNS to check if it points to private IPs
  try {
    const lookup = await dns.lookup(hostname, { all: true });
    for (const record of lookup) {
      if (record.family === 4 && isPrivateIPv4(record.address)) {
        return { valid: false, error: `Domain ${hostname} resolves to private IP ${record.address}, which is blocked.` };
      }
      if (record.family === 6 && isPrivateIPv6(record.address)) {
        return { valid: false, error: `Domain ${hostname} resolves to internal IPv6 ${record.address}, which is blocked.` };
      }
    }
  } catch (dnsErr) {
    // If DNS fails completely for non-demo site
    return { valid: false, error: `Could not resolve domain ${hostname}: ${dnsErr.message}` };
  }

  return { valid: true, url: parsed.toString(), isDemo: false };
}

module.exports = {
  validateAuditUrl,
  isPrivateIPv4,
  isPrivateIPv6
};
