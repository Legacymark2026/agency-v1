const puppeteer = require('puppeteer');

async function testDomain(url) {
    let browser;
    try {
        console.log(`📸 [${url}] Launching Puppeteer...`);
        browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
        });
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });
        await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");
        
        console.log(`🌐 [${url}] Navigating...`);
        try {
            await page.goto(url, { waitUntil: "load", timeout: 20000 });
        } catch (gotoErr) {
            console.warn(`⚠️ [${url}] Goto warning:`, gotoErr.message);
        }
        
        console.log(`📸 [${url}] Capturing screenshot...`);
        const buffer = await page.screenshot({
            type: "jpeg",
            quality: 70,
            encoding: "base64"
        });
        console.log(`✅ [${url}] Success! Screenshot size: ${buffer.length} chars`);
    } catch (err) {
        console.error(`❌ [${url}] Puppeteer failed:`, err);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

async function runAll() {
    await testDomain("https://google.com");
    await testDomain("https://juanvaldez.com");
    await testDomain("https://github.com");
}

runAll();
