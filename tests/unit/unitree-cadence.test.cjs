const { it } = require('node:test');
const assert = require('node:assert/strict');
require('../support/load-ts.cjs');
const THREE = require('three');
const { createUnitreeMotion, measureUnitreeWalkSpeed } = require('../../src/features/scene/items/unitreeMotion.ts');
it('calibre les deux robots sur leurs vrais pieds et préserve le modèle visible', async t => {
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  const { NodeIO } = await import('@gltf-transform/core');
  const { KHRDracoMeshCompression } = await import('@gltf-transform/extensions');
  const io = new NodeIO().registerExtensions([KHRDracoMeshCompression]).registerDependencies({ 'draco3d.decoder': await require('draco3d').createDecoderModule() });
  for (const model of ['g1', 'go2']) {
    const document = await io.read(`public/items/unitree-${model}/unitree-${model}.glb`);
    document.getRoot().listExtensionsUsed().forEach(extension => extension.dispose());
    const data = await io.writeBinary(document);
    const { scene } = await new GLTFLoader().parseAsync(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength), '');
    const before = JSON.stringify(scene.toJSON());
    const speed = measureUnitreeWalkSpeed(scene, model);
    assert(speed > 0 && Number.isFinite(speed));
    assert.equal(JSON.stringify(scene.toJSON()), before);
    const scaled = scene.clone(true); scaled.scale.multiplyScalar(2);
    assert(Math.abs(measureUnitreeWalkSpeed(scaled, model) / speed - 2) < 1e-9);
    t.diagnostic(`${model}: ${speed.toFixed(2)} cm/s`);
    if (model === 'g1') {
      const animate = createUnitreeMotion(scene, model);
      for (const [side, start] of [['left', 0.5], ['right', 0]]) {
        const foot = scene.getObjectByName(`${side}_ankle_roll_link_visual`);
        const samples = [];
        for (let frame = 0; frame <= 30; frame++) {
          const seconds = (start + frame / 60) / 0.8;
          animate('walk', seconds, Infinity);
          scene.updateMatrixWorld(true);
          const point = foot.getWorldPosition(new THREE.Vector3());
          point.z += speed * seconds;
          samples.push(point);
          const sole = new THREE.Vector3(0, 1, 0).transformDirection(foot.matrixWorld);
          assert(sole.y > 0.999999, 'semelle horizontale pendant l’appui');
        }
        for (const point of samples) {
          assert(point.distanceTo(samples[0]) < 0.001, `${side}: pied d’appui ancré au sol`);
        }
      }
      animate('walk', 0.25 / 0.8, Infinity);
      scene.updateMatrixWorld(true);
      const left = scene.getObjectByName('left_ankle_roll_link_visual').getWorldPosition(new THREE.Vector3());
      const right = scene.getObjectByName('right_ankle_roll_link_visual').getWorldPosition(new THREE.Vector3());
      assert(left.y - right.y > 4, 'le pied libre se lève réellement');
    }
    if (model === 'go2') {
      const animate = createUnitreeMotion(scene, model);
      const foot = scene.getObjectByName('FL_calf_foot');
      assert(foot, 'pied avant gauche');
      const samples = [];
      // FL is in stance during the second half of its 1.4 Hz cycle.
      for (const phase of [0.6, 0.7, 0.8, 0.9]) {
        animate('trot', phase / 1.4, Infinity);
        scene.updateMatrixWorld(true);
        samples.push(foot.getWorldPosition(new THREE.Vector3()));
      }
      const displacements = samples.slice(1).map((p, i) => Math.hypot(p.x - samples[i].x, p.z - samples[i].z));
      for (const distance of displacements) assert(Math.abs(distance - displacements[0]) < 1e-5, 'vitesse constante pendant l’appui');
    }
  }
});
