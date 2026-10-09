const assert = require('node:assert/strict');
const puppeteer = require('../node_modules/puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
  try {
    if (process.argv.includes('--perf')) {
      await compareScenePerformance(browser);
      return;
    }
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewport({ width: 800, height: 600 });
    await page.goto(`${process.env.ROOM_TEST_URL || 'http://127.0.0.1:5173'}/AGENTS.md?mode=orbit`);
    await page.evaluate(async () => {
      const refresh = (await import('/@react-refresh')).default;
      refresh.injectIntoGlobalHook(window);
      window.$RefreshReg$ = () => {};
      window.$RefreshSig$ = () => type => type;
      window.__vite_plugin_react_preamble_installed__ = true;
      const React = (await import('/node_modules/.vite/deps/react.js')).default;
      const { createRoot } = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
      const { Canvas, useThree, useFrame } = await import('/node_modules/.vite/deps/@react-three_fiber.js');
      const THREE = await import('/node_modules/.vite/deps/three.js');
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
      window.fixture = { THREE, hoverState, root, checks: 0, frameChecks: [], afterFrame: null, appearances: [], wasVisible: false };
      const setFromCamera = THREE.Raycaster.prototype.setFromCamera;
      THREE.Raycaster.prototype.setFromCamera = function (...args) {
        const stack = new Error().stack;
        if (stack.includes('HoverMenu.tsx') && stack.includes('checkHover')) window.fixture.checks++;
        return setFromCamera.apply(this, args);
      };
      function Capture() {
        const state = useThree();
        React.useLayoutEffect(() => { Object.assign(window.fixture, state); }, [state]);
        useFrame(() => {
          if (hoverState.visible && !window.fixture.wasVisible) window.fixture.appearances.push(performance.now());
          window.fixture.wasVisible = hoverState.visible;
          window.fixture.frameChecks.push(window.fixture.checks);
          window.fixture.checks = 0;
          if (window.fixture.afterFrame) {
            const resolve = window.fixture.afterFrame;
            window.fixture.afterFrame = null;
            resolve(hoverState.visible);
          }
        });
        return null;
      }
      root.render(React.createElement(Canvas, { camera: { position: [0, 0, 10] } },
        React.createElement(HoverRaycaster), React.createElement(Capture),
        React.createElement('group', { name: 'target', userData: { hoverAction: { label: 'Porte', actionId: 'entryDoor' } } },
          React.createElement('mesh', null, React.createElement('boxGeometry', { args: [2, 2, 2] }), React.createElement('meshBasicMaterial'))),
        React.createElement('group', { position: [3, 0, 0], userData: { hoverAction: { label: 'Autre porte', actionId: 'livingDoor' } } },
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
    const moveBeforeFrame = (positions) => page.evaluate(positions => new Promise(resolve => {
      window.fixture.moveStartedAt = performance.now();
      window.fixture.afterFrame = resolve;
      const canvas = window.fixture.gl.domElement;
      for (const [clientX, clientY] of positions) {
        canvas.dispatchEvent(new PointerEvent('pointermove', { clientX, clientY, pointerType: 'mouse', bubbles: true }));
      }
    }), positions);
    await moveBeforeFrame([[400, 250], [401, 250]]);
    await new Promise(resolve => setTimeout(resolve, 100));
    assert.equal(await isVisible(), false);
    await page.waitForFunction(() => window.fixture.hoverState.visible);
    assert.equal(await page.evaluate(() => window.fixture.appearances[0] - window.fixture.moveStartedAt >= 250), true);
    assert.equal(await page.evaluate(() => window.fixture.frameChecks.some(count => count === 1)), true);
    assert.equal(await moveBeforeFrame([[402, 250], [403, 250], [790, 490]]), false);
    console.log('Latest of multiple moves checked in first frame; no early appearance: OK');
    await hover();
    assert.equal(await moveBeforeFrame([[400, 250], [500, 250]]), false);
    await page.waitForFunction(() => window.fixture.hoverState.visible && window.fixture.hoverState.label === 'Autre porte');
    console.log('Changing objects hides old dot and waits for new appearance: OK');
    await moveBeforeFrame([[790, 490]]);
    await page.evaluate(() => window.fixture.setFrameloop('demand'));
    await hover();
    assert.equal(await moveBeforeFrame([[401, 250], [790, 490]]), false);
    console.log('Demand rendering wakes for pointer movement and appearance: OK');
    await page.evaluate(() => window.fixture.setFrameloop('always'));
    await page.evaluate(() => new Promise(resolve => {
      requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    }));
    assert.equal(await page.evaluate(() => window.fixture.frameChecks.slice(-2).every(count => count === 0)), true);
    console.log('Stationary pointer and camera do not trigger hover raycasts: OK');
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
    await page.evaluate(() => {
      const { THREE, scene } = window.fixture;
      const opaque = new THREE.MeshBasicMaterial();
      const invisible = new THREE.MeshBasicMaterial({ visible: false });
      const wall = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 1), [opaque, opaque, opaque, opaque, invisible, opaque]);
      wall.position.z = 4;
      wall.userData.brickType = 'wall';
      const group = new THREE.Group();
      group.name = 'walls-group';
      group.add(wall);
      scene.add(group);
      window.fixture.wall = wall;
      window.fixture.wallGroup = group;
      window.fixture.opaque = opaque;
    });
    // Laisser expirer le cache pour intégrer le mur ajouté après le montage.
    await new Promise(resolve => setTimeout(resolve, 3100));
    await page.mouse.move(790, 490);
    await hover();
    await page.mouse.click(400, 250);
    assert.equal(await page.evaluate(() => window.fixture.hoverState.locked), true);
    await page.keyboard.press('Escape');
    console.log('Invisible wall face permits hover and menu opening: OK');
    await page.evaluate(() => { window.fixture.wall.material = window.fixture.opaque; });
    await moveBeforeFrame([[401, 250]]);
    assert.equal(await isVisible(), false);
    await page.mouse.click(400, 250);
    assert.equal(await page.evaluate(() => window.fixture.hoverState.locked), false);
    console.log('Opaque wall blocks hover and menu opening: OK');
    await page.evaluate(() => {
      window.fixture.opaque.transparent = true;
      window.fixture.opaque.opacity = 0.5;
      window.fixture.opaque.needsUpdate = true;
    });
    await hover();
    await page.mouse.click(400, 250);
    assert.equal(await page.evaluate(() => window.fixture.hoverState.locked), true);
    await page.keyboard.press('Escape');
    console.log('Transparent wall permits hover and menu opening: OK');
    await page.evaluate(() => {
      window.fixture.opaque.transparent = false;
      window.fixture.opaque.opacity = 1;
      window.fixture.opaque.needsUpdate = true;
      window.fixture.wallGroup.visible = false;
    });
    await page.mouse.move(790, 490);
    await hover();
    await page.mouse.click(400, 250);
    assert.equal(await page.evaluate(() => window.fixture.hoverState.locked), true);
    await page.keyboard.press('Escape');
    console.log('Hidden wall ancestor permits hover and menu opening: OK');
    await page.mouse.move(790, 490);
    await page.mouse.move(400, 250);
    await page.evaluate(() => window.fixture.root.unmount());
    await new Promise(resolve => setTimeout(resolve, 600));
    assert.equal(await page.evaluate(() => window.fixture.hoverState.visible), false);
    assert.equal(await isVisible(), false);
    console.log('Unmount cancels pending appearance: OK');
    assert.equal(await page.evaluate(() => window.fixture.frameChecks.every(count => count <= 1)), true);
    console.log('At most one hover raycast per rendered frame: OK');
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });

async function compareScenePerformance(browser) {
  const { execFileSync } = require('node:child_process');
  const ts = require('typescript');
  const previousSource = execFileSync('git', ['show', '69003109:src/features/scene/HoverMenu.tsx'], { encoding: 'utf8' });
  const previousJs = ts.transpileModule(previousSource, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.React },
  }).outputText.replace("import React, { useEffect, useState } from 'react';", "import React from 'react'; const { useEffect, useState } = React;").replace(/from ['"]([^'"]+)['"]/g, (_, path) => {
    const dependencies = { react: 'react', three: 'three', '@react-three/fiber': '@react-three_fiber' };
    if (dependencies[path]) return `from '/node_modules/.vite/deps/${dependencies[path]}.js'`;
    if (path === '@config') return "from '/src/features/scene/config.ts'";
    if (path.startsWith('@features/')) return `from '/src/features/${path.slice(10)}'`;
    if (path.startsWith('./')) return `from '/src/features/scene/${path.slice(2)}'`;
    throw new Error(`Unmapped baseline import: ${path}`);
  });
  for (const baseline of [true, false]) {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => { errors.push(error.message); console.error('Performance page:', error.message); });
    await page.setViewport({ width: 1000, height: 700 });
    if (baseline) {
      await page.setRequestInterception(true);
      page.on('request', request => {
        if (request.url().includes('/src/features/scene/HoverMenu.tsx')) {
          request.respond({ status: 200, contentType: 'application/javascript', body: previousJs + '\n//# sourceURL=HoverMenu.tsx' });
        } else request.continue();
      });
    }
    console.log(`Loading full apartment scene (${baseline ? 'before' : 'after'})...`);
    await page.goto('http://127.0.0.1:5173/?mode=orbit', { waitUntil: 'domcontentloaded' });
    // Le benchmark CPU des raycasts n'a pas besoin d'attendre le préchauffage GPU logiciel.
    await page.waitForFunction(() => window.threeScene?.getObjectByName('walls-group') &&
      (!document.getElementById('loading') || document.getElementById('loading-item')?.textContent.includes('compilation des shaders')),
    { timeout: 120000 }).catch(async error => {
      console.log(await page.evaluate(() => ({ scene: !!window.threeScene, loading: document.getElementById('loading')?.innerText, text: document.body.innerText.slice(0, 1500) })));
      console.log({ errors });
      throw error;
    });
    const metrics = await page.evaluate(async () => {
      const THREE = await import('/node_modules/.vite/deps/three.js');
      const { cameraState } = await import('/src/features/scene/cameraState.ts');
      const { hoverState } = await import('/src/features/scene/hoverState.ts');
      const { dispatchView, VIEWS } = await import('/src/features/scene/sidepanel/types.ts');
      const original = THREE.Raycaster.prototype.intersectObjects;
      const samples = [];
      let depth = 0;
      THREE.Raycaster.prototype.intersectObjects = function (...args) {
        const measure = depth === 0 && new Error().stack.includes('HoverMenu.tsx');
        depth++;
        const start = performance.now();
        try { return original.apply(this, args); }
        finally {
          depth--;
          if (measure) samples.push(performance.now() - start);
        }
      };
      cameraState.skipIntro?.();
      cameraState.isSceneLaunched = true;
      document.getElementById('loading')?.remove();
      dispatchView('perspective', VIEWS.perspective.pos);
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '0' }));
      const canvas = window.threeGl.domElement;
      const start = performance.now();
      for (let frame = 0; frame < 120; frame++) {
        await new Promise(resolve => requestAnimationFrame(resolve));
        for (let move = 0; move < 8; move++) {
          canvas.dispatchEvent(new PointerEvent('pointermove', {
            clientX: 420 + (frame % 20) * 20 + move,
            clientY: 200 + (frame % 10) * 30,
            pointerType: 'mouse', bubbles: true,
          }));
        }
      }
      await new Promise(resolve => requestAnimationFrame(resolve));
      const elapsed = performance.now() - start;
      THREE.Raycaster.prototype.intersectObjects = original;
      let objects = 0;
      window.threeScene.traverse(() => objects++);
      const sorted = samples.toSorted((a, b) => a - b);
      const total = samples.reduce((sum, value) => sum + value, 0);
      if (!samples.length) throw new Error(JSON.stringify({ message: 'No hover raycasts measured', objects, dragging: cameraState.isDragging, touchActive: hoverState.touchActive, intro: cameraState.isIntroRunning, canvasCount: document.querySelectorAll('canvas').length }));
      return { objects, elapsedMs: Math.round(elapsed), raycastCalls: samples.length,
        totalRaycastMs: +total.toFixed(2), averageRaycastMs: +(total / samples.length).toFixed(2),
        p95RaycastMs: +sorted[Math.floor(sorted.length * .95)].toFixed(2) };
    });
    console.log(JSON.stringify({ version: baseline ? 'before' : 'after', ...metrics }));
    await page.close();
  }
}
