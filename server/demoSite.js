const express = require('express');
const router = express.Router();

// -------------------------------------------------------------
// DEMO SITE V1 (Intentionally Seeded Issues)
// -------------------------------------------------------------

// Robots.txt for Demo V1
router.get('/demo-site/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *
Disallow: /api/demo-site/admin
Disallow: /api/demo-site/private
Sitemap: http://localhost:3001/api/demo-site/sitemap.xml
`);
});

// Sitemap.xml for Demo V1 (includes a dead link to demonstrate sitemap conflict check!)
router.get('/demo-site/sitemap.xml', (req, res) => {
  res.type('application/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>http://localhost:3001/api/demo-site</loc>
    <lastmod>2026-09-01</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>http://localhost:3001/api/demo-site/features</loc>
    <lastmod>2026-09-01</lastmod>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>http://localhost:3001/api/demo-site/missing-pricing</loc>
    <lastmod>2026-09-01</lastmod>
    <priority>0.5</priority>
  </url>
</urlset>
`);
});

// Redirect Chain endpoints
router.get('/demo-site/old-features', (req, res) => {
  res.redirect(301, '/api/demo-site/features-v2');
});

router.get('/demo-site/features-v2', (req, res) => {
  res.redirect(302, '/api/demo-site/features');
});

router.get('/demo-site/features', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <title>Features — Acme SaaS</title>
  <meta name="description" content="Explore all features of our cloud platform.">
</head>
<body style="font-family: sans-serif; padding: 40px;">
  <h1>Platform Features</h1>
  <p>Real-time analytics, automated backups, and 99.99% uptime guarantee.</p>
  <a href="/api/demo-site">Back to Home</a>
</body>
</html>`);
});

// Missing 404 page
router.get('/demo-site/missing-pricing', (req, res) => {
  res.status(404).send(`<!DOCTYPE html>
<html>
<head><title>404 Not Found</title></head>
<body style="font-family: sans-serif; padding: 40px; text-align: center;">
  <h1>404 — Page Not Found</h1>
  <p>The requested pricing sheet could not be located on this server.</p>
  <a href="/api/demo-site">Return Home</a>
</body>
</html>`);
});

// Main Demo Site V1 Home
router.get('/demo-site', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Acme SaaS</title>
  <!-- Flaw 1: Missing meta description -->
  <!-- Flaw 2: Inconsistent Canonical pointing to staging environment -->
  <link rel="canonical" href="http://staging.acmeservices.fake/home" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 0; background: #f8fafc; color: #1e293b; }
    header { background: #0f172a; color: white; padding: 16px 32px; display: flex; justify-content: space-between; align-items: center; }
    nav a { color: #94a3b8; text-decoration: none; margin-left: 20px; font-weight: 500; }
    nav a:hover { color: white; }
    .hero { padding: 60px 32px; max-width: 1000px; margin: 0 auto; text-align: center; }
    /* Flaw 3: Elements with fixed width exceeding mobile screen (Horizontal Overflow) */
    .overflow-container {
      width: 980px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 24px;
      margin: 40px auto;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
    }
    .pricing-table { width: 100%; border-collapse: collapse; text-align: left; }
    .pricing-table th, .pricing-table td { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; }
    .btn { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 16px; }
    .form-section { background: white; max-width: 600px; margin: 40px auto; padding: 32px; border-radius: 8px; border: 1px solid #e2e8f0; }
    .form-group { margin-bottom: 16px; }
    .form-group input { width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; box-sizing: border-box; }
    footer { background: #0f172a; color: #64748b; padding: 32px; text-align: center; margin-top: 60px; font-size: 14px; }
  </style>
</head>
<body>
  <header>
    <div style="font-weight: 800; font-size: 20px; letter-spacing: -0.5px;">⚡ ACME CLOUD</div>
    <nav>
      <a href="/api/demo-site">Home</a>
      <!-- Flaw 4: Redirect chain trigger -->
      <a href="/api/demo-site/old-features">Features</a>
      <!-- Flaw 5: Broken link to 404 -->
      <a href="/api/demo-site/missing-pricing" style="color: #f87171;">Pricing (Broken)</a>
    </nav>
  </header>

  <main class="hero">
    <!-- Flaw 6: Missing <h1>, starts straight with <h2> and skips hierarchy -->
    <h2 style="font-size: 36px; color: #0f172a; margin-bottom: 12px;">Next-Gen Cloud Storage Infrastructure</h2>
    <h4 style="color: #64748b; font-weight: 400; font-size: 18px; margin-top: 0;">High performance storage clusters for fast-growing data companies.</h4>
    
    <!-- Flaw 7: Missing image alt attribute on marketing graphic -->
    <img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='260' viewBox='0 0 600 260'><rect width='600' height='260' fill='%232563eb'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='24' fill='white'>Acme Cloud Architecture Diagram</text></svg>" 
         style="max-width: 100%; height: auto; border-radius: 8px; margin: 24px 0;" />

    <p><a href="/api/demo-site/missing-pricing" class="btn">View Enterprise Pricing →</a></p>

    <!-- Flaw 3: Visible horizontal layout overflow container -->
    <div class="overflow-container">
      <h3 style="margin-top:0;">Global Availability Matrix (Forced 980px Width)</h3>
      <p style="color: #64748b; font-size: 14px;">This unconstrained table forces horizontal scrolling on mobile viewports under 980px width.</p>
      <table class="pricing-table">
        <thead>
          <tr style="background: #f8fafc;">
            <th>Region</th><th>Latency</th><th>Throughput</th><th>Redundancy</th><th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>US-East (N. Virginia)</td><td>12ms</td><td>100 Gbps</td><td>Triple AZ</td><td>🟢 Operational</td></tr>
          <tr><td>EU-West (Frankfurt)</td><td>18ms</td><td>80 Gbps</td><td>Triple AZ</td><td>🟢 Operational</td></tr>
          <tr><td>AP-South (Tokyo)</td><td>25ms</td><td>50 Gbps</td><td>Dual AZ</td><td>🟢 Operational</td></tr>
        </tbody>
      </table>
    </div>

    <!-- Flaw 8: Form accessibility failure - inputs lack <label> or aria-label -->
    <div class="form-section">
      <h3 style="margin-top: 0;">Request Early Access</h3>
      <form onsubmit="return false;">
        <div class="form-group">
          <!-- Unlabelled input -->
          <input type="text" id="user-full-name" placeholder="Full Name" />
        </div>
        <div class="form-group">
          <!-- Unlabelled input -->
          <input type="email" id="contact-email" placeholder="Work Email" />
        </div>
        <button type="button" class="btn" style="width: 100%; border: none; cursor: pointer;">Submit Request</button>
      </form>
    </div>
  </main>

  <footer>
    <p>© 2026 Acme Cloud Systems, Inc. All rights reserved.</p>
  </footer>

  <!-- Flaw 9: Console Error -->
  <script>
    console.error("Uncaught ReferenceError: legacyAnalyticsTracker is not defined at https://localhost:3001/api/demo-site:142");
  </script>
</body>
</html>`);
});

