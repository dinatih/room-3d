const launch = require('../../scripts/browser-test-options.cjs');
(async () => {
  const browser = await launch({ args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1000, height: 850 });
    await page.setRequestInterception(true);
    page.on('request', req => ['localhost', '127.0.0.1'].includes(new URL(req.url()).hostname) || req.url().startsWith('data:') ? req.continue() : req.abort());
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto((process.env.COOKING_TEST_ORIGIN || 'http://127.0.0.1:5173') + '/tests/visual/kitchen-cooking.html');
    await page.waitForFunction(() => typeof window.setCooking === 'function');
    await new Promise(r => setTimeout(r, 5000));
    for (const recipe of ['rice', 'macaroni', 'semolina']) {
      for (const elapsed of [0, 2, 4, 7, 14, 15]) {
        await page.evaluate((recipe, elapsed) => window.setCooking(recipe, elapsed), recipe, elapsed);
        await new Promise(r => setTimeout(r, 120));
        await page.screenshot({ path: `/tmp/cooking-${recipe}-${elapsed}.png` });
      }
    }
    await page.evaluate(() => window.setCooking(null, 0));
    await page.screenshot({ path: '/tmp/cooking-cancelled.png' });
    if (errors.length) throw Error(errors.join('\n'));
    console.log('Three recipes rendered at six phases; no browser exceptions.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
