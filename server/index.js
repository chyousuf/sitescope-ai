const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { db } = require('./db');
const { validateAuditUrl } = require('./safety');
const { crawlDomain, inspectRobotsAndSitemaps } = require('./crawler');
const { inspectBrowserQuality, SCREENSHOTS_DIR } = require('./browserQuality');
const { analyzeSEO } = require('./seoAnalyzer');
const { inspectPageSpeed } = require('./speedAnalyzer');
const { calculateScores, deduplicateFindings, generateExecutiveSummary, generateSuggestedMeta } = require('./aiSynthesizer');
const demoSiteRouter = require('./demoSite');

const app = express();
const PORT = process.env.PORT || 3001;
const isVercel = process.env.VERCEL === '1' || !!process.env.NOW_REGION || !!process.env.AWS_LAMBDA_FUNCTION_NAME;

app.use(cors());
app.use(express.json());

// Serve static screenshots
app.use('/screenshots', express.static(SCREENSHOTS_DIR));
const distScreenshots = path.join(__dirname, '..', 'dist', 'screenshots');
if (fs.existsSync(distScreenshots)) {
  app.use('/screenshots', express.static(distScreenshots));
}

// Router to handle both /api/* and /* paths transparently in serverless
const apiRouter = express.Router();

// Mount built-in demo site
apiRouter.use(demoSiteRouter);

// Health check endpoint
apiRouter.get('/health', (req, res) => {
  res.json({ status: 'ok', serverless: isVercel, timestamp: new Date().toISOString() });
});

// In-memory SSE connections for active audits
const auditEventStreams = new Map();
// Active audit cancellation flags
const activeAudits = new Map();

function sendSseEvent(auditId, type, data) {
  const clients = auditEventStreams.get(auditId);
  if (clients && clients.length > 0) {
    const payload = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
    clients.forEach(res => res.write(payload));
  }
}

// -------------------------------------------------------------
// SSE Endpoint for Live Audit Progress
// -------------------------------------------------------------
apiRouter.get('/audits/:id/stream', (req, res) => {
  const auditId = req.params.id;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  if (!auditEventStreams.has(auditId)) {
    auditEventStreams.set(auditId, []);
  }
  auditEventStreams.get(auditId).push(res);

  // Send initial ping
  res.write(`event: ping\ndata: ${JSON.stringify({ auditId, time: Date.now() })}\n\n`);

  req.on('close', () => {
    const clients = auditEventStreams.get(auditId) || [];
    const index = clients.indexOf(res);
    if (index !== -1) clients.splice(index, 1);
    if (clients.length === 0) auditEventStreams.delete(auditId);
  });
});

// -------------------------------------------------------------
// Start Audit Endpoint
// -------------------------------------------------------------
apiRouter.post('/audits', async (req, res) => {
  const { url, auditType = 'single', maxPages = 5, apiKey = null } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  // SSRF & Domain Validation
  const safetyCheck = await validateAuditUrl(url, PORT);
  if (!safetyCheck.valid) {
    return res.status(400).json({ error: safetyCheck.error });
  }

  const targetUrl = safetyCheck.url;
  const parsed = new URL(targetUrl);
  const domain = parsed.host;
  const auditId = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  // Insert initial audit record
  const insertStmt = db.prepare(`
    INSERT INTO audits (id, url, domain, status, audit_type, max_pages, pages_scanned, created_at)
    VALUES (?, ?, ?, 'running', ?, ?, 0, CURRENT_TIMESTAMP)
  `);
  insertStmt.run(auditId, targetUrl, domain, auditType, maxPages);

  // Track active job
  activeAudits.set(auditId, { cancelled: false });

  // Return immediately so client can open live progress
  res.status(202).json({
    id: auditId,
    url: targetUrl,
    domain,
    status: 'running',
    auditType,
    maxPages
  });

  // Run audit asynchronously in background
  runAuditPipeline(auditId, targetUrl, domain, auditType, maxPages, apiKey).catch(err => {
    console.error(`Audit pipeline error for ${auditId}:`, err);
    db.prepare('UPDATE audits SET status = ?, error_message = ? WHERE id = ?')
      .run('failed', err.message, auditId);
    sendSseEvent(auditId, 'error', { message: err.message });
  }).finally(() => {
    activeAudits.delete(auditId);
  });
});

