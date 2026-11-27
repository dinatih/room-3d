const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const React = require('react');
const { renderToString } = require('react-dom/server');
const THREE = require('three');
const { load } = require('../support/load-ts.cjs');
require('../support/load-ts.cjs');

const { buildHairChain } = require('../../src/features/scene/retargeting/hairChain.ts');
const { retargetClip } = require('../../src/features/scene/retargeting/retargetClip.ts');
const layers = { hairPhysics: true, breastPhysics: false };
const { useCharacterPhysics } = load('src/features/scene/character/useCharacterPhysics.ts', {
  react: React,
  three: THREE,
  '@features/scene/store/useSceneStore': { useSceneStore: { getState: () => ({ layers }) } },
});

function createPhysics() {
  let physics;
  function Rig() {
    physics = useCharacterPhysics();
    return null;
  }
  renderToString(React.createElement(Rig));
  return physics;
}

async function loadRig(path) {
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  const loader = new GLTFLoader();
  loader.setDRACOLoader({ preload() {} });
  loader.register(() => ({ name: 'SkeletonOnly', loadMesh: () => Promise.resolve(new THREE.Group()) }));
  const bytes = fs.readFileSync(path);
  return loader.parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
}

test('la tresse native se stabilise sur une image fixe de la pose lean et se fige en pause', async () => {
  const [{ scene }, source] = await Promise.all([
    loadRig('public/characters/lara/lara_native.glb'),
    loadRig('public/animations/fab/injured/lean-on-wall-rest.glb'),
  ]);
  scene.scale.setScalar(100);
  const hairBones = [];
  scene.updateMatrixWorld(true);
  scene.traverse(node => {
    node.defaultPosition = node.position.clone();
    node.restLocalQuaternion = node.quaternion.clone();
    node.restWorldQuaternion = node.getWorldQuaternion(new THREE.Quaternion());
    if (node.isBone && /hair.*ponytail/.test(node.name)) hairBones.push(node);
  });
  const { resolveTargetBoneName } = require('../../src/features/scene/retargeting/boneResolver.ts');
  const findBone = name => scene.getObjectByName(resolveTargetBoneName(scene, name));
  const physics = createPhysics();
  const chain = buildHairChain(hairBones);
  physics.hairChainRef.current = chain;
  assert.equal(chain.length, 6);
  assert.ok(chain.at(-1).length < 2 * chain.at(-2).length);
  physics.initPhysicsBones({
    bones: {
      head: findBone('Head'), hips: findBone('Hips'), spine2: findBone('Spine2'),
      lShoulder: findBone('LeftShoulder'), rShoulder: findBone('RightShoulder'), breastBones: [],
    },
    backpacks: [{ mesh: { visible: true } }],
  });

  const clip = retargetClip(source.animations[0], scene, source.scene);
  const mixer = new THREE.AnimationMixer(scene);
  const action = mixer.clipAction(clip).play();
  action.time = 41 / 30;
  mixer.update(0);
  const context = { haircut: 'original', clockElapsedTime: action.time, targetAnim: 'fab-injured-lean-on-wall-rest' };

  for (let frame = 0; frame < 600; frame++) physics.updatePhysics(1 / 60, context, scene);
  const settled = chain.map(node => node.bone.quaternion.clone());
  for (let frame = 0; frame < 60; frame++) {
    physics.updatePhysics(frame % 2 === 0 ? 1 / 120 : 1 / 40, context, scene);
    chain.forEach((node, index) => assert.ok(node.bone.quaternion.angleTo(settled[index]) < 1e-4));
  }

  for (let frame = 0; frame < 60; frame++) physics.updatePhysics(0, context, scene);
  chain.forEach((node, index) => assert.ok(node.bone.quaternion.angleTo(settled[index]) < 1e-4));
});

test('la perruque respecte son échelle, répond au mouvement et retrouve sa forme si la physique est coupée', () => {
  const physics = createPhysics();
  const scene = new THREE.Group();
  const head = new THREE.Bone();
  const strand = new THREE.Bone();
  const tip = new THREE.Bone();
  const otherRoot = new THREE.Bone();
  const otherStrand = new THREE.Bone();
  tip.position.x = 0.12;
  otherRoot.rotation.y = Math.PI / 2;
  otherStrand.position.x = 0.1;
  strand.add(tip);
  otherRoot.add(otherStrand);
  head.add(strand, otherRoot);
  const chain = buildHairChain([tip, otherStrand, strand]);
  physics.customHairChainRef.current = chain;
  scene.add(head);
  scene.scale.setScalar(100);

  assert.equal(chain.length, 3);
  const context = { haircut: 'test', clockElapsedTime: 0, targetAnim: 'idle' };
  for (let frame = 0; frame < 120; frame++) physics.updatePhysics(1 / 60, context, scene);
  for (const node of chain) {
    const anchor = node.bone.getWorldPosition(new THREE.Vector3());
    assert.ok(Math.abs(node.tipWorld.distanceTo(anchor) - node.length * 100) < 1e-8);
    const rest = node.rootParent.getWorldQuaternion(new THREE.Quaternion()).multiply(node.relQuat);
    const pose = node.bone.getWorldQuaternion(new THREE.Quaternion());
    assert.ok(pose.angleTo(rest) <= Math.PI / 12 + 1e-7);
  }

  const beforeTravel = strand.quaternion.clone();
  head.position.z += chain[0].length;
  physics.updatePhysics(1 / 60, context, scene);
  assert.ok(strand.quaternion.angleTo(beforeTravel) > 1e-3);

  layers.hairPhysics = false;
  try {
    physics.updatePhysics(0, context, scene);
    for (const node of chain) {
      assert.deepEqual(node.bone.quaternion.toArray(), node.restQuat.toArray());
      assert.equal(node.needsReset, true);
    }
  } finally {
    layers.hairPhysics = true;
  }
});
