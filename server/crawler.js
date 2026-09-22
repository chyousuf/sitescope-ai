const { URL } = require('url');
const cheerio = require('cheerio');
const http = require('http');
const https = require('https');
const { validateAuditUrl } = require('./safety');

// Helper to make safe HTTP requests following redirects while recording the chain
async function fetchWithRedirects(targetUrl, maxRedirects = 5, userAgent = 'SiteScope-AI-Audit-Bot/1.0') {
  let currentUrl = targetUrl;
  const redirectChain = [];

  for (let i = 0; i <= maxRedirects; i++) {
    const parsed = new URL(currentUrl);
    const client = parsed.protocol === 'https:' ? https : http;

    const res = await new Promise((resolve, reject) => {
      const req = client.get(currentUrl, {
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 10000
      }, (response) => {
        let body = '';
        response.on('data', (chunk) => {
          body += chunk;
          // Guard against excessively large HTML documents (> 5MB)
          if (body.length > 5 * 1024 * 1024) {
            req.destroy();
            resolve({ statusCode: response.statusCode, headers: response.headers, body, redirectedTo: null });
          }
        });
        response.on('end', () => {
          resolve({
            statusCode: response.statusCode,
            headers: response.headers,
            body,
            location: response.headers['location']
          });
        });
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Connection timed out after 10000ms for ${currentUrl}`));
      });

      req.on('error', (err) => {
        reject(err);
      });
    });

    if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.location) {
      const nextUrl = new URL(res.location, currentUrl).toString();
      redirectChain.push({
        from: currentUrl,
        to: nextUrl,
        statusCode: res.statusCode
      });

      // Validate redirect destination against SSRF
      const safetyCheck = await validateAuditUrl(nextUrl);
      if (!safetyCheck.valid) {
        throw new Error(`Unsafe redirect destination blocked: ${safetyCheck.error}`);
      }

      currentUrl = nextUrl;
      continue;
    }

    return {
      finalUrl: currentUrl,
      statusCode: res.statusCode,
      headers: res.headers,
      body: res.body,
      redirectChain
    };
  }

  throw new Error(`Exceeded maximum redirect limit of ${maxRedirects}`);
}

/**
 * Fetch and analyze robots.txt and sitemap.xml
 */
async function inspectRobotsAndSitemaps(targetUrl, onLog) {
  const parsed = new URL(targetUrl);
  const origin = `${parsed.protocol}//${parsed.host}`;
  const basePath = parsed.pathname.startsWith('/api/demo-site') ? '/api/demo-site' : '';
  const robotsUrl = `${origin}${basePath}/robots.txt`;

  const result = {
    robotsUrl,
    hasRobotsTxt: false,
    disallowRules: [],
    sitemapUrls: [],
    sitemapEntries: [],
    sitemapConflicts: []
  };

  if (onLog) onLog(`Checking robots.txt at ${robotsUrl}...`);

  try {
    const robotsRes = await fetchWithRedirects(robotsUrl, 3);
    if (robotsRes.statusCode === 200 && robotsRes.body) {
      result.hasRobotsTxt = true;
      const lines = robotsRes.body.split('\n');
      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (line.toLowerCase().startsWith('disallow:')) {
          result.disallowRules.push(line.substring(9).trim());
        } else if (line.toLowerCase().startsWith('sitemap:')) {
          const sitemapUrl = line.substring(8).trim();
          result.sitemapUrls.push(sitemapUrl);
        }
      }
      if (onLog) onLog(`Found robots.txt with ${result.disallowRules.length} disallow rules and ${result.sitemapUrls.length} sitemaps.`);
    }
  } catch (err) {
    if (onLog) onLog(`No valid robots.txt accessible: ${err.message}`);
  }

  // If no sitemap found in robots.txt, check standard /sitemap.xml
  if (result.sitemapUrls.length === 0) {
    result.sitemapUrls.push(`${origin}${basePath}/sitemap.xml`);
  }

  // Inspect XML sitemaps
  for (const sitemapUrl of result.sitemapUrls.slice(0, 2)) {
    try {
      if (onLog) onLog(`Inspecting XML sitemap at ${sitemapUrl}...`);
      const sitemapRes = await fetchWithRedirects(sitemapUrl, 3);
      if (sitemapRes.statusCode === 200 && sitemapRes.body) {
        const $ = cheerio.load(sitemapRes.body, { xmlMode: true });
        $('url > loc').each((_, el) => {
          const loc = $(el).text().trim();
          if (loc && !result.sitemapEntries.includes(loc)) {
            result.sitemapEntries.push(loc);
          }
        });
        if (onLog) onLog(`Sitemap contains ${result.sitemapEntries.length} URL entries.`);
      }
    } catch (err) {
      if (onLog) onLog(`Sitemap check failed for ${sitemapUrl}: ${err.message}`);
    }
  }

  return result;
}

/**
 * Crawl website pages constrained strictly to authorized domain up to maxPages.
 */
async function crawlDomain(initialUrl, { maxPages = 5, auditType = 'single', onProgress, onLog } = {}) {
  const startUrlObj = new URL(initialUrl);
  const targetHost = startUrlObj.host;
  const isDemo = targetHost.includes('localhost') && initialUrl.includes('/api/demo-site');

  const visitedUrls = new Set();
  const queue = [initialUrl];
  const pages = [];
  const brokenLinks = [];
  const redirectChains = [];

  const maxToVisit = auditType === 'single' ? 1 : Math.min(maxPages, 10);

  if (onLog) onLog(`Starting crawl for domain: ${targetHost} (Mode: ${auditType}, Max: ${maxToVisit} pages)`);

  while (queue.length > 0 && visitedUrls.size < maxToVisit) {
    const currentUrl = queue.shift();
    if (visitedUrls.has(currentUrl)) continue;

    visitedUrls.add(currentUrl);
    if (onProgress) {
      onProgress({
        phase: 'crawl',
        pagesScanned: visitedUrls.size,
        maxPages: maxToVisit,
        currentUrl
      });
    }

    try {
      const startTime = Date.now();
      const res = await fetchWithRedirects(currentUrl);
      const loadTimeMs = Date.now() - startTime;

      if (res.redirectChain.length > 0) {
        redirectChains.push({
          requestedUrl: currentUrl,
          finalUrl: res.finalUrl,
          chain: res.redirectChain
        });
      }

      pages.push({
        url: currentUrl,
        finalUrl: res.finalUrl,
        statusCode: res.statusCode,
        headers: res.headers,
        html: res.body || '',
        loadTimeMs,
        htmlSize: (res.body || '').length,
        redirectChain: res.redirectChain
      });

      // Extract internal links from HTML if we can crawl more pages
      if (auditType !== 'single' && res.statusCode === 200 && res.body) {
        const $ = cheerio.load(res.body);
        $('a[href]').each((_, el) => {
          const href = $(el).attr('href');
          if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) {
            return;
          }

          try {
            const resolved = new URL(href, currentUrl);
            // Constrain strictly to same host
            if (resolved.host === targetHost) {
              // If demo, ensure within demo path
              if (isDemo && !resolved.pathname.startsWith('/api/demo-site')) {
                return;
              }
              const cleanUrl = `${resolved.protocol}//${resolved.host}${resolved.pathname}`;
              if (!visitedUrls.has(cleanUrl) && !queue.includes(cleanUrl)) {
                queue.push(cleanUrl);
              }
            }
          } catch {
            // ignore invalid href
          }
        });
      }
    } catch (fetchErr) {
      if (onLog) onLog(`Failed to fetch ${currentUrl}: ${fetchErr.message}`);
      pages.push({
        url: currentUrl,
        finalUrl: currentUrl,
        statusCode: 0,
        headers: {},
        html: '',
        loadTimeMs: 0,
        htmlSize: 0,
        error: fetchErr.message,
        redirectChain: []
      });
    }
  }

  // Cross-check internal links extracted from scanned pages to identify broken links
  for (const page of pages) {
    if (!page.html) continue;
    const $ = cheerio.load(page.html);
    const linksOnPage = $('a[href]').toArray();

    for (const el of linksOnPage) {
      const href = $(el).attr('href');
      const anchorText = $(el).text().trim() || 'Link';
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) {
        continue;
      }

      try {
        const resolved = new URL(href, page.url);
        if (resolved.host === targetHost) {
          // If already checked in pages
          const existing = pages.find(p => p.url === resolved.toString() || p.finalUrl === resolved.toString());
          if (existing) {
            if (existing.statusCode >= 400 || existing.statusCode === 0) {
              brokenLinks.push({
                sourceUrl: page.url,
                targetUrl: resolved.toString(),
                anchorText,
                statusCode: existing.statusCode
              });
            }
          } else {
            // Probe link with quick HEAD/GET
            try {
              const probe = await fetchWithRedirects(resolved.toString(), 2);
              if (probe.statusCode >= 400) {
                brokenLinks.push({
                  sourceUrl: page.url,
                  targetUrl: resolved.toString(),
                  anchorText,
                  statusCode: probe.statusCode
                });
              }
            } catch (err) {
              brokenLinks.push({
                sourceUrl: page.url,
                targetUrl: resolved.toString(),
                anchorText,
                statusCode: 0,
                error: err.message
              });
            }
          }
        }
      } catch {
        // ignore malformed URLs
      }
    }
  }

  return {
    pages,
    brokenLinks,
    redirectChains
  };
}

module.exports = {
  fetchWithRedirects,
  inspectRobotsAndSitemaps,
  crawlDomain
};
