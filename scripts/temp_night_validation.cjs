const assert = require('node:assert/strict');
const fs = require('node:fs');
const launch = require('./browser-test-options.cjs');
(async () => {
  const { createServer } = await import('vite');
  const server = await createServer({ server: { host: '127.0.0.1', port: 5179, strictPort: true } });
  let browser;
  try {
    await server.listen();
    browser = await launch({ args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
    const page = await browser.newPage();
    await page.goto('http://127.0.0.1:5179');
    const result = await page.evaluate(async () => {
      const { daylight } = await import('/src/features/scene/DayNight.tsx');
      const hours = [0, 6, 7, 8, 12, 18, 20, 22, 24];
      return hours.map(hour => ({ hour, light: daylight(hour), moonY: Math.sin(((hour + 6) % 24) / 24 * Math.PI * 2) }));
    });
    for (const { hour, light, moonY } of result) {
      assert.ok(Number.isFinite(light) && light >= 0 && light <= 1);
      if ([0, 6, 22, 24].includes(hour)) assert.equal(light, 0);
      if ([8, 12, 18].includes(hour)) assert.equal(light, 1);
      if (hour === 0) assert.ok(moonY > 0);
      if (hour === 12) assert.ok(moonY < 0);
    }
    fs.writeFileSync('/tmp/room-night-validation.json', JSON.stringify(result, null, 2));
    console.log('PASS: browser-loaded day/night curves and lunar trajectory');
  } finally {
    if (browser) await browser.close();
    await server.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
