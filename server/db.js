const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'data', 'sitescope.db');
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS audits (
    id TEXT PRIMARY KEY,
    url TEXT NOT NULL,
    domain TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    audit_type TEXT NOT NULL DEFAULT 'single',
    max_pages INTEGER DEFAULT 5,
    pages_scanned INTEGER DEFAULT 0,
    quality_score INTEGER DEFAULT 0,
    seo_score INTEGER DEFAULT 0,
    performance_score INTEGER DEFAULT 0,
    executive_summary TEXT,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME
  );

  CREATE TABLE IF NOT EXISTS pages (
    id TEXT PRIMARY KEY,
    audit_id TEXT NOT NULL,
    url TEXT NOT NULL,
    status_code INTEGER,
    title TEXT,
    meta_description TEXT,
    canonical TEXT,
    h1 TEXT,
    load_time_ms INTEGER,
    desktop_screenshot TEXT,
    mobile_screenshot TEXT,
    html_size INTEGER,
    redirect_chain_json TEXT,
    FOREIGN KEY(audit_id) REFERENCES audits(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS findings (
    id TEXT PRIMARY KEY,
    audit_id TEXT NOT NULL,
    page_url TEXT,
    category TEXT NOT NULL, -- 'quality', 'seo', 'speed'
    severity TEXT NOT NULL, -- 'critical', 'high', 'medium', 'low'
    title TEXT NOT NULL,
    description TEXT,
    why_it_matters TEXT,
    evidence TEXT,
    suggested_fix TEXT,
    effort TEXT, -- 'Quick Fix (<15m)', 'Moderate (1-2h)', 'Complex (4h+)'
    verification_steps TEXT,
    dedupe_key TEXT,
    FOREIGN KEY(audit_id) REFERENCES audits(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS performance_reports (
    id TEXT PRIMARY KEY,
    audit_id TEXT NOT NULL,
    device TEXT NOT NULL, -- 'mobile', 'desktop'
    score INTEGER DEFAULT 0,
    fcp TEXT,
    lcp TEXT,
    cls TEXT,
    speed_index TEXT,
    tbt TEXT,
    inp TEXT,
    is_field_data INTEGER DEFAULT 0,
    field_origin TEXT,
    diagnostics_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(audit_id) REFERENCES audits(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_audits_domain ON audits(domain);
  CREATE INDEX IF NOT EXISTS idx_findings_audit ON findings(audit_id);
  CREATE INDEX IF NOT EXISTS idx_pages_audit ON pages(audit_id);
`);

// Pre-seed sample "Before" and "After" audits for immediate demonstration if empty
const countStmt = db.prepare('SELECT count(*) as count FROM audits').get();
if (countStmt.count === 0) {
  seedInitialAudits();
}

function seedInitialAudits() {
  const insertAudit = db.prepare(`
    INSERT INTO audits (id, url, domain, status, audit_type, max_pages, pages_scanned, quality_score, seo_score, performance_score, executive_summary, created_at, completed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertPage = db.prepare(`
    INSERT INTO pages (id, audit_id, url, status_code, title, meta_description, canonical, h1, load_time_ms, desktop_screenshot, mobile_screenshot, html_size)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertFinding = db.prepare(`
    INSERT INTO findings (id, audit_id, page_url, category, severity, title, description, why_it_matters, evidence, suggested_fix, effort, verification_steps, dedupe_key)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertPerf = db.prepare(`
    INSERT INTO performance_reports (id, audit_id, device, score, fcp, lcp, cls, speed_index, tbt, inp, is_field_data, field_origin, diagnostics_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date();
  const pastDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); // 3 days ago

  // 1. Audit V1: Before Fixes
  const auditIdV1 = 'audit-demo-before-001';
  insertAudit.run(
    auditIdV1,
    'http://localhost:3001/api/demo-site',
    'localhost:3001',
    'completed',
    'crawl',
    3,
    3,
    52, // Quality score
    58, // SEO score
    46, // Speed score
    `Executive Audit Summary for Acme Cloud Services (Initial Run):
The initial audit discovered 6 high-priority issues that directly impact search engine indexing, mobile conversions, and customer trust. Crucially, the mobile viewport suffers from visible horizontal layout overflow caused by an unconstrained 980px table, preventing mobile shoppers from viewing pricing details. Furthermore, a 404 broken link on the primary navigation button disrupts user flow, and the primary H1 tag is missing. Page speed is hindered by 1.4MB of uncompressed PNG banners and render-blocking scripts. Recommended priority: resolve mobile overflow and 404 links first.`,
    pastDate.toISOString(),
    pastDate.toISOString()
  );

  insertPage.run(
    'p1-v1',
    auditIdV1,
    'http://localhost:3001/api/demo-site',
    200,
    'Acme SaaS',
    '', // missing meta description
    'http://staging.acmeservices.fake/home', // inconsistent canonical
    null, // missing H1
    1450,
    '/screenshots/demo_desktop_v1.png',
    '/screenshots/demo_mobile_v1.png',
    48200
  );

  insertFinding.run(
    'f1-v1',
    auditIdV1,
    'http://localhost:3001/api/demo-site',
    'quality',
    'critical',
    'Visible Horizontal Overflow on Mobile Viewport',
    'Elements exceed the 390px mobile viewport width (scrollWidth: 980px), forcing an awkward horizontal scrollbar on smartphones.',
    'Mobile users cannot read content without pinching and scrolling sideways. Google penalizes pages that fail mobile usability criteria, causing significant drop-offs in organic search ranking.',
    'Element <div class="pricing-matrix" style="width: 980px"> overflows by 590px beyond screen boundary.',
    'Add "max-width: 100%; overflow-x: auto;" to the container or convert to a responsive card layout.',
    'Quick Fix (<15m)',
    'Open the page in Chrome DevTools Device Mode (iPhone 14, 390px width) and verify no horizontal scrollbar appears.',
    'overflow-pricing-matrix'
  );

  insertFinding.run(
    'f2-v1',
    auditIdV1,
    'http://localhost:3001/api/demo-site',
    'quality',
    'critical',
    'Broken Internal Link to Pricing Page (HTTP 404)',
    'The "View Enterprise Pricing" button links to "/api/demo-site/missing-pricing" which returns a 404 Not Found error.',
    'Dead links create a frustrating user experience, waste crawl budget, and stop potential customers from completing high-intent conversions.',
    'Anchor <a href="/api/demo-site/missing-pricing"> returned HTTP 404 Not Found.',
    'Update the href attribute to point to the active pricing endpoint: "/api/demo-site/pricing".',
    'Quick Fix (<15m)',
    'Click the button and confirm it loads the live pricing page with HTTP 200 OK.',
    'broken-link-pricing'
  );

  insertFinding.run(
    'f3-v1',
    auditIdV1,
    'http://localhost:3001/api/demo-site',
    'quality',
    'high',
    'Unlabelled Contact Form Inputs (Accessibility)',
    'Form input fields (<input type="email"> and <input type="text">) lack associated <label> tags, aria-label, or title attributes.',
    'Screen reader users cannot understand what data to enter. This violates WCAG 2.1 Level A compliance and can lead to legal accessibility exposure.',
    'Input id="contact-email" has no matching <label for="contact-email">.',
    'Provide explicit <label for="contact-email">Email Address</label> or add aria-label="Work Email".',
    'Quick Fix (<15m)',
    'Test with VoiceOver / screen reader or inspect accessibility tree in DevTools.',
    'missing-form-labels'
  );

  insertFinding.run(
    'f4-v1',
    auditIdV1,
    'http://localhost:3001/api/demo-site',
    'seo',
    'high',
    'Missing Main H1 Heading and Broken Heading Hierarchy',
    'The page starts directly with an <h2> and jumps to <h4>, with no top-level <h1> found on the entire page.',
    'Search crawlers use the H1 tag as the primary structural topic signal. Skipping heading levels confuses both screen reader users and search indexers.',
    'Headings detected: <h2>Features</h2>, <h4>Cloud Storage</h4>. Missing <h1>.',
    'Add an <h1> heading summarizing the main page proposition (e.g. <h1>Enterprise Cloud Infrastructure & Storage</h1>).',
    'Quick Fix (<15m)',
    'Inspect DOM and verify document has exactly one logical <h1> tag before any <h2> tags.',
    'missing-h1-tag'
  );

  insertFinding.run(
    'f5-v1',
    auditIdV1,
    'http://localhost:3001/api/demo-site',
    'seo',
    'high',
    'Inconsistent Canonical Tag Target',
    'Canonical tag points to an external staging environment ("http://staging.acmeservices.fake/home") instead of the live URL.',
    'Tells search engines to index a staging/dev URL instead of this production page, which can completely de-index the live website from Google.',
    '<link rel="canonical" href="http://staging.acmeservices.fake/home" />',
    'Change the canonical href to the canonical production URL ("http://localhost:3001/api/demo-site").',
    'Quick Fix (<15m)',
    'Verify <link rel="canonical"> matches the exact canonical production URL.',
    'canonical-mismatch'
  );

  insertFinding.run(
    'f6-v1',
    auditIdV1,
    'http://localhost:3001/api/demo-site',
    'seo',
    'medium',
    'Missing Image Alt Text on Content Banners',
    '2 prominent marketing graphics lack alt attributes, preventing them from being understood by visually impaired users or image search crawlers.',
    'Fails basic accessibility standards and misses valuable image search traffic opportunities.',
    '<img src="/assets/hero-banner.png" class="hero-img"> missing alt attribute.',
    'Add descriptive alt text: alt="Acme Cloud Server Infrastructure Dashboard".',
    'Quick Fix (<15m)',
    'Inspect <img> tags and confirm non-decorative images contain descriptive alt text.',
    'missing-image-alt'
  );

  insertFinding.run(
    'f7-v1',
    auditIdV1,
    'http://localhost:3001/api/demo-site',
    'speed',
    'high',
    'Poor Largest Contentful Paint (LCP: 4.6s) on Mobile',
    'The hero image is 1.4MB unoptimized PNG loaded without modern formatting (WebP/AVIF) and blocks main thread rendering.',
    'Slow initial load causes high mobile bounce rates (over 53% of mobile visits are abandoned if pages take >3s to load).',
    'LCP element: img.hero-img (1420 KB), TTFB: 420ms, Render Delay: 3100ms.',
    'Convert hero image to modern WebP format, implement responsive srcset, and preload the critical LCP image.',
    'Moderate (1-2h)',
    'Rerun PageSpeed Insights lab test and ensure LCP drops below 2.5s.',
    'slow-lcp-mobile'
  );

  // Perf reports V1
  insertPerf.run(
    'perf-v1-mob',
    auditIdV1,
    'mobile',
    46,
    '3.2s', // FCP
    '4.6s', // LCP
    '0.28', // CLS
    '5.4s', // Speed Index
    '680ms', // TBT
    '340ms', // INP
    1,
    'URL-level',
    JSON.stringify([
      { title: 'Serve images in next-gen formats', savings: '1,120 KB', description: 'Image formats like WebP and AVIF often provide better compression than PNG or JPEG.' },
      { title: 'Eliminate render-blocking resources', savings: '640 ms', description: 'Resources are blocking the first paint of your page. Consider delivering critical JS/CSS inline and deferring all non-critical JS/styles.' },
      { title: 'Ensure text remains visible during webfont load', savings: '210 ms', description: 'Leverage the font-display CSS feature to ensure text is user-visible while webfonts are loading.' }
    ])
  );

  insertPerf.run(
    'perf-v1-desk',
    auditIdV1,
    'desktop',
    64,
    '1.4s',
    '2.9s',
    '0.14',
    '2.6s',
    '220ms',
    '180ms',
    1,
    'URL-level',
    JSON.stringify([
      { title: 'Properly size images', savings: '840 KB', description: 'Serve images that are appropriately-sized to save cellular data and improve load time.' },
      { title: 'Reduce unused JavaScript', savings: '380 KB', description: 'Reduce unused JavaScript and defer loading scripts until they are required to decrease bytes consumed by network activity.' }
    ])
  );

  // 2. Audit V2: Post-Optimization (After Fixes)
  const auditIdV2 = 'audit-demo-after-002';
  insertAudit.run(
    auditIdV2,
    'http://localhost:3001/api/demo-site-fixed',
    'localhost:3001',
    'completed',
    'crawl',
    3,
    3,
    98, // Quality score
    96, // SEO score
    94, // Speed score
    `Post-Fix Verification Report for Acme Cloud Services:
A follow-up inspection was conducted after implementing agency remediations. All critical blockers have been successfully resolved:
1. Horizontal mobile overflow eliminated by migrating the pricing matrix to responsive CSS grid.
2. The broken 404 pricing link was corrected to the live endpoint.
3. Form fields now feature accessible <label> pairings compliant with WCAG 2.1 AA.
4. Proper <h1> hierarchy and production canonical links are in place.
5. Hero graphics were compressed and converted to WebP with preloading, dropping LCP from 4.6s to 1.6s and raising Mobile Performance from 46 to 94.`,
    now.toISOString(),
    now.toISOString()
  );

  insertPage.run(
    'p1-v2',
    auditIdV2,
    'http://localhost:3001/api/demo-site-fixed',
    200,
    'Acme Cloud — High-Performance Cloud Infrastructure & Storage',
    'Scalable, secure cloud servers and object storage for modern engineering teams. 99.99% uptime SLA.',
    'http://localhost:3001/api/demo-site-fixed',
    'Enterprise Cloud Infrastructure Built for Scale',
    320,
    '/screenshots/demo_desktop_v2.png',
    '/screenshots/demo_mobile_v2.png',
    28400
  );

  // V2 has only 1 low-priority minor suggestion remaining
  insertFinding.run(
    'f1-v2',
    auditIdV2,
    'http://localhost:3001/api/demo-site-fixed',
    'seo',
    'low',
    'Add Structured Data (JSON-LD Organization Schema)',
    'Page lacks Schema.org Organization structured data markup for enhanced Google Knowledge Graph representation.',
    'Adding Organization schema helps search engines understand your brand name, logo, official social channels, and customer service contact.',
    'No <script type="application/ld+json"> tag detected.',
    'Insert standard Organization JSON-LD script into the <head> of the homepage.',
    'Quick Fix (<15m)',
    'Validate using Google Rich Results Test.',
    'missing-organization-schema'
  );

  // Perf reports V2
  insertPerf.run(
    'perf-v2-mob',
    auditIdV2,
    'mobile',
    94,
    '1.1s', // FCP
    '1.6s', // LCP
    '0.02', // CLS
    '1.8s', // Speed Index
    '80ms', // TBT
    '95ms', // INP
    1,
    'URL-level',
    JSON.stringify([
      { title: 'Serve static assets with an efficient cache policy', savings: '45 KB', description: 'A long cache lifetime can speed up repeat visits to your page.' }
    ])
  );

  insertPerf.run(
    'perf-v2-desk',
    auditIdV2,
    'desktop',
    99,
    '0.5s',
    '0.8s',
    '0.00',
    '0.9s',
    '20ms',
    '45ms',
    1,
    'URL-level',
    JSON.stringify([])
  );

  console.log('Database seeded with sample initial and post-fix audits.');
}

module.exports = {
  db,
  seedInitialAudits
};
