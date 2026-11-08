// Reproduce entry/exit of duo waiting poses at a fixed 60 Hz with real retargeted clips.
const fs = require('node:fs');
const launch = require('./browser-test-options.cjs');
(async () => {
  const browser = await launch({ args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'], defaultViewport: { width: 1200, height: 700 } });
  try {
    const page = await browser.newPage();
    page.on('pageerror', e => console.error('PAGE', e.message));
    await page.setRequestInterception(true);
    page.on('request', request => request.isNavigationRequest() ? request.respond({ contentType: 'text/html; charset=utf-8', body: '<html><body style="margin:0;background:#18202b;color:white;font:16px sans-serif"><h3>Attente duo — ancien fondu (gauche), corrigé (droite)</h3></body></html>' }) : request.continue());
    await page.goto('http://localhost:5173/__duo_probe');
    const result = await page.evaluate(async () => {
      const THREE = await import('/node_modules/.vite/deps/three.js');
      const { GLTFLoader } = await import('/node_modules/three/examples/jsm/loaders/GLTFLoader.js');
      const { DRACOLoader } = await import('/node_modules/three/examples/jsm/loaders/DRACOLoader.js');
      const { animationSourcePlugin } = await import('/src/features/scene/character/animationSource.ts');
      const { acquireAnimationLibrary } = await import('/src/features/scene/character/animationLibrary.ts');
      const { getAnimationDef } = await import('/src/features/scene/animations/animationResolver.ts');
      const { isLocomotionAnimation, getCrossfadeDuration } = await import('/src/features/scene/animations/animationTransitions.ts');
      const draco = new DRACOLoader().setDecoderPath('/draco/');
      const loader = new GLTFLoader().setDRACOLoader(draco).register(animationSourcePlugin);
      const rig = (await loader.loadAsync('/characters/lara/lara_native.glb')).scene;
      const library = acquireAnimationLibrary(rig), clips = {};
      for (const id of ['walking', 'female-standing-pose', 'female-standing-pose-1', 'interx-g049t002a009r013-p1']) {
        const def = getAnimationDef(id), source = await loader.loadAsync('/' + def.path);
        clips[id] = await library.prepare(def.path, def.id, source, def.rootMotionSpace);
      }
      const scene = new THREE.Scene(), renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(1200, 600); document.body.appendChild(renderer.domElement);
      const camera = new THREE.PerspectiveCamera(35, 2, .01, 10000);
      const left = rig, right = rig.clone(true), mixers = [left, right].map(root => new THREE.AnimationMixer(root));
      const box = new THREE.Box3(); rig.updateMatrixWorld(true);
      rig.traverse(o => { if (o.isBone) box.expandByPoint(o.getWorldPosition(new THREE.Vector3())); });
      const size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3()), height = size.length();
      left.position.x -= height * .65; right.position.x += height * .65;
      for (const root of [left, right]) { scene.add(root); scene.add(new THREE.SkeletonHelper(root)); }
      camera.position.set(center.x, center.y, center.z + height * 3.2); camera.lookAt(center);
      window.duoProbe = { renderer, scene, camera, mixers, clips };
      const results = [];
      for (const pose of ['female-standing-pose', 'female-standing-pose-1']) for (const [fromId, toId] of [['walking', pose], [pose, 'walking'], [pose, 'interx-g049t002a009r013-p1']]) {
        for (const [index, mixer] of mixers.entries()) {
          mixer.stopAllAction();
          const from = mixer.clipAction(clips[fromId]).reset().play(); mixer.update(.02);
          const to = mixer.clipAction(clips[toId]).reset();
          const warp = index === 0 || (isLocomotionAnimation(fromId) && isLocomotionAnimation(toId));
          to.crossFadeFrom(from, getCrossfadeDuration(fromId, toId), warp).play();
          const samples = [];
          for (let frame = 0; frame < 30; frame++) { mixer.update(1 / 60); samples.push({ from: from.getEffectiveTimeScale(), to: to.getEffectiveTimeScale() }); }
          results.push({ fromId, toId, corrected: index === 1, fromDuration: clips[fromId].duration, toDuration: clips[toId].duration, samples });
        }
      }
      const sheet = document.createElement('canvas'); sheet.width = 1200; sheet.height = 900;
      const context = sheet.getContext('2d');
      renderer.setSize(800, 500); camera.aspect = 1.6; camera.updateProjectionMatrix();
      for (const [row, [fromId, toId]] of [['walking', 'female-standing-pose'], ['female-standing-pose', 'walking'], ['female-standing-pose', 'interx-g049t002a009r013-p1']].entries()) {
        for (const [index, mixer] of mixers.entries()) {
          mixer.stopAllAction();
          const from = mixer.clipAction(clips[fromId]).reset().setEffectiveWeight(1).setEffectiveTimeScale(1).play(); mixer.update(.02);
          const to = mixer.clipAction(clips[toId]).reset().setEffectiveWeight(1).setEffectiveTimeScale(1);
          to.crossFadeFrom(from, .4, index === 0).play();
        }
        for (let frame = 0; frame < 6; frame++) {
          if (frame) for (let step = 0; step < 5; step++) for (const mixer of mixers) mixer.update(1 / 60);
          scene.updateMatrixWorld(true);
          const posed = new THREE.Box3(); scene.traverse(o => { if (o.isBone) posed.expandByPoint(o.getWorldPosition(new THREE.Vector3())); });
          const mid = posed.getCenter(new THREE.Vector3());
          camera.position.set(mid.x, mid.y, mid.z + height * 2.2); camera.lookAt(mid);
          renderer.render(scene, camera);
          const x = (frame % 3) * 400, y = row * 300 + Math.floor(frame / 3) * 150;
          context.drawImage(renderer.domElement, x, y, 400, 150);
          context.fillStyle = 'white'; context.font = '12px sans-serif';
          context.fillText(`${fromId} → ${toId} · ${(frame * 5 / 60).toFixed(2)}s`, x + 4, y + 14);
        }
      }
      renderer.domElement.remove(); document.body.appendChild(sheet);
      return results;
    });
    fs.writeFileSync('/tmp/room-duo-probe.json', JSON.stringify(result, null, 2));
    for (const row of result) console.log(JSON.stringify({ from: row.fromId, to: row.toId, corrected: row.corrected, durations: [row.fromDuration, row.toDuration], speedRange: [Math.min(...row.samples.flatMap(s => [s.from, s.to])), Math.max(...row.samples.flatMap(s => [s.from, s.to]))] }));
    await page.screenshot({ path: '/tmp/room-duo-probe.png', fullPage: true });
    for (const row of result.filter(r => r.corrected)) if (row.samples.some(s => s.from !== 1 || s.to !== 1)) throw Error('Unexpected speed warping in corrected transition');
    console.log('PASS: real retargeted waiting clips preserve playback speed in both directions.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