// -------------------------------------------------------------
// DEMO SITE V2 (Fully Fixed & Optimized Version)
// -------------------------------------------------------------

router.get('/demo-site-fixed/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *
Disallow: /api/demo-site-fixed/admin
Sitemap: http://localhost:3001/api/demo-site-fixed/sitemap.xml
`);
});

router.get('/demo-site-fixed/sitemap.xml', (req, res) => {
  res.type('application/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>http://localhost:3001/api/demo-site-fixed</loc>
    <lastmod>2026-09-22</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>http://localhost:3001/api/demo-site-fixed/features</loc>
    <lastmod>2026-09-22</lastmod>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>http://localhost:3001/api/demo-site-fixed/pricing</loc>
    <lastmod>2026-09-22</lastmod>
    <priority>0.9</priority>
  </url>
</urlset>
`);
});

router.get('/demo-site-fixed/pricing', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <title>Pricing Plans — Acme Cloud</title>
  <meta name="description" content="Transparent, predictable cloud pricing starting at $49/mo.">
  <link rel="canonical" href="http://localhost:3001/api/demo-site-fixed/pricing" />
</head>
<body style="font-family: sans-serif; padding: 40px;">
  <h1>Enterprise & Starter Pricing</h1>
  <p>All plans include multi-region failover and dedicated engineer support.</p>
  <a href="/api/demo-site-fixed">← Back to Overview</a>
</body>
</html>`);
});

router.get('/demo-site-fixed/features', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <title>Features — Acme Cloud Services</title>
  <meta name="description" content="Discover automated clustering, continuous replication, and 99.99% uptime.">
  <link rel="canonical" href="http://localhost:3001/api/demo-site-fixed/features" />
</head>
<body style="font-family: sans-serif; padding: 40px;">
  <h1>Cloud Platform Capabilities</h1>
  <p>Zero downtime deployments and real-time observability.</p>
  <a href="/api/demo-site-fixed">← Back to Overview</a>
</body>
</html>`);
});

