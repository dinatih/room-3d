const assert = require('node:assert/strict');
const launch = require('./browser-test-options.cjs');
(async () => {
 const browser = await launch({args:['--no-sandbox','--enable-unsafe-swiftshader'], defaultViewport:{width:1200,height:800}});
 try {
 const page = await browser.newPage();
 page.on('pageerror', e => console.error(e));
 await page.setRequestInterception(true);
 page.on('request', req => req.isNavigationRequest() ? req.respond({contentType:'text/html',body:'<div id="root"></div><script type="module">import RefreshRuntime from "/@react-refresh"; RefreshRuntime.injectIntoGlobalHook(window); window.$RefreshReg$ = () => {}; window.$RefreshSig$ = () => (type) => type; window.__vite_plugin_react_preamble_installed__ = true;</script><script type="module" src="/scripts/temp_wig_alignment.tsx"></script>'}) : req.continue());
 await page.goto('http://127.0.0.1:5173');
 await page.waitForFunction(() => window.inspectWigs?.().length === 4, {timeout:120000});
 const rest = await page.evaluate(() => window.inspectWigs());
 console.log('rest', JSON.stringify(rest));
 for (const item of rest) { assert.ok(Math.abs(item.head[0]) < 1e-5); assert.ok(Math.abs(item.head[1]) < 1e-5); assert.ok(Math.abs(item.head[2]) < 1e-5); }
 await page.evaluate(() => window.setView(false));
 await page.screenshot({path:'/tmp/wig-alignment-rest.png'});
 await page.evaluate(() => window.setView(true));
 await page.screenshot({path:'/tmp/wig-alignment-profile.png'});
 await page.evaluate(() => window.setView(false));
 await page.evaluate(() => window.setWind(true));
 await new Promise(resolve => setTimeout(resolve,2000));
 const wind = await page.evaluate(() => window.inspectWigs());
 wind.forEach((item,i) => { assert.deepEqual(item.head,rest[i].head); assert.deepEqual(item.fixed,rest[i].fixed); });
 await page.screenshot({path:'/tmp/wig-alignment-wind.png'});
 await page.evaluate(() => window.setWind(false));
 await page.waitForFunction(expected => JSON.stringify(window.inspectWigs()) === expected, {}, JSON.stringify(rest));
 console.log('PASS: anchors and scalp stable, rest pose restored');
 const wigs = await page.evaluate(() => window.wigs);
 for (let i = 0; i < wigs.length; i += 2) {
  const batch = wigs.slice(i, i+2);
  await page.evaluate(ids => window.setSelected(ids), batch.map(w => w.id));
  await page.waitForFunction(paths => { const items = window.inspectWigs(); return items.length === paths.length*2 && items.every(item => paths.includes(item.path)); }, {timeout:120000}, batch.map(w => w.path));
  const baseline = await page.evaluate(() => window.inspectWigs());
  for (const item of baseline) {
   const offsetY = item.path.endsWith('/lara_native_hair.glb') ? -0.0367 * 90 : item.path.endsWith('/wavy_ponytail.glb') ? -0.05 * 90 : 0;
   item.head.forEach((v, axis) => assert.ok(Math.abs(v - (axis === 1 ? offsetY : 0)) < 1e-5, JSON.stringify(item)));
   if (/\/wig_1(?:0[0-9]|1[0-2])\.glb$/.test(item.path)) {
    assert.ok(Math.abs(item.forward[0]) < 1e-3 && Math.abs(item.forward[1]) < 1e-3 && item.forward[2] > 1-1e-3, JSON.stringify(item));
   }
   item.size.forEach(v => assert.ok(Number.isFinite(v) && v > 0));
  }
  await page.evaluate(() => window.setWind(true));
  await new Promise(resolve => setTimeout(resolve,100));
  const moving = await page.evaluate(() => window.inspectWigs());
  moving.forEach((item,j) => { assert.deepEqual(item.head, baseline[j].head); assert.deepEqual(item.fixed,baseline[j].fixed); });
  await page.evaluate(() => window.setWind(false));
  console.log('PASS',batch.map(w => w.id).join(', '));
 }

 } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
