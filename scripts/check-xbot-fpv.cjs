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
const meshNodes = gltf.nodes.filter(node => node.mesh !== undefined);
assert.deepEqual(meshNodes.map(node => node.name).sort(), ['Beta_Head', 'Beta_Joints', 'Beta_Surface']);
for (const node of gltf.nodes.filter(node => node.mesh !== undefined)) {
  const mesh = new THREE.Mesh();
  mesh.name = node.name;
  mesh.material = gltf.meshes[node.mesh].primitives.map(primitive => {
    const material = new THREE.MeshStandardMaterial();
    material.name = gltf.materials[primitive.material].name;
    return material;
  });
  assert.equal(isHeadMesh(mesh), node.name === 'Beta_Head', `${node.name}: only the head must be hidden in FPV`);
  assert.notEqual(node.skin, undefined, `${node.name} must retain its skeleton`);
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

// Exercise the production layer assignment with the actual exported model.
const layerModule = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/features/scene/character/characterLayers.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, {
  exports: layerModule.exports,
  require: name => name === '@config'
    ? { LAYER_WALKER: 1, LAYER_WALKER_DETAIL: 2 }
    : { isHeadMesh },
});

(async () => {
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  const { scene, animations } = await new GLTFLoader().parseAsync(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
  const camera = new THREE.PerspectiveCamera();
  camera.layers.set(1);
  const mirror = new THREE.PerspectiveCamera();
  mirror.layers.enable(1);
  mirror.layers.enable(2);
  for (const firstPerson of [true, false, true]) {
    layerModule.exports.updateCharacterLayers(scene, firstPerson);
    scene.traverse(mesh => {
      if (!mesh.isMesh) return;
      assert.equal(camera.layers.test(mesh.layers), !firstPerson || mesh.name !== 'Beta_Head');
      assert.equal(mirror.layers.test(mesh.layers), true, 'Mirrors must show the complete character');
      assert.equal(mesh.isSkinnedMesh, true);
      assert(mesh.skeleton.bones.some(bone => bone.name.includes('Head')));
    });
  }
  assert(animations.length > 0, 'Embedded animations must survive export');
  for (const clip of animations) {
    const mixer = new THREE.AnimationMixer(scene);
    mixer.clipAction(clip).play();
    mixer.setTime(clip.duration / 2);
    scene.updateMatrixWorld(true);
    scene.traverse(mesh => {
      if (!mesh.isSkinnedMesh) return;
      mesh.computeBoundingBox();
      assert(!mesh.boundingBox.isEmpty());
      assert(mesh.boundingBox.min.toArray().every(Number.isFinite));
      assert(mesh.boundingBox.max.toArray().every(Number.isFinite));
    });
    mixer.stopAllAction();
  }
  console.log(`PASS: FPV/orbit/mirror layers and ${animations.length} skinned animations.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
