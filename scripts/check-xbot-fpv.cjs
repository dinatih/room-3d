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
const bytes = fs.readFileSync('public/characters/xbot/Xbot_official.glb');
const gltf = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
for (const node of gltf.nodes.filter(node => node.mesh !== undefined)) {
  const mesh = new THREE.Mesh();
  mesh.name = node.name;
  mesh.material = gltf.meshes[node.mesh].primitives.map(primitive => {
    const material = new THREE.MeshStandardMaterial();
    material.name = gltf.materials[primitive.material].name;
    return material;
  });
  assert.equal(isHeadMesh(mesh), false, `${node.name} must remain visible in FPV`);
}
for (const name of ['face', 'body_face', 'CharacterFace', 'Face_001', 'head', 'hair', 'eyes']) {
  const mesh = new THREE.Mesh();
  mesh.name = name;
  assert.equal(isHeadMesh(mesh), true, `${name} must be hidden in FPV`);
}
const mesh = new THREE.Mesh();
mesh.material.name = 'Character_Face';
assert.equal(isHeadMesh(mesh), true, 'Face materials must still identify head meshes');
console.log('PASS: Xbot GLB body meshes remain visible; face/head/hair/eyes are recognized.');
