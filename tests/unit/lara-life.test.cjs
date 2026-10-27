const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
require('../support/load-ts.cjs');
const { createLife, evolveLife, chooseLifeActivity } = require('../../src/features/scene/ai/laraLife.ts');
const { load } = require('../support/load-ts.cjs');
const position = { x: 0, z: 0 };
const candidates = [
  { activity: 'work', id: 'desk', slotId: 'work', x: 0, z: 0 },
  { activity: 'rest', id: 'sofa', slotId: 'sit', x: 10, z: 0 },
  { activity: 'walk', id: 'garden', slotId: 'breathe', x: 100, z: 0 },
];

describe('Besoins de Lara Native', () => {
  it('évolue selon le temps écoulé, indépendamment de la fréquence des images', () => {
    const initial = { rest: 50, work: 90, walk: 50 };
    let needs = initial;
    for (let frame = 0; frame < 1800; frame++) needs = evolveLife(needs, 1 / 30, 'work', false);
    const expected = evolveLife(initial, 60, 'work', false);
    for (const key of Object.keys(needs)) assert(Math.abs(needs[key] - expected[key]) < 1e-8);
    assert.deepEqual(initial, { rest: 50, work: 90, walk: 50 });
  });

  it('ne récupère pas pendant un trajet ou une attente de navigation', () => {
    const initial = { rest: 50, work: 50, walk: 50 };
    const waiting = evolveLife(initial, 10, null, false);
    const walking = evolveLife(initial, 10, null, true);
    const resting = evolveLife(initial, 10, 'rest', false);
    assert(waiting.rest > initial.rest && waiting.walk > initial.walk);
    assert(walking.rest > initial.rest && walking.walk < initial.walk);
    assert(resting.rest < initial.rest);
    assert.deepEqual(evolveLife(initial, 0, 'rest', true), initial);
  });

  it('choisit selon l’urgence, puis la mémoire, la proximité et un ordre stable', () => {
    assert.equal(chooseLifeActivity({ rest: 90, work: 50, walk: 80 }, candidates, position, null).activity, 'rest');
    assert.equal(chooseLifeActivity({ rest: 50, work: 50, walk: 50 }, candidates, position, 'work').activity, 'rest');
    assert.equal(chooseLifeActivity({ rest: 50, work: 50, walk: 50 }, candidates, position, null).activity, 'work');
    const seats = ['b', 'a'].map(id => ({ ...candidates[1], id }));
    assert.equal(chooseLifeActivity({ rest: 90, work: 0, walk: 0 }, seats, position, null).id, 'a');
  });

  it('fait une pause si les besoins sont faibles ou les activités indisponibles', () => {
    assert.equal(chooseLifeActivity({ rest: 0, work: 0, walk: 0 }, candidates, position, null), null);
    assert.equal(chooseLifeActivity({ rest: 90, work: 90, walk: 90 }, [], position, null), null);
    assert.equal(chooseLifeActivity({ rest: 90, work: 50, walk: 0 }, [candidates[0]], position, null).activity, 'work');
  });

  it('borne les besoins et signale explicitement les données invalides', () => {
    assert.deepEqual(evolveLife({ rest: 0, work: 100, walk: 100 }, 60, 'rest', false), { rest: 0, work: 100, walk: 100 });
    for (const seconds of [-1, NaN, Infinity]) assert.throws(() => evolveLife(createLife().needs, seconds, null, false));
    assert.throws(() => evolveLife({ rest: NaN, work: 0, walk: 0 }, 1, null, false));
  });
});

it('sélectionne uniquement des places de repos adaptées et libres dans la configuration active', () => {
  const life = require('../../src/features/scene/ai/laraLife.ts');
  const occupied = new Set(['sofa:seat-1']);
  const objects = [
    { id: 'sofa', category: 'seating', position: [0, 0, 0], slots: [
      { slotId: 'seat-1', offset: [10, 0, 20], entryAnimation: 'stand-to-sit', exitAnimation: 'sit-to-stand' },
      { slotId: 'seat-2', offset: [30, 0, 40], entryAnimation: 'stand-to-sit', exitAnimation: 'sit-to-stand' },
      { slotId: 'duo', isDuo: true, entryAnimation: 'stand-to-sit', exitAnimation: 'sit-to-stand' },
      { slotId: 'unconfigured' },
    ] },
    { id: 'private', category: 'seating', position: [0, 0, 0], slots: [{ slotId: 'sit', entryAnimation: 'stand-to-sit', exitAnimation: 'sit-to-stand' }] },
    { id: 'garden-fresh-air', position: [100, 0, 200], slots: [{ slotId: 'breathe' }] },
  ];
  const { getLaraLifeCandidates, buildLaraLifeInstructions } = load('src/features/scene/ai/autonomousActivities.ts', {
    './laraLife': life,
    './smartObjectRegistry': { getAllSmartObjects: () => objects,
      buildSmartObjectInstructionSequence: (id, slotId) => [{ type: 'USE_OBJECT', smartObjectId: id, slotId }] },
    './occupancyManager': { OccupancyManager: { canUseObject: id => id !== 'private',
      isSlotOccupied: (id, slotId) => occupied.has(`${id}:${slotId}`) } },
  });
  const available = getLaraLifeCandidates();
  assert.deepEqual(available.map(c => c.slotId), ['seat-2', 'breathe']);
  assert.deepEqual([available[0].x, available[0].z], [30, 40]);
  const gardenSteps = buildLaraLifeInstructions(available[1]);
  assert.equal(gardenSteps[0].targetZoneId, 'garden');
  const garden = gardenSteps[1];
  assert.equal(garden.animation, 'looking');
  assert.equal(garden.repeatCount, 1);
  occupied.clear();
  assert.equal(getLaraLifeCandidates().filter(c => c.activity === 'rest').length, 2);
});
