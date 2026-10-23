const { it } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../support/load-ts.cjs');
it('respecte une approche de douche explicite sans déplacer les poses de douche', () => {
  const approaches = [];
  const object = { id: 'shower', name: 'Douche', category: 'hygiene', approachDoor: 'shower', position: [25, 15, 645], slots: [
    { slotId: 'right', offset: [8, 15, 650], approachOffset: [35.5, 0, 545] },
    { slotId: 'left', offset: [42, 15, 660], approachOffset: [35.5, 0, 545] },
  ] };
  const { resolveInstructionCoords } = load('src/features/scene/ai/agent/agentInstructionCoords.ts', {
    '../navigation/service': {
      getContainingObjectOwner: () => undefined,
      getDoorApproach: () => { throw Error('Generic door approach must not replace the shower approach'); },
      getObjectApproach: (owner, goal) => { approaches.push({ owner, goal }); return goal; },
    },
    '../navigation/obstacles': { hasAgentProfile: () => true },
    '../navigation/doorRequests': {}, '../../cameraState': {}, '../navigation/destinations': {},
    '../smartObjectRegistry': { getSmartObject: () => object },
    '../../animations/animationResolver': { resolveSlotAnimation: () => null },
  });
  for (const slot of object.slots) {
    const move = resolveInstructionCoords({ type: 'MOVE_TO', smartObjectId: 'shower', slotId: slot.slotId }, null, 'walker', { x: 100, z: 550 });
    assert.deepEqual([move.tx, move.ty, move.tz], slot.approachOffset);
    const use = resolveInstructionCoords({ type: 'USE_OBJECT', smartObjectId: 'shower', slotId: slot.slotId }, null, 'walker');
    assert.deepEqual([use.tx, use.ty, use.tz], slot.offset);
  }
  assert.equal(approaches.length, 4, 'Les approches restent validées par la navigation et ses obstacles');
});

it('conserve l’approche frontale du WC lors du passage à la pose assise', () => {
  const { object } = load('src/features/scene/ai/smartObjectRegistry.ts', {}, source => {
    const begin = source.indexOf("  'toilet': {");
    const end = source.indexOf("  'vasque-sdb': {", begin);
    assert(begin > 0 && end > begin);
    return `const TOILET_BOWL_CENTER = [0, 17.5, 10], TOILET_D = 70, HUMAN_BODY_RADIUS = 28;
      export const object = ({${source.slice(begin, end)}}).toilet;`;
  });
  const { resolveInstructionCoords } = load('src/features/scene/ai/agent/agentInstructionCoords.ts', {
    '../navigation/service': { getContainingObjectOwner: () => undefined, getObjectApproach: (owner, goal) => goal },
    '../navigation/obstacles': { hasAgentProfile: () => true },
    '../navigation/doorRequests': {}, '../../cameraState': {}, '../navigation/destinations': {},
    '../smartObjectRegistry': { getSmartObject: () => object },
    '../../animations/animationResolver': { resolveSlotAnimation: () => null },
  });
  const move = resolveInstructionCoords({ type: 'MOVE_TO', smartObjectId: 'toilet', slotId: 'use' }, null, 'walker');
  const use = resolveInstructionCoords({ type: 'USE_OBJECT', smartObjectId: 'toilet', slotId: 'use' }, null, 'walker');
  assert.deepEqual([move.tx, move.tz], [0, 63]);
  assert.deepEqual([use.tx, use.tz], [0, 10]);
  assert.equal(use.entryAnimation, 'stand-to-sit');
  assert.equal(use.exitAnimation, 'sit-to-stand', 'Le WC doit déclarer sa sortie depuis la suppression des relèvements automatiques');
  assert.deepEqual(use.approach, { x: 0, z: 63 }, 'L’entrée et la sortie restent devant la cuvette plutôt que sur le bord latéral le plus proche');
  const measuredMove = resolveInstructionCoords({ type: 'MOVE_TO', smartObjectId: 'toilet', slotId: 'use' }, null, 'walker', undefined, undefined, -40);
  const measuredUse = resolveInstructionCoords({ type: 'USE_OBJECT', smartObjectId: 'toilet', slotId: 'use' }, null, 'walker', undefined, undefined, -40);
  assert.deepEqual([measuredMove.tx, measuredMove.tz], [0, 50], 'La marche rejoint l’approche mesurée avant de plier les jambes');
  assert.deepEqual(measuredUse.approach, { x: 0, z: 50 }, 'L’assise commence au même point, sans reprendre l’ancien dégagement');
});
