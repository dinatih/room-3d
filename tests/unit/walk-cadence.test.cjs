const { it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
require('../support/load-ts.cjs');
const THREE = require('three');
const { getWalkCycleSpeed, walkTimeScale } = require('../../src/features/scene/character/walkCadence.ts');
const { NPC_WALK_ANIMATIONS, ANIMATION_WALK_SPEEDS } = require('../../src/features/scene/ai/agent/agentWalkAnimations.ts');
const { ANIMATION_DEFINITIONS } = require('../../src/features/scene/animations/animationRegistry.ts');
const { CHARACTERS } = require('../../src/features/scene/characterConfig.ts');

function fixture(scale = 1) {
  const rig = new THREE.Group();
  rig.scale.setScalar(scale);
  for (const [name, y] of [['LeftFoot', 0], ['RightFoot', 10]]) {
    const foot = new THREE.Bone(); foot.name = name; foot.position.y = y; rig.add(foot);
  }
  const clip = new THREE.AnimationClip('walking', 1, [
    new THREE.VectorKeyframeTrack('LeftFoot.position', [0, 0.5, 1], [0, 0, 0, 0, 0, -50, 0, 0, -100]),
    new THREE.VectorKeyframeTrack('RightFoot.position', [0, 0.5, 1], [0, 10, 0, 0, 10, 50, 0, 10, 0]),
  ]);
  return { rig, clip };
}
it('mesure le pied en appui, respecte les proportions et ne modifie pas le personnage', () => {
  for (const scale of [1, 2]) {
    const { rig, clip } = fixture(scale);
    assert.equal(getWalkCycleSpeed(clip, rig), 100 * scale);
    assert.equal(rig.getObjectByName('LeftFoot').position.z, 0);
    assert.equal(getWalkCycleSpeed(clip, rig), 100 * scale);
  }
  assert.equal(getWalkCycleSpeed(new THREE.AnimationClip('idle'), new THREE.Group()), null);
});
it('synchronise la phase avec la distance, quels que soient le FPS et les ralentissements', () => {
  for (const fps of [12, 30, 60, 144]) {
    let phase = 0;
    for (let frame = 0; frame < fps; frame++) {
      const dt = 1 / fps, distance = 75 * dt;
      phase += dt * walkTimeScale(distance, dt, 100);
    }
    assert(Math.abs(phase - 0.75) < 1e-12);
  }
  assert.equal(walkTimeScale(0, 1 / 60, 100), 0);
  assert.equal(walkTimeScale(0, 0, 100), 0);
});
it('mesure les avant-pieds plutôt que les chevilles pendant le déroulé du pied', () => {
  const { rig, clip } = fixture();
  for (const side of ['Left', 'Right']) {
    const toe = new THREE.Bone();
    toe.name = `${side}ToeBase`;
    rig.add(toe);
    clip.tracks.push(new THREE.VectorKeyframeTrack(`${toe.name}.position`, [0, 1], [0, 0, 0, 0, 0, -200]));
  }
  assert.equal(getWalkCycleSpeed(clip, rig), 200);
});
it('ignore le déplacement latéral et le retour aérien, et respecte la marche arrière', () => {
  for (const backwards of [false, true]) {
    const { rig, clip } = fixture();
    if (backwards) clip.name = 'walking-backward';
    const direction = backwards ? -1 : 1;
    clip.tracks[0] = new THREE.VectorKeyframeTrack('LeftFoot.position', [0, 0.25, 0.5, 1],
      [0, 0, 0, 25, 0, -25 * direction, 50, 0, 50 * direction, 100, 0, 0]);
    assert.equal(getWalkCycleSpeed(clip, rig), 100);
  }
});
it('exclut les animations solo même lorsque leurs pieds bougent', () => {
  for (const name of ['bureau-2', 'idle', 'dancing']) {
    const { rig, clip } = fixture();
    clip.name = name;
    assert.equal(getWalkCycleSpeed(clip, rig), null);
  }
});
it('signale les marches invalides et permet de recalibrer un clip corrigé', () => {
  const { rig, clip } = fixture();
  assert.throws(() => getWalkCycleSpeed(clip, new THREE.Group()), /Pied manquant.*walking/);
  assert.equal(getWalkCycleSpeed(clip, rig), 100);
  assert.throws(() => getWalkCycleSpeed(new THREE.AnimationClip('walking'), rig), /Échantillons insuffisants.*walking/);
  const stationary = new THREE.AnimationClip('walking', 1, [
    new THREE.VectorKeyframeTrack('LeftFoot.position', [0, 1], [0, 0, 0, 0, 0, 0]),
  ]);
  assert.throws(() => getWalkCycleSpeed(stationary, rig), /Foulée invalide.*walking/);
});
it('vérifie toutes les marches calibrées sur chaque squelette humanoïde, sans retour horizontal de boucle', async t => {
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  const { retargetClip } = require('../../src/features/scene/retargeting/retargetClip.ts');
  const { resolveTargetBoneName } = require('../../src/features/scene/retargeting/boneResolver.ts');
  const read = async path => {
    const loader = new GLTFLoader();
    loader.setDRACOLoader({ preload() {} }); // Mesh decoding is skipped by SkeletonOnly.
    loader.register(() => ({ name: 'SkeletonOnly', loadMesh: () => Promise.resolve(new THREE.Group()) }));
    const data = fs.readFileSync(path);
    return loader.parseAsync(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength), '');
  };
  const definitions = ANIMATION_DEFINITIONS.filter(def => Object.hasOwn(ANIMATION_WALK_SPEEDS, def.id));
  assert.equal(definitions.length, Object.keys(ANIMATION_WALK_SPEEDS).length - 1, 'Seul walk est un alias sans GLB');
  assert(NPC_WALK_ANIMATIONS.every(id => definitions.some(def => def.id === id)), 'Chaque marche PNJ doit être calibrée et testée');
  for (const definition of definitions.filter(def => def.walkSpeed !== undefined)) {
    // FAB metadata measures authored root travel, not the retargeted forefoot.
    const original = ANIMATION_DEFINITIONS.find(def => def.id === definition.id.replace(/-in-place$/, ''));
    const source = await read(`public/${original.path}`);
    const hips = source.scene.getObjectByName(resolveTargetBoneName(source.scene, 'Hips'));
    const clip = source.animations[0], mixer = new THREE.AnimationMixer(source.scene);
    mixer.clipAction(clip).setLoop(THREE.LoopOnce, 1).play().clampWhenFinished = true;
    mixer.setTime(0); source.scene.updateMatrixWorld(true);
    const start = hips.getWorldPosition(new THREE.Vector3());
    mixer.setTime(clip.duration); source.scene.updateMatrixWorld(true);
    const end = hips.getWorldPosition(new THREE.Vector3());
    const speed = Math.hypot(end.x - start.x, end.z - start.z) * 100 / clip.duration;
    assert.equal(Number(speed.toFixed(1)), Number(definition.walkSpeed.toFixed(1)), definition.id + ' source speed');
    mixer.stopAllAction(); mixer.uncacheRoot(source.scene);
  }
  for (const path of new Set(CHARACTERS.filter(character => !character.isRobot).map(character => character.path))) {
    const { scene } = await read(`public/${path}`);
    // Match Character's world scale (1 unit = 1 cm) and captured rest transforms.
    scene.scale.multiplyScalar(100);
    scene.updateMatrixWorld(true);
    scene.traverse(node => {
      node.defaultPosition = node.position.clone();
      node.restLocalQuaternion = node.quaternion.clone();
      node.restWorldQuaternion = node.getWorldQuaternion(new THREE.Quaternion());
      node.restWorldPosition = node.getWorldPosition(new THREE.Vector3());
    });
    for (const definition of definitions) {
      const { id } = definition;
      const source = await read(`public/${definition.path}`);
      source.animations[0].name = id; // The worker receives the canonical animation ID.
      const clip = retargetClip(source.animations[0], scene, source.scene, definition.rootMotionSpace); clip.name = id;
      const speed = getWalkCycleSpeed(clip, scene);
      assert(Number.isFinite(speed) && speed > 0);
      if (path.includes('/lara/') && definition.walkSpeed === undefined) assert.equal(Number(speed.toFixed(1)), Number(ANIMATION_WALK_SPEEDS[id].toFixed(1)), id);
      for (const track of clip.tracks.filter(track => track.name.endsWith('.position'))) {
        const bone = scene.getObjectByName(track.name.slice(0, -'.position'.length));
        const start = new THREE.Vector3().fromArray(track.values).applyMatrix4(bone.parent.matrixWorld);
        const end = new THREE.Vector3().fromArray(track.values, track.values.length - 3).applyMatrix4(bone.parent.matrixWorld);
        assert(Math.hypot(end.x - start.x, end.z - start.z) < 0.001, `${path} / ${id}: retour horizontal de boucle`);
      }
      t.diagnostic(`${path} / ${id}: ${speed.toFixed(2)} cm/s`);
    }
  }
});
