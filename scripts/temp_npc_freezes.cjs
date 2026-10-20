const assert = require('node:assert/strict');
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const ts = require('typescript');
const THREE = require('three');

const filename = 'src/features/scene/utils/animatedFrustumCulling.ts';
function load(source) {
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  new Function('exports', 'require', output)(exports, name => {
    assert.equal(name, 'three');
    return THREE;
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
