const { it } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../support/load-ts.cjs');
const geometry = require('../../src/features/scene/ai/navigation/geometry.ts');

it('attend la chaise en retour, réserve le dégagement et restitue les deux meubles sans concurrence', () => {
  const previousDocument = global.document, events = [], reservations = new Map(), movingFurniture = new Set(['smorkull-position']);
  const currentFurnitureTransforms = {
    'smorkull-position': { x: 150, z: 330, ry: Math.PI / 2 },
    'trash-bin-position': { x: 57, z: 340, ry: Math.PI / 2 },
  };
  const furnitureObstacles = new Map();
  global.document = { dispatchEvent: event => events.push(event.type) };
  try {
    const access = load('src/features/scene/ai/diyChairClearance.ts', {
      '../furniturePositions': { currentFurnitureTransforms, movingFurniture },
      '../wallData': { BATH_WEST_WALL: 0, ROOM_D: 400, FURNITURE_WALL_CLEARANCE: 3 },
      '../items/kallaxCuisineDrona': { KALLAX_CUISINE_POSITION: [20, 0, 350] },
      './occupancyManager': { OccupancyManager: {
        getOccupant: () => reservations.get('chair'),
        claimSlot: (object, slot, actor) => { if (reservations.has('chair')) return false; reservations.set('chair', actor); return true; },
        releaseSlot: () => reservations.delete('chair'),
      } },
      './navigation/obstacles': { furnitureObstacles, furnitureClearance: profile => profile.radius / 4, getAgentProfile: () => ({ radius: 13.3, height: 170 }) },
      './navigation/geometry': geometry,
      './smartObjectRegistry': { getSmartObject: () => ({ slots: [{ offset: [10, 0, 10] }] }) },
    });
    assert.equal(access.prepareKitchenStorageAccess('first'), false, 'A returning chair must settle before access can be evaluated');
    assert.deepEqual(events, [], 'A returning chair must not make the trash start moving prematurely');
    movingFurniture.clear();
    currentFurnitureTransforms['smorkull-position'] = { x: 10, z: 10, ry: 0 };
    furnitureObstacles.set('chair', { owner: 'chair-office', polygon: geometry.rectangle(10, 10, 30, 30) });
    assert.equal(access.prepareKitchenStorageAccess('first'), false);
    assert.equal(reservations.get('chair'), 'first');
    assert.equal(access.prepareKitchenStorageAccess('second'), false, 'Another actor cannot steal an active furniture preparation');
    currentFurnitureTransforms['smorkull-position'] = { ...access.getDiyChairParking() };
    assert.equal(access.prepareKitchenStorageAccess('first'), false, 'The trash has only just received its parking command');
    assert.deepEqual(events, ['diy-chair-clearance', 'kitchen-trash-clearance']);
    currentFurnitureTransforms['trash-bin-position'] = { ...access.getKitchenTrashParking() };
    movingFurniture.add('trash-bin-position');
    assert.equal(access.prepareKitchenStorageAccess('first'), false, 'The gesture must wait for the actual end of furniture movement');
    movingFurniture.clear();
    assert.equal(access.prepareKitchenStorageAccess('first'), true);
    access.releaseKitchenStorageAccess('second');
    assert(access.getKitchenTrashParking(), 'A different actor must not restore furniture in use');
    access.releaseKitchenStorageAccess('first');
    assert.equal(access.getKitchenTrashParking(), undefined);
    assert.equal(access.getDiyChairParking(), undefined);
    assert.equal(reservations.size, 0);
    assert.deepEqual(events, ['diy-chair-clearance', 'kitchen-trash-clearance', 'diy-chair-clearance', 'kitchen-trash-clearance']);
  } finally { if (previousDocument === undefined) delete global.document; else global.document = previousDocument; }
});
