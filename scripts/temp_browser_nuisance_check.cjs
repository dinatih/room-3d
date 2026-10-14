const assert = require('node:assert/strict');
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const launchBrowser = require('./browser-test-options.cjs');
(async () => {
  const events = execFileSync('hyprctl', ['-j', 'clients'], { encoding: 'utf8' });
  const before = new Set(JSON.parse(events).map(c => c.address));
  const log = fs.createWriteStream('/tmp/room-browser-verification.log');
  const browser = await launchBrowser({ headless: false, args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
  try {
    const args = browser.process().spawnargs;
    assert.ok(args.some(a => a.startsWith('--headless')));
    assert.ok(args.includes('--codex-browser-test=room-3d'));
    const page = await browser.newPage();
    const error = new Promise(resolve => page.once('pageerror', e => { log.write(`pageerror: ${e.message}\n`); resolve(e.message); }));
    await page.setContent('<h1>Codex headless verification</h1><script>setTimeout(() => { throw new Error("intentional-log-check"); }, 0)</script>');
    assert.match(await error, /intentional-log-check/);
    for (let i = 0; i < 20; i++) {
      const clients = JSON.parse(execFileSync('hyprctl', ['-j', 'clients'], { encoding: 'utf8' }));
      assert.equal(clients.filter(c => c.pid === browser.process().pid || (!before.has(c.address) && /chrome|chromium/i.test(c.class))).length, 0);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    log.write(`PASS: ${await browser.version()}; headless; no Hyprland browser window in 20 samples\n`);
    console.log('PASS: headless enforced even with headless:false; no browser window; page error logged.');
  } finally { await browser.close(); log.end(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
