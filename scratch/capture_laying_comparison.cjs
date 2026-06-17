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

  page.on('console', msg => {
    console.log('[BROWSER CONSOLE]', msg.text());
  });

  page.on('pageerror', err => {
    console.log('[BROWSER ERROR]', err.toString());
  });

  console.log("Navigating to http://localhost:5174/lara_xbot_debug.html...");
  try {
    await page.goto('http://localhost:5174/lara_xbot_debug.html', { waitUntil: 'load' });
  } catch (e) {
    console.error("Failed to load. Dev server running on port 5174?", e.message);
    await browser.close();
    return;
  }

  console.log("Waiting 4 seconds for assets to load...");
  await new Promise(r => setTimeout(r, 4000));

  // Capture Laying Idle (works)
  console.log("Selecting Laying Idle...");
  await page.evaluate(() => {
    const select = document.getElementById('select-anim');
    const options = Array.from(select.options);
    const targetOpt = options.find(opt => opt.text.includes('Laying Idle (anim_laying_idle.glb)'));
    if (targetOpt) {
      select.value = targetOpt.value;
      select.dispatchEvent(new Event('change'));
    }
  });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: '/home/dinatih/.gemini/antigravity-cli/brain/6cf40343-2557-4162-94fd-538f17d2073c/laying_idle_ok.png' });
  console.log("Saved laying_idle_ok.png");

  // Capture Laying Idle 1 (buggy)
  console.log("Selecting Laying Idle 1...");
  await page.evaluate(() => {
    const select = document.getElementById('select-anim');
    const options = Array.from(select.options);
    const targetOpt = options.find(opt => opt.text.includes('Laying Idle 1 (anim_laying_idle_1.glb)'));
    if (targetOpt) {
      select.value = targetOpt.value;
      select.dispatchEvent(new Event('change'));
    }
  });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: '/home/dinatih/.gemini/antigravity-cli/brain/6cf40343-2557-4162-94fd-538f17d2073c/laying_idle_1_bug.png' });
  console.log("Saved laying_idle_1_bug.png");

  await browser.close();
})();
