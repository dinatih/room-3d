const assert = require('node:assert/strict');
const launchBrowser = require('./browser-test-options.cjs');

(async () => {
  const browser = await launchBrowser({ args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:5173/AGENTS.md');
    await page.evaluate(async () => {
      const refresh = (await import('/@react-refresh')).default;
      refresh.injectIntoGlobalHook(window);
      window.$RefreshReg$ = () => {};
      window.$RefreshSig$ = () => type => type;
      window.__vite_plugin_react_preamble_installed__ = true;
      const React = (await import('/node_modules/.vite/deps/react.js')).default;
      const { createRoot } = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
      const { _roots } = await import('/node_modules/.vite/deps/@react-three_fiber.js');
      const { AnimationStudioView } = await import('/src/features/inventory/AnimationStudioView.tsx');
      const { STUDIO_CATALOG } = await import('/src/features/inventory/animationStudioCatalog.ts');
      const { useAnimPreviewStore } = await import('/src/features/inventory/useAnimPreviewStore.ts');
      await import('/node_modules/bootstrap/dist/css/bootstrap.min.css');
      await import('/src/index.css');
      document.body.replaceChildren();
      const container = document.createElement('div');
      container.style.height = '900px';
      document.body.append(container);
      createRoot(container).render(React.createElement(AnimationStudioView));
      window.transport = useAnimPreviewStore;
      window.duoLabel = STUDIO_CATALOG.duo[0].label;
      window.previewState = () => _roots.get(document.querySelector('.inventory-preview-renderer canvas')).store.getState();
    });
    await page.waitForFunction(() => window.transport.getState().duration > 0, { timeout: 120000 });
    for (const projection of ['persp', 'ortho']) {
      await page.evaluate(projection => {
        document.dispatchEvent(new CustomEvent('camera-view', { detail: { key: 'front', projection } }));
      }, projection);
      await new Promise(resolve => setTimeout(resolve, 500));
      const before = await page.evaluate(() => {
        const state = window.previewState();
        window.savedCanvas = document.querySelector('.inventory-preview-renderer canvas');
        window.savedCamera = state.camera;
        state.camera.position.set(123, 145, 345);
        state.camera.zoom = 1.7;
        state.camera.updateProjectionMatrix();
        state.controls.target.set(12, 67, 8);
        state.controls.update();
        const transport = window.transport.getState();
        transport.pause();
        transport.seekToTime(transport.duration / 2);
        transport.setSpeed(0.5);
        transport.setLooping(false);
        window.snapshot = () => {
          const { camera, controls } = window.previewState();
          const { currentTime, isPlaying, speed, isLooping, clipName } = window.transport.getState();
          return { position: camera.position.toArray(), quaternion: camera.quaternion.toArray(), zoom: camera.zoom,
            target: controls.target.toArray(), currentTime, isPlaying, speed, isLooping, clipName };
        };
        return window.snapshot();
      });
      const nextId = await page.$eval('[aria-label="Personnage testé"]', select =>
        [...select.options].find(option => option.value !== select.value && ['native', 'rosanna'].includes(option.value)).value);
      await page.select('[aria-label="Personnage testé"]', nextId);
      await new Promise(resolve => setTimeout(resolve, 4000));
      assert.equal(await page.evaluate(() => document.querySelector('.inventory-preview-renderer canvas') === window.savedCanvas), true);
      assert.equal(await page.evaluate(() => window.previewState().camera === window.savedCamera), true);
      assert.deepEqual(await page.evaluate(() => window.snapshot()), before);
      console.log(`${projection}: character replaced, canvas/camera/framing and paused animation transport preserved`);
    }
    await page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.textContent.startsWith('Duo (')).click());
    await page.waitForFunction(() => window.transport.getState().clipName === window.duoLabel && window.previewState().controls.target.y > 0, { timeout: 120000 });
    await new Promise(resolve => setTimeout(resolve, 4000));
    for (const role of ['Personnage testé', 'Partenaire du duo', 'swap']) {
      const before = await page.evaluate(() => {
        const transport = window.transport.getState();
        transport.pause();
        transport.seekToTime(transport.duration / 2);
        return window.snapshot();
      });
      if (role === 'swap') await page.click('[aria-label="Échanger les personnages"]');
      else {
        const selector = `[aria-label="${role}"]`;
        const nextId = await page.$eval(selector, select => [...select.options].find(option => option.value !== select.value).value);
        await page.select(selector, nextId);
      }
      await new Promise(resolve => setTimeout(resolve, 4000));
      assert.deepEqual(await page.evaluate(() => window.snapshot()), before);
      console.log(`duo ${role}: camera and paused animation transport preserved`);
    }
    const start = await page.evaluate(() => {
      const transport = window.transport.getState();
      transport.setLooping(true);
      transport.setSpeed(0.05);
      transport.seekToTime(transport.duration / 3);
      window.minimumTime = transport.currentTime;
      window.unsubscribe = window.transport.subscribe(state => { window.minimumTime = Math.min(window.minimumTime, state.currentTime); });
      transport.play();
      return window.transport.getState().currentTime;
    });
    await page.click('[aria-label="Échanger les personnages"]');
    await new Promise(resolve => setTimeout(resolve, 4000));
    const playback = await page.evaluate(() => {
      window.unsubscribe();
      return { minimum: window.minimumTime, time: window.transport.getState().currentTime, playing: window.transport.getState().isPlaying };
    });
    assert.ok(playback.minimum >= start, JSON.stringify({ start, playback }));
    assert.ok(playback.time > start);
    assert.equal(playback.playing, true);
    console.log('Playing duo swap: playback continues without rewinding');
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
