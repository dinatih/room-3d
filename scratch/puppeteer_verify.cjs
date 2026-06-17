const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  console.log("Launching browser...");
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1024 });

  const logs = [];
  page.on('console', msg => {
    const t = msg.text();
    logs.push(t);
    if (t.includes('WALKER_DEBUG') || t.includes('PropertyBinding') || t.includes('ANIM_DEBUG')) {
      console.log('BROWSER:', t);
    }
  });

  console.log("Navigating to http://localhost:5173...");
  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  } catch (e) {
    console.error("Navigation failed. Server running?");
    await browser.close(); return;
  }

  // Set walk mode and switch to X-Bot (index 1)
  console.log("Switching to X-Bot (Key 'L')...");
  await page.keyboard.press('KeyL');
  await new Promise(r => setTimeout(r, 2000));
  
  // Start walking
  console.log("Starting movement (ArrowUp)...");
  await page.keyboard.down('ArrowUp');
  await new Promise(r => setTimeout(r, 3000));
  await page.keyboard.up('ArrowUp');

  console.log("Taking diagnostic screenshot: scratch/xbot_studio_check.png");
  await page.screenshot({ path: 'scratch/xbot_studio_check.png' });

  fs.writeFileSync('scratch/browser_logs.txt', logs.join('\n'));
  
  await browser.close();
  console.log("Diagnostic complete. Logs saved to scratch/browser_logs.txt");
})();
