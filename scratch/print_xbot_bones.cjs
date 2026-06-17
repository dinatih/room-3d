const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: "new"
  });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(msg.text());
  });

  try {
    await page.goto('http://localhost:5174/lara_xbot_debug.html', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForSelector('#visible-lara', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 4000));
    
    await page.evaluate(() => {
      console.log("=== X-BOT BONE ANALYSIS ===");
      const xbot = MODELS_META.xbot.instance;
      if (!xbot) {
        console.log("X-Bot instance not found!");
        return;
      }
      xbot.updateMatrixWorld(true);
      xbot.traverse(c => {
        if (c.isBone) {
          const worldPos = new THREE.Vector3();
          c.getWorldPosition(worldPos);
          console.log(`BONE: ${c.name} | worldPos: [${worldPos.x.toFixed(3)}, ${worldPos.y.toFixed(3)}, ${worldPos.z.toFixed(3)}]`);
        }
      });
    });
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await browser.close();
  }
})();
