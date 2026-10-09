const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const puppeteer = require('puppeteer');

// Optional migration snapshot: { files: [{ old, new, sha256 }], definitions: [{ id, new, category }] }.
const baseline = process.argv[2] ? JSON.parse(fs.readFileSync(process.argv[2], 'utf8')) : undefined;
const root = path.resolve(__dirname, '..');

async function main() {
  if (baseline) {
    for (const file of baseline.files) {
      const data = fs.readFileSync(path.join(root, 'public', file.new));
      assert.equal(crypto.createHash('sha256').update(data).digest('hex'), file.sha256, file.new);
      assert(!fs.existsSync(path.join(root, 'public', file.old)), file.old);
    }
    console.log(`${baseline.files.length} GLB moved with unchanged contents`);
  }

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.goto(`${process.env.ROOM_TEST_URL || 'http://127.0.0.1:5176'}/AGENTS.md`);
    const result = await page.evaluate(async baseline => {
      window.$RefreshReg$ = () => {};
      window.$RefreshSig$ = () => type => type;
      window.__vite_plugin_react_preamble_installed__ = true;
      const { ANIMATION_DEFINITIONS: definitions } = await import('/src/features/scene/animations/animationRegistry.ts');
      const { getAnimationDef, resolveAnimationPath } = await import('/src/features/scene/animations/animationResolver.ts');
      const { ANIM_CATEGORIES, ENHANCED_ANIM_OPTIONS, getAnimCategory, getFilteredAnimOptions } = await import('/src/features/scene/CharacterAnimSelector.tsx');
      const { DUO_ANIMATIONS } = await import('/src/features/scene/animations/duoAnimations.ts');
      const { GLTFLoader } = await import('/node_modules/three/examples/jsm/loaders/GLTFLoader.js');
      const { DRACOLoader } = await import('/node_modules/three/examples/jsm/loaders/DRACOLoader.js');
      const { MeshoptDecoder } = await import('/node_modules/three/examples/jsm/libs/meshopt_decoder.module.js');
      const { AnimationMixer } = await import('/node_modules/.vite/deps/three.js');
      function check(condition, message) { if (!condition) throw Error(message); }
      const categories = new Set(ANIM_CATEGORIES.map(c => c.key));
      const sources = new Map();
      for (const def of definitions) {
        check(/^animations\/(miley|mixamo|others|npz\/(yoga|dances))\/[^/]+\.glb$/.test(def.path), def.path);
        check(categories.has(def.category), `Missing category: ${def.id}`);
        check(getAnimCategory(def.id) === def.category && getAnimCategory(def.path) === def.category, `Category lookup: ${def.id}`);
        check(resolveAnimationPath(def.id) === def.path, `ID lookup: ${def.id}`);
        const source = def.path.split('/').slice(1, -1).join('/');
        if (!sources.has(source)) sources.set(source, def.path);
        const response = await fetch(`/${def.path}`, { method: 'HEAD' });
        check(response.ok && response.headers.get('content-type') !== 'text/html', `Missing GLB: ${def.path}`);
      }
      if (baseline) {
        check(definitions.length === baseline.definitions.length, 'Registry count changed');
        for (const before of baseline.definitions) {
          const def = definitions.find(d => d.id === before.id);
          check(def?.path === before.new && def?.category === before.category, `Migration mismatch: ${before.id}`);
          check(!getAnimationDef(before.old), `Old path still indexed: ${before.old}`);
        }
      }
      for (const category of categories) {
        const expected = ENHANCED_ANIM_OPTIONS.filter(a => a.category === category);
        const filtered = getFilteredAnimOptions('', [category]);
        check(filtered.length === expected.length && filtered.every(a => a.category === category), `Filter: ${category}`);
      }
      const paths = new Set(sources.values());
      for (const key of ['idle', 't-pose', 'walking', 'running', 'falling', 'falling-idle']) {
        check(getAnimationDef(key), `Missing default: ${key}`);
        paths.add(resolveAnimationPath(key));
      }
      for (const duo of DUO_ANIMATIONS) {
        for (const key of [duo.animA, duo.animB]) {
          check(getAnimationDef(key), `Missing duo participant: ${key}`);
          paths.add(resolveAnimationPath(key));
        }
      }
      const loader = new GLTFLoader();
      loader.setDRACOLoader(new DRACOLoader().setDecoderPath('/draco/'));
      loader.setMeshoptDecoder(MeshoptDecoder);
      for (const path of paths) {
        const gltf = await loader.loadAsync(`/${path}`);
        check(gltf.animations.length > 0, `No animation: ${path}`);
        const mixer = new AnimationMixer(gltf.scene);
        const clip = gltf.animations[0];
        mixer.clipAction(clip).play();
        mixer.update(clip.duration / 2);
        gltf.scene.updateMatrixWorld(true);
        gltf.scene.traverse(object => check(object.matrixWorld.elements.every(Number.isFinite), `Invalid animated transform: ${path}`));
        mixer.stopAllAction();
        mixer.uncacheRoot(gltf.scene);
      }
      return { definitions: definitions.length, categories: [...categories], sources: [...sources.keys()], played: paths.size, duos: DUO_ANIMATIONS.length };
    }, baseline);
    console.log('Animation paths, categories, default clips and duo playback passed:', result);
  } finally {
    await browser.close();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