/**
 * Background execution engine for audit pipeline
 */
async function runAuditPipeline(auditId, targetUrl, domain, auditType, maxPages, apiKey) {
  const job = activeAudits.get(auditId);
  const log = (msg) => {
    console.log(`[Audit ${auditId}] ${msg}`);
    sendSseEvent(auditId, 'log', { message: msg, time: new Date().toLocaleTimeString() });
  };

  const checkCancelled = () => {
    if (job && job.cancelled) {
      throw new Error('Audit cancelled by user');
    }
  };

  try {
    // 1. Stage: Discovery & Robots.txt
    sendSseEvent(auditId, 'stage', { stage: 'discovery', label: 'Inspecting robots.txt and sitemaps...' });
    log(`Phase 1: Validating target host and robots.txt rules...`);
    const robotsInfo = await inspectRobotsAndSitemaps(targetUrl, log);
    checkCancelled();

    // 2. Stage: Crawling & Link Extraction
    sendSseEvent(auditId, 'stage', { stage: 'crawling', label: 'Crawling site pages and internal links...' });
    log(`Phase 2: Crawling domain up to ${maxPages} pages...`);
    const crawlResult = await crawlDomain(targetUrl, {
      maxPages,
      auditType,
      onProgress: (p) => sendSseEvent(auditId, 'progress', p),
      onLog: log
    });
    checkCancelled();

    const scannedPages = crawlResult.pages;
    log(`Crawl completed: ${scannedPages.length} page(s) retrieved. Discovered ${crawlResult.brokenLinks.length} broken link(s).`);

    // 3. Stage: Headless Browser Quality & Screenshots
    sendSseEvent(auditId, 'stage', { stage: 'browser', label: 'Running headless Chrome for mobile & desktop layouts...' });
    log(`Phase 3: Launching Headless Chrome for desktop and mobile viewport checks...`);

    const pageRecords = [];
    const collectedFindings = [];

    // Analyze each crawled page
    for (let i = 0; i < scannedPages.length; i++) {
      checkCancelled();
      const p = scannedPages[i];
      log(`Inspecting page [${i + 1}/${scannedPages.length}]: ${p.url}`);

      // Browser Quality Check (Mobile + Desktop Screenshots, Overflow, Forms)
      const browserRes = await inspectBrowserQuality(p.url, auditId, i, log);

      // Technical SEO Check
      const seoRes = analyzeSEO(p.html, p.url, p.headers);

      // Record SEO issues
      seoRes.issues.forEach(iss => {
        collectedFindings.push({
          page_url: p.url,
          ...iss
        });
      });

      // Record Browser Quality Issues
      if (browserRes.horizontalOverflow && browserRes.horizontalOverflow.hasOverflow) {
        collectedFindings.push({
          page_url: p.url,
          category: 'quality',
          severity: 'critical',
          title: 'Visible Horizontal Overflow on Mobile Viewport',
          description: `Page content exceeds the 390px mobile viewport width (scrollWidth: ${browserRes.horizontalOverflow.scrollWidth}px), forcing an awkward horizontal scrollbar on smartphones.`,
          why_it_matters: 'Mobile users cannot view the full layout without zooming and panning sideways. Fails Google Mobile-Friendly standards and increases bounce rates.',
          evidence: `scrollWidth (${browserRes.horizontalOverflow.scrollWidth}px) exceeds window width (${browserRes.horizontalOverflow.windowWidth}px). Offending elements: ${browserRes.horizontalOverflow.elements.map(e => `<${e.tag} class="${e.className}" width="${e.width}px">`).join(', ')}`,
          suggested_fix: 'Set "max-width: 100%; box-sizing: border-box;" on wide containers or enable responsive overflow scrolling ("overflow-x: auto").',
          effort: 'Quick Fix (<15m)',
          verification_steps: 'Open mobile viewport (390px width) in Chrome DevTools and verify document.documentElement.scrollWidth equals clientWidth.',
          dedupe_key: 'horizontal-mobile-overflow'
        });
      }

      if (browserRes.formAccessibility.issues.length > 0) {
        const count = browserRes.formAccessibility.issues.length;
        collectedFindings.push({
          page_url: p.url,
          category: 'quality',
          severity: 'high',
          title: `Unlabelled Form Input(s) Found (${count})`,
          description: `${count} form input(s) lack an explicit <label>, aria-label, or title attribute.`,
          why_it_matters: 'Screen readers cannot announce what data is expected in the input fields, failing WCAG 2.1 Level A accessibility standards.',
          evidence: browserRes.formAccessibility.issues.slice(0, 3).map(f => f.htmlSnippet).join(' | '),
          suggested_fix: 'Associate each <input> with a <label for="id"> matching the input id, or add aria-label="Descriptive Name".',
          effort: 'Quick Fix (<15m)',
          verification_steps: 'Inspect input elements in accessibility tree and confirm an accessible name is computed.',
          dedupe_key: 'missing-form-labels'
        });
      }

      if (browserRes.consoleErrors.length > 0) {
        collectedFindings.push({
          page_url: p.url,
          category: 'quality',
          severity: 'medium',
          title: `Browser JavaScript Console Error(s) (${browserRes.consoleErrors.length})`,
          description: `The page threw ${browserRes.consoleErrors.length} JavaScript exception(s) during page load.`,
          why_it_matters: 'Unhandled script exceptions can break interactive UI widgets, prevent analytics tracking, or cause broken purchase flows.',
          evidence: browserRes.consoleErrors.slice(0, 2).map(e => `${e.text} (${e.location})`).join('\n'),
          suggested_fix: 'Debug the reported exception in browser console and add null-checks or fix script dependencies.',
          effort: 'Moderate (1-2h)',
          verification_steps: 'Open page in Chrome DevTools Console and verify no uncaught red errors appear upon load.',
          dedupe_key: 'console-js-errors'
        });
      }

      // Save page details
      const pageId = `page-${auditId}-${i}`;
      pageRecords.push({
        id: pageId,
        audit_id: auditId,
        url: p.url,
        status_code: p.statusCode,
        title: seoRes.title.text || null,
        meta_description: seoRes.metaDescription.text || null,
        canonical: seoRes.canonical.url || null,
        h1: seoRes.headings.primaryH1 || null,
        load_time_ms: p.loadTimeMs || 0,
        desktop_screenshot: browserRes.desktopScreenshot,
        mobile_screenshot: browserRes.mobileScreenshot,
        html_size: p.htmlSize || 0
      });
    }

    // Add broken links findings
    if (crawlResult.brokenLinks.length > 0) {
      crawlResult.brokenLinks.forEach(bl => {
        collectedFindings.push({
          page_url: bl.sourceUrl,
          category: 'quality',
          severity: 'critical',
          title: `Broken Link: ${bl.targetUrl} (Status ${bl.statusCode || 'Failed'})`,
          description: `Internal link with anchor "${bl.anchorText}" points to ${bl.targetUrl} which returns HTTP status ${bl.statusCode}.`,
          why_it_matters: 'Broken links frustrate visitors, degrade search crawl budget, and directly hurt search engine rankings.',
          evidence: `Source page: ${bl.sourceUrl} -> <a href="${bl.targetUrl}">${bl.anchorText}</a>`,
          suggested_fix: `Update or remove the href link to point to a valid live page.`,
          effort: 'Quick Fix (<15m)',
          verification_steps: 'Click the link and ensure it returns HTTP 200 OK.',
          dedupe_key: `broken-link-${bl.targetUrl}`
        });
      });
    }

    // Add redirect chains findings
    if (crawlResult.redirectChains.length > 0) {
      crawlResult.redirectChains.forEach(rc => {
        collectedFindings.push({
          page_url: rc.requestedUrl,
          category: 'seo',
          severity: 'medium',
          title: `Redirect Chain Detected (${rc.chain.length} hops)`,
          description: `URL redirects multiple times before reaching destination: ${rc.requestedUrl} -> ${rc.finalUrl}`,
          why_it_matters: 'Redirect hops add latency, drain crawl budget, and can dilute link equity.',
          evidence: rc.chain.map(c => `${c.from} (${c.statusCode}) -> ${c.to}`).join(' -> '),
          suggested_fix: `Update internal links to point directly to final destination: ${rc.finalUrl}.`,
          effort: 'Quick Fix (<15m)',
          verification_steps: 'Verify internal link leads directly to destination without 301/302 intermediaries.',
          dedupe_key: `redirect-chain-${rc.requestedUrl}`
        });
      });
    }

    // 4. Stage: Performance & PageSpeed Insights
    sendSseEvent(auditId, 'stage', { stage: 'speed', label: 'Analyzing Core Web Vitals (Mobile & Desktop)...' });
    log(`Phase 4: Running PageSpeed Insights & Performance analysis...`);

    const primaryPage = scannedPages[0] || {};
    const perfResults = await inspectPageSpeed(targetUrl, {
      apiKey,
      loadTimeMs: primaryPage.loadTimeMs || 500,
      htmlSize: primaryPage.htmlSize || 25000,
      hasOverflow: collectedFindings.some(f => f.category === 'quality' && f.dedupe_key === 'horizontal-mobile-overflow'),
      onLog: log
    });
    checkCancelled();

    // Add speed findings if LCP is slow
    if (perfResults.mobile.metrics.lcp.value > 2500) {
      collectedFindings.push({
        page_url: targetUrl,
        category: 'speed',
        severity: perfResults.mobile.metrics.lcp.value > 4000 ? 'critical' : 'high',
        title: `Slow Largest Contentful Paint (LCP: ${perfResults.mobile.metrics.lcp.display}) on Mobile`,
        description: `Mobile LCP is ${perfResults.mobile.metrics.lcp.display}, which exceeds Google's recommended 2.5s threshold.`,
        why_it_matters: 'LCP measures perceived load speed. Google uses LCP as an official Core Web Vitals ranking factor; slow LCP directly damages organic search ranking and mobile conversion rates.',
        evidence: `Lab LCP: ${perfResults.mobile.metrics.lcp.display}. Top diagnostics: ${perfResults.mobile.diagnostics.map(d => `${d.title} (Savings: ${d.savings || 'N/A'})`).join('; ')}`,
        suggested_fix: 'Optimize and compress hero images into WebP/AVIF, inline critical CSS, and defer non-critical scripts.',
        effort: 'Moderate (1-2h)',
        verification_steps: 'Rerun PageSpeed mobile test and confirm LCP is under 2.5 seconds.',
        dedupe_key: 'slow-lcp-mobile'
      });
    }

    // 5. Stage: AI Prioritization, Deduplication & Score Synthesis
    sendSseEvent(auditId, 'stage', { stage: 'ai', label: 'Synthesizing AI action plan and prioritized fixes...' });
    log(`Phase 5: Deduplicating findings and computing weighted scorecard...`);

    const deduplicated = deduplicateFindings(collectedFindings);
    const scores = calculateScores(deduplicated, perfResults.mobile.score);
    const executiveSummary = generateExecutiveSummary(targetUrl, domain, scores, deduplicated, scannedPages.length);

    // Save pages to SQLite
    const insertPageStmt = db.prepare(`
      INSERT INTO pages (id, audit_id, url, status_code, title, meta_description, canonical, h1, load_time_ms, desktop_screenshot, mobile_screenshot, html_size)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    pageRecords.forEach(pr => {
      insertPageStmt.run(
        pr.id, pr.audit_id, pr.url, pr.status_code, pr.title,
        pr.meta_description, pr.canonical, pr.h1, pr.load_time_ms,
        pr.desktop_screenshot, pr.mobile_screenshot, pr.html_size
      );
    });

    // Save findings to SQLite
    const insertFindingStmt = db.prepare(`
      INSERT INTO findings (id, audit_id, page_url, category, severity, title, description, why_it_matters, evidence, suggested_fix, effort, verification_steps, dedupe_key)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    deduplicated.forEach((f, idx) => {
      insertFindingStmt.run(
        `find-${auditId}-${idx}`,
        auditId,
        f.page_url || targetUrl,
        f.category,
        f.severity,
        f.title,
        f.description,
        f.why_it_matters,
        f.evidence,
        f.suggested_fix,
        f.effort || 'Quick Fix (<15m)',
        f.verification_steps,
        f.dedupe_key
      );
    });

    // Save performance reports
    const insertPerfStmt = db.prepare(`
      INSERT INTO performance_reports (id, audit_id, device, score, fcp, lcp, cls, speed_index, tbt, inp, is_field_data, field_origin, diagnostics_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertPerfStmt.run(
      `perf-${auditId}-mob`,
      auditId,
      'mobile',
      perfResults.mobile.score,
      perfResults.mobile.metrics.fcp.display,
      perfResults.mobile.metrics.lcp.display,
      perfResults.mobile.metrics.cls.display,
      perfResults.mobile.metrics.speedIndex.display,
      perfResults.mobile.metrics.tbt.display,
      perfResults.mobile.fieldData.inp?.value || 'N/A',
      perfResults.mobile.fieldData.isAvailable ? 1 : 0,
      perfResults.mobile.fieldData.originType || 'None',
      JSON.stringify(perfResults.mobile.diagnostics || [])
    );

    insertPerfStmt.run(
      `perf-${auditId}-desk`,
      auditId,
      'desktop',
      perfResults.desktop.score,
      perfResults.desktop.metrics.fcp.display,
      perfResults.desktop.metrics.lcp.display,
      perfResults.desktop.metrics.cls.display,
      perfResults.desktop.metrics.speedIndex.display,
      perfResults.desktop.metrics.tbt.display,
      perfResults.desktop.fieldData.inp?.value || 'N/A',
      perfResults.desktop.fieldData.isAvailable ? 1 : 0,
      perfResults.desktop.fieldData.originType || 'None',
      JSON.stringify(perfResults.desktop.diagnostics || [])
    );

    // Update main audit record
    db.prepare(`
      UPDATE audits SET
        status = 'completed',
        pages_scanned = ?,
        quality_score = ?,
        seo_score = ?,
        performance_score = ?,
        executive_summary = ?,
        completed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      scannedPages.length,
      scores.qualityScore,
      scores.seoScore,
      scores.performanceScore,
      executiveSummary,
      auditId
    );

    log(`Audit completed successfully! Quality: ${scores.qualityScore}, SEO: ${scores.seoScore}, Performance: ${scores.performanceScore}`);
    sendSseEvent(auditId, 'complete', {
      auditId,
      scores,
      findingsCount: deduplicated.length,
      pagesScanned: scannedPages.length
    });
  } catch (err) {
    log(`Audit execution error: ${err.message}`);
    throw err;
  }
}

// -------------------------------------------------------------
// REST API Endpoints
// -------------------------------------------------------------

// List Audits
apiRouter.get('/audits', (req, res) => {
  const audits = db.prepare(`
    SELECT a.*, 
      (SELECT COUNT(*) FROM findings WHERE audit_id = a.id) as findings_count,
      (SELECT COUNT(*) FROM findings WHERE audit_id = a.id AND severity = 'critical') as critical_count
    FROM audits a 
    ORDER BY created_at DESC
  `).all();
  res.json(audits);
});

// Get Audit Details
apiRouter.get('/audits/:id', (req, res) => {
  const audit = db.prepare('SELECT * FROM audits WHERE id = ?').get(req.params.id);
  if (!audit) {
    return res.status(404).json({ error: 'Audit not found' });
  }

  const pages = db.prepare('SELECT * FROM pages WHERE audit_id = ?').all(audit.id);
  const findings = db.prepare(`
    SELECT * FROM findings 
    WHERE audit_id = ? 
    ORDER BY CASE severity 
      WHEN 'critical' THEN 1 
      WHEN 'high' THEN 2 
      WHEN 'medium' THEN 3 
      ELSE 4 
    END
  `).all(audit.id);
  const performanceReports = db.prepare('SELECT * FROM performance_reports WHERE audit_id = ?').all(audit.id);

  // Parse diagnostics JSON
  performanceReports.forEach(p => {
    try {
      p.diagnostics = JSON.parse(p.diagnostics_json || '[]');
    } catch {
      p.diagnostics = [];
    }
  });

  res.json({
    ...audit,
    pages,
    findings,
    performanceReports
  });
});

// Cancel Audit
apiRouter.post('/audits/:id/cancel', (req, res) => {
  const auditId = req.params.id;
  const job = activeAudits.get(auditId);
  if (job) {
    job.cancelled = true;
  }
  db.prepare('UPDATE audits SET status = ? WHERE id = ?').run('cancelled', auditId);
  sendSseEvent(auditId, 'cancelled', { auditId });
  res.json({ message: 'Audit cancellation requested' });
});

// Delete Audit
apiRouter.delete('/audits/:id', (req, res) => {
  const auditId = req.params.id;
  db.prepare('DELETE FROM findings WHERE audit_id = ?').run(auditId);
  db.prepare('DELETE FROM pages WHERE audit_id = ?').run(auditId);
  db.prepare('DELETE FROM performance_reports WHERE audit_id = ?').run(auditId);
  db.prepare('DELETE FROM audits WHERE id = ?').run(auditId);
  res.json({ success: true });
});

// Update Executive Summary
apiRouter.patch('/audits/:id/summary', (req, res) => {
  const { executive_summary } = req.body;
  db.prepare('UPDATE audits SET executive_summary = ? WHERE id = ?').run(executive_summary, req.params.id);
  res.json({ success: true, executive_summary });
});

// Before-and-After Audit Comparison
apiRouter.post('/audits/compare', (req, res) => {
  const { auditId1, auditId2 } = req.body;
  if (!auditId1 || !auditId2) {
    return res.status(400).json({ error: 'Both auditId1 and auditId2 are required' });
  }

  const audit1 = db.prepare('SELECT * FROM audits WHERE id = ?').get(auditId1);
  const audit2 = db.prepare('SELECT * FROM audits WHERE id = ?').get(auditId2);

  if (!audit1 || !audit2) {
    return res.status(404).json({ error: 'One or both audits could not be found' });
  }

  const findings1 = db.prepare('SELECT * FROM findings WHERE audit_id = ?').all(auditId1);
  const findings2 = db.prepare('SELECT * FROM findings WHERE audit_id = ?').all(auditId2);

  const perf1 = db.prepare('SELECT * FROM performance_reports WHERE audit_id = ?').all(auditId1);
  const perf2 = db.prepare('SELECT * FROM performance_reports WHERE audit_id = ?').all(auditId2);

  const keys1 = new Set(findings1.map(f => f.dedupe_key || f.title));
  const keys2 = new Set(findings2.map(f => f.dedupe_key || f.title));

  // Resolved: present in 1, missing in 2
  const resolvedIssues = findings1.filter(f => !keys2.has(f.dedupe_key || f.title));
  // New: present in 2, missing in 1
  const newIssues = findings2.filter(f => !keys1.has(f.dedupe_key || f.title));
  // Persistent: present in both
  const persistentIssues = findings2.filter(f => keys1.has(f.dedupe_key || f.title));

  const scoreDeltas = {
    quality: (audit2.quality_score || 0) - (audit1.quality_score || 0),
    seo: (audit2.seo_score || 0) - (audit1.seo_score || 0),
    performance: (audit2.performance_score || 0) - (audit1.performance_score || 0)
  };

  res.json({
    audit1,
    audit2,
    scoreDeltas,
    resolvedIssues,
    newIssues,
    persistentIssues,
    performance: {
      audit1: perf1,
      audit2: perf2
    }
  });
});

// Grounded AI Meta Tag Suggestion
apiRouter.post('/ai/suggest-meta', (req, res) => {
  const { title, headings, metaDescription, sampleText } = req.body;
  const suggestion = generateSuggestedMeta(title, headings, metaDescription, sampleText);
  res.json(suggestion);
});

// Mount API routes under both /api and / so it works seamlessly on Vercel and local
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Serve production frontend assets if built
const distPath = path.join(__dirname, '..', 'dist');
const indexPath = path.join(distPath, 'index.html');
if (fs.existsSync(indexPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/screenshots')) {
      return res.sendFile(indexPath);
    }
    next();
  });
}

module.exports = app;

// Start Server if executed directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`SiteScope AI backend running on http://localhost:${PORT}`);
  });
}
