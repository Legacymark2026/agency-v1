const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Capture all console logs
  page.on('console', msg => {
    console.log(`[BROWSER CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}`);
  });

  // Capture page errors
  page.on('pageerror', err => {
    console.error(`[BROWSER ERROR]: ${err.toString()}`);
  });

  console.log('Navigating to https://legacymarksas.com/es ...');
  try {
    await page.goto('https://legacymarksas.com/es', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    console.log('Page loaded. Waiting 5 seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    const screenshotPath = path.join(__dirname, 'live-screenshot.png');
    console.log(`Saving screenshot to ${screenshotPath}...`);
    await page.screenshot({ path: screenshotPath, fullPage: true });

    // Extract basic page info
    const info = await page.evaluate(() => {
      const main = document.querySelector('main');
      const errDebug = document.getElementById('seo-debug-errors');
      return {
        title: document.title,
        mainHtml: main ? main.innerHTML.substring(0, 500) : 'NO MAIN FOUND',
        bodyBgColor: window.getComputedStyle(document.body).backgroundColor,
        mainBgColor: main ? window.getComputedStyle(main).backgroundColor : 'N/A',
        childCount: main ? main.children.length : 0,
        seoDebugErrors: errDebug ? errDebug.innerHTML : null
      };
    });

    console.log('Page evaluation info:', info);

  } catch (error) {
    console.error('Error during execution:', error);
  } finally {
    await browser.close();
    console.log('Browser closed.');
  }
})();
