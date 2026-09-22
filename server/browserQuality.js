const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SCREENSHOTS_DIR = path.join(__dirname, '..', 'public', 'screenshots');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

/**
 * Launch headless browser instance
 */
async function launchBrowser() {
  return await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1280,800'
    ]
  });
}

/**
 * Perform comprehensive browser quality inspection for desktop and mobile
 */
async function inspectBrowserQuality(url, auditId, pageIndex = 0, onLog) {
  let browser = null;
  const result = {
    desktopScreenshot: null,
    mobileScreenshot: null,
    consoleErrors: [],
    failedRequests: [],
    horizontalOverflow: { hasOverflow: false, scrollWidth: 0, clientWidth: 0, elements: [] },
    formAccessibility: { issues: [] },
    keyboardAccessibility: { issues: [] },
    navIssues: []
  };

  try {
    if (onLog) onLog(`Launching headless Chrome for ${url}...`);
    browser = await launchBrowser();

    // -------------------------------------------------------------
    // 1. DESKTOP VIEWPORT INSPECTION (1280x800)
    // -------------------------------------------------------------
    const desktopPage = await browser.newPage();
    await desktopPage.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });

    desktopPage.on('console', (msg) => {
      if (msg.type() === 'error') {
        result.consoleErrors.push({
          type: 'console-error',
          text: msg.text(),
          location: msg.location() ? `${msg.location().url}:${msg.location().lineNumber}` : 'inline'
        });
      }
    });

    desktopPage.on('requestfailed', (req) => {
      result.failedRequests.push({
        url: req.url(),
        failure: req.failure() ? req.failure().errorText : 'Failed',
        resourceType: req.resourceType()
      });
    });

    if (onLog) onLog(`Loading desktop view (1280x800)...`);
    try {
      await desktopPage.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
    } catch (navErr) {
      if (onLog) onLog(`Desktop navigation warning: ${navErr.message}`);
    }

    // Capture desktop screenshot
    const desktopFileName = `${auditId}_p${pageIndex}_desktop.png`;
    const desktopFilePath = path.join(SCREENSHOTS_DIR, desktopFileName);
    await desktopPage.screenshot({ path: desktopFilePath, fullPage: false });
    result.desktopScreenshot = `/screenshots/${desktopFileName}`;

    // Desktop Quality Checks (Forms, Nav, A11y)
    const domChecks = await desktopPage.evaluate(() => {
      const formIssues = [];
      const kbdIssues = [];
      const navIssues = [];

      // Check form inputs for labels
      const inputs = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), select, textarea');
      inputs.forEach((input) => {
        const id = input.id;
        const hasAriaLabel = !!input.getAttribute('aria-label');
        const hasAriaLabelledBy = !!input.getAttribute('aria-labelledby');
        const hasTitle = !!input.getAttribute('title');
        const hasParentLabel = !!input.closest('label');
        const hasForLabel = id ? !!document.querySelector(`label[for="${id}"]`) : false;

        if (!hasAriaLabel && !hasAriaLabelledBy && !hasTitle && !hasParentLabel && !hasForLabel) {
          formIssues.push({
            tag: input.tagName.toLowerCase(),
            type: input.getAttribute('type') || 'text',
            id: id || null,
            name: input.getAttribute('name') || null,
            placeholder: input.getAttribute('placeholder') || null,
            htmlSnippet: input.outerHTML.substring(0, 140)
          });
        }
      });

      // Keyboard & tab index anti-patterns
      const positiveTabindex = document.querySelectorAll('[tabindex]:not([tabindex="-1"]):not([tabindex="0"])');
      positiveTabindex.forEach((el) => {
        const val = parseInt(el.getAttribute('tabindex'), 10);
        if (val > 0) {
          kbdIssues.push({
            type: 'positive-tabindex',
            tabindex: val,
            tag: el.tagName.toLowerCase(),
            snippet: el.outerHTML.substring(0, 100)
          });
        }
      });

      // Interactive buttons or links without accessible text
      const buttons = document.querySelectorAll('button, a[href]');
      buttons.forEach((btn) => {
        const text = btn.innerText.trim();
        const ariaLabel = btn.getAttribute('aria-label');
        const title = btn.getAttribute('title');
        const imgAlt = btn.querySelector('img') ? btn.querySelector('img').getAttribute('alt') : null;

        if (!text && !ariaLabel && !title && !imgAlt) {
          kbdIssues.push({
            type: 'empty-interactive-element',
            tag: btn.tagName.toLowerCase(),
            href: btn.getAttribute('href') || null,
            snippet: btn.outerHTML.substring(0, 100)
          });
        }
      });

      // Navigation checks: broken anchor links or empty hashes
      const navLinks = document.querySelectorAll('nav a, header a');
      navLinks.forEach((a) => {
        const href = a.getAttribute('href');
        if (href === '#' || href === 'javascript:void(0)' || href === '') {
          navIssues.push({
            text: a.innerText.trim() || 'Empty anchor',
            href: href,
            snippet: a.outerHTML.substring(0, 100)
          });
        }
      });

      return { formIssues, kbdIssues, navIssues };
    });

    result.formAccessibility.issues = domChecks.formIssues;
    result.keyboardAccessibility.issues = domChecks.kbdIssues;
    result.navIssues = domChecks.navIssues;

    await desktopPage.close();

    // -------------------------------------------------------------
    // 2. MOBILE VIEWPORT INSPECTION (390x844 - iPhone 14 / modern smartphone)
    // -------------------------------------------------------------
    if (onLog) onLog(`Loading mobile view (390x844) to inspect layout and horizontal overflow...`);
    const mobilePage = await browser.newPage();
    await mobilePage.setViewport({
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true
    });

    try {
      await mobilePage.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
    } catch (navErr) {
      if (onLog) onLog(`Mobile navigation warning: ${navErr.message}`);
    }

    // Capture mobile screenshot
    const mobileFileName = `${auditId}_p${pageIndex}_mobile.png`;
    const mobileFilePath = path.join(SCREENSHOTS_DIR, mobileFileName);
    await mobilePage.screenshot({ path: mobileFilePath, fullPage: false });
    result.mobileScreenshot = `/screenshots/${mobileFileName}`;

    // Inspect Horizontal Layout Overflow
    const overflowCheck = await mobilePage.evaluate(() => {
      const docScrollWidth = document.documentElement.scrollWidth || 0;
      const bodyScrollWidth = document.body ? document.body.scrollWidth : 0;
      const scrollWidth = Math.max(docScrollWidth, bodyScrollWidth);
      const clientWidth = document.documentElement.clientWidth;
      const visualWidth = window.visualViewport ? window.visualViewport.width : window.innerWidth;
      const viewportRef = Math.min(clientWidth || 390, visualWidth || 390, 390);

      const overflowingElements = [];
      const allElements = document.querySelectorAll('*');
      allElements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.width > viewportRef + 10 || el.scrollWidth > viewportRef + 10) {
          const style = window.getComputedStyle(el);
          if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0' && el.tagName !== 'HTML' && el.tagName !== 'BODY') {
            overflowingElements.push({
              tag: el.tagName.toLowerCase(),
              className: el.className || '',
              id: el.id || '',
              width: Math.round(rect.width),
              scrollWidth: el.scrollWidth,
              right: Math.round(rect.right),
              outerHtmlSnippet: el.outerHTML.substring(0, 160)
            });
          }
        }
      });

      const hasOverflow = (scrollWidth > viewportRef + 10) || (overflowingElements.length > 0);

      return {
        hasOverflow,
        scrollWidth,
        clientWidth,
        windowWidth: viewportRef,
        elements: overflowingElements.slice(0, 5) // return top 5 offending elements
      };
    });

    result.horizontalOverflow = overflowCheck;
    await mobilePage.close();

    if (onLog) onLog(`Browser quality check complete (Overflow: ${overflowCheck.hasOverflow ? 'DETECTED' : 'None'}, Form issues: ${result.formAccessibility.issues.length}, Console errors: ${result.consoleErrors.length})`);
  } catch (err) {
    if (onLog) onLog(`Browser quality inspection error: ${err.message}`);
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch {}
    }
  }

  return result;
}

module.exports = {
  inspectBrowserQuality,
  SCREENSHOTS_DIR
};
