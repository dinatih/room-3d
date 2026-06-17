const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  console.log("Launching headless browser...");
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 1000 });

  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    console.log('[BROWSER CONSOLE]', text);
    logs.push(text);
  });

  page.on('pageerror', err => {
    console.log('[BROWSER ERROR]', err.toString());
    logs.push(err.toString());
  });

  console.log("Navigating to http://localhost:5173/lara_xbot_debug.html...");
  try {
    await page.goto('http://localhost:5173/lara_xbot_debug.html', { waitUntil: 'networkidle2' });
  } catch (e) {
    console.error("Failed to load page. Is the dev server running on port 5173?", e.message);
    await browser.close();
    return;
  }

  console.log("Waiting 3 seconds for models and animations to load...");
  await new Promise(r => setTimeout(r, 3000));

  console.log("Taking screenshot...");
  await page.screenshot({ path: 'scratch/current_state.png' });

  fs.writeFileSync('scratch/browser_logs.txt', logs.join('\n'));
  console.log("Screenshot saved to scratch/current_state.png and logs to scratch/browser_logs.txt");

  await browser.close();
})();
