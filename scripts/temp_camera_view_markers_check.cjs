const assert = require('node:assert/strict');
const puppeteer = require('../node_modules/puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => { errors.push(error.message); console.error('Browser error:', error.message); });
    await page.setViewport({ width: 1200, height: 900 });
    await page.goto(`${process.argv[2] || process.env.ROOM_TEST_URL || 'http://127.0.0.1:5173'}/AGENTS.md?mode=orbit`);
    await page.evaluate(async () => {
      const refresh = (await import('/@react-refresh')).default;
      refresh.injectIntoGlobalHook(window);
      window.$RefreshReg$ = () => {};
      window.$RefreshSig$ = () => type => type;
      window.__vite_plugin_react_preamble_installed__ = true;
      const React = (await import('/node_modules/.vite/deps/react.js')).default;
      const { createRoot } = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
      const { Canvas, useThree } = await import('/node_modules/.vite/deps/@react-three_fiber.js');
      const THREE = await import('/node_modules/.vite/deps/three.js');
      const { CameraViewMarkers } = await import('/src/features/scene/CameraViewMarkers.tsx');
      const { CameraController } = await import('/src/features/scene/CameraController.tsx');
      const { HoverRaycaster } = await import('/src/features/scene/HoverMenu.tsx');
      const { hoverState } = await import('/src/features/scene/hoverState.ts');
      const { ViewControlBar } = await import('/src/features/scene/ViewControlBar.tsx');
      const { VIEWS, dispatchView, CAMERA_SHORTCUT_VIEWS } = await import('/src/features/scene/sidepanel/types.ts');
      const { useSceneStore } = await import('/src/features/scene/store/useSceneStore.ts');
      const { cameraState } = await import('/src/features/scene/cameraState.ts');
      cameraState.isSceneLaunched = true;
      document.body.replaceChildren();
      const bootstrap = document.createElement('link');
      bootstrap.rel = 'stylesheet';
      bootstrap.href = '/node_modules/bootstrap/dist/css/bootstrap.min.css';
      document.head.append(bootstrap);
      document.body.style.margin = '0';
      const container = document.createElement('div');
      container.style.width = '1200px';
      container.style.height = '700px';
      const toolbar = document.createElement('div');
      document.body.append(container, toolbar);
      window.fixture = { THREE, VIEWS, dispatchView, CAMERA_SHORTCUT_VIEWS, useSceneStore, hoverState, container, clicks: [] };
      function Capture() {
        const state = useThree();
        React.useLayoutEffect(() => { Object.assign(window.fixture, state); }, [state]);
        return null;
      }
      const sceneRoot = createRoot(container);
      window.renderSizingFixture = () => sceneRoot.render(React.createElement(Canvas, {
        camera: { position: [0, 300, 2000], near: 5, far: 10000 },
      }, React.createElement(Capture), React.createElement(CameraViewMarkers)));
      sceneRoot.render(React.createElement(Canvas, { camera: { position: [0, 300, 2000], near: 5, far: 10000 } },
        React.createElement(Capture), React.createElement(CameraController), React.createElement(HoverRaycaster), React.createElement(CameraViewMarkers)));
      createRoot(toolbar).render(React.createElement(ViewControlBar, { showCharacterModes: true, inline: true }));
      document.addEventListener('camera-view', event => window.fixture.clicks.push(event.detail));
      window.frameMarker = key => dispatchView('perspective', VIEWS[key].pos);
      window.markerCount = () => {
        let count = 0;
        window.fixture.scene.traverse(object => { if (object.userData.isCameraViewMarker) count++; });
        return count;
      };
    });
    await page.waitForFunction(() => window.fixture?.camera && window.markerCount() === 10);
    const geometries = await page.evaluate(() => {
      const { scene, VIEWS, THREE } = window.fixture;
      return Object.entries(VIEWS).filter(([key]) => !['perspective', 'top3d'].includes(key)).map(([key, preset]) => {
        const marker = scene.getObjectByName(`camera-view-marker-${key}`);
        const expected = new THREE.PerspectiveCamera();
        expected.position.set(...preset.pos);
        expected.lookAt(...preset.target);
        return { key, distance: marker.position.distanceTo(expected.position), angle: marker.quaternion.angleTo(expected.quaternion) };
      });
    });
    for (const result of geometries) {
      assert.equal(result.distance, 0, result.key);
      assert(result.angle < 1e-7, result.key);
    }
    console.log('Ten marker positions and camera orientations (including poles): OK');
    for (const [width, height] of [[1200, 700], [390, 844], [844, 390]]) {
      await page.setViewport({ width, height: Math.max(height, 900) });
      await page.evaluate(({ width, height }) => {
        window.fixture.container.style.width = `${width}px`;
        window.fixture.container.style.height = `${height}px`;
      }, { width, height });
      await page.waitForFunction(({ width, height }) => {
        const { scene, THREE } = window.fixture;
        return window.fixture.size.width === width && window.fixture.size.height === height &&
          window.fixture.CAMERA_SHORTCUT_VIEWS.every(view => {
            const marker = scene.getObjectByName(`camera-view-marker-${view.key}`);
            const mesh = marker.children.find(child => child.isMesh && child.geometry.isBufferGeometry && child.geometry.type === 'BufferGeometry');
            mesh.geometry.computeBoundingBox();
            const size = mesh.geometry.boundingBox.getSize(new THREE.Vector3());
            return Math.abs(size.x / size.y - width / height) < 1e-6;
          });
      }, {}, { width, height });
    }
    console.log('All ten pyramid bases match canvas ratio in landscape, portrait and after rotation: OK');
    await page.setViewport({ width: 1200, height: 900 });
    await page.evaluate(() => {
      window.fixture.container.style.width = '1200px';
      window.fixture.container.style.height = '700px';
    });
    await page.waitForFunction(() => window.fixture.size.width === 1200 && window.fixture.size.height === 700);
    await page.hover('button[aria-label="Face (Alt+1)"]');
    await page.waitForFunction(() => {
      const tooltip = document.querySelector('.view-control-bar__view-tooltip');
      if (!tooltip) return false;
      const rect = tooltip.getBoundingClientRect();
      return !tooltip.querySelector('pre') &&
        tooltip.querySelector('.badge')?.textContent === 'Face (Alt+1)' &&
        rect.top >= 0 && rect.bottom <= window.innerHeight &&
        getComputedStyle(tooltip).pointerEvents === 'none';
    });
    await page.mouse.move(0, 0);
    await page.waitForFunction(() => !document.querySelector('.view-control-bar__view-tooltip'));
    await page.evaluate(() => window.scrollTo(0, 0));
    console.log('Toolbar hover shows the view badge without debug: OK');
    for (const { key } of geometries) {
      console.log('Checking mesh click:', key);
      await page.evaluate(key => window.frameMarker(key), key);
      await page.waitForFunction(() => window.fixture.camera.isPerspectiveCamera).catch(async error => {
        console.log(await page.evaluate(() => ({ capturedCamera: window.fixture.camera.type, currentCamera: window.fixture.get().camera.type, projection: window.fixture.useSceneStore.getState().cameraProjection, clicks: window.fixture.clicks.map(detail => detail.key), errors: document.body.innerText })));
        throw error;
      });
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      await page.mouse.move(500, 350);
      await page.mouse.move(600, 350);
      await page.waitForFunction(() => document.querySelector('canvas').style.cursor === 'pointer').catch(async error => {
        console.log(await page.evaluate(key => {
          const { THREE, scene, camera, VIEWS, hoverState } = window.fixture;
          const marker = scene.getObjectByName(`camera-view-marker-${key}`);
          const raycaster = new THREE.Raycaster();
          raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
          return { key, camera: camera.position.toArray(), preset: VIEWS[key], marker: marker?.position.toArray(), projected: marker?.position.clone().project(camera).toArray(), hits: raycaster.intersectObjects(scene.children, true).map(hit => ({ name: hit.object.name, parent: hit.object.parent?.name, distance: hit.distance })), hover: hoverState, cursor: document.querySelector('canvas').style.cursor };
        }, key));
        throw error;
      });
      await page.waitForFunction(() => {
        const tooltip = document.querySelector('[role="tooltip"]');
        if (!tooltip || !tooltip.querySelector('.badge') || tooltip.querySelector('pre')) return false;
        for (let element = tooltip; element; element = element.parentElement) {
          const style = getComputedStyle(element);
          if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
        }
        return true;
      }).catch(async error => {
        console.log(await page.evaluate(() => ({
          tooltips: [...document.querySelectorAll('[role="tooltip"]')].map(tooltip => ({
            text: tooltip.innerText,
            ancestors: [...(function* () { for (let element = tooltip; element; element = element.parentElement) yield element; })()].map(element => ({ tag: element.tagName, opacity: getComputedStyle(element).opacity, display: getComputedStyle(element).display, visibility: getComputedStyle(element).visibility })),
          })),
          html: document.body.innerText,
        })));
        throw error;
      });
      await page.mouse.click(600, 350);
      await page.waitForFunction(key => window.fixture.useSceneStore.getState().activeCameraView === key && window.fixture.camera.isOrthographicCamera, {}, key).catch(async error => {
        console.log(await page.evaluate(() => ({ active: window.fixture.useSceneStore.getState().activeCameraView, camera: window.fixture.camera.type, clicks: window.fixture.clicks.map(detail => detail.key), elementAtPointer: document.elementFromPoint(600, 350)?.outerHTML })));
        throw error;
      });
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const applied = await page.evaluate(key => {
        const { camera, VIEWS, THREE, clicks, useSceneStore } = window.fixture;
        const preset = VIEWS[key];
        const direction = new THREE.Vector3().subVectors(new THREE.Vector3(...preset.target), camera.position).normalize();
        return { detail: clicks.at(-1), position: camera.position.toArray(), posError: camera.position.distanceTo(new THREE.Vector3(...preset.pos)), directionError: camera.getWorldDirection(new THREE.Vector3()).distanceTo(direction), zoom: camera.zoom, mode: useSceneStore.getState().cameraMode, count: window.markerCount(), cursor: document.querySelector('canvas').style.cursor };
      }, key);
      assert.equal(applied.detail.key, key);
      assert.deepEqual(applied.detail.pos, await page.evaluate(key => window.fixture.VIEWS[key].pos, key));
      assert(applied.posError < .01, `${key}: ${JSON.stringify(applied)}`);
      assert(applied.directionError < .00001, key);
      assert.equal(applied.zoom, 1);
      assert.equal(applied.mode, 'orbit');
      assert.equal(applied.count, 9);
      assert.equal(applied.cursor, '');
    }
    console.log('All ten real mesh clicks apply the correct camera preset, projection and zoom; active marker and cursor clear: OK');
    await page.evaluate(() => {
      window.frameMarker('front');
      const { THREE, scene, VIEWS } = window.fixture;
      const behind = new THREE.Mesh(new THREE.BoxGeometry(40, 40, 40), new THREE.MeshBasicMaterial({ color: 'blue' }));
      const offset = new THREE.Vector3(100, 200 - 250 / 3, 300).normalize().multiplyScalar(-100);
      behind.position.set(...VIEWS.front.pos).add(offset);
      behind.userData.hoverAction = { label: 'Behind marker', actions: ['tv'] };
      behind.name = 'test-behind-marker';
      scene.add(behind);
      scene.updateMatrixWorld(true);
    });
    await page.waitForFunction(() => window.fixture.camera.isPerspectiveCamera);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await page.mouse.move(500, 350);
    await page.mouse.move(600, 350);
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 650)));
    assert.equal(await page.$eval('canvas', canvas => canvas.style.cursor), 'pointer');
    await page.mouse.click(600, 350);
    assert.equal(await page.evaluate(() => window.fixture.hoverState.locked), false);
    await page.evaluate(() => {
      const { scene } = window.fixture;
      const behind = scene.getObjectByName('test-behind-marker');
      scene.remove(behind);
      behind.geometry.dispose();
      behind.material.dispose();
    });
    console.log('Existing native hover menu leaves the marker cursor intact and does not select furniture behind it: OK');
    await page.evaluate(() => window.frameMarker('front'));
    await page.waitForFunction(() => window.fixture.camera.isPerspectiveCamera);
    const beforeDrag = await page.evaluate(() => window.fixture.clicks.length);
    await page.mouse.move(600, 350);
    await page.mouse.down();
    await page.mouse.move(630, 350, { steps: 5 });
    await page.mouse.up();
    assert.equal(await page.evaluate(() => window.fixture.clicks.length), beforeDrag);
    assert.equal(await page.evaluate(() => window.fixture.useSceneStore.getState().activeCameraView), null);
    assert.equal(await page.evaluate(() => window.markerCount()), 10);
    await page.evaluate(() => window.frameMarker('front'));
    await page.waitForFunction(() => window.fixture.camera.isPerspectiveCamera);
    const beforeOcclusion = await page.evaluate(() => {
      const { THREE, scene, camera, VIEWS, clicks } = window.fixture;
      const wall = new THREE.Mesh(new THREE.BoxGeometry(120, 120, 20), new THREE.MeshBasicMaterial({ color: 'white' }));
      wall.name = 'test-wall';
      wall.position.copy(camera.position).lerp(new THREE.Vector3(...VIEWS.front.pos), .5);
      wall.lookAt(camera.position);
      scene.add(wall);
      scene.updateMatrixWorld(true);
      window.fixture.invalidate();
      return clicks.length;
    });
    await page.mouse.move(500, 350);
    await page.mouse.click(600, 350);
    assert.equal(await page.evaluate(() => window.fixture.clicks.length), beforeOcclusion);
    await page.evaluate(() => {
      const { scene } = window.fixture;
      const wall = scene.getObjectByName('test-wall');
      scene.remove(wall);
      wall.geometry.dispose();
      wall.material.dispose();
    });
    const toggle = 'button[aria-label="Raccourcis de vues 3D"]';
    assert.equal(await page.$eval(toggle, button => button.getAttribute('aria-pressed')), 'true');
    await page.click(toggle);
    await page.waitForFunction(() => window.markerCount() === 0);
    await page.click(toggle);
    await page.waitForFunction(() => window.markerCount() === 10);
    await page.evaluate(() => window.fixture.useSceneStore.getState().setPhotoModeOpen(true));
    await page.waitForFunction(() => window.markerCount() === 0);
    await page.evaluate(() => window.fixture.useSceneStore.getState().setPhotoModeOpen(false));
    await page.waitForFunction(() => window.markerCount() === 10);
    const touchSession = await page.createCDPSession();
    await touchSession.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
    await page.evaluate(() => window.frameMarker('front'));
    await page.waitForFunction(() => window.fixture.camera.isPerspectiveCamera);
    await touchSession.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 600, y: 350 }] });
    await touchSession.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForFunction(() => window.fixture.useSceneStore.getState().activeCameraView === 'front');
    await page.mouse.move(0, 0);
    await page.evaluate(() => window.renderSizingFixture());
    await page.waitForFunction(() => !window.fixture.scene.getObjectByProperty('type', 'OrthographicCamera'));
    for (const projection of ['perspective', 'ortho']) {
      for (const distance of [60, 350, 2000]) {
        for (const zoom of [0.05, 1, 8]) {
          await page.evaluate(({ projection, distance, zoom }) => {
            const { THREE, scene, size, set } = window.fixture;
            const marker = scene.getObjectByName('camera-view-marker-back');
            const camera = projection === 'ortho'
              ? new THREE.OrthographicCamera(-size.width / 2, size.width / 2, size.height / 2, -size.height / 2, 1, 10000)
              : new THREE.PerspectiveCamera(50, size.width / size.height, 1, 10000);
            // Décalage latéral : l'échelle doit dépendre de la profondeur, pas de la distance oblique.
            camera.position.copy(marker.position).add(new THREE.Vector3(120, 0, distance).applyQuaternion(marker.quaternion));
            camera.quaternion.copy(marker.quaternion);
            camera.zoom = zoom;
            camera.updateProjectionMatrix();
            camera.updateMatrixWorld(true);
            set({ camera });
          }, { projection, distance, zoom });
          await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
          const result = await page.evaluate(() => {
            const { THREE, scene, camera, size } = window.fixture;
            const marker = scene.getObjectByName('camera-view-marker-back');
            marker.updateWorldMatrix(true, false);
            const top = marker.localToWorld(new THREE.Vector3(0, 10, 0)).project(camera);
            const bottom = marker.localToWorld(new THREE.Vector3(0, -10, 0)).project(camera);
            const pyramid = marker.children.find(child => child.geometry?.type === 'BufferGeometry');
            return { height: Math.abs(top.y - bottom.y) * size.height / 2, opacity: pyramid.material.opacity };
          });
          assert(Math.abs(result.height - 32) < 0.001, JSON.stringify({ projection, distance, zoom, ...result }));
          assert.equal(result.opacity, 0.08);
        }
      }
    }
    console.log('Discreet 32 px marker size at near/far and off-axis positions, for perspective/orthographic zooms: OK');
    assert.deepEqual(errors, []);
    console.log('Drag, wall occlusion, red visibility toggle, photo exclusion/restoration and touch activation: OK');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
