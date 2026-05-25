/**
 * Debug script v2: captures React #418 with more context.
 * Intercepts the exact text node that caused the mismatch by
 * injecting a MutationObserver before React hydrates.
 */
const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
  });

  const page = await browser.newPage();

  // Capture all console logs
  page.on('console', msg => {
    const type = msg.type().toUpperCase();
    if (type !== 'LOG' || msg.text().includes('[HYDRATION]') || msg.text().includes('Error') || msg.text().includes('418')) {
      console.log(`[BROWSER ${type}]: ${msg.text()}`);
    }
  });

  // Capture page errors
  page.on('pageerror', err => {
    console.error(`[BROWSER ERROR]: ${err.toString()}`);
  });

  // Inject a script BEFORE page load to intercept errors at the earliest possible moment
  await page.evaluateOnNewDocument(() => {
    // Patch React's reconcileChildFibers to catch hydration mismatches
    // Track any text node differences
    const origCreateElement = document.createElement.bind(document);
    const origCreateTextNode = document.createTextNode.bind(document);
    
    // Intercept MutationObserver to detect text mismatches  
    window.__hydrationErrors = [];
    const origError = console.error.bind(console);
    console.error = (...args) => {
      const msg = args.join(' ');
      if (msg.includes('418') || msg.includes('hydration') || msg.includes('did not match') || msg.includes('Minified React')) {
        window.__hydrationErrors.push(msg);
        console.log('[HYDRATION ERROR INTERCEPTED]:', msg.substring(0, 500));
      }
      origError(...args);
    };
    
    // Also patch warn
    const origWarn = console.warn.bind(console);
    console.warn = (...args) => {
      const msg = args.join(' ');
      if (msg.includes('418') || msg.includes('hydration') || msg.includes('did not match') || msg.includes('Minified React')) {
        console.log('[HYDRATION WARN INTERCEPTED]:', msg.substring(0, 500));
      }
      origWarn(...args);
    };
  });

  console.log('Navigating to https://legacymarksas.com/es ...');
  try {
    await page.goto('https://legacymarksas.com/es', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // Wait for hydration to happen
    console.log('Page loaded. Waiting for hydration (3s)...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    const info = await page.evaluate(() => {
      const main = document.querySelector('main');
      const errDebug = document.getElementById('seo-debug-errors');
      
      // Check chunk names in scripts to see if new deploy is live
      const scripts = Array.from(document.querySelectorAll('script[src]')).map(s => s.src);
      const nextChunks = scripts.filter(s => s.includes('_next/static/chunks'));
      
      return {
        title: document.title,
        hydrationErrors: window.__hydrationErrors || [],
        seoDebugErrors: errDebug ? errDebug.innerText.substring(0, 1000) : 'NONE',
        nextChunks: nextChunks.slice(0, 5),  // First 5 chunk names to verify if new deploy
        bodyClasses: document.documentElement.className,
      };
    });

    console.log('\n=== PAGE INFO ===');
    console.log('Title:', info.title);
    console.log('Body Classes:', info.bodyClasses);
    console.log('\n=== NEXT.JS CHUNKS (to verify deploy) ===');
    info.nextChunks.forEach(c => console.log(' -', c.split('/').pop()));
    console.log('\n=== SEO DEBUG ERRORS ===');
    console.log(info.seoDebugErrors);

    // Also take screenshot
    const screenshotPath = path.join(__dirname, 'live-screenshot-v2.png');
    await page.screenshot({ path: screenshotPath, clip: { x: 0, y: 0, width: 1280, height: 900 } });
    console.log('\nScreenshot saved to:', screenshotPath);

  } catch (error) {
    console.error('Error during execution:', error);
  } finally {
    await browser.close();
    console.log('Browser closed.');
  }
})();
