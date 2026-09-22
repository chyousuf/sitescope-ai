const http = require('http');
const assert = require('assert');

// Start Express server programmatically for the test
const express = require('express');
const path = require('path');
const cors = require('cors');

async function runE2ETest() {
  console.log('🚀 Running SiteScope AI End-to-End Live Audit Verification...\n');

  // Launch test server
  const app = require('../server/index.js');
  // server/index.js starts on port 3001
  await new Promise(resolve => setTimeout(resolve, 1500));

  console.log('1. Testing POST /api/audits for built-in demo site...');
  const startAuditPayload = JSON.stringify({
    url: 'http://localhost:3001/api/demo-site',
    auditType: 'single',
    maxPages: 1
  });

  const auditRes = await fetch('http://localhost:3001/api/audits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: startAuditPayload
  });

  assert.strictEqual(auditRes.status, 202, 'Should respond with HTTP 202 Accepted');
  const initialAudit = await auditRes.json();
  console.log(`  Audit started successfully with ID: ${initialAudit.id}`);

  // Poll audit status until completed (max 25s)
  console.log('2. Waiting for Headless Chrome and SEO audit pipeline to complete...');
  let completedAudit = null;
  for (let i = 0; i < 25; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const statusRes = await fetch(`http://localhost:3001/api/audits/${initialAudit.id}`);
    if (statusRes.ok) {
      const data = await statusRes.json();
      if (data.status === 'completed') {
        completedAudit = data;
        break;
      }
    }
  }

  assert.ok(completedAudit, 'Audit should reach completed status within 25 seconds');
  console.log(`  Audit finished in state: ${completedAudit.status}`);
  console.log(`  Scores computed: Quality: ${completedAudit.quality_score}, SEO: ${completedAudit.seo_score}, Performance: ${completedAudit.performance_score}`);
  console.log(`  Total findings recorded: ${completedAudit.findings.length}`);

  // 3. Verify key findings
  console.log('3. Verifying detection of seeded flaws:');
  const findings = completedAudit.findings;

  const hasOverflow = findings.some(f => f.dedupe_key === 'horizontal-mobile-overflow');
  assert.ok(hasOverflow, 'Must detect horizontal layout overflow on mobile');
  console.log('  ✅ Detected: Horizontal layout overflow on mobile');

  const hasBrokenLink = findings.some(f => f.dedupe_key?.includes('missing-pricing'));
  assert.ok(hasBrokenLink, 'Must detect 404 broken link');
  console.log('  ✅ Detected: HTTP 404 broken link to /missing-pricing');

  const hasMissingH1 = findings.some(f => f.dedupe_key === 'missing-h1');
  assert.ok(hasMissingH1, 'Must detect missing H1 heading');
  console.log('  ✅ Detected: Missing <h1> heading tag');

  const hasFormLabels = findings.some(f => f.dedupe_key === 'missing-form-labels');
  assert.ok(hasFormLabels, 'Must detect unlabelled form inputs');
  console.log('  ✅ Detected: Unlabelled accessible form inputs');

  const hasCanonical = findings.some(f => f.dedupe_key === 'inconsistent-canonical');
  assert.ok(hasCanonical, 'Must detect inconsistent canonical target');
  console.log('  ✅ Detected: Inconsistent canonical URL tag');

  // 4. Verify screenshots saved
  console.log('4. Verifying screenshots captured:');
  assert.ok(completedAudit.pages.length > 0, 'Must have at least 1 scanned page record');
  const page = completedAudit.pages[0];
  assert.ok(page.desktop_screenshot, 'Must have desktop screenshot path');
  assert.ok(page.mobile_screenshot, 'Must have mobile screenshot path');
  console.log(`  ✅ Desktop screenshot: ${page.desktop_screenshot}`);
  console.log(`  ✅ Mobile screenshot: ${page.mobile_screenshot}`);

  // 5. Verify Before-and-After Comparison endpoint
  console.log('5. Testing Before-and-After Comparison endpoint:');
  const compareRes = await fetch('http://localhost:3001/api/audits/compare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      auditId1: 'audit-demo-before-001',
      auditId2: 'audit-demo-after-002'
    })
  });
  assert.strictEqual(compareRes.status, 200);
  const compareData = await compareRes.json();
  assert.ok(compareData.scoreDeltas.quality > 0, 'Quality score must improve in comparison');
  assert.ok(compareData.resolvedIssues.length > 0, 'Must identify resolved issues');
  console.log(`  ✅ Score Deltas: Quality +${compareData.scoreDeltas.quality}, SEO +${compareData.scoreDeltas.seo}, Speed +${compareData.scoreDeltas.performance}`);
  console.log(`  ✅ Resolved issues count: ${compareData.resolvedIssues.length}`);

  // 6. Verify Grounded AI Meta Tag Suggestion endpoint
  console.log('6. Testing Grounded AI Meta Tag Suggestion endpoint:');
  const metaRes = await fetch('http://localhost:3001/api/ai/suggest-meta', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Acme SaaS',
      headings: [{ tag: 'h1', text: 'Enterprise Cloud Infrastructure' }],
      sampleText: 'Deploy resilient ultra-fast storage clusters across global locations.'
    })
  });
  assert.strictEqual(metaRes.status, 200);
  const metaData = await metaRes.json();
  assert.ok(metaData.suggestedTitle.includes('Enterprise Cloud Infrastructure'));
  assert.ok(metaData.suggestedDescription.length > 30);
  console.log(`  ✅ Grounded Title: "${metaData.suggestedTitle}" (${metaData.titleCharCount} chars)`);
  console.log(`  ✅ Grounded Desc: "${metaData.suggestedDescription}" (${metaData.descCharCount} chars)`);

  console.log('\n🎉 ALL LIVE END-TO-END VERIFICATION CHECKS PASSED!\n');
  process.exit(0);
}

runE2ETest().catch(err => {
  console.error('❌ E2E Test Failed:', err);
  process.exit(1);
});
