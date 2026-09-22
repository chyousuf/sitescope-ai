const assert = require('assert');
const { validateAuditUrl } = require('../server/safety');
const { analyzeSEO } = require('../server/seoAnalyzer');
const { calculateScores, deduplicateFindings, generateExecutiveSummary, generateSuggestedMeta } = require('../server/aiSynthesizer');
const { inspectBrowserQuality } = require('../server/browserQuality');
const { db } = require('../server/db');

async function runTests() {
  console.log('🧪 Starting SiteScope AI Automated Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error('    ', err.message);
      failed++;
    }
  }

  async function testAsync(name, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error('    ', err.message);
      failed++;
    }
  }

  // 1. SAFETY & SSRF TESTS
  console.log('1. SSRF Guardian & Safety Tests:');
  
  await testAsync('Blocks AWS/Cloud metadata address (169.254.169.254)', async () => {
    const res = await validateAuditUrl('http://169.254.169.254/latest/meta-data');
    assert.strictEqual(res.valid, false);
    assert.match(res.error, /private|internal/i);
  });

  await testAsync('Blocks RFC1918 192.168.x.x private network', async () => {
    const res = await validateAuditUrl('http://192.168.1.1/admin');
    assert.strictEqual(res.valid, false);
    assert.match(res.error, /private/i);
  });

  await testAsync('Blocks RFC1918 10.x.x.x private network', async () => {
    const res = await validateAuditUrl('http://10.0.0.1/status');
    assert.strictEqual(res.valid, false);
    assert.match(res.error, /private/i);
  });

  await testAsync('Allows built-in local demo site path', async () => {
    const res = await validateAuditUrl('http://localhost:3001/api/demo-site');
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.isDemo, true);
  });

  // 2. TECHNICAL SEO ANALYZER TESTS
  console.log('\n2. Technical SEO Analyzer Tests:');

  test('Detects missing H1 heading', () => {
    const html = `<html><head><title>Test</title></head><body><h2>Subheading</h2></body></html>`;
    const res = analyzeSEO(html, 'https://example.com');
    const h1Issue = res.issues.find(i => i.dedupe_key === 'missing-h1');
    assert.ok(h1Issue, 'Should flag missing <h1> tag');
    assert.strictEqual(h1Issue.severity, 'high');
  });

  test('Detects missing meta description', () => {
    const html = `<html><head><title>Test</title></head><body><h1>Title</h1></body></html>`;
    const res = analyzeSEO(html, 'https://example.com');
    const metaIssue = res.issues.find(i => i.dedupe_key === 'missing-meta-description');
    assert.ok(metaIssue, 'Should flag missing meta description');
  });

  test('Detects inconsistent cross-domain canonical tag', () => {
    const html = `<html><head><link rel="canonical" href="http://staging.dev.fake/home" /></head><body><h1>Title</h1></body></html>`;
    const res = analyzeSEO(html, 'https://production.com/home');
    const canonIssue = res.issues.find(i => i.dedupe_key === 'inconsistent-canonical');
    assert.ok(canonIssue, 'Should flag cross-domain canonical mismatch');
  });

  test('Detects unlabelled content images while ignoring decorative images', () => {
    const html = `<html><body>
      <img src="banner.png"> <!-- Content image missing alt -->
      <img src="icon.svg" role="presentation"> <!-- Decorative: ignored -->
      <img src="spacer.gif" alt=""> <!-- Decorative: ignored -->
    </body></html>`;
    const res = analyzeSEO(html, 'https://example.com');
    assert.strictEqual(res.images.missingAltCount, 1);
    const altIssue = res.issues.find(i => i.dedupe_key === 'missing-image-alt');
    assert.ok(altIssue, 'Should flag missing alt for content image only');
  });

  // 3. AI SYNTHESIS & SCORING TESTS
  console.log('\n3. AI Synthesis & Scoring Tests:');

  test('Computes transparent score deductions correctly', () => {
    const sampleFindings = [
      { category: 'quality', severity: 'critical' }, // -25
      { category: 'quality', severity: 'high' },     // -12
      { category: 'seo', severity: 'critical' },     // -30
      { category: 'seo', severity: 'medium' }        // -8
    ];
    const scores = calculateScores(sampleFindings, 82);
    assert.strictEqual(scores.qualityScore, 63); // 100 - 37
    assert.strictEqual(scores.seoScore, 62);     // 100 - 38
    assert.strictEqual(scores.performanceScore, 82);
  });

  test('Deduplicates site-wide findings across multiple pages', () => {
    const raw = [
      { page_url: 'https://example.com/page1', category: 'quality', severity: 'high', title: 'Missing Form Label', dedupe_key: 'form-label' },
      { page_url: 'https://example.com/page2', category: 'quality', severity: 'high', title: 'Missing Form Label', dedupe_key: 'form-label' }
    ];
    const dedupe = deduplicateFindings(raw);
    assert.strictEqual(dedupe.length, 1);
    assert.strictEqual(dedupe[0].pageCount, 2);
    assert.ok(dedupe[0].title.includes('Site-wide:'));
  });

  test('Generates grounded meta without hallucinating', () => {
    const meta = generateSuggestedMeta(
      'Cloud Storage',
      [{ tag: 'h1', text: 'Ultra-Fast Enterprise Object Storage' }, { tag: 'h2', text: 'Global Clustering' }],
      '',
      'Ultra-Fast Enterprise Object Storage built for engineers.'
    );
    assert.ok(meta.suggestedTitle.includes('Ultra-Fast Enterprise Object Storage'));
    assert.ok(meta.suggestedDescription.length >= 50);
  });

  // 4. DATABASE & BEFORE/AFTER COMPARISON TESTS
  console.log('\n4. Database & Before-and-After Comparison Tests:');

  test('Pre-seeded audits exist in SQLite DB', () => {
    const audits = db.prepare('SELECT count(*) as count FROM audits').get();
    assert.ok(audits.count >= 2, 'Should have at least 2 pre-seeded audits');
    const v1 = db.prepare('SELECT * FROM audits WHERE id = ?').get('audit-demo-before-001');
    const v2 = db.prepare('SELECT * FROM audits WHERE id = ?').get('audit-demo-after-002');
    assert.ok(v1 && v2, 'Before and After seeded audits must exist');
    assert.ok(v2.quality_score > v1.quality_score, 'V2 Quality score must be higher than V1');
    assert.ok(v2.performance_score > v1.performance_score, 'V2 Speed score must be higher than V1');
  });

  // 5. BROWSER AUTOMATION HEADLESS CHROME TEST
  console.log('\n5. Headless Chrome Browser Quality Inspection:');

  await testAsync('Captures layout and detects horizontal overflow', async () => {
    // We inspect a data URI with forced 980px overflow
    const testUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(`
      <!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body>
        <div style="width: 950px; height: 100px; background: red;">Wide content</div>
      </body></html>
    `);

    const res = await inspectBrowserQuality(testUrl, 'test-audit', 0);
    assert.ok(res.mobileScreenshot, 'Mobile screenshot should be captured');
    assert.ok(res.desktopScreenshot, 'Desktop screenshot should be captured');
    assert.strictEqual(res.horizontalOverflow.hasOverflow, true, 'Should detect horizontal overflow on mobile');
  });

  console.log(`\n========================================`);
  console.log(`Test Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Unexpected test error:', err);
  process.exit(1);
});
