const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../support/load-ts.cjs');

function fixture(characterId = 'rosanna') {
  const objects = [
    { id: 'bed-east', slots: ['seat-1', 'seat-2', 'seat-3', 'lie-down'].map(slotId => ({ slotId })) },
    { id: 'chair', slots: [{ slotId: 'sit' }] },
    { id: 'duo', slots: [{ slotId: 'hug', isDuo: true }] },
    { id: 'private', slots: [{ slotId: 'use' }] },
  ];
  const occupied = new Set();
  return { occupied, ...load('src/features/scene/ai/autonomousActivities.ts', {
    './aiTypes': {}, './smartObjectRegistry': {
      getAllSmartObjects: () => objects,
      buildSmartObjectInstructionSequence: (id, slotId, actor) => {
        assert.equal(actor, characterId);
        assert(objects.find(obj => obj.id === id).slots.some(slot => slot.slotId === slotId), 'The selected slot must be passed explicitly');
        return [{ type: 'MOVE_TO', smartObjectId: id, slotId }, { type: 'USE_OBJECT', smartObjectId: id, slotId }];
      },
    }, './occupancyManager': { OccupancyManager: {
      canUseObject: id => id !== 'private',
      isSlotOccupied: (id, slotId) => occupied.has(`${id}:${slotId}`),
    } },
  }) };
}

describe('Tirage autonome par slot', () => {
  it('fait démarrer Hayley et Gloria par le même tirage aléatoire que Ybot', () => {
    const random = Math.random;
    try {
      Math.random = () => 0.5;
      const sequences = ['ybot', 'hayley (Inyeong)', 'gloria'].map(id => fixture(id).buildAutonomousActivities(id));
      assert.deepEqual(sequences[1], sequences[0]);
      assert.deepEqual(sequences[2], sequences[0]);
      assert.equal(fixture().INITIAL_SMART_OBJECT_BY_CHAR.gloria, undefined);
    } finally { Math.random = random; }
  });
  it('donne quatre candidats au lit et un à la chaise, en conservant les activités duo', () => {
    const { getAvailableAutonomousActivities } = fixture();
    const candidates = getAvailableAutonomousActivities('rosanna');
    assert.equal(candidates.length, 6);
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
    const { buildAutonomousActivities, getAvailableAutonomousActivities } = fixture();
    const steps = buildAutonomousActivities('rosanna');
    const entries = steps.filter(step => step.type === 'MOVE_TO');
    assert.equal(entries[0].smartObjectId, 'bed-east');
    assert.deepEqual(entries.map(step => `${step.smartObjectId}:${step.slotId}`).sort(),
      getAvailableAutonomousActivities('rosanna').map(activity => `${activity.id}:${activity.slotId}`).sort());
    for (let i = 0; i < steps.length; i += 2) assert.equal(steps[i].slotId, steps[i + 1].slotId);
  });
});
