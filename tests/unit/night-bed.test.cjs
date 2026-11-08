const { it } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../support/load-ts.cjs');

it('déploie une fois par nuit, respecte 2 h / 6 h et restaure le mobilier', () => {
  const simulationClock = { minutes: 0 }, furniture = { bedDouble: false };
  const positionState = { 'desk1-position': { idx: 2 }, 'desk2-position': { idx: 3 }, 'smorkull-position': { idx: 1 } };
  let update, selected, selections = 0;
  const events = [];
  const fixtures = {
    simulationClock, positionState,
    lifeClock: require('../../src/features/scene/ai/laraLife.ts').lifeClock,
    useLaraLifeStore: { subscribe: fn => { update = fn; return () => { update = undefined; }; } },
    useSceneStore: { getState: () => ({ furniture, toggleFurniture: () => { furniture.bedDouble = !furniture.bedDouble; } }) },
    setDoublePosIdx: index => { selected = index; selections++; },
    document: { dispatchEvent: event => events.push(event.detail) },
    CustomEvent: class { constructor(type, options) { this.detail = options.detail; } },
  };
  const { mount } = load('src/features/scene/placements/LivingRoomPlacements.tsx', { fixtures }, source => {
    const start = source.indexOf('    let nightDay:');
    const end = source.indexOf('\n  }, []);', start);
    return `import { simulationClock, positionState, lifeClock, useLaraLifeStore, useSceneStore, setDoublePosIdx, document, CustomEvent } from 'fixtures';
      export function mount() { ${source.slice(start, end)} }`;
  });
  const stop = mount();
  const seek = (hour, day = 2) => { simulationClock.minutes = (day - 1) * 1440 + hour * 60 - 480; update(); };
  seek(1.99); assert.equal(furniture.bedDouble, false);
  seek(2); assert.equal(furniture.bedDouble, true); assert.ok(selected === 0 || selected === 1);
  seek(5.99); assert.equal(selections, 1);
  seek(6); assert.equal(furniture.bedDouble, false);
  assert.deepEqual(events, Object.entries(positionState).map(([key, state]) => ({ key, index: state.idx })));
  seek(2, 3); assert.equal(selections, 2); assert.equal(furniture.bedDouble, true);
  stop(); assert.equal(update, undefined);
});

it('place les actions dans l’allée opposée au lit et rétablit les points simples', () => {
  const positionState = { 'bed-double': { idx: 1 }, 'bed-position': { idx: 0 } };
  const { DOUBLE_BED_POSITIONS } = require('../../src/features/scene/furniturePositions.ts');
  const { ROOM_W } = require('../../src/features/scene/wallData.ts');
  let deskX = ROOM_W - 21;
  const SMART_OBJECTS = Object.fromEntries(['clean-floor-living', 'dance-mirror-south', 'dance-bed-east-north', 'interx-affection-point', 'interx-affection-garden-point'].map(id => [id, { id, position: [160, 0, id.includes('garden') ? -200 : 200], slots: [{ slotId: 'action' }] }]));
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
  positionState['bed-double'].idx = 0;
  for (const id of Object.keys(SMART_OBJECTS)) assert.deepEqual(getSmartObject(id).position, SMART_OBJECTS[id].position);
});
