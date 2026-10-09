const assert = require('node:assert/strict');
const puppeteer = require('../node_modules/puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewport({ width: 900, height: 700 });
    await page.goto(`${process.argv[2] || 'http://127.0.0.1:5174'}/AGENTS.md`);
    await page.evaluate(async () => {
      const refresh = (await import('/@react-refresh')).default;
      refresh.injectIntoGlobalHook(window);
      window.$RefreshReg$ = () => {};
      window.$RefreshSig$ = () => type => type;
      window.__vite_plugin_react_preamble_installed__ = true;
      const React = (await import('/node_modules/.vite/deps/react.js')).default;
      const { createRoot } = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
      const { Canvas, useThree } = await import('/node_modules/.vite/deps/@react-three_fiber.js');
      const { OrbitControls } = await import('/src/features/scene/camera/OrbitControls.tsx');
      const { getOrbitMouseButtons } = await import('/src/features/scene/camera/orbitMouseButtons.ts');
      document.body.replaceChildren();
      document.body.style.margin = '0';
      const container = document.createElement('div');
      container.style.width = '800px';
      container.style.height = '500px';
      document.body.append(container);
      window.fixture = { starts: 0 };
      function Fixture() {
        window.fixture.scene = useThree(state => state.scene);
        const [mode, setMode] = React.useState('rotate');
        const [enabled, setEnabled] = React.useState(true);
        window.fixture.setMode = setMode;
        window.fixture.setEnabled = setEnabled;
        const ref = React.useRef(null);
        React.useEffect(() => { window.fixture.controls = ref.current; });
        return React.createElement(OrbitControls, {
          ref, enabled, zoomScope: 'scene', target: [10, 5, 0], mouseButtons: getOrbitMouseButtons(mode),
          onStart: () => { window.fixture.starts++; },
        });
      }
      createRoot(container).render(React.createElement(Canvas, { camera: { position: [0, 0, 100] } }, React.createElement(Fixture)));
    });
    await page.waitForFunction(() => window.fixture?.controls?.domElement);
    const cursor = () => page.evaluate(() => ({
      action: window.fixture.controls.domElement.dataset.orbitDrag,
      css: getComputedStyle(document.querySelector('canvas')).cursor,
      markerVisible: window.fixture.scene.getObjectByName('orbit-target-marker').visible,
      markerPosition: window.fixture.scene.getObjectByName('orbit-target-marker').position.toArray(),
      target: window.fixture.controls.target.toArray(),
    }));
    async function drag(button, expected, modifier) {
      await page.mouse.move(300, 250);
      if (modifier) await page.keyboard.down(modifier);
      await page.mouse.down({ button });
      await page.waitForFunction(expected => window.fixture.scene.getObjectByName('orbit-target-marker').visible === (expected === 'rotate'), {}, expected);
      const pressed = await cursor();
      assert.equal(pressed.markerVisible, expected === 'rotate', 'marker appears on press before movement');
      await page.mouse.move(350, 270);
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const value = await cursor();
      assert.equal(value.markerVisible, expected === 'rotate');
      if (value.markerVisible) assert.deepEqual(value.markerPosition, value.target);
      assert.equal(value.action, expected, JSON.stringify(await page.evaluate(() => ({
        starts: window.fixture.starts,
        element: window.fixture.controls.domElement.tagName,
        action: window.fixture.controls.domElement.dataset.orbitDrag,
        enabled: window.fixture.controls.enabled,
        buttons: window.fixture.controls.mouseButtons,
      }))));
      if (expected === 'rotate') assert.match(value.css, /url\(.*orbit-rotate-cursor/);
      if (expected === 'pan') assert.equal(value.css, 'move');
      await page.mouse.up({ button });
      if (modifier) await page.keyboard.up(modifier);
      assert.equal((await cursor()).action, undefined);
      assert.equal((await cursor()).markerVisible, false);
    }
    await drag('left', 'rotate');
    await drag('right', 'pan');
    await drag('left', 'pan', 'Control');
    await drag('right', 'rotate', 'Shift');
    await drag('middle', 'zoom');
    await page.evaluate(() => window.fixture.setMode('pan'));
    await page.waitForFunction(() => window.fixture.controls.mouseButtons.LEFT === 2);
    await drag('left', 'pan');
    await drag('right', 'rotate');
    await page.$eval('canvas', element => { element.style.cursor = 'pointer'; });
    await drag('left', 'pan');
    assert.equal((await cursor()).css, 'pointer');
    await page.mouse.down();
    await page.mouse.move(850, 600);
    await page.mouse.up();
    assert.equal((await cursor()).action, undefined);
    assert.equal((await cursor()).markerVisible, false);
    await page.mouse.move(300, 250);
    await page.mouse.down();
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    assert.equal((await cursor()).action, undefined);
    assert.equal((await cursor()).markerVisible, false);
    await page.mouse.up();
    await page.mouse.down();
    await page.evaluate(() => window.fixture.controls.domElement.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true })));
    assert.equal((await cursor()).action, undefined);
    assert.equal((await cursor()).markerVisible, false);
    await page.mouse.up();
    await page.evaluate(() => window.fixture.setEnabled(false));
    await page.waitForFunction(() => !window.fixture.controls.enabled);
    await drag('left', undefined);
    assert((await page.evaluate(() => window.fixture.starts)) > 0, 'onStart prop must still run');
    assert.deepEqual(errors, []);
    console.log('OK: rotation/translation, left/right swap, modifiers, zoom, hover cursor, release outside, blur/cancel, disabled controls and forwarded ref/events.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
