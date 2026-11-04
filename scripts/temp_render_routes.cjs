const assert = require('node:assert/strict');
const launch = require('./browser-test-options.cjs');
(async () => {
  const browser = await launch();
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    const response = await page.goto('http://127.0.0.1:5174/render-jobs');
    assert.equal(response.status(), 200);
    await page.waitForFunction(() => document.querySelector('main')?.textContent.includes('Aucun rendu envoyé'), { timeout: 10000 });
    assert.equal(await page.title(), 'Rendus locaux');
    assert.deepEqual(errors, []);
    console.log('PASS: redirect, dashboard JavaScript and API polling in Chromium.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
