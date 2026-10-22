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
  const object = { id: 'toilet', name: 'WC', category: 'hygiene', position: [50, 0, 508.7], slots: [
    { slotId: 'use', offset: [50, 0, 518.7], approachOffset: [50, 0, 571.7], animation: 'sit-idle' },
  ] };
  const { resolveInstructionCoords } = load('src/features/scene/ai/agent/agentInstructionCoords.ts', {
    '../navigation/service': { getContainingObjectOwner: () => undefined, getObjectApproach: (owner, goal) => goal },
    '../navigation/obstacles': { hasAgentProfile: () => true },
    '../navigation/doorRequests': {}, '../../cameraState': {}, '../navigation/destinations': {},
    '../smartObjectRegistry': { getSmartObject: () => object },
    '../../animations/animationResolver': { resolveSlotAnimation: () => null },
  });
  const move = resolveInstructionCoords({ type: 'MOVE_TO', smartObjectId: 'toilet', slotId: 'use' }, null, 'walker');
  const use = resolveInstructionCoords({ type: 'USE_OBJECT', smartObjectId: 'toilet', slotId: 'use' }, null, 'walker');
  assert.deepEqual([move.tx, move.tz], [50, 571.7]);
  assert.deepEqual([use.tx, use.tz], [50, 518.7]);
  assert.deepEqual(use.approach, { x: 50, z: 571.7 }, 'L’entrée reste devant la cuvette plutôt que sur le bord latéral le plus proche');
});
