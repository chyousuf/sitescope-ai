# SiteScope AI — Website Quality, SEO & Speed Inspector

**SiteScope AI** is a website auditing platform engineered for web agencies, freelancers, and small business owners. It provides a centralized, trustworthy platform to diagnose what is wrong with a website, why it matters in plain business terms, and what to fix first.

---

## 🌟 Key Features

### 1. Website Quality & Layout Inspection
- **Headless Chrome Automation**: Automatically renders pages in desktop (1280x800) and mobile (390x844 iPhone 14) viewports.
- **Horizontal Overflow Detection**: Evaluates `scrollWidth > clientWidth`, highlights specific DOM elements that break mobile responsive bounds, and provides CSS remedies (`max-width: 100%`, `overflow-x: auto`).
- **Dead Link Detection**: Crawls internal links and flags HTTP 404/500 errors and broken navigation anchors.
- **Form Accessibility (WCAG 2.1 AA)**: Flags `<input>`, `<select>`, and `<textarea>` controls missing `<label for="...">` or `aria-label`.
- **Keyboard Navigation & Tabindex**: Detects `tabindex > 0` anti-patterns and unlabelled interactive buttons.
- **Console Error Logger**: Captures runtime JavaScript exceptions thrown in headless Chrome.

### 2. Technical & On-Page SEO
- **Title & Meta Descriptions**: Pixel/character length gauges (50–60 chars title, 120–160 chars description) treated as non-absolute guidelines.
- **Heading Outline Tree**: Full visual hierarchy tree (`H1` → `H2` → `H3`), flagging missing H1, multiple H1s, and skipped levels.
- **Canonical Consistency & Robots**: Checks for cross-domain canonical mismatches, `noindex` directives, `robots.txt` disallow rules, and XML sitemap availability.
- **Image Alt Attributes**: Distinguishes decorative images (`role="presentation"`, `aria-hidden="true"`, empty `alt=""`) from content images missing alt text.
- **Social Media Cards**: Live Open Graph (`og:image`, `og:title`) and Twitter Card previews.
- **Structured Data (JSON-LD)**: Extracts and validates Schema.org markup.
- **Grounded AI SEO Copywriter**: Generates optimized titles and descriptions grounded *strictly* in actual page text without hallucinating.

### 3. Page Speed & Core Web Vitals
- **Lighthouse Performance Lab Score** (0–100) on mobile simulation.
- **Official Core Web Vitals**:
  - **LCP** (Largest Contentful Paint) — Target: ≤ 2.5s
  - **CLS** (Cumulative Layout Shift) — Target: ≤ 0.1
  - **FCP** (First Contentful Paint) — Target: ≤ 1.8s
  - **TBT** (Total Blocking Time) — Target: ≤ 200ms
  - **Speed Index** — Target: ≤ 3.4s
  - **INP** (Interaction to Next Paint) — Field data when present
- **Lab vs. Field Data Separation**: Clearly distinguishes lab measurements from real-user Chrome User Experience Report (CrUX) field data.
- **Diagnostic Savings**: Quantifies byte and time savings (render-blocking resources, unused JS/CSS, modern WebP/AVIF formats, TTFB).

### 4. AI Prioritization Queue
- Categorizes findings by severity (**Critical**, **High**, **Medium**, **Low**).
- Includes **"Why it matters"** written in persuasive business language for clients.
- Provides copyable code fixes, screenshot evidence, and exact verification steps.
- Deduplicates site-wide issues across multiple crawled pages.

### 5. Before-and-After Comparison Tool
- Compare any two audits for a website.
- Highlights:
  - **Resolved Issues** (green checkmarks)
  - **New Regressions** (red warnings)
  - **Persistent Issues** (amber notices)
  - **Score Deltas** (e.g. Quality +46, SEO +38, Speed +48)

### 6. Client Report & PDF Exporter
- Editable executive summary saved directly into the audit record.
- Agency branding customizations (Agency Name, Client Name, Auditor).
- Print-optimized CSS (`@media print`) for 1-click PDF generation.

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- Google Chrome installed on your machine (`/Applications/Google Chrome.app`)

### Run Application
In `/Users/chaudhryyousaf/.gemini/antigravity/scratch/sitescope-ai`:

```bash
# Start backend server and production client
npm run server

# Or run development mode with Vite hot-reload:
npm run dev
```

The application will be live at:
- **Web App**: `http://localhost:3001` (or `http://localhost:5173` in dev mode)
- **Built-in Demo Sandbox (Flawed V1)**: `http://localhost:3001/api/demo-site`
- **Built-in Demo Sandbox (Optimized V2)**: `http://localhost:3001/api/demo-site-fixed`

---

## 🧪 Running Tests

```bash
# Run automated unit and integration tests:
npm test

# Run full headless Chrome end-to-end audit test:
node scripts/e2e-demo-test.js
```
