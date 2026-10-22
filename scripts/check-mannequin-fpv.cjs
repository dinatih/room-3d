const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const THREE = require('three');

const source = fs.readFileSync('src/features/scene/characterParts.ts', 'utf8');
const moduleStub = { exports: {} };
vm.runInNewContext(ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, {
  exports: moduleStub.exports,
  require: name => name === 'three' ? THREE : {},
});
const { isHeadMesh } = moduleStub.exports;
const bytes = fs.readFileSync('public/characters/mannequin/mannequin.glb');
const gltf = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
const meshNodes = gltf.nodes.filter(node => node.mesh !== undefined);
assert.deepEqual(meshNodes.map(node => node.name).sort(), ['Ch36', 'Ch36_Head']);

for (const node of meshNodes) {
  const mesh = new THREE.Mesh();
  mesh.name = node.name;
  mesh.material = gltf.meshes[node.mesh].primitives.map(primitive => {
    const material = new THREE.MeshStandardMaterial();
    if (primitive.material !== undefined && gltf.materials && gltf.materials[primitive.material]) {
      material.name = gltf.materials[primitive.material].name;
    }
    return material;
  });
  assert.equal(isHeadMesh(mesh), node.name === 'Ch36_Head', `${node.name}: only the head must be hidden in FPV`);
  assert.notEqual(node.skin, undefined, `${node.name} must retain its skeleton`);
}

const layerModule = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/features/scene/character/characterLayers.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, {
  exports: layerModule.exports,
  require: name => name === '@config'
    ? { LAYER_WALKER: 1, LAYER_WALKER_DETAIL: 2 }
    : { isHeadMesh },
});

const scene = new THREE.Group();
for (const node of meshNodes) {
  const mesh = new THREE.Mesh();
  mesh.name = node.name;
  mesh.material = new THREE.MeshStandardMaterial({ name: 'Ch36_Body' });
  scene.add(mesh);
}

const camera = new THREE.PerspectiveCamera();
camera.layers.set(1);
const mirror = new THREE.PerspectiveCamera();
mirror.layers.enable(1);
mirror.layers.enable(2);

for (const firstPerson of [true, false, true]) {
  layerModule.exports.updateCharacterLayers(scene, firstPerson);
  scene.traverse(mesh => {
    if (!mesh.isMesh) return;
    assert.equal(camera.layers.test(mesh.layers), !firstPerson || mesh.name !== 'Ch36_Head');
    assert.equal(mirror.layers.test(mesh.layers), true, 'Mirrors must show the complete character');
  });
}

console.log('PASS: Mannequin GLB body mesh remains visible; head is hidden in FPV and visible in mirrors.');
