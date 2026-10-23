const { it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
require('../support/load-ts.cjs');
const THREE = require('three');
const { retargetClip } = require('../../src/features/scene/retargeting/retargetClip.ts');
const { captureAnimationRig, restoreAnimationRig } = require('../../src/features/scene/character/animationSerialization.ts');

it('les quatre modèles ont le sol et la bind pose normalisés sans compensation JS', async t => {
  const { NodeIO } = await import('@gltf-transform/core');
  const { ALL_EXTENSIONS } = await import('@gltf-transform/extensions');
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'draco3d.decoder': await require('draco3d').createDecoderModule() });
  const loader = new GLTFLoader();
  loader.register(() => ({ name: 'NoTextures', loadMaterial: () => Promise.resolve(new THREE.MeshBasicMaterial()) }));
  const sourceLoader = new GLTFLoader(); sourceLoader.setDRACOLoader({ preload() {} });
  sourceLoader.register(() => ({ name: 'SkeletonOnly', loadMesh: () => Promise.resolve(new THREE.Group()) }));
  const sources = [];
  for (const id of ['laying-sleeping', 'sitting-idle']) {
    const b = fs.readFileSync(`public/animations/mixamo/anim_${id.replaceAll('-', '_')}.glb`);
    const source = await sourceLoader.parseAsync(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength), '');
    source.animations[0].name = id; sources.push(source);
  }
  for (const id of ['james', 'lewis', 'david', 'alex', 'mannequin']) {
    const doc = await io.read(`public/characters/${id}/${id}.glb`);
    doc.getRoot().listExtensionsUsed().forEach(e => e.dispose()); const b = await io.writeBinary(doc);
    const { scene } = await loader.parseAsync(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength), '');
    scene.updateMatrixWorld(true);
    const floor = new THREE.Box3().setFromObject(scene, true).min.y;
    assert(Math.abs(floor) < 1e-5, `${id}: sol natif`);
    scene.traverse(node => {
      if (node.isSkinnedMesh) node.skeleton.bones.forEach((bone, i) => {
        const matrix = bone.matrixWorld.clone().multiply(node.skeleton.boneInverses[i]);
        assert(matrix.elements.every((v, j) => Math.abs(v - new THREE.Matrix4().elements[j]) < 1e-4), `${id}: bind pose ${bone.name}`);
      });
      node.defaultPosition = node.isBone ? node.position.clone() : undefined;
      node.restLocalQuaternion = node.isBone ? node.quaternion.clone() : undefined;
      node.restWorldQuaternion = node.getWorldQuaternion(new THREE.Quaternion());
    });
    scene.scale.setScalar(100); scene.updateMatrixWorld(true);
    const hips = scene.getObjectByName('mixamorigHips'), restHeight = hips.getWorldPosition(new THREE.Vector3()).y;
    for (const source of sources) {
      const raw = source.animations[0]; const clip = retargetClip(raw, scene, source.scene);
      const worker = retargetClip(raw, restoreAnimationRig(captureAnimationRig(scene)), source.scene);
      assert.deepEqual(clip.tracks.map(t => [...t.values]), worker.tracks.map(t => [...t.values]), `${id}: worker`);
      const mixer = new THREE.AnimationMixer(scene); mixer.clipAction(clip).play(); mixer.setTime(0); scene.updateMatrixWorld(true);
      const height = hips.getWorldPosition(new THREE.Vector3()).y;
      if (raw.name === 'laying-sleeping') assert(Math.abs(height - 12) < 0.1, `${id}: bassin couché ${height}`);
      else {
        let sourceHips; source.scene.traverse(node => { if (node.isBone && /hips?$/i.test(node.name)) sourceHips = node; });
        assert(sourceHips, source.scene.children.map(n => n.name).join(','));
        const sourceRest = sourceHips.getWorldPosition(new THREE.Vector3()).y;
        const sourceMixer = new THREE.AnimationMixer(source.scene); sourceMixer.clipAction(raw).play(); sourceMixer.setTime(0); source.scene.updateMatrixWorld(true);
        const ratio = sourceHips.getWorldPosition(new THREE.Vector3()).y / sourceRest;
        assert(Math.abs(height - restHeight * ratio) < 0.1, `${id}: hauteur assise proportionnelle`);
        sourceMixer.stopAllAction(); sourceMixer.uncacheRoot(source.scene);
      }
      mixer.stopAllAction(); mixer.uncacheRoot(scene);
    }
    t.diagnostic(`${id}: sol ${(floor * 100).toFixed(5)} cm, bassin debout ${restHeight.toFixed(2)} cm`);
  }
});
