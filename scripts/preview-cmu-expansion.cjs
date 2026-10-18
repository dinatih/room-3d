// With Vite on port 5193: node scripts/preview-cmu-expansion.cjs
const path = require('node:path');
const fs = require('node:fs');
const metadata = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/animations/npz/_metadata/cmu_expansion.json'), 'utf8'));
// Four rows per sheet keep the skeletons readable; every motion is included.
const rowsPerSheet = 4;

(async () => {
  const browser = await require('./browser-test-options.cjs')({ args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1800, height: 1200 });
    await page.goto('http://127.0.0.1:5193/AGENTS.md');
    const reports = [];
    const previews = [];
    for (let offset = 0; offset < metadata.length; offset += rowsPerSheet) {
      const rows = metadata.slice(offset, offset + rowsPerSheet);
      const report = await page.evaluate(async rows => {
        window.$RefreshReg$ = () => {};
        window.$RefreshSig$ = () => type => type;
        window.__vite_plugin_react_preamble_installed__ = true;
        const { ANIMATION_DEFINITIONS } = await import('/src/features/scene/animations/animationRegistry.ts');
        const { STUDIO_CATALOG } = await import('/src/features/inventory/animationStudioCatalog.ts');
        for (const { id } of rows) {
          const definitions = ANIMATION_DEFINITIONS.filter(row => row.id === id);
          const entries = STUDIO_CATALOG.solo.filter(row => row.id === id);
          if (definitions.length !== 1 || entries.length !== 1 || !entries[0].sources.includes('cmu')) {
            throw Error(id + ': missing or duplicate CMU catalog entry');
          }
          if (definitions[0].loop !== 'once') throw Error(id + ': expected one-shot capture');
        }
        const T = await import('/node_modules/three/build/three.module.js');
        const { GLTFLoader } = await import('/node_modules/three/examples/jsm/loaders/GLTFLoader.js');
        document.body.innerHTML = '';
        document.body.style.cssText = 'margin:0;background:#17212d;color:white;font:15px sans-serif';
        const canvas = document.createElement('canvas');
        document.body.append(canvas);
        const renderer = new T.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
        renderer.setSize(1800, 1200);
        renderer.setScissorTest(true);
        const report = [];
        for (let row = 0; row < rows.length; row++) {
          const { filename: file, label, trial, duration } = rows[row];
          const gltf = await new GLTFLoader().loadAsync('/animations/npz/cmu/' + file);
          if (gltf.animations.length !== 1) throw Error(file + ': expected one animation');
          const clip = gltf.animations[0];
          const definition = ANIMATION_DEFINITIONS.find(item => item.id === rows[row].id);
          if (Math.round(clip.duration * 10) / 10 !== duration || definition.duration !== duration) {
            throw Error(file + ': duration does not match registry and metadata');
          }
          for (const track of clip.tracks) {
            if (![...track.times, ...track.values].every(Number.isFinite)) throw Error(file + ': invalid track');
          }
          const scene = new T.Scene();
          scene.background = new T.Color('#17212d');
          scene.add(gltf.scene);
          gltf.scene.traverse(object => { if (object.isMesh) object.visible = false; });
          const helper = new T.SkeletonHelper(gltf.scene);
          helper.material.depthTest = false;
          scene.add(helper);
          const mixer = new T.AnimationMixer(gltf.scene);
          mixer.clipAction(clip).play();
          const bones = [];
          gltf.scene.traverse(object => { if (object.isBone) bones.push(object); });
          if (!bones.length) throw Error(file + ': missing skeleton');
          const bounds = new T.Box3();
          // Check the complete animation, including transitions between review images.
          for (let frame = 0; frame <= Math.ceil(clip.duration * 30); frame++) {
            mixer.setTime(Math.min(frame / 30, clip.duration));
            scene.updateMatrixWorld(true);
            for (const bone of bones) {
              const p = bone.getWorldPosition(new T.Vector3());
              if (!p.toArray().every(Number.isFinite)) throw Error(file + ': invalid bone');
              bounds.expandByPoint(p);
            }
          }
          const center = bounds.getCenter(new T.Vector3());
          const size = bounds.getSize(new T.Vector3());
          const camera = new T.PerspectiveCamera(38, 1, 0.01, 1000);
          const distance = size.length() / (2 * Math.tan(T.MathUtils.degToRad(19)));
          camera.position.copy(center).add(new T.Vector3(0.7, 0.3, 1).normalize().multiplyScalar(distance));
          camera.lookAt(center);
          for (let col = 0; col < 6; col++) {
            const time = clip.duration * col / 6;
            mixer.setTime(time);
            scene.updateMatrixWorld(true);
            renderer.setViewport(col * 300, (3 - row) * 300, 300, 300);
            renderer.setScissor(col * 300, (3 - row) * 300, 300, 300);
            renderer.render(scene, camera);
            const text = document.createElement('div');
            text.style.cssText = `position:absolute;left:${col * 300 + 8}px;top:${row * 300 + 8}px;max-width:284px;font-size:13px`;
            text.textContent = `${trial} — ${label} · ${time.toFixed(1)} s`;
            document.body.append(text);
          }
          report.push({ file, duration: clip.duration, tracks: clip.tracks.length, bones: bones.length, bounds: size.toArray() });
        }
        renderer.dispose();
        return report;
      }, rows);
      const output = `/tmp/room-cmu-expansion-${offset / rowsPerSheet + 1}.png`;
      await page.screenshot({ path: output });
      reports.push(...report);
      previews.push(output);
    }
    const result = { report: reports, previews };
    fs.writeFileSync('/tmp/room-cmu-expansion-report.json', JSON.stringify(result, null, 2) + '\n');
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
