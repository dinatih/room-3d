// Browser playback/grounding audit of the selected non-combat ACCAD imports.
const fs = require('node:fs');
const launchBrowser = require('./browser-test-options.cjs');
(async () => {
 const browser = await launchBrowser({ args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
 try {
  const page = await browser.newPage(); await page.setViewport({ width: 1800, height: 1500 });
  page.on('pageerror', error => console.error(error));
  await page.goto(`${process.env.ROOM_TEST_URL || 'http://127.0.0.1:5173'}/AGENTS.md`);
  const rows = await page.evaluate(async previewModel => {
   const T = await import('/node_modules/three/build/three.module.js');
   const { GLTFLoader } = await import('/node_modules/three/examples/jsm/loaders/GLTFLoader.js');
   const { DRACOLoader } = await import('/node_modules/three/examples/jsm/loaders/DRACOLoader.js');
   const { retargetClip } = await import('/src/features/scene/retargeting/retargetClip.ts');
   const { extractCharacterParts, applyClothingAndAccessoriesVisibility } = await import('/src/features/scene/characterParts.ts');
   const { ACCAD_ANIMATION_DEFINITIONS: definitions } = await import('/src/features/scene/animations/accadManifest.ts');
   const loader = new GLTFLoader().setDRACOLoader(new DRACOLoader().setDecoderPath('/draco/'));
   const sourceLoader = new GLTFLoader(); sourceLoader.register(() => ({ name: 'SkeletonOnly', loadMesh: () => Promise.resolve(new T.Group()) }));
   const renderer = new T.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); renderer.setSize(1800, 1500); renderer.setScissorTest(true);
   document.body.replaceChildren(renderer.domElement); document.body.style.margin = '0';
   const scene = new T.Scene(); scene.background = new T.Color(0xdddddd); scene.add(new T.HemisphereLight(0xffffff, 0x777777, 3));
   const sun = new T.DirectionalLight(0xffffff, 3); sun.position.set(200, 300, 200); scene.add(sun); scene.add(new T.GridHelper(1000, 50));
   const camera = new T.OrthographicCamera(-135, 135, 135, -135, 1, 2000); camera.position.set(350, 170, 350); camera.lookAt(0, 70, 0);
   const metadata = await (await fetch('/animations/npz/_metadata/accad_actions.json')).json();
   const rows = [], snapshots = [];
   for (const model of ['xbot/Xbot_official', 'lara/lara_native']) {
    const target = (await loader.loadAsync(`/characters/${model}.glb`)).scene;
    target.scale.multiplyScalar(100); target.updateMatrixWorld(true);
    // A contact sheet reuses one rig across unrelated poses; refresh culling
    // bounds on every sample instead of retaining the first clip's sphere.
    const parts = extractCharacterParts(target);
    if (model.startsWith('lara')) applyClothingAndAccessoriesVisibility(parts, { laraShoes: true, laraTop: 'native', laraBottom: 'native', showAccessories: false, laraPistols: false, equipment: { holster: false, pistols: false, backpack: false } });
    const rest = []; target.traverse(node => { if (node.isBone) rest.push([node, node.position.clone(), node.quaternion.clone()]); });
    for (const definition of definitions) {
     for (const [node, p, q] of rest) { node.position.copy(p); node.quaternion.copy(q); } target.updateMatrixWorld(true);
     const source = await sourceLoader.loadAsync('/' + definition.path), raw = source.animations[0]; raw.name = definition.id;
     const clip = retargetClip(raw, target, source.scene);
     if (Math.abs(clip.duration - definition.duration) > 0.051) throw Error(`Duration mismatch: ${definition.id}`);
     if (!clip.tracks.every(track => [...track.values].every(Number.isFinite))) throw Error(`Invalid clip: ${definition.id}`);
     const bindings = clip.tracks.map(track => ({ node: target.getObjectByName(track.name.split('.')[0]), prop: track.name.split('.')[1], interp: track.createInterpolant() }));
     const sample = time => { for (const { node, prop, interp } of bindings) node[prop].fromArray(interp.evaluate(time)); target.updateMatrixWorld(true); target.traverse(node => { if (node.isSkinnedMesh) { node.skeleton.update(); node.computeBoundingSphere(); } }); };
     const heights = [];
     for (const fraction of [0, .25, .5, .75, 1]) {
      sample(clip.duration * fraction);
      let lowest = Infinity; const point = new T.Vector3();
      target.traverseVisible(node => { if (node.isSkinnedMesh) { node.skeleton.update(); for (let i = 0; i < node.geometry.attributes.position.count; i++) { node.getVertexPosition(i, point).applyMatrix4(node.matrixWorld); lowest = Math.min(lowest, point.y); } } });
      if (!Number.isFinite(lowest)) throw Error(`Invalid mesh: ${definition.id}`); heights.push(lowest);
     }
     const item = metadata.find(item => item.id === definition.id);
     if (model.startsWith('xbot') && item.support !== 'standing' && Math.max(...heights.map(Math.abs)) > .1) throw Error(`Reference body contact exceeds 1 mm: ${definition.id}: ${heights}`);
     rows.push({ id: definition.id, model, heightsCm: heights });
     if (model.startsWith(previewModel)) {
      sample(definition.id === 'accad-crouch-female' ? 106 / 30 : definition.id === 'accad-crouch-male2' ? 15 / 30 : clip.duration / 2); scene.add(target);
      const index = snapshots.length, x = index % 6 * 300, y = 1500 - 300 - Math.floor(index / 6) * 300;
      const box = new T.Box3().setFromObject(target, true), center = box.getCenter(new T.Vector3()); center.y = 70;
      camera.position.copy(center).add(new T.Vector3(350, 100, 350)); camera.lookAt(center);
      renderer.setViewport(x, y, 300, 300); renderer.setScissor(x, y, 300, 300); renderer.render(scene, camera); scene.remove(target);
      const label = document.createElement('div'); label.textContent = definition.label; label.style.cssText = `position:absolute;left:${x + 5}px;top:${1500 - y - 295}px;font:13px sans-serif`; document.body.append(label); snapshots.push(definition.id);
     }
    }
   }
   return rows;
  }, process.env.ACCAD_PREVIEW_MODEL || 'xbot');
  fs.writeFileSync('/tmp/accad-actions-browser.json', JSON.stringify(rows, null, 2));
  await page.screenshot({ path: '/tmp/accad-actions-contact-sheet.png' });
  console.log(JSON.stringify(rows));
 } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
