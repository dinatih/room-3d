const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText, filename);
const { createStarfishStarts, advanceStarfish, STARFISH_STARTS } = require('../src/features/scene/items/starfishBehavior.ts');
const { BATHTUB } = require('../src/features/scene/bathtubData.ts');
const model = require('../src/features/scene/items/starfishModel.json');
let seed = 42;
const random = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
function inside(p) {
  const segment = BATHTUB.length / 2 - BATHTUB.cornerRadius;
  const dz = Math.max(Math.abs(p.z) - segment, 0);
  assert(Math.hypot(p.x, dz) + model.radius <= BATHTUB.cornerRadius - BATHTUB.wallThickness + 1e-8, 'wall penetration');
  assert(p.y - model.halfHeight >= BATHTUB.wallThickness - 1e-8, 'bottom penetration');
  assert(p.y + model.halfHeight <= BATHTUB.waterHeight + 1e-8, 'above water');
}
assert.equal(STARFISH_STARTS.length, 3);
const a = createStarfishStarts(random);
const b = createStarfishStarts(random);
assert.notDeepEqual(a.map(s => s.position), b.map(s => s.position));
for (const s of a) { inside(s.position); assert.equal(s.position.y - model.halfHeight, BATHTUB.wallThickness); }
for (let i = 0; i < a.length; i++) for (let j = i + 1; j < a.length; j++) assert(Math.hypot(a[i].position.x - a[j].position.x, a[i].position.z - a[j].position.z) >= model.radius * 2);
const modes = new Set();
for (let frame = 0; frame < 180000; frame++) for (const s of a) {
  advanceStarfish(s, 1 / 60, random);
  inside(s.position);
  modes.add(s.mode);
}
assert.deepEqual([...modes].sort(), ['crawling', 'floating', 'resting', 'rising', 'sinking']);
console.log('Three stars validated: random separate bottom starts; 50 minutes of crawling, rising, floating and sinking stay inside tub.');
(async () => {
  const THREE = await import('three');
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  const { clone } = await import('three/addons/utils/SkeletonUtils.js');
  const bytes = fs.readFileSync('public/characters/star-fish/star-fish.glb');
  const gltf = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
  assert.equal(gltf.animations.length, 1);
  const clones = a.map(() => clone(gltf.scene));
  const meshes = clones.map(scene => { let skinned; scene.traverse(o => { if (o.isSkinnedMesh) skinned = o; assert(!o.isCamera && !o.isLight); }); return skinned; });
  assert(meshes.every(Boolean));
  assert.notEqual(meshes[0].skeleton.bones[0], meshes[1].skeleton.bones[0]);
  const mixer = new THREE.AnimationMixer(clones[0]);
  mixer.clipAction(gltf.animations[0]).play();
  const center = new THREE.Vector3(...model.center);
  const box = new THREE.Box3();
  for (let frame = 0; frame <= 80; frame++) {
    mixer.setTime(frame / 24);
    clones[0].updateMatrixWorld(true);
    box.setFromObject(clones[0], true);
    for (const x of [box.min.x, box.max.x]) for (const z of [box.min.z, box.max.z]) assert(Math.hypot(x - center.x, z - center.z) * model.scale <= model.radius + 1e-5, 'animated horizontal bounds');
    assert((center.y - box.min.y) * model.scale <= model.halfHeight + 1e-5, 'animated lower bounds');
    assert((box.max.y - center.y) * model.scale <= model.halfHeight + 1e-5, 'animated upper bounds');
  }
  console.log('Asset validated: independent skeletons, original animation, all 81 poses fit the measured bounds.');
})().catch(error => { console.error(error); process.exitCode = 1; });
