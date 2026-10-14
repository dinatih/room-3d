const assert = require('node:assert/strict');
const launchBrowser = require('./browser-test-options.cjs');
(async () => {
  const browser = await launchBrowser({ args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error' || message.text().includes('No target node')) errors.push(message.text()); });
    await page.setViewport({width:1200,height:900});
    await page.goto(`${process.env.ROOM_TEST_URL || 'http://127.0.0.1:5191'}/AGENTS.md`);
    const result = await page.evaluate(async () => {
      const THREE = await import('/node_modules/.vite/deps/three.js');
      const { GLTFLoader } = await import('/node_modules/three/examples/jsm/loaders/GLTFLoader.js');
      const gltf = await new GLTFLoader().loadAsync('/items/jumper/jumper.glb');
      const report = await (await fetch('/items/jumper/animations.json')).json();
      const mixer = new THREE.AnimationMixer(gltf.scene);
      const samples = [];
      for (const clip of gltf.animations) {
        const action = mixer.clipAction(clip).reset().play();
        const states = [];
        for (const fraction of [0,0.17,0.37,0.73,0.999]) {
          mixer.setTime(clip.duration*fraction);
          gltf.scene.updateMatrixWorld(true);
          let minY = Infinity;
          gltf.scene.traverse(mesh => {
            if (!mesh.isMesh) return;
            const positions = mesh.geometry.attributes.position;
            const point = new THREE.Vector3();
            for (let i=0;i<positions.count;i++) {
              point.fromBufferAttribute(positions,i).applyMatrix4(mesh.matrixWorld);
              if (!Number.isFinite(point.lengthSq())) throw Error('Non-finite geometry');
              minY = Math.min(minY,point.y);
            }
          });
          if (Math.abs(minY)>0.08) throw Error(`${clip.name}: ground offset ${minY}cm`);
          const foot = gltf.scene.getObjectByName('LM_foot_tip_link');
          states.push(foot.getWorldPosition(new THREE.Vector3()).toArray());
        }
        if (clip.name !== 'idle' && states.every(state => state.every((value,i) => Math.abs(value-states[0][i])<1e-5))) throw Error(`${clip.name}: static clip`);
        action.stop();
        samples.push({name:clip.name, duration:clip.duration, tracks:clip.tracks.length});
      }
      window.jumperFixture = {THREE,gltf,mixer};
      return {samples,report};
    });
    assert.equal(result.samples.length,9);
    console.log(JSON.stringify(result,null,2));
    await page.evaluate(async () => {
      const refresh = (await import('/@react-refresh')).default;
      refresh.injectIntoGlobalHook(window);
      window.$RefreshReg$ = () => {};
      window.$RefreshSig$ = () => type => type;
      window.__vite_plugin_react_preamble_installed__ = true;
      const React = (await import('/node_modules/.vite/deps/react.js')).default;
      const { createRoot } = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
      const { InventoryPreview } = await import('/src/features/inventory/InventoryPreview.tsx');
      const { INVENTORY } = await import('/src/features/inventory/inventoryData.ts');
      document.body.replaceChildren();
      const host = document.createElement('div');
      document.body.append(host);
      createRoot(host).render(React.createElement(InventoryPreview,{item:INVENTORY.find(item=>item.id==='jumper-robot'),height:750}));
    });
    await page.waitForSelector('select[data-object-action="jumper-motion"]',{timeout:60000});
    for (const motion of ['walk','turn-left','turn-right','hello','bow','paw','salute','maze','idle']) {
      await page.select('select[data-object-action="jumper-motion"]',motion);
      await new Promise(resolve=>setTimeout(resolve,300));
    }
    await page.screenshot({path:'/tmp/room-jumper-animations.png'});
    assert.deepEqual(errors,[]);
    console.log('Jumper: 9 clips, geometry grounding, animated feet, selector changes and browser errors OK');
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