// Main Demo Site V2 Fixed
router.get('/demo-site-fixed', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Acme Cloud — High-Performance Cloud Infrastructure & Storage</title>
  <meta name="description" content="Scalable, secure cloud servers and object storage for modern engineering teams. 99.99% uptime SLA with instant failover.">
  <link rel="canonical" href="http://localhost:3001/api/demo-site-fixed" />
  
  <!-- Open Graph & Social Cards -->
  <meta property="og:title" content="Acme Cloud Infrastructure" />
  <meta property="og:description" content="Scalable cloud servers with sub-millisecond data replication." />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="http://localhost:3001/api/demo-site-fixed" />

  <!-- Structured Data JSON-LD -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Acme Cloud",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "All",
    "offers": {
      "@type": "Offer",
      "price": "49.00",
      "priceCurrency": "USD"
    }
  }
  </script>

  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 0; background: #f8fafc; color: #1e293b; }
    header { background: #0f172a; color: white; padding: 16px 32px; display: flex; justify-content: space-between; align-items: center; }
    nav a { color: #94a3b8; text-decoration: none; margin-left: 20px; font-weight: 500; }
    nav a:hover { color: white; }
    .hero { padding: 60px 24px; max-width: 900px; margin: 0 auto; text-align: center; }
    
    /* Fixed: Fully responsive layout with overflow prevention */
    .responsive-container {
      width: 100%;
      max-width: 860px;
      overflow-x: auto;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 24px;
      margin: 40px auto;
      box-sizing: border-box;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
    }
    .pricing-table { width: 100%; border-collapse: collapse; text-align: left; min-width: 500px; }
    .pricing-table th, .pricing-table td { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; }
    .btn { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 16px; }
    .form-section { background: white; max-width: 500px; margin: 40px auto; padding: 32px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: left; }
    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; font-size: 14px; font-weight: 600; margin-bottom: 6px; color: #334155; }
    .form-group input { width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; box-sizing: border-box; }
    footer { background: #0f172a; color: #64748b; padding: 32px; text-align: center; margin-top: 60px; font-size: 14px; }
  </style>
</head>
<body>
  <header>
    <div style="font-weight: 800; font-size: 20px; letter-spacing: -0.5px;">⚡ ACME CLOUD</div>
    <nav>
      <a href="/api/demo-site-fixed">Home</a>
      <a href="/api/demo-site-fixed/features">Features</a>
      <a href="/api/demo-site-fixed/pricing">Pricing</a>
    </nav>
  </header>

  <main class="hero">
    <!-- Fixed: Proper H1 heading -->
    <h1 style="font-size: 40px; color: #0f172a; margin-bottom: 16px; letter-spacing: -0.5px;">Enterprise Cloud Infrastructure Built for Scale</h1>
    <p style="color: #64748b; font-size: 20px; line-height: 1.5; margin-top: 0;">Deploy resilient, ultra-fast storage clusters across 24 global edge locations in minutes.</p>
    
    <!-- Fixed: Descriptive Alt Text and Responsive Image -->
    <img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='260' viewBox='0 0 600 260'><rect width='600' height='260' fill='%232563eb'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='24' fill='white'>Acme Cloud Architecture Diagram</text></svg>" 
         alt="Acme Cloud Server Infrastructure Architecture and Regional Redundancy Graph"
         style="max-width: 100%; height: auto; border-radius: 8px; margin: 24px 0;" />

    <p><a href="/api/demo-site-fixed/pricing" class="btn">View Enterprise Pricing & Plans →</a></p>

    <!-- Fixed: Responsive table inside scrolling container -->
    <div class="responsive-container">
      <h3 style="margin-top:0;">Global Availability Matrix</h3>
      <table class="pricing-table">
        <thead>
          <tr style="background: #f8fafc;">
            <th>Region</th><th>Latency</th><th>Throughput</th><th>Redundancy</th><th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>US-East (N. Virginia)</td><td>12ms</td><td>100 Gbps</td><td>Triple AZ</td><td>🟢 Operational</td></tr>
          <tr><td>EU-West (Frankfurt)</td><td>18ms</td><td>80 Gbps</td><td>Triple AZ</td><td>🟢 Operational</td></tr>
          <tr><td>AP-South (Tokyo)</td><td>25ms</td><td>50 Gbps</td><td>Dual AZ</td><td>🟢 Operational</td></tr>
        </tbody>
      </table>
    </div>

    <!-- Fixed: Accessible Form with properly associated labels -->
    <div class="form-section">
      <h3 style="margin-top: 0;">Request Early Access</h3>
      <form onsubmit="return false;">
        <div class="form-group">
          <label for="fixed-user-full-name">Full Name</label>
          <input type="text" id="fixed-user-full-name" placeholder="Alex Morgan" />
        </div>
        <div class="form-group">
          <label for="fixed-contact-email">Work Email Address</label>
          <input type="email" id="fixed-contact-email" placeholder="alex@company.com" />
        </div>
        <button type="button" class="btn" style="width: 100%; border: none; cursor: pointer;">Submit Request</button>
      </form>
    </div>
  </main>

  <footer>
    <p>© 2026 Acme Cloud Systems, Inc. All rights reserved.</p>
  </footer>
</body>
</html>`);
});

module.exports = router;
