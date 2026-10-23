const { it } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../support/load-ts.cjs');
const THREE = require('three');
const { fitPostureTransition } = require('../../src/features/scene/animations/postureTransition.ts');

it('interpole les orientations par le quart de tour le plus court dans les deux sens', () => {
  const { lerpAngle } = load('src/features/scene/animations/animationTransitions.ts', {
    './animationResolver': {},
  });
  const quarter = Math.PI / 2;
  for (const [from, to, turn] of [[3 * quarter, 0, quarter], [0, 3 * quarter, -quarter],
    [-3 * quarter, 0, -quarter], [0, -3 * quarter, quarter], [7 * quarter, 0, quarter]]) {
    let previous = from, travelled = 0;
    for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
      const angle = lerpAngle(from, to, progress);
      assert(Math.abs(angle - (from + turn * progress)) < 1e-12);
      travelled += Math.abs(angle - previous);
      previous = angle;
    }
    assert(Math.abs(travelled - quarter) < 1e-12);
    assert(Math.abs(Math.sin(previous - to)) < 1e-12);
    assert(Math.cos(previous - to) > 0);
  }
});

it('reconnaît l’alias canonique d’assise comme transition', () => {
  const entry = { id: 'miley-armature-stand-to-sit', tags: ['sitting'], duration: 5.1 };
  const { isPostureTransition } = load('src/features/scene/animations/animationTransitions.ts', {
    './animationResolver': { getAnimationDef: key => ['stand-to-sit', entry.id].includes(key) ? entry : undefined },
  });
  assert.equal(isPostureTransition('stand-to-sit'), true);
  assert.equal(isPostureTransition(entry.id), true);
});
it('ajuste la descente du bassin de la pose debout actuelle à la pose assise sans modifier le clip partagé', () => {
  const hips = new THREE.Object3D();
  new THREE.Group().add(hips);
  hips.name = 'Hips'; hips.position.set(0, 100, 0);
  const source = new THREE.AnimationClip('entry', 2, [new THREE.VectorKeyframeTrack('Hips.position', [0, 1, 2], [0, 90, 0, 0, 70, -10, 0, 50, -20])]);
  const seated = new THREE.AnimationClip('seated', 1, [new THREE.VectorKeyframeTrack('Hips.position', [0, 1], [0, 45, 0, 0, 45, 0])]);
  const fitted = fitPostureTransition(source, hips, seated).tracks[0];
  assert.deepEqual([...fitted.values.slice(0, 3)], [0, 100, 0]);
  assert.deepEqual([...fitted.values.slice(-3)], [0, 45, 0]);
  assert.ok(fitted.values[4] < 100 && fitted.values[4] > 45);
  assert.deepEqual([...source.tracks[0].values.slice(-3)], [0, 50, -20]);
});

it('laisse le déplacement au sol à la navigation même avec un bassin dans un repère tourné', () => {
  const parent = new THREE.Group(), hips = new THREE.Object3D();
  parent.rotation.x = -Math.PI / 2;
  parent.add(hips); parent.updateMatrixWorld(true);
  hips.name = 'Hips'; hips.position.set(0, 0, 100);
  const source = new THREE.AnimationClip('entry', 2, [new THREE.VectorKeyframeTrack('Hips.position', [0, 1, 2], [0, 0, 100, 12, -30, 70, 5, -60, 50])]);
  const seated = new THREE.AnimationClip('seated', 1, [new THREE.VectorKeyframeTrack('Hips.position', [0, 1], [0, 0, 45, 0, 0, 45])]);
  const fitted = fitPostureTransition(source, hips, seated).tracks[0];
  assert(Math.abs(fitted.values[3]) < 1e-6, 'Aucun déport latéral du bassin');
  assert(Math.abs(fitted.values[4]) < 1e-6, 'Aucun recul ajouté au trajet');
  assert.equal(fitted.values[5], 67.5, 'La descente verticale originale est conservée');
  assert.deepEqual([...source.tracks[0].values.slice(3, 6)], [12, -30, 70]);
});

it('sort uniquement des assises configurées et attend la fin réelle du relèvement devant le siège', () => {
  const { harness } = load('src/features/scene/ai/agentController.ts', {}, source => {
    const begin = source.indexOf('  const beginSlotExit =');
    const end = source.indexOf('  const releaseClaimedSlot =', begin);
    const update = source.indexOf("    if (agentStatus === 'TRANSITIONING') {");
    const updateEnd = source.indexOf('    const scenarioLength =', update);
    assert(begin > 0 && end > begin && update > end && updateEnd > update);
    return `export function harness(exitAnimation) {
      const state = { x: 270, y: 0, z: -80, animation: 'sitting-idle' };
      const cachedCoords = { exitAnimation, approach: { x: 225, z: -80 }, owner: 'sofa-garden-east' };
      let agentStatus = 'INTERACTING', postureTransition = null, animationPlayback = null;
      const resolveAnimationId = id => id;
      const route = {}, _characterId = 'test', BOOLEAN_PRECISION = 1e-6;
      const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
      const movePostureTransition = (route, id, previous, target, owner) => {
        if (owner !== cachedCoords.owner) throw Error('Lost furniture collision owner');
        return target;
      };
      const reportNavigationStop = () => { throw Error('Unexpected block'); };
      ${source.slice(begin, end)}
      return { begin: beginSlotExit, state, status: () => agentStatus,
        tick(progress, finished = false) {
          animationPlayback = { animation: exitAnimation, progress, finished };
          ${source.slice(update, updateEnd)}
        }
      };
    }`;
  });
  const plain = harness(undefined);
  assert.equal(plain.begin(), false);
  assert.equal(plain.status(), 'INTERACTING');
  const seat = harness('sit-to-stand');
  assert.equal(seat.begin(), true);
  assert.equal(seat.begin(), false, 'Do not restart a running exit');
  seat.tick(0.5);
  assert.equal(seat.state.x, 247.5);
  assert.equal(seat.status(), 'TRANSITIONING');
  seat.tick(1);
  assert.equal(seat.status(), 'TRANSITIONING', 'Elapsed progress alone cannot complete playback');
  seat.tick(1, true);
  assert.equal(seat.state.x, 225);
  assert.equal(seat.state.z, -80);
  assert.equal(seat.state.animation, 'idle');
  assert.equal(seat.status(), 'IDLE');
});
