const { it } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../support/load-ts.cjs');
const THREE = require('three');
const { fitPostureTransition } = require('../../src/features/scene/animations/postureTransition.ts');

it('reconnaît l’alias canonique d’assise comme transition et ne déclenche pas un relèvement supplémentaire', () => {
  const entry = { id: 'miley-armature-stand-to-sit', tags: ['sitting'], duration: 5.1 };
  const { isPostureTransition, getExitTransition } = load('src/features/scene/animations/animationTransitions.ts', {
    './animationResolver': { getAnimationDef: key => ['stand-to-sit', entry.id].includes(key) ? entry : undefined },
  });
  assert.equal(isPostureTransition('stand-to-sit'), true);
  assert.equal(isPostureTransition(entry.id), true);
  assert.equal(getExitTransition('stand-to-sit'), null);
});
it('ajuste la descente du bassin de la pose debout actuelle à la pose assise sans modifier le clip partagé', () => {
  const hips = new THREE.Object3D();
  hips.name = 'Hips'; hips.position.set(0, 100, 0);
  const source = new THREE.AnimationClip('entry', 2, [new THREE.VectorKeyframeTrack('Hips.position', [0, 1, 2], [0, 90, 0, 0, 70, -10, 0, 50, -20])]);
  const seated = new THREE.AnimationClip('seated', 1, [new THREE.VectorKeyframeTrack('Hips.position', [0, 1], [0, 45, 0, 0, 45, 0])]);
  const fitted = fitPostureTransition(source, hips, seated).tracks[0];
  assert.deepEqual([...fitted.values.slice(0, 3)], [0, 100, 0]);
  assert.deepEqual([...fitted.values.slice(-3)], [0, 45, 0]);
  assert.ok(fitted.values[4] < 100 && fitted.values[4] > 45);
  assert.deepEqual([...source.tracks[0].values.slice(-3)], [0, 50, -20]);
});
