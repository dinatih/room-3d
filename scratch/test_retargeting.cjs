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

  console.log("Navigating to http://localhost:5174/lara_xbot_debug.html...");
  try {
    await page.goto('http://localhost:5174/lara_xbot_debug.html', { waitUntil: 'load' });
  } catch (e) {
    console.error("Failed to load page. Is the dev server running on port 5174?", e.message);
    await browser.close();
    return;
  }

  console.log("Waiting 4 seconds for models and animations to load...");
  await new Promise(r => setTimeout(r, 4000));

  // Let's select the "laying_idle_1" animation from the dropdown
  await page.evaluate(() => {
    const select = document.getElementById('select-anim');
    const options = Array.from(select.options);
    const targetOpt = options.find(opt => opt.text.includes('Laying Idle 1 (anim_laying_idle_1.glb)') || opt.value.includes('anim_laying_idle_1.glb'));
    if (targetOpt) {
      select.value = targetOpt.value;
      select.dispatchEvent(new Event('change'));
      console.log("Selected animation:", targetOpt.value);
    } else {
      console.log("Could not find 'laying_idle' animation in dropdown!");
    }
  });

  console.log("Waiting 4 seconds for animation to play...");
  await new Promise(r => setTimeout(r, 4000));

  console.log("Taking screenshot of the models...");
  await page.screenshot({ path: 'scratch/test_retargeting_result.png' });

  fs.writeFileSync('scratch/browser_logs.txt', logs.join('\n'));
  console.log("Screenshot saved to scratch/test_retargeting_result.png");

  await browser.close();
})();
