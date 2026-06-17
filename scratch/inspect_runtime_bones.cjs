const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: "new"
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });

  try {
    await page.goto('http://localhost:5174/stare_debug.html', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 6000)); // wait for model load

    const bonePositions = await page.evaluate(() => {
      if (!window.mainModel) return { error: "mainModel not loaded" };
      
      const results = [];
      window.mainModel.traverse(c => {
        if (c.isBone && (c.name.includes('rootJoint') || c.name.includes('Hips'))) {
          const m = c.matrixWorld.elements;
          results.push({
            name: c.name,
            localPos: [c.position.x.toFixed(4), c.position.y.toFixed(4), c.position.z.toFixed(4)],
            worldPos: [m[12].toFixed(4), m[13].toFixed(4), m[14].toFixed(4)],
            parent: c.parent ? c.parent.name : null
          });
        }
      });
      return results;
    });

    console.log(JSON.stringify(bonePositions, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await browser.close();
  }
})();
