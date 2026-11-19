const assert = require('node:assert/strict');
const fs = require('node:fs');
const launch = require('./browser-test-options.cjs');
const base = process.env.ROOM_TEST_URL || 'http://127.0.0.1:5191';
const output = 'artifacts/dog-comparison';
(async () => {
 fs.mkdirSync(output, { recursive: true });
 const browser = await launch({ args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
 try {
  const page = await browser.newPage(), errors = [];
  page.on('pageerror', error => { errors.push(error.message); console.error(error.stack); });
  await page.setRequestInterception(true);
  page.on('request', request => {
   const url = new URL(request.url());
   return ['data:', 'blob:'].includes(url.protocol) || ['localhost', '127.0.0.1'].includes(url.hostname) ? request.continue() : request.abort();
  });
  await page.setViewport({ width: 1600, height: 1000 });
  await page.goto(base + '/dog-comparison.html?skeleton=1&clip=walk_fwd%2029&frame=20');
  await page.waitForFunction(() => document.querySelectorAll('[data-model] canvas').length === 3 && !document.body.textContent.includes('Lecture du modèle…'), { timeout: 60000 });
  await page.waitForFunction(() => {
   const images = [...document.querySelectorAll('.dog-comparison-grid figure img')];
   return images.length === 3 && images.every(image => image.complete && image.naturalWidth > 0);
  });
  assert(await page.$$eval('.dog-comparison-grid > div', columns => columns.every(column => {
   const reference = column.querySelector('figure'), model = column.querySelector('section');
   return model.getBoundingClientRect().bottom <= reference.getBoundingClientRect().top;
  })));
  await page.screenshot({ path: `${output}/comparison-initial.png`, fullPage: true });
  async function state() {
   return page.evaluate(async () => {
    const transformed = await (await fetch('/src/features/dog-comparison/DogComparison.tsx')).text();
    const moduleUrl = transformed.match(/from ["']([^"']*react-three_fiber\.js[^"']*)["']/)[1];
    const { _roots } = await import(moduleUrl);
    return Array.from(_roots.values()).map(root => {
     const s = root.store.getState(); let model;
     s.scene.traverse(object => { if (object.userData.comparisonClip) model = object; });
     return { path: model?.userData.gltfPath, phase: model?.userData.comparisonPhase, clip: model?.userData.comparisonClip, direction: s.camera.position.clone().sub(s.controls.target).normalize().toArray(), zoom: s.camera.zoom };
    });
   });
  }
  await page.waitForFunction(async () => {
   const transformed = await (await fetch('/src/features/dog-comparison/DogComparison.tsx')).text();
   const moduleUrl = transformed.match(/from ["']([^"']*react-three_fiber\.js[^"']*)["']/)[1];
   const { _roots } = await import(moduleUrl);
   return Array.from(_roots.values()).every(root => { let ready = false; root.store.getState().scene.traverse(o => { if (Number.isFinite(o.userData.comparisonPhase)) ready = true; }); return ready; });
  });
  let models = await state();
  assert.equal(models.length, 3); assert(models.every(m => m.clip === 'walk_fwd 29'));
  assert(Math.max(...models.map(m => m.phase)) - Math.min(...models.map(m => m.phase)) < 1e-5);
  assert.equal(await page.$eval('button[aria-label="Squelette"]', e => e.getAttribute('aria-pressed')), 'true');
  assert.equal(await page.$eval('[aria-label="Nombre d’animations"]', e => e.textContent.trim()), '2 / 119');
  await page.click('button[aria-label="Animation suivante"]');
  await page.waitForFunction(() => document.querySelector('select[aria-label="Animation"]').value === 'run_fwd 13');
  await page.click('button[aria-label="Animation précédente"]');
  assert.equal(await page.$eval('select[aria-label="Animation"]', e => e.value), 'walk_fwd 29');
  const promoted = await page.$$eval('select[aria-label="Animation"] option', options => options.slice(0, 16).map(option => option.value));
  assert.deepEqual(promoted, ['idle 50', 'walk_fwd 29', 'run_fwd 13', 'idle_shake_1. 137', 'idle_shake_2. 81', 'interact_bed_lay_exist 270', 'interact_bed_sleep_exist 221', 'pee 43', 'walk_fwd_sniff 46', 'idle_to_idle_lay 111', 'idle_lay_pose 2', 'idle_lay_to_idle 71', 'poop 75', 'track_bark_harvest 75', 'canter_fwd 53', 'idle_bark_04_warning 47']);
  // Paused, exact common phases; screenshots show the actual three models.
  for (const frame of [0, 8, 16, 20, 24, 32]) {
   await page.$eval('input[aria-label="Image commune"]', (input, frame) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, String(frame)); input.dispatchEvent(new Event('input', { bubbles: true })); input.dispatchEvent(new Event('change', { bubbles: true }));
   }, frame);
   await page.waitForFunction(frame => document.querySelector('[data-testid="comparison-frame"]').textContent.includes('Image ' + frame + ' /'), {}, frame);
   await new Promise(resolve => setTimeout(resolve, 150));
   models = await state();
   assert(Math.max(...models.map(m => m.phase)) - Math.min(...models.map(m => m.phase)) < 1e-5);
   await page.screenshot({ path: `${output}/walk-frame-${String(frame).padStart(2,'0')}.png`, fullPage: true });
  }
  // Review the reported problem poses with the actual app materials and no
  // skeleton hiding the shoulder, belly or hip surface.
  await page.click('button[aria-label="Squelette"]');
  for (const clip of promoted.slice(3)) {
   await page.select('select[aria-label="Animation"]', clip);
   await new Promise(resolve => setTimeout(resolve, 150));
   const middle = await page.$eval('input[aria-label="Image commune"]', input => Math.floor(Number(input.max) / 2));
   await page.$eval('input[aria-label="Image commune"]', (input, frame) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, String(frame)); input.dispatchEvent(new Event('input', { bubbles: true })); input.dispatchEvent(new Event('change', { bubbles: true }));
   }, middle);
   await new Promise(resolve => setTimeout(resolve, 150));
   models = await state();
   assert(models.every(model => model.clip === clip));
   assert(Math.max(...models.map(m => m.phase)) - Math.min(...models.map(m => m.phase)) < 1e-5);
   await page.screenshot({ path: `${output}/priority-${clip.replace(/[^a-z0-9]+/gi, '-')}.png` });
  }
  await page.click('button[aria-label="Squelette"]');
  await page.select('select[aria-label="Animation"]', 'walk_fwd 29');
  await new Promise(resolve => setTimeout(resolve, 150));
  await page.$$eval('label', labels => labels.find(label => label.textContent.includes('Pose de référence')).querySelector('input').click());
  await page.waitForFunction(() => document.querySelector('fieldset').disabled);
  await new Promise(resolve => setTimeout(resolve, 150));
  models = await state();
  assert(models.every(model => model.clip === 'bind-pose' && model.phase === 0));
  assert.equal(new URL(page.url()).searchParams.get('referencePose'), '1');
  await page.screenshot({ path: `${output}/reference-pose.png`, fullPage: true });
  await page.$$eval('label', labels => labels.find(label => label.textContent.includes('Pose de référence')).querySelector('input').click());
  await new Promise(resolve => setTimeout(resolve, 150));
  assert((await state()).every(model => model.clip === 'walk_fwd 29'));
  // A drag in one viewport changes all three camera orientations together.
  const canvas = await page.$('[data-model="ushiro"] canvas'), box = await canvas.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down(); await page.mouse.move(box.x + box.width / 2 + 70, box.y + box.height / 2 + 30, { steps: 8 }); await page.mouse.up();
  models = await state();
  for (const model of models) for (let axis = 0; axis < 3; axis++) assert(Math.abs(model.direction[axis] - models[0].direction[axis]) < 1e-5);
  await page.select('select[aria-label="Disposition"]', 'rows');
  assert(new URL(page.url()).searchParams.get('layout') === 'rows');
  const panels = await page.$$eval('[data-model]', els => els.map(e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y }; }));
  assert(panels[1].y > panels[0].y && panels[2].y > panels[1].y);
  await page.reload();
  await page.waitForSelector('button[aria-label="Squelette"][aria-pressed="true"]');
  assert.equal(new URL(page.url()).searchParams.get('skeleton'), '1');
  assert.deepEqual(errors, []);
  console.log('PASS: common phase, 119-clip navigation/count, linked cameras, stacked layout, persistent skeleton, reference pose and exact-frame screenshots.');
 } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
