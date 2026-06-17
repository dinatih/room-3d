const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  console.log("Launching browser...");
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    logs.push(text);
    console.log('[Browser Console]:', text);
  });

  const url = 'http://localhost:5175/lara_xbot_debug.html';
  console.log(`Navigating to ${url}...`);
  try {
    await page.goto(url, { waitUntil: 'networkidle2' });
  } catch (e) {
    console.error("Navigation failed:", e.message);
    await browser.close();
    process.exit(1);
  }

  // Wait for loading screen to disappear
  console.log("Waiting for initialization...");
  await new Promise(r => setTimeout(r, 4500));

  // Select catwalk animation
  console.log("Selecting catwalk animation...");
  await page.select('#select-anim', 'media/sandbox/anim_catwalk_walking_not_in_place.glb');
  
  // Wait for it to play
  console.log("Playing animation for 5 seconds...");
  await new Promise(r => setTimeout(r, 5000));

  // Capture screenshot
  const screenshotPath = 'scratch/catwalk_debug_verify.png';
  console.log(`Taking screenshot: ${screenshotPath}...`);
  await page.screenshot({ path: screenshotPath });

  fs.writeFileSync('scratch/catwalk_browser_logs.txt', logs.join('\n'));
  
  await browser.close();
  console.log("Verification complete.");
})();
