const assert = require('node:assert/strict');
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const ts = require('typescript');
const THREE = require('three');

const filename = 'src/features/scene/utils/animatedFrustumCulling.ts';
function load(source, dependencies = {}) {
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  new Function('exports', 'require', output)(exports, name => {
    if (name === 'three') return THREE;
    assert(name in dependencies, `Unexpected dependency: ${name}`);
    return dependencies[name];
  });
  return exports;
}
const before = load(execFileSync('git', ['show', `3916b752:${filename}`], { encoding: 'utf8' }));
const after = load(fs.readFileSync(filename, 'utf8'));
function fixture(api) {
  const bones = Array.from({ length: 180 }, () => new THREE.Bone());
  const root = new THREE.Group();
  root.add(...bones);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 1, 2, 0, -1, 0, 3], 3));
  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute([0, 90, 179, 0, 0, 90, 179, 0, 0, 90, 179, 0], 4));
  geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute([.5, .3, .2, 0, .1, .2, .7, 0, .2, .6, .2, 0], 4));
  geometry.morphAttributes.position = [new THREE.Float32BufferAttribute([1, 0, 0, 0, 2, 0, 0, 0, 3], 3)];
  geometry.morphTargetsRelative = true;
  const mesh = new THREE.SkinnedMesh(geometry, new THREE.MeshBasicMaterial());
  root.add(mesh);
  root.updateMatrixWorld(true);
  mesh.bind(new THREE.Skeleton(bones));
  api.enableAnimatedFrustumCulling(mesh);
  return { root, mesh, bones };
}
const old = fixture(before), current = fixture(after);
for (let pose = 0; pose < 50; pose++) {
  for (const { root, mesh, bones } of [old, current]) {
    root.position.set(pose, pose / 3, -pose / 2);
    root.scale.set(1.2, .8, 1.7);
    for (const [i, bone] of bones.entries()) {
      bone.rotation.set(Math.sin(pose + i), Math.cos(pose - i), pose / 10);
      bone.position.set(i / 100, Math.sin(pose), i / 70);
    }
    mesh.morphTargetInfluences[0] = (pose % 5) / 4;
    root.updateMatrixWorld(true);
  }
  assert.deepEqual(current.mesh.boundingSphere, old.mesh.boundingSphere);
  assert.deepEqual(after.meshWorldBounds(current.mesh, new THREE.Box3()), before.meshWorldBounds(old.mesh, new THREE.Box3()));
  for (let i = 0; i < 3; i++) {
    const vertex = current.mesh.getVertexPosition(i, new THREE.Vector3());
    const sphere = current.mesh.boundingSphere;
    assert(vertex.distanceTo(sphere.center) <= sphere.radius + 1e-6);
  }
}
function benchmark(mesh) {
  const start = performance.now();
  for (let i = 0; i < 100000; i++) void mesh.boundingSphere;
  return performance.now() - start;
}
benchmark(old.mesh); benchmark(current.mesh);
console.log('50 poses, morphs, nonuniform scale, moving bind transform: identical bounds; all vertices contained.');
console.log('100,000 repeated culling checks (ms):', { before: benchmark(old.mesh), after: benchmark(current.mesh) });
const report = '/tmp/room-freeze-profile/summary.json';
if (fs.existsSync(report)) {
  const run = JSON.parse(fs.readFileSync(report)).runs[0];
  console.log('Profile renderer:', run.samples.at(-1).page.renderer);
  console.log('Profile errors:', run.errors);
}

// Compare actual perch resolution and obstacle discovery against the previous
// implementation, including visibility changes, reparenting and moving furniture.
const birdFile = 'src/features/scene/birdPerches.ts';
const birdDependencies = { './wallData': {} };
const previousBird = load(execFileSync('git', ['show', `4015bce4:${birdFile}`], { encoding: 'utf8' }) + '\nexport { groundObstacles, supportsOf };', birdDependencies);
const currentBird = load(fs.readFileSync(birdFile, 'utf8') + '\nexport { groundObstacles, supportsOf };', birdDependencies);
const world = new THREE.Scene();
const ground = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial());
ground.userData.birdSupport = { id: 'ground', kind: 'ground' };
world.add(ground);
const furniture = [];
for (let i = 0; i < 500; i++) {
  const root = new THREE.Group();
  root.visible = i % 2 === 0;
  root.position.set(2000 + i, 0, 0);
  root.userData = i % 3 === 0
    ? { birdSupport: { id: `furniture-${i}`, kind: 'furniture' } }
    : { animUnit: true, itemName: `furniture-${i}` };
  let parent = root;
  for (let depth = 0; depth < 20; depth++) {
    const child = new THREE.Group(); parent.add(child); parent = child;
  }
  parent.add(new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), new THREE.MeshBasicMaterial()));
  world.add(root); furniture.push(root);
}
const feet = { left: new THREE.Vector3(-1, 0, 0), right: new THREE.Vector3(1, 0, 0), height: 15, radius: 3, thickness: 1 };
const perch = { support: ground, mesh: ground, descriptor: ground.userData.birdSupport,
  point: new THREE.Vector3(), normal: new THREE.Vector3(0, 1, 0), tangent: new THREE.Vector3(1, 0, 0), id: 'test' };
for (const state of ['clear', 'moved', 'hidden', 'removed', 'reparented', 'hidden-ground']) {
  const obstacle = furniture[0];
  if (state === 'moved') obstacle.position.set(0, 0, 0);
  if (state === 'hidden') obstacle.visible = false;
  if (state === 'removed') world.remove(obstacle);
  if (state === 'reparented') { furniture[1].add(obstacle); obstacle.visible = true; }
  if (state === 'hidden-ground') ground.visible = false;
  world.updateMatrixWorld(true);
  assert.deepEqual(currentBird.groundObstacles(world, ground), previousBird.groundObstacles(world, ground), state);
  assert.deepEqual(currentBird.supportsOf(world), previousBird.supportsOf(world), state);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), qa = new THREE.Quaternion(), qb = new THREE.Quaternion();
  const oldResult = previousBird.resolveBirdPerch(perch, world, feet, a, qa);
  assert.equal(currentBird.resolveBirdPerch(perch, world, feet, b, qb), oldResult, state);
  if (state === 'clear') assert.equal(oldResult, true);
  if (state === 'moved') assert.equal(oldResult, false);
  assert.deepEqual(a, b); assert.deepEqual(qa, qb);
}
function obstacleBenchmark(api) {
  const start = performance.now();
  for (let i = 0; i < 200; i++) api.groundObstacles(world, ground);
  return performance.now() - start;
}
obstacleBenchmark(previousBird); obstacleBenchmark(currentBird);
console.log('Perches: identical supports, obstacles, contact positions and rotations after moving, hiding, removing and reparenting.');
console.log('200 obstacle scans, 11,000 scene nodes (ms):', { before: obstacleBenchmark(previousBird), after: obstacleBenchmark(currentBird) });
