const { it } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../support/load-ts.cjs');

it('confie la préparation à un PNJ disponible, attend les occupants et range le matin', () => {
  const simulationClock = { minutes: 0 }, furniture = { bedDouble: false };
  let update, blocked;
  const commands = [], reservations = [];
  const life = require('../../src/features/scene/ai/laraLife.ts');
  const cameraState = { isSceneLaunched: true, positions: { native: { x: 150, y: 0, z: 310 }, cha: { x: 100, y: 0, z: 310 } } };
  const snapshot = { needs: { rest: 40, meal: 0, toilet: 0, hygiene: 0 }, current: { status: 'IDLE' } };
  const previousDocument = global.document, previousEvent = global.CustomEvent;
  global.document = { dispatchEvent: event => {
    commands.push(event.detail);
    update(); // Interrupting a life activity publishes synchronously, before reserving the task.
    reservations.push({ slot: 'bed-arrangement:' + event.detail.slotId, characterId: event.detail.targetId });
  } };
  global.CustomEvent = class { constructor(type, options) { this.detail = options.detail; } };
  const { mountBedRoutine } = load('src/features/scene/ai/bedRoutine.ts', {
    './laraLifeStore': { simulationClock, useLaraLifeStore: {
      subscribe: fn => { update = fn; return () => { update = undefined; }; }, getState: () => ({ characters: { native: snapshot, cha: snapshot } }),
    } },
    './laraLife': life, '../store/useSceneStore': { useSceneStore: { getState: () => ({ furniture, activeCharacterId: 'player' }) } },
    '../cameraState': { cameraState }, './occupancyManager': { OccupancyManager: { getReservations: () => reservations }, isInRoom: () => true },
    './bedLayout': { bedLayoutBlock: () => blocked }, './smartObjectRegistry': { getSmartObject: () => ({ id: 'bed-arrangement', position: [150, 0, 320] }) },
    './navigation/geometry': require('../../src/features/scene/ai/navigation/geometry.ts'), '@/devLog': {}, '@features/ui/AppConsole': { appLog() {} },
  });
  const stop = mountBedRoutine();
  const seek = hour => { simulationClock.minutes = hour * 60 - 480; update(); };
  try {
    seek(18); assert.equal(commands.length, 0);
    blocked = 'Lit réservé'; seek(21); assert.equal(commands.length, 0);
    blocked = undefined; snapshot.needs.rest = 0; seek(21.1); assert.equal(commands.length, 0);
    snapshot.needs.rest = 40; seek(21.2);
    assert.deepEqual(commands, [{ targetId: 'native', objectId: 'bed-arrangement', slotId: 'double' }]);
    assert.equal(furniture.bedDouble, false, 'L’horloge seule ne doit jamais déplacer le lit');
    seek(22); assert.equal(commands.length, 1, 'Ne pas répéter un ordre au même PNJ');
    furniture.bedDouble = true;
    reservations.length = 0;
    blocked = 'Personnage encore couché'; seek(7); assert.equal(commands.length, 1);
    blocked = undefined; snapshot.current.smartObjectId = 'toilet'; seek(8); assert.equal(commands.length, 1);
    delete snapshot.current.smartObjectId; seek(8.1);
    assert.equal(commands[1].slotId, 'single');
    assert.equal(furniture.bedDouble, true, 'Le PNJ doit rejoindre le lit avant le rangement');
    stop(); assert.equal(update, undefined);
  } finally { global.document = previousDocument; global.CustomEvent = previousEvent; }
});

it('place les actions dans l’allée opposée au lit et rétablit les points simples', () => {
  const positionState = { 'bed-double': { idx: 1 }, 'bed-position': { idx: 0 } };
  const { DOUBLE_BED_POSITIONS } = require('../../src/features/scene/furniturePositions.ts');
  const { ROOM_W } = require('../../src/features/scene/wallData.ts');
  let deskX = ROOM_W - 21;
  const SMART_OBJECTS = Object.fromEntries(['clean-floor-living', 'dance-mirror-south', 'dance-bed-east-north', 'hugs-point', 'interx-affection-point', 'interx-affection-garden-point'].map(id => [id, { id, position: [160, 0, id.includes('garden') ? -200 : 200], slots: [{ slotId: 'action' }] }]));
  const fixtures = { positionState, DOUBLE_BED_POSITIONS, ROOM_W, SMART_OBJECTS, getObjectTransform: () => ({ position: [deskX, 0, 155], rotationY: 0 }) };
  const { getSmartObject } = load('src/features/scene/ai/smartObjectRegistry.ts', { fixtures }, source => `import { positionState, DOUBLE_BED_POSITIONS, ROOM_W, SMART_OBJECTS, getObjectTransform } from 'fixtures';\n${source.slice(source.indexOf('export function getSmartObject(objectId:'))}`);
  for (const index of [0, 1]) {
    positionState['bed-position'].idx = index;
    deskX = index === 0 ? ROOM_W - 21 : 56;
    for (const id of ['clean-floor-living', 'dance-mirror-south', 'dance-bed-east-north']) {
      const object = getSmartObject(id), x = object.position[0], bed = DOUBLE_BED_POSITIONS[index];
      assert.ok(index === 0 ? x > bed.east.x + 83 / 2 && x < deskX - 18 : x < bed.west.x - 83 / 2 && x > deskX + 18);
      assert.deepEqual(object.slots[0].offset, object.position);
    }
  }
  assert.deepEqual(getSmartObject('interx-affection-point').position, SMART_OBJECTS['interx-affection-garden-point'].position);
  assert.deepEqual(getSmartObject('hugs-point').position, SMART_OBJECTS['interx-affection-garden-point'].position);
  positionState['bed-double'].idx = 0;
  for (const id of Object.keys(SMART_OBJECTS)) assert.deepEqual(getSmartObject(id).position, SMART_OBJECTS[id].position);
});
