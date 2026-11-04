const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../support/load-ts.cjs');

function fixture(characterId = 'rosanna') {
  const objects = [
    { id: 'desk-bollsidan-2', position: [0, 0, 0], slots: [{ slotId: 'work-standing' }] },
    { id: 'bed-east', slots: ['seat-1', 'seat-2', 'seat-3', 'lie-down'].map(slotId => ({ slotId })) },
    { id: 'chair', slots: [{ slotId: 'sit' }] },
    { id: 'duo', slots: [{ slotId: 'hug', isDuo: true }] },
    { id: 'private', slots: [{ slotId: 'use' }] },
  ];
  const occupied = new Set();
  return { occupied, objects, ...load('src/features/scene/ai/autonomousActivities.ts', {
    './aiTypes': {}, './laraLife': require('../../src/features/scene/ai/laraLife.ts'), './lifeHousekeeping': require('../../src/features/scene/ai/lifeHousekeeping.ts'), './smartObjectRegistry': {
      getAllSmartObjects: () => objects,
      buildSmartObjectInstructionSequence: (id, slotId, actor) => {
        assert.equal(actor, characterId);
        assert(objects.find(obj => obj.id === id).slots.some(slot => slot.slotId === slotId), 'The selected slot must be passed explicitly');
        const slot = objects.find(obj => obj.id === id).slots.find(slot => slot.slotId === slotId);
        return [{ type: 'MOVE_TO', smartObjectId: id, slotId },
          { type: 'USE_OBJECT', smartObjectId: id, ...slot, duration: slot.duration ?? (id === 'desk-bollsidan-2' ? 24 : undefined) }];
      },
    }, './occupancyManager': { OccupancyManager: {
      getReservations: () => [], canUseObject: id => id !== 'private',
      isSlotOccupied: (id, slotId) => occupied.has(`${id}:${slotId}`),
    } },
  }) };
}

describe('Tirage autonome par slot', () => {
  it('varie les préparations de repas entre les appareils libres sans remplacer leurs smart actions', () => {
    const { objects, occupied, getLaraLifeCandidates, buildLaraLifeInstructions } = fixture('native');
    objects.push(
      { id: 'cuisine-group', slots: [{ slotId: 'cook-stove', animation: 'cooking-stir-pan', duration: 9.3 }, { slotId: 'cook-oven', animation: 'entering-code' }, { slotId: 'wash-dishes' }] },
      ...['fridge', 'freezer'].map(id => ({ id, slots: [{ slotId: 'open-pick', animation: id }] })),
      { id: 'sofa', category: 'seating', position: [0, 0, 0], slots: [{ slotId: 'sit', entryAnimation: 'stand-to-sit', exitAnimation: 'sit-to-stand' }] },
    );
    for (const object of objects) object.position ??= [0, 0, 0];
    const meal = getLaraLifeCandidates('native', false).find(candidate => candidate.activity === 'meal');
    assert(meal);
    const random = Math.random;
    try {
      for (const [index, animation] of ['cooking-stir-pan', 'entering-code', 'fridge', 'freezer'].entries()) {
        Math.random = () => index / 4;
        const [move, use, eat] = buildLaraLifeInstructions('native', meal);
        assert.equal(use.animation, animation);
        assert.equal(use.duration, index === 0 ? 9.3 : undefined);
        assert.equal(move.lifePhase, 'prepare-meal');
        assert.equal(use.lifePhase, 'prepare-meal');
        assert.equal(eat.lifePhase, 'eat-meal');
        assert.equal(eat.smartObjectId, 'sofa');
      }
      occupied.add('cuisine-group:cook-stove');
      occupied.add('cuisine-group:cook-oven');
      occupied.add('fridge:open-pick');
      const excluded = new Set(['freezer:open-pick']);
      assert(!getLaraLifeCandidates('native', false, {}, {}, 0, excluded).some(candidate => candidate.activity === 'meal'));
      assert.throws(() => buildLaraLifeInstructions('native', meal, excluded), /Aucune préparation/);
      assert.equal(buildLaraLifeInstructions('native', meal)[1].smartObjectId, 'freezer');
      assert(!getLaraLifeCandidates('native', true).some(candidate => candidate.activity === 'meal'));
    } finally { Math.random = random; }
  });
  it('fait démarrer Xbot et Ivy par le même tirage aléatoire que Ybot', () => {
    const random = Math.random;
    try {
      Math.random = () => 0.5;
      const sequences = ['ybot', 'xbot', 'ivy'].map(id => fixture(id).buildAutonomousActivities(id));
      assert.deepEqual(sequences[1], sequences[0]);
      assert.deepEqual(sequences[2], sequences[0]);
      assert.equal(fixture().INITIAL_SMART_OBJECT_BY_CHAR.ivy, undefined);
    } finally { Math.random = random; }
  });
  it('donne quatre candidats au lit et un à la chaise, en conservant les activités duo', () => {
    const { getAvailableAutonomousActivities } = fixture();
    const candidates = getAvailableAutonomousActivities('rosanna');
    assert.equal(candidates.length, 7);
    assert.equal(candidates.filter(activity => activity.id === 'bed-east').length, 4);
    assert.equal(candidates.filter(activity => activity.id === 'chair').length, 1);
    assert(candidates.some(activity => activity.id === 'duo' && activity.slotId === 'hug'));
    assert(!candidates.some(activity => activity.id === 'private'));
  });

  it('retire les slots indisponibles du prochain tirage et gère une liste vide', () => {
    const { occupied, getAvailableAutonomousActivities } = fixture();
    occupied.add('bed-east:lie-down');
    assert.equal(getAvailableAutonomousActivities('rosanna').filter(activity => activity.id === 'bed-east').length, 3);
    for (const { id, slotId } of getAvailableAutonomousActivities('rosanna')) occupied.add(`${id}:${slotId}`);
    assert.deepEqual(getAvailableAutonomousActivities('rosanna'), []);
  });

  it('mélange tous les slots une seule fois et conserve le meuble de départ du personnage', () => {
    const { buildAutonomousActivities, getAvailableAutonomousActivities, INITIAL_SMART_OBJECT_BY_CHAR } = fixture('ybot');
    INITIAL_SMART_OBJECT_BY_CHAR.ybot = 'bed-east';
    const steps = buildAutonomousActivities('ybot');
    const entries = steps.filter(step => step.type === 'MOVE_TO');
    assert.equal(entries[0].smartObjectId, 'bed-east');
    assert.deepEqual(entries.map(step => `${step.smartObjectId}:${step.slotId}`).sort(),
      getAvailableAutonomousActivities('ybot').map(activity => `${activity.id}:${activity.slotId}`).sort());
    for (let i = 0; i < steps.length; i += 2) assert.equal(steps[i].slotId, steps[i + 1].slotId);
  });

  it('fait démarrer Native au bureau avec la durée et les animations du slot', () => {
    const steps = fixture('native').buildAutonomousActivities('native');
    assert.equal(steps.length, 2);
    assert(steps.every(step => step.smartObjectId === 'desk-bollsidan-2'));
    assert.equal(steps[1].duration, 24);
    assert.equal(steps[1].repeatCount, undefined);
    assert.equal(steps[1].animation, undefined);
  });
});
