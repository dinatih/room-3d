const assert = require('node:assert/strict');
const puppeteer = require('../node_modules/puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewport({ width: 800, height: 600 });
    await page.goto('http://127.0.0.1:5173/AGENTS.md?mode=orbit');
    await page.evaluate(async () => {
      const refresh = (await import('/@react-refresh')).default;
      refresh.injectIntoGlobalHook(window);
      window.$RefreshReg$ = () => {};
      window.$RefreshSig$ = () => type => type;
      window.__vite_plugin_react_preamble_installed__ = true;
      const React = (await import('/node_modules/.vite/deps/react.js')).default;
      const { createRoot } = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
      const { Canvas, useThree } = await import('/node_modules/.vite/deps/@react-three_fiber.js');
      const { HoverRaycaster, HoverOverlay } = await import('/src/features/scene/HoverMenu.tsx');
      const { hoverState } = await import('/src/features/scene/hoverState.ts');
      document.body.replaceChildren();
      document.body.style.margin = '0';
      const container = document.createElement('div');
      container.style.width = '800px';
      container.style.height = '500px';
      const overlay = document.createElement('div');
      document.body.append(container, overlay);
      const root = createRoot(container);
      const overlayRoot = createRoot(overlay);
      window.fixture = { hoverState, root };
      function Capture() {
        const state = useThree();
        React.useLayoutEffect(() => { Object.assign(window.fixture, state); }, [state]);
        return null;
      }
      root.render(React.createElement(Canvas, { camera: { position: [0, 0, 10] } },
        React.createElement(Capture), React.createElement(HoverRaycaster),
        React.createElement('group', { name: 'target', userData: { hoverAction: { label: 'Porte', actionId: 'entryDoor' } } },
          React.createElement('mesh', null, React.createElement('boxGeometry', { args: [2, 2, 2] }), React.createElement('meshBasicMaterial')))));
      overlayRoot.render(React.createElement(HoverOverlay));
    });
    await page.waitForFunction(() => window.fixture?.camera);
    const isVisible = () => page.$eval('.hover-dot-indicator', dot => getComputedStyle(dot).display !== 'none');
    const hover = async () => {
      await page.mouse.move(400, 250);
      await page.waitForFunction(() => window.fixture.hoverState.visible);
      assert.equal(await isVisible(), true);
    };
    await hover();
    await page.mouse.move(790, 490);
    await page.waitForFunction(() => !window.fixture.hoverState.visible);
    assert.equal(await isVisible(), false);
    console.log('Leaving the object hides the indicator: OK');
    await hover();
    await page.evaluate(() => {
      window.fixture.camera.position.x = 20;
      window.fixture.camera.updateMatrixWorld();
    });
    await page.waitForFunction(() => !window.fixture.hoverState.visible);
    assert.equal(await isVisible(), false);
    console.log('Camera movement with stationary pointer: OK');
    await page.evaluate(() => { window.fixture.camera.position.x = 0; window.fixture.camera.updateMatrixWorld(); });
    await page.waitForFunction(() => window.fixture.hoverState.visible);
    await page.mouse.move(400, 550);
    await page.waitForFunction(() => !window.fixture.hoverState.visible);
    assert.equal(await isVisible(), false);
    console.log('Leaving the canvas: OK');
    await hover();
    await page.mouse.click(400, 250);
    await page.waitForFunction(() => window.fixture.hoverState.locked);
    await page.mouse.move(790, 490);
    await page.waitForFunction(() => !window.fixture.hoverState.visible);
    assert.equal(await page.evaluate(() => window.fixture.hoverState.locked), true);
    await page.keyboard.press('Escape');
    assert.equal(await isVisible(), false);
    console.log('Pinned menu survives leaving; Escape does not restore stale dot: OK');
    await hover();
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    await page.waitForFunction(() => !window.fixture.hoverState.visible);
    console.log('Window losing focus: OK');
    await page.mouse.move(790, 490);
    await page.mouse.move(400, 250);
    await page.evaluate(() => {
      const camera = window.fixture.camera.clone();
      camera.position.x = 20;
      camera.updateMatrixWorld();
      window.fixture.set({ camera });
    });
    await new Promise(resolve => setTimeout(resolve, 600));
    assert.equal(await isVisible(), false);
    console.log('Camera replacement cancels pending appearance: OK');
    await page.evaluate(() => { window.fixture.camera.position.x = 0; window.fixture.camera.updateMatrixWorld(); });
    await hover();
    await page.evaluate(() => { window.fixture.scene.getObjectByName('target').visible = false; });
    await page.mouse.move(401, 250);
    await page.waitForFunction(() => !window.fixture.hoverState.visible);
    console.log('Invisible ancestor cannot remain hoverable: OK');
    await page.evaluate(() => { window.fixture.scene.getObjectByName('target').visible = true; });
    await page.mouse.move(790, 490);
    await page.mouse.move(400, 250);
    await page.evaluate(() => window.fixture.root.unmount());
    await new Promise(resolve => setTimeout(resolve, 600));
    assert.equal(await page.evaluate(() => window.fixture.hoverState.visible), false);
    assert.equal(await isVisible(), false);
    console.log('Unmount cancels pending appearance: OK');
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
