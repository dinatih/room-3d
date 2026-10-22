// Run with Vite running. Inspect the actual rigid skin and converted walk in headless Chromium.
const assert = require('node:assert/strict');
const launchBrowser = require('../../scripts/browser-test-options.cjs');

(async () => {
  const browser = await launchBrowser({ args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 720 });
    if (process.argv.includes('--inventory')) {
      page.on('pageerror', error => console.error(error));
      await page.setRequestInterception(true);
      page.on('request', request => request.isNavigationRequest()
        ? request.respond({ contentType: 'text/html', body: '<body><div id="root"></div></body>' })
        : request.continue());
      await page.goto(`${process.env.H2_TEST_URL || 'http://127.0.0.1:5173'}/?inventory=robots&item=unitree-h2`);
      await page.evaluate(async () => {
        const RefreshRuntime = (await import('/@react-refresh')).default;
        RefreshRuntime.injectIntoGlobalHook(window);
        window.$RefreshReg$ = () => {};
        window.$RefreshSig$ = () => type => type;
        window.__vite_plugin_react_preamble_installed__ = true;
        await import('/scss/app.scss');
        await import('/src/index.css');
        const React = (await import('/node_modules/.vite/deps/react.js')).default;
        const { createRoot } = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
        const { Inventory } = await import('/src/features/inventory/Inventory.tsx');
        const previewSource = await fetch('/src/features/inventory/InventoryPreview.tsx').then(response => response.text());
        window.h2Fiber = await import(previewSource.match(/from "([^"]+@react-three_fiber[^"]+)"/)[1]);
        createRoot(document.getElementById('root')).render(React.createElement(Inventory, { initialCategory: 'robots', onClose() {} }));
      });
      await page.waitForSelector('.inventory-preview-renderer', { timeout: 60000 });
      await page.waitForFunction(() => !document.body.textContent.includes('Chargement du modèle'), { timeout: 60000 });
      await page.evaluate(() => {
        document.dispatchEvent(new CustomEvent('camera-view', { detail: { key: 'north', projection: 'persp' } }));
        document.querySelector('button[title="Afficher le squelette (K)"]')?.click();
      });
      await page.screenshot({ path: '/tmp/room-h2-inventory-before-bones.png' });
      await page.waitForFunction(() => {
        const triangles = document.body.textContent.match(/Tris:\s*([\d.]+)k/);
        return triangles && Number(triangles[1]) > 0;
      }, { timeout: 60000 }).catch(async error => {
        await page.screenshot({ path: '/tmp/room-h2-inventory-error.png' });
        throw error;
      });
      await page.evaluate(() => {
        [...document.querySelectorAll('button')].find(button => button.textContent.trim() === '0°')?.click();
        document.dispatchEvent(new CustomEvent('camera-view', { detail: { key: 'north', projection: 'persp' } }));
      });
      console.log(JSON.stringify(await page.evaluate(async () => {
        const { _roots } = window.h2Fiber;
        const data = [];
        for (const root of _roots.values()) {
          root.store.getState().scene.traverse(node => {
            if (node.name !== 'head_yaw_joint') return;
            const ancestors = [];
            for (let parent = node; parent; parent = parent.parent) ancestors.push({ name: parent.name, rotation: parent.rotation.toArray() });
            data.push({ camera: root.store.getState().camera.position.toArray(), matrix: node.matrixWorld.toArray(), ancestors });
          });
        }
        return data;
      })));
      console.log(await page.evaluate(() => [...document.querySelectorAll('button')].filter(button => /Nord|nord|squelette|Squelette/.test(button.title + button.textContent)).map(button => ({ title: button.title, text: button.textContent }))));
      await page.screenshot({ path: '/tmp/room-h2-inventory.png' });
      return;
    }
    await page.setRequestInterception(true);
    page.on('request', request => request.isNavigationRequest()
      ? request.respond({ contentType: 'text/html', body: '<body style="margin:0;background:#e7e9ed"><div id="label" style="position:absolute;top:16px;left:16px;font:20px sans-serif"></div></body>' })
      : request.continue());
    await page.goto(process.env.H2_TEST_URL || 'http://127.0.0.1:5173');
    const result = await page.evaluate(async () => {
      const THREE = await import('/node_modules/three/build/three.module.js');
      const { GLTFLoader } = await import('/node_modules/three/examples/jsm/loaders/GLTFLoader.js');
      const { DRACOLoader } = await import('/node_modules/three/examples/jsm/loaders/DRACOLoader.js');
      const { retargetClip } = await import('/src/features/scene/retargeting/retargetClip.ts');
      const loader = new GLTFLoader().setDRACOLoader(new DRACOLoader().setDecoderPath('/draco/'));
      const { scene: robot } = await loader.loadAsync('/items/unitree-h2/unitree-h2.glb');
      robot.scale.setScalar(100);
      robot.updateMatrixWorld(true);
      robot.traverse(node => Object.assign(node, {
        defaultPosition: node.position.clone(), restLocalQuaternion: node.quaternion.clone(),
        restWorldQuaternion: node.getWorldQuaternion(new THREE.Quaternion()), restWorldPosition: node.getWorldPosition(new THREE.Vector3()),
      }));
      const source = await loader.loadAsync('/animations/mixamo/anim_walking.glb');
      source.animations[0].name = 'walking';
      const clip = retargetClip(source.animations[0], robot, source.scene);
      const mixer = new THREE.AnimationMixer(robot);
      const action = mixer.clipAction(clip);
      const scene = new THREE.Scene();
      scene.background = new THREE.Color('#e7e9ed');
      scene.add(robot, new THREE.HemisphereLight(0xffffff, 0x64748b, 3));
      const light = new THREE.DirectionalLight(0xffffff, 3);
      light.position.set(-200, 350, -300); scene.add(light);
      const grid = new THREE.GridHelper(600, 30, '#64748b', '#cbd5e1'); scene.add(grid);
      const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
      renderer.setSize(1200, 720); document.body.append(renderer.domElement);
      const camera = new THREE.PerspectiveCamera(35, 1200 / 720, 1, 2000);
      window.h2Pose = (phase, side) => {
        if (phase === null) action.stop();
        else { action.play(); mixer.setTime(clip.duration * phase); }
        robot.updateMatrixWorld(true);
        camera.position.set(side ? 380 : 0, 130, side ? -120 : -400);
        camera.lookAt(0, 90, 0);
        document.getElementById('label').textContent = phase === null ? 'H2 — posture URDF, avant vers le nord (-Z)' : `H2 — walking, phase ${phase}`;
        renderer.render(scene, camera);
      };
      window.h2Pose(null, false);
      return { motors: clip.tracks.filter(track => track.name.endsWith('.quaternion')).length - 1, duration: clip.duration };
    });
    assert.equal(result.motors, 31);
    for (const [name, phase, side] of [['neutral', null, false], ['walk-front', 0.25, false], ['walk-side', 0.25, true]]) {
      await page.evaluate((phase, side) => window.h2Pose(phase, side), phase, side);
      await page.screenshot({ path: `/tmp/room-h2-${name}.png` });
    }
    console.log(JSON.stringify(result));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
