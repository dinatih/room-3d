const launchBrowser = require('./browser-test-options.cjs');
const assert = require('node:assert/strict');
const puppeteer = require('puppeteer');
(async () => {
 const browser = await launchBrowser({ headless: true, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
 try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') console.error(m.text()); });
  page.on('pageerror', e => { errors.push(e.message); console.error(e.message); });
  await page.goto('http://127.0.0.1:5174/scripts/temp_object_actions_harness.html');
  await page.waitForFunction(() => window.previewScene && window.hoverState.onUpdate);
  const registry = await page.evaluate(() => {
   const { getActionDef, getPreviewActionIds, toggleObjectAction, getNextActionValue, getActionLabel } = window.actions;
   if (getActionLabel('fridge', false) !== 'Ouvrir' || getActionLabel('fridge', true) !== 'Fermer') throw new Error('shared labels');
   if (getNextActionValue('airPerformerMode', 'auto') !== 'cool' || getNextActionValue('airPerformerSpeed', 10) !== 3) throw new Error('shared cycles');
   window.store.getState().triggerAction('fridge-crisper-toggle', true);
   if (!window.store.getState().furniture.fridge) throw new Error('scene crisper must open fridge');
   window.store.getState().triggerAction('fridge', false);
   if (window.store.getState().extraStates['fridge-crisper-toggle']) throw new Error('scene door must close crisper');
   for (const id of ['entryDoor','livingDoor','bathroomDoor','eastGlassDoor','glassDoorV2LeftOpen']) {
    let pushed; const handler = e => pushed = e.detail.key; document.addEventListener('door-push', handler);
    window.store.getState().triggerAction(id); document.removeEventListener('door-push', handler);
    if (pushed !== id) throw new Error('shared door event ' + id);
   }
   for (const item of window.items) for (const id of window.getObjectActionIds(item.id)) if (!getActionDef(id)) throw new Error(`${item.id}/${id}`);
   let fridge = toggleObjectAction('fridge-crisper-toggle', {});
   if (!fridge['fridge']) throw new Error('crisper must open fridge');
   fridge = toggleObjectAction('fridge', fridge);
   if (fridge['fridge-crisper-toggle']) throw new Error('closing fridge must close crisper');
   let state = {};
   const positions = [];
   for (let i = 0; i < 5; i++) { state = toggleObjectAction('glassDoorV2ShutterPos', state); positions.push(state['glassDoorV2ShutterPos']); }
   return { tv: getPreviewActionIds('tv'), laptop: getPreviewActionIds('laptop'), shutters: positions };
  });
  assert.deepEqual(registry.tv, ['tv-toggle', 'desk2-screen-toggle']);
  assert.deepEqual(registry.laptop, ['desk2-screen-toggle']);
  assert.deepEqual(registry.shutters, [70, 90, 100, 0, 70]);
  for (const item of ['tv', 'laptop']) {
   await page.evaluate(id => { window.previousScene = window.previewScene; window.setItem(id); }, item);
   if (item === 'laptop') await page.waitForFunction(() => window.previewScene !== window.previousScene && window.previewScene.children.length > 0);
   await page.waitForFunction(item => document.querySelectorAll('[data-object-action]').length === (item === 'tv' ? 2 : 1), {}, item);
   await page.waitForSelector('[data-object-action="desk2-screen-toggle"]');
   await page.waitForFunction(() => window.videoMaps().length === 0);
   await page.$eval('[data-object-action="desk2-screen-toggle"]', button => button.click());
   try { await page.waitForFunction(() => window.videoMaps()[0]?.image.videoWidth === 1280 && !window.videoMaps()[0].image.paused); } catch (e) { console.error(await page.evaluate(() => ({ buttons: [...document.querySelectorAll('[data-object-action]')].map(b => [b.textContent, b.getAttribute('aria-pressed')]), videos: window.videoMaps().map(t => ({ width: t.image.videoWidth, paused: t.image.paused, src: t.image.src, error: t.image.error?.message })), children: window.previewScene.children.map(o => [o.type, o.children.length]) }))); throw e; }
   assert.equal(await page.$eval('[data-object-action="desk2-screen-toggle"]', e => e.getAttribute('aria-pressed')), 'true');
   assert.equal(await page.evaluate(() => !!window.store.getState().extraStates.desk2Screen), false, 'preview action must not change apartment state');
   await page.evaluate(() => { window.oldVideo = window.videoMaps()[0].image; });
   await page.$eval('[data-object-action="desk2-screen-toggle"]', button => button.click());
   await page.waitForFunction(() => window.videoMaps().length === 0 && window.oldVideo.paused && !window.oldVideo.getAttribute('src'));
   // Global scene activation must not start the preview.
   await page.evaluate(() => window.store.getState().triggerAction('desk2-screen-toggle', true));
   await new Promise(r => setTimeout(r, 150));
   assert.equal(await page.evaluate(() => window.videoMaps().length), 0);
   await page.evaluate(() => window.store.getState().triggerAction('desk2-screen-toggle', false));
   console.log(`${item}: actual preview button plays/stops video independently from scene.`);
  }
  await page.evaluate(() => {
   const h = window.hoverState;
   Object.assign(h, { locked: true, lockedLabel: 'TV', lockedX: 600, lockedY: 200, lockedActionIds: window.getObjectActionIds('tv') }); h.onUpdate();
  });
  await page.waitForFunction(() => [...document.querySelectorAll('button.btn-outline-warning')].some(e => e.textContent.trim() === 'Allumer'));
  await page.evaluate(() => [...document.querySelectorAll('button.btn-outline-warning')].find(e => e.textContent.trim() === 'Allumer').click());
  assert.equal(await page.evaluate(() => window.store.getState().furniture.tvOn), true, 'scene TV action must be available');
  for (const [id, expected] of [['door-glass', ['eastGlassDoor', 'glassDoorV2LeftOpen', 'glassDoorV2ShutterPos']], ['sdb-closet', ['sdbClosetL', 'sdbClosetR']], ['air-performer', ['airPerformerPower', 'airPerformerMode', 'airPerformerSpeed']]]) {
   await page.evaluate(id => window.setItem(id), id);
   await page.waitForFunction(expected => expected.every(id => document.querySelector(`[data-object-action="${id}"]`)), {}, expected);
  }
  assert.deepEqual(errors, []);
  console.log('Shared registry, inventory associations, fridge rules, shutter cycle and scene TV action passed.');
 } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
