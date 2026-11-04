const { it } = require('node:test');
const assert = require('node:assert/strict');
require('../support/load-ts.cjs');
const { createHomeDirt, evolveHome, roomDirt, HOME_RATES } = require('../../src/features/scene/ai/lifeHousekeeping.ts');
const { load } = require('../support/load-ts.cjs');

it('salit les pièces selon les usages et nettoie seulement la source réellement travaillée', () => {
  const dirt = createHomeDirt();
  const update = values => evolveHome(dirt, { activity: null, seconds: 0, distance: 0, room: 'living', ...values });
  update({ seconds: 600 });
  assert.equal(roomDirt(dirt, 'living'), 0, 'Time alone does not dirty a room');
  update({ activity: 'toilet', seconds: 6, room: 'bathroom' });
  assert.equal(dirt.toilet, 6 * HOME_RATES.toilet);
  assert.equal(roomDirt(dirt, 'living'), 0);
  assert.equal(roomDirt(dirt, 'bathroom'), dirt.toilet);
  update({ activity: 'meal', seconds: 10 });
  assert.equal(dirt.dishes, 10 * HOME_RATES.dishes);
  update({ distance: 100 });
  assert.equal(dirt.living, HOME_RATES.floorPerCm * 100);
  update({ activity: 'clean', objectId: 'toilet', slotId: 'clean', room: 'bathroom', seconds: 0 });
  assert.equal(dirt.toilet, 12, 'Loading or travelling cannot clean a toilet');
  update({ activity: 'clean', objectId: 'toilet', slotId: 'clean', room: 'bathroom', seconds: 1 });
  assert.equal(dirt.toilet, 7);
  assert.equal(dirt.dishes, 10, 'Cleaning the toilet must not wash the dishes');
  update({ activity: 'clean', objectId: 'cuisine-group', slotId: 'wash-dishes', seconds: 1 });
  assert.equal(dirt.dishes, 5);
  for (const seconds of [-1, NaN, Infinity]) assert.throws(() => update({ seconds }));
  assert.throws(() => update({ activity: 'clean', seconds: 1, objectId: 'unknown' }));
});

it('partage l’état de la maison entre les colocataires et choisit une tâche sale hors de la pièce actuelle', () => {
  const home = require('../../src/features/scene/ai/lifeHousekeeping.ts');
  const dirt = createHomeDirt();
  dirt.toilet = 90;
  const life = require('../../src/features/scene/ai/laraLife.ts');
  const { getLaraLifeCandidates } = load('src/features/scene/ai/autonomousActivities.ts', {
    './laraLife': life, './lifeHousekeeping': { ...home, homeDirt: dirt },
    './smartObjectRegistry': { getAllSmartObjects: () => [{ id: 'toilet', category: 'hygiene', position: [50, 0, 550], slots: [{ slotId: 'clean' }] }] },
    './occupancyManager': { OccupancyManager: { canUseObject: () => true, isSlotOccupied: () => false } },
  });
  const { useLaraLifeStore, publishLife } = load('src/features/scene/ai/laraLifeStore.ts', {
    zustand: require('zustand'), './laraLife': life, './lifeHousekeeping': { ...home, homeDirt: dirt },
  });
  const needs = { ...life.createLife('native').needs, rest: 0, work: 0, walk: 0 };
  const candidate = life.chooseLifeActivity(needs, getLaraLifeCandidates('native', false), { x: 0, z: 0 }, null, 10, {}, 0);
  assert.equal(candidate.activity, 'clean');
  assert.equal(candidate.urgency, 90);
  publishLife('native', { room: 'bathroom' });
  publishLife('cha', { room: 'bathroom' });
  evolveHome(dirt, { activity: 'clean', objectId: 'toilet', slotId: 'clean', seconds: 2, distance: 0, room: 'bathroom' });
  publishLife('vivida', { activity: 'Nettoyer' });
  const state = useLaraLifeStore.getState();
  assert.equal(roomDirt(state.home, state.characters.native.room), 80);
  assert.equal(roomDirt(state.home, state.characters.cha.room), 80);
  assert.equal(roomDirt(state.home, 'living'), 0);
});

it('résout les animations du balai sur une destination libre calculée dans la pièce', () => {
  const { resolveInstructionCoords } = load('src/features/scene/ai/agent/agentInstructionCoords.ts', {
    '../navigation/service': {}, '../navigation/obstacles': { hasAgentProfile: () => false },
    '../navigation/doorRequests': {}, '../../cameraState': {},
    '../navigation/destinations': { getZoneDestination: () => ({ x: 12, z: 34 }) },
    '../smartObjectRegistry': { getSmartObject: () => ({ name: 'Balayer', slots: [{ slotId: 'sweep', animation: 'sweeping-floor' }] }) },
    '../../animations/animationResolver': { resolveSlotAnimation: slot => ({ animation: slot.animation }) },
  });
  const target = resolveInstructionCoords({ type: 'USE_OBJECT', targetZoneId: 'living', smartObjectId: 'clean-floor-living', slotId: 'sweep' }, null);
  assert.deepEqual([target.tx, target.ty, target.tz, target.anim], [12, 0, 34, 'sweeping-floor']);
});

it('reconnaît un duo même si le tirage assis choisit le clip du partenaire B', () => {
  const { getDuoAnimationForClip } = load('src/features/scene/animations/duoAnimations.ts', {
    './animationRegistry': { ANIMATION_DEFINITIONS: [{ id: 'talking-1', path: 'partner.glb', aliases: ['partner'], duration: 3 }] },
    './interxManifest': { INTERX_DUO_ANIMATIONS: [] },
  });
  for (const key of ['talking-1', 'partner.glb', 'partner']) assert.equal(getDuoAnimationForClip(key).id, 'conversation');
});
