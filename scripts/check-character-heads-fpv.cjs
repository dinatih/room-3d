const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const THREE = require('three');
function loadModule(path, require) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText, { exports, require });
  return exports;
}
const { isHeadMesh } = loadModule('src/features/scene/characterParts.ts', name => name === 'three' ? THREE : {});
const { updateCharacterLayers } = loadModule('src/features/scene/character/characterLayers.ts', name =>
  name === '@config' ? { LAYER_WALKER: 1, LAYER_WALKER_DETAIL: 2 } : { isHeadMesh });
const parse = bytes => JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
const triangles = gltf => gltf.meshes.reduce((sum, mesh) => sum + mesh.primitives.reduce((n, p) => n + gltf.accessors[p.indices].count / 3, 0), 0);
for (const id of ['alex', 'james', 'david', 'lewis', 'ivy', 'valby', 'ybot', 'skeleton', 'curious_skeleton']) {
  const path = `public/characters/${id}/${id}.glb`;
  const gltf = parse(fs.readFileSync(path));
  if (process.argv[2]) {
    const original = parse(fs.readFileSync(`${process.argv[2]}/${id}.glb`));
    assert.equal(triangles(gltf), triangles(original), `${id}: preserve all triangles`);
    assert.deepEqual((gltf.animations || []).map(a => a.name), (original.animations || []).map(a => a.name), `${id}: preserve animations`);
    const joints = g => [...new Set(g.skins.flatMap(s => s.joints.map(i => g.nodes[i].name)))].sort();
    assert.deepEqual(joints(gltf), joints(original), `${id}: preserve skeleton bones`);
  }
  const scene = new THREE.Group();
  let heads = 0, bodies = 0;
  for (const node of gltf.nodes.filter(n => n.mesh !== undefined)) {
    assert.notEqual(node.skin, undefined, `${id}/${node.name}: retain skin`);
    for (const primitive of gltf.meshes[node.mesh].primitives) {
      const mesh = new THREE.Mesh();
      mesh.name = node.name;
      mesh.material.name = gltf.materials[primitive.material].name;
      if (isHeadMesh(mesh)) heads++; else bodies++;
      if (node.name.includes('_Head')) assert(isHeadMesh(mesh), `${id}: recognize separated head`);
      scene.add(mesh);
    }
  }
  assert(heads > 0 && bodies > 0, `${id}: separate head and visible body`);
  const camera = new THREE.PerspectiveCamera(); camera.layers.set(1);
  const mirror = new THREE.PerspectiveCamera(); mirror.layers.enable(1); mirror.layers.enable(2);
  for (const fpv of [true, false, true]) {
    updateCharacterLayers(scene, fpv);
    for (const mesh of scene.children) {
      assert.equal(camera.layers.test(mesh.layers), !fpv || !isHeadMesh(mesh));
      assert(mirror.layers.test(mesh.layers), `${id}: complete mirror reflection`);
    }
  }
  console.log(`PASS ${id}: ${heads} head parts, ${bodies} body parts; FPV/mirror layers${process.argv[2] ? ', triangle counts, bones and animation names preserved' : ''}`);
}
