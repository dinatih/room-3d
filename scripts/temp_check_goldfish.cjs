global.ProgressEvent = class ProgressEvent { constructor(type, data) { this.type = type; Object.assign(this, data); } };
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, filename);
const { fishHabitat, pickFishTarget, shortestFishTurn, GOLDFISH_FRAMES } = require('../src/features/scene/items/goldfishBehavior.ts');
const model = require('../src/features/scene/items/goldfishModel.json');
const habitat = fishHabitat(model.radius);
for (let i = 0; i < 10000; i++) {
  for (const mode of ['swim', 'eat']) {
    const p = pickFishTarget(model.radius, mode);
    const dz = Math.max(Math.abs(p.z) - habitat.segment, 0);
    assert(Math.hypot(p.x, dz) <= habitat.r + 1e-9);
    assert(p.y >= habitat.bottom && p.y <= habitat.top);
    if (mode === 'eat') assert.equal(p.y, habitat.top);
  }
}
assert(Math.abs(shortestFishTurn(Math.PI - .1, -Math.PI + .1) - .2) < 1e-9);
assert.throws(() => fishHabitat(40));
(async () => {
  const THREE = await import('three');
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  const b = fs.readFileSync('public/characters/jikin-goldfish/jikin-goldfish.glb');
  const n = b.readUInt32LE(12);
  const json = JSON.parse(b.subarray(20, 20 + n));
  assert(json.images.length > 0 && json.images.every(image => Number.isInteger(image.bufferView)));
  // Skip GPU textures in the Node check, but retain skeletons, geometry and animations.
  json.buffers[0].uri = 'data:application/octet-stream;base64,' + b.subarray(28 + n).toString('base64');
  delete json.images; delete json.textures; delete json.samplers; delete json.materials;
  for (const mesh of json.meshes) for (const p of mesh.primitives) delete p.material;
  const gltf = await new GLTFLoader().parseAsync(JSON.stringify(json), '');
  assert.equal(gltf.animations.length, 1);
  const mixer = new THREE.AnimationMixer(gltf.scene);
  for (const [name, [start, end]] of Object.entries(GOLDFISH_FRAMES)) {
    const clip = THREE.AnimationUtils.subclip(gltf.animations[0], name, start, end + 1, 24);
    assert(clip.tracks.length > 0);
    assert(Math.abs(clip.duration - 49 / 24) < 1e-5);
  }
  mixer.clipAction(gltf.animations[0]).play();
  const center = new THREE.Vector3(...model.center);
  const box = new THREE.Box3();
  const corner = new THREE.Vector3();
  for (let frame = 2; frame <= 251; frame++) {
    mixer.setTime(frame / 24);
    gltf.scene.updateMatrixWorld(true);
    box.setFromObject(gltf.scene, true);
    for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
      assert(corner.set(x,y,z).distanceTo(center) * 100 <= model.radius + 1e-4, `animated bounds at frame ${frame}`);
    }
  }
  console.log('Goldfish validated: embedded textures, 5 clips, all 250 animated poses fit, 20000 habitat targets inside tub.');
})().catch(error => { console.error(error); process.exitCode = 1; });
