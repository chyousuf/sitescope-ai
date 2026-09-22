export const DEFAULT_AUDITS = [
  {
    id: 'audit-demo-before-001',
    url: 'https://demo.sitescope.ai/v1',
    domain: 'acmecloud.com',
    status: 'completed',
    audit_type: 'crawl',
    max_pages: 3,
    pages_scanned: 3,
    quality_score: 52,
    seo_score: 58,
    performance_score: 46,
    executive_summary: `Executive Audit Summary for acmecloud.com (Initial Run):
The initial audit discovered 6 high-priority issues that directly impact search engine indexing, mobile conversions, and customer trust. Crucially, the mobile viewport suffers from visible horizontal layout overflow caused by an unconstrained 980px table, preventing mobile shoppers from viewing pricing details. Furthermore, a 404 broken link on the primary navigation button disrupts user flow, and the primary H1 tag is missing. Page speed is hindered by 1.4MB of uncompressed PNG banners and render-blocking scripts. Recommended priority: resolve mobile overflow and 404 links first.`,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    completed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    pages: [
      {
        id: 'p1-v1',
        audit_id: 'audit-demo-before-001',
        url: 'https://demo.sitescope.ai/v1',
        status_code: 200,
        title: 'Acme SaaS',
        meta_description: '',
        canonical: 'http://staging.acmeservices.fake/home',
        h1: null,
        load_time_ms: 1450,
        desktop_screenshot: '/screenshots/demo_desktop_v1.png',
        mobile_screenshot: '/screenshots/demo_mobile_v1.png',
        html_size: 48200
      }
    ],
    findings: [
      {
        id: 'f1-v1',
        audit_id: 'audit-demo-before-001',
        page_url: 'https://demo.sitescope.ai/v1',
        category: 'quality',
        severity: 'critical',
        title: 'Visible Horizontal Overflow on Mobile Viewport',
        description: 'Elements exceed the 390px mobile viewport width (scrollWidth: 980px), forcing an awkward horizontal scrollbar on smartphones.',
        why_it_matters: 'Mobile users cannot read content without pinching and scrolling sideways. Google penalizes pages that fail mobile usability criteria, causing significant drop-offs in organic search ranking.',
        evidence: 'Element <div class="pricing-matrix" style="width: 980px"> overflows by 590px beyond screen boundary.',
        suggested_fix: 'Add "max-width: 100%; overflow-x: auto;" to the container or convert to a responsive card layout.',
        effort: 'Quick Fix (<15m)',
        verification_steps: 'Open the page in Chrome DevTools Device Mode (iPhone 14, 390px width) and verify no horizontal scrollbar appears.',
        dedupe_key: 'overflow-pricing-matrix'
      },
      {
        id: 'f2-v1',
        audit_id: 'audit-demo-before-001',
        page_url: 'https://demo.sitescope.ai/v1',
        category: 'quality',
        severity: 'critical',
        title: 'Broken Internal Link to Pricing Page (HTTP 404)',
        description: 'The "View Enterprise Pricing" button links to "/pricing-broken" which returns a 404 Not Found error.',
        why_it_matters: 'Dead links create a frustrating user experience, waste crawl budget, and stop potential customers from completing high-intent conversions.',
        evidence: 'Anchor <a href="/pricing-broken"> returned HTTP 404 Not Found.',
        suggested_fix: 'Update the href attribute to point to the active pricing endpoint: "/pricing".',
        effort: 'Quick Fix (<15m)',
        verification_steps: 'Click the button and confirm it loads the live pricing page with HTTP 200 OK.',
        dedupe_key: 'broken-link-pricing'
      },
      {
        id: 'f3-v1',
        audit_id: 'audit-demo-before-001',
        page_url: 'https://demo.sitescope.ai/v1',
        category: 'quality',
        severity: 'high',
        title: 'Unlabelled Contact Form Inputs (Accessibility)',
        description: 'Form input fields (<input type="email"> and <input type="text">) lack associated <label> tags, aria-label, or title attributes.',
        why_it_matters: 'Screen reader users cannot understand what data to enter. This violates WCAG 2.1 Level A compliance and can lead to legal accessibility exposure.',
        evidence: 'Input id="contact-email" has no matching <label for="contact-email">.',
        suggested_fix: 'Provide explicit <label for="contact-email">Email Address</label> or add aria-label="Work Email".',
        effort: 'Quick Fix (<15m)',
        verification_steps: 'Test with VoiceOver / screen reader or inspect accessibility tree in DevTools.',
        dedupe_key: 'missing-form-labels'
      },
      {
        id: 'f4-v1',
        audit_id: 'audit-demo-before-001',
        page_url: 'https://demo.sitescope.ai/v1',
        category: 'seo',
        severity: 'high',
        title: 'Missing Main H1 Heading and Broken Heading Hierarchy',
        description: 'The page starts directly with an <h2> and jumps to <h4>, with no top-level <h1> found on the entire page.',
        why_it_matters: 'Search crawlers use the H1 tag as the primary structural topic signal. Skipping heading levels confuses both screen reader users and search indexers.',
        evidence: 'Headings detected: <h2>Features</h2>, <h4>Cloud Storage</h4>. Missing <h1>.',
        suggested_fix: 'Add an <h1> heading summarizing the main page proposition (e.g. <h1>Enterprise Cloud Infrastructure & Storage</h1>).',
        effort: 'Quick Fix (<15m)',
        verification_steps: 'Inspect DOM and verify document has exactly one logical <h1> tag before any <h2> tags.',
        dedupe_key: 'missing-h1-tag'
      },
      {
        id: 'f5-v1',
        audit_id: 'audit-demo-before-001',
        page_url: 'https://demo.sitescope.ai/v1',
        category: 'seo',
        severity: 'high',
        title: 'Inconsistent Canonical Tag Target',
        description: 'Canonical tag points to an external staging environment ("http://staging.acmeservices.fake/home") instead of the live URL.',
        why_it_matters: 'Tells search engines to index a staging/dev URL instead of this production page, which can completely de-index the live website from Google.',
        evidence: '<link rel="canonical" href="http://staging.acmeservices.fake/home" />',
        suggested_fix: 'Change the canonical href to the canonical production URL ("https://demo.sitescope.ai/v1").',
        effort: 'Quick Fix (<15m)',
        verification_steps: 'Verify <link rel="canonical"> matches the exact canonical production URL.',
        dedupe_key: 'canonical-mismatch'
      },
      {
        id: 'f6-v1',
        audit_id: 'audit-demo-before-001',
        page_url: 'https://demo.sitescope.ai/v1',
        category: 'seo',
        severity: 'medium',
        title: 'Missing Image Alt Text on Content Banners',
        description: '2 prominent marketing graphics lack alt attributes, preventing them from being understood by visually impaired users or image search crawlers.',
        why_it_matters: 'Fails basic accessibility standards and misses valuable image search traffic opportunities.',
        evidence: '<img src="/assets/hero-banner.png" class="hero-img"> missing alt attribute.',
        suggested_fix: 'Add descriptive alt text: alt="Acme Cloud Server Infrastructure Dashboard".',
        effort: 'Quick Fix (<15m)',
        verification_steps: 'Inspect <img> tags and confirm non-decorative images contain descriptive alt text.',
        dedupe_key: 'missing-image-alt'
      },
      {
        id: 'f7-v1',
        audit_id: 'audit-demo-before-001',
        page_url: 'https://demo.sitescope.ai/v1',
        category: 'speed',
        severity: 'high',
        title: 'Poor Largest Contentful Paint (LCP: 4.6s) on Mobile',
        description: 'The hero image is 1.4MB unoptimized PNG loaded without modern formatting (WebP/AVIF) and blocks main thread rendering.',
        why_it_matters: 'Slow initial load causes high mobile bounce rates (over 53% of mobile visits are abandoned if pages take >3s to load).',
        evidence: 'LCP element: img.hero-img (1420 KB), TTFB: 420ms, Render Delay: 3100ms.',
        suggested_fix: 'Convert hero image to modern WebP format, implement responsive srcset, and preload the critical LCP image.',
        effort: 'Moderate (1-2h)',
        verification_steps: 'Rerun PageSpeed Insights lab test and ensure LCP drops below 2.5s.',
        dedupe_key: 'slow-lcp-mobile'
      }
    ],
    performanceReports: [
      {
        id: 'perf-v1-mob',
        audit_id: 'audit-demo-before-001',
        device: 'mobile',
        score: 46,
        fcp: '3.2s',
        lcp: '4.6s',
        cls: '0.28',
        speed_index: '5.4s',
        tbt: '680ms',
        inp: '340ms',
        is_field_data: 1,
        field_origin: 'URL-level',
        diagnostics: [
          { title: 'Serve images in next-gen formats', savings: '1,120 KB', description: 'Image formats like WebP and AVIF often provide better compression than PNG or JPEG.' },
          { title: 'Eliminate render-blocking resources', savings: '640 ms', description: 'Resources are blocking the first paint of your page. Consider delivering critical JS/CSS inline and deferring all non-critical JS/styles.' },
          { title: 'Ensure text remains visible during webfont load', savings: '210 ms', description: 'Leverage the font-display CSS feature to ensure text is user-visible while webfonts are loading.' }
        ]
      },
      {
        id: 'perf-v1-desk',
        audit_id: 'audit-demo-before-001',
        device: 'desktop',
        score: 64,
        fcp: '1.4s',
        lcp: '2.9s',
        cls: '0.14',
        speed_index: '2.6s',
        tbt: '220ms',
        inp: '180ms',
        is_field_data: 1,
        field_origin: 'URL-level',
        diagnostics: [
          { title: 'Properly size images', savings: '840 KB', description: 'Serve images that are appropriately-sized to save cellular data and improve load time.' },
          { title: 'Reduce unused JavaScript', savings: '380 KB', description: 'Reduce unused JavaScript and defer loading scripts until they are required to decrease bytes consumed by network activity.' }
        ]
      }
    ]
  },
  {
    id: 'audit-demo-after-002',
    url: 'https://demo.sitescope.ai/v2',
    domain: 'acmecloud.com',
    status: 'completed',
    audit_type: 'crawl',
    max_pages: 3,
    pages_scanned: 3,
    quality_score: 98,
    seo_score: 96,
    performance_score: 94,
    executive_summary: `Post-Fix Verification Report for acmecloud.com:
A follow-up inspection was conducted after implementing agency remediations. All critical blockers have been successfully resolved:
1. Horizontal mobile overflow eliminated by migrating the pricing matrix to responsive CSS grid.
2. The broken 404 pricing link was corrected to the live endpoint.
3. Form fields now feature accessible <label> pairings compliant with WCAG 2.1 AA.
4. Proper <h1> hierarchy and production canonical links are in place.
5. Hero graphics were compressed and converted to WebP with preloading, dropping LCP from 4.6s to 1.6s and raising Mobile Performance from 46 to 94.`,
    created_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    pages: [
      {
        id: 'p1-v2',
        audit_id: 'audit-demo-after-002',
        url: 'https://demo.sitescope.ai/v2',
        status_code: 200,
        title: 'Acme Cloud — High-Performance Cloud Infrastructure & Storage',
        meta_description: 'Scalable, secure cloud servers and object storage for modern engineering teams. 99.99% uptime SLA.',
        canonical: 'https://demo.sitescope.ai/v2',
        h1: 'Enterprise Cloud Infrastructure Built for Scale',
        load_time_ms: 320,
        desktop_screenshot: '/screenshots/demo_desktop_v2.png',
        mobile_screenshot: '/screenshots/demo_mobile_v2.png',
        html_size: 28400
      }
    ],
    findings: [
      {
        id: 'f1-v2',
        audit_id: 'audit-demo-after-002',
        page_url: 'https://demo.sitescope.ai/v2',
        category: 'seo',
        severity: 'low',
        title: 'Add Structured Data (JSON-LD Organization Schema)',
        description: 'Page lacks Schema.org Organization structured data markup for enhanced Google Knowledge Graph representation.',
        why_it_matters: 'Adding Organization schema helps search engines understand your brand name, logo, official social channels, and customer service contact.',
        evidence: 'No <script type="application/ld+json"> tag detected.',
        suggested_fix: 'Insert standard Organization JSON-LD script into the <head> of the homepage.',
        effort: 'Quick Fix (<15m)',
        verification_steps: 'Validate using Google Rich Results Test.',
        dedupe_key: 'missing-organization-schema'
      }
    ],
    performanceReports: [
      {
        id: 'perf-v2-mob',
        audit_id: 'audit-demo-after-002',
        device: 'mobile',
        score: 94,
        fcp: '1.1s',
        lcp: '1.6s',
        cls: '0.02',
        speed_index: '1.8s',
        tbt: '80ms',
        inp: '95ms',
        is_field_data: 1,
        field_origin: 'URL-level',
        diagnostics: [
          { title: 'Serve static assets with an efficient cache policy', savings: '45 KB', description: 'A long cache lifetime can speed up repeat visits to your page.' }
        ]
      },
      {
        id: 'perf-v2-desk',
        audit_id: 'audit-demo-after-002',
        device: 'desktop',
        score: 99,
        fcp: '0.5s',
        lcp: '0.8s',
        cls: '0.00',
        speed_index: '0.9s',
        tbt: '20ms',
        inp: '45ms',
        is_field_data: 1,
        field_origin: 'URL-level',
        diagnostics: []
      }
    ]
  }
];
