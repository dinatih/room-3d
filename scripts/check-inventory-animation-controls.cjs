const assert = require('node:assert/strict');
const launch = require('./browser-test-options.cjs');
(async () => {
 const browser = await launch({ args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
 try {
  const page = await browser.newPage(), errors = [];
  page.on('pageerror', error => { errors.push(error.message); console.error(error.stack); });
  await page.setRequestInterception(true);
  page.on('request', r => { const u = new URL(r.url()); return ['blob:', 'data:'].includes(u.protocol) || ['localhost', '127.0.0.1'].includes(u.hostname) ? r.continue() : r.abort(); });
  await page.setViewport({ width: 1200, height: 1000 });
  await page.goto((process.env.ROOM_TEST_URL || 'http://127.0.0.1:5191') + '/AGENTS.md?skeleton=1');
  await page.addStyleTag({ path: 'node_modules/bootstrap/dist/css/bootstrap.min.css' });
  await page.evaluate(async () => {
   (await import('/@react-refresh')).default.injectIntoGlobalHook(window);
   window.$RefreshReg$ = () => {}; window.$RefreshSig$ = () => type => type; window.__vite_plugin_react_preamble_installed__ = true;
   const transformed = await (await fetch('/src/features/scene/useGLTFClone.ts')).text();
   const url = transformed.match(/from ["']([^"']*react-three_drei\.js[^"']*)["']/)[1];
   const { useGLTF } = await import(url); useGLTF.setDecoderPath('/draco/');
   const preload = useGLTF.preload; useGLTF.preload = () => {};
   const { InventoryPreview } = await import('/src/features/inventory/InventoryPreview.tsx');
   useGLTF.preload = preload;
   window.__sceneKeyCalls = 0;window.addEventListener('keydown', e => { if (e.key === 'k') window.__sceneKeyCalls++; });
   const React = (await import('/node_modules/.vite/deps/react.js')).default;
   const { createRoot } = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
   const { INVENTORY } = await import('/src/features/inventory/inventoryData.ts');
   function Harness() {
    const [id, setId] = React.useState('ushiro'); window.selectPreviewItem = setId;
    return React.createElement('div', { 'data-preview-item': id }, React.createElement(InventoryPreview, { item: INVENTORY.find(item => item.id === id), height: '650px', neutralLighting: true, showPhotoGallery: false, defaultAutoRotate: false, defaultShowMiniPerf: false }));
   }
   const container = document.createElement('div'); document.body.replaceChildren(container);createRoot(container).render(React.createElement(Harness));
  });
  await page.waitForSelector('select[aria-label="Animation"]', { timeout: 60000 });
  await page.waitForFunction(() => document.querySelector('[aria-label="Nombre d’animations"]').textContent.trim() === '1 / 119');
  assert.equal(await page.$eval('button[aria-label="Squelette"]', e => e.getAttribute('aria-pressed')), 'true');
  await page.click('button[aria-label="Animation suivante"]');
  assert.equal(await page.$eval('select[aria-label="Animation"]', e => e.value), 'walk_fwd 29');
  await page.click('button[aria-label="Animation précédente"]');
  assert.equal(await page.$eval('select[aria-label="Animation"]', e => e.value), 'idle 50');
  for (const id of ['animated-pitbull-dog', 'dachshund-sculpt', 'ushiro']) {
   await page.evaluate(id => window.selectPreviewItem(id), id);
   await page.waitForFunction(id => document.querySelector('[data-preview-item]')?.dataset.previewItem === id, {}, id);
   await page.waitForSelector('button[aria-label="Squelette"][aria-pressed="true"]');
   assert.equal(new URL(page.url()).searchParams.get('skeleton'), '1');
   await page.waitForFunction(() => document.querySelector('a[title="Comparer Pitbull, Ushiro et Ulotte HD"]'));
  }
  await page.click('button[aria-label="Squelette"]');

  await page.waitForFunction(() => !new URL(location.href).searchParams.has('skeleton'));
  assert.equal(await page.evaluate(() => new URL(location.href).searchParams.has('skeleton')), false);
  await page.evaluate(() => window.selectPreviewItem('animated-pitbull-dog'));
  await page.waitForSelector('button[aria-label="Squelette"][aria-pressed="false"]');
  await page.keyboard.press('k');
  await page.waitForSelector('button[aria-label="Squelette"][aria-pressed="true"]');
  assert.equal(await page.evaluate(() => window.__sceneKeyCalls), 0);
  assert.deepEqual(errors, []);
  console.log('PASS: animal previous/next/count, skeleton URL and state retained while switching models.');
 } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
