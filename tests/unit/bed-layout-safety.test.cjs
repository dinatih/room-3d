const { it } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../support/load-ts.cjs');
const geometry = require('../../src/features/scene/ai/navigation/geometry.ts');
const positions = require('../../src/features/scene/furniturePositions.ts');

function fixture() {
  const cameraState = { positions: {} }, furnitureObstacles = new Map(), reservations = [];
  const currentFurnitureTransforms = {
    'bed-west-position': { ...positions.SINGLE_BED_POSITIONS.west }, 'bed-east-position': { ...positions.SINGLE_BED_POSITIONS.east },
    'desk1-position': { ...positions.DESK1_POSITIONS[0] }, 'desk2-position': { ...positions.DESK2_POSITIONS[0] }, 'smorkull-position': { ...positions.SMORKULL_POSITIONS[0] },
  };
  const movingFurniture = new Set();
  const safety = load('src/features/scene/ai/bedLayout.ts', {
    '../cameraState': { cameraState }, '../positionState': { positionState: {} },
    '../furniturePositions': { ...positions, currentFurnitureTransforms, movingFurniture },
    './navigation/obstacles': { furnitureObstacles, hasAgentProfile: () => true, getAgentProfile: () => ({ radius: 14, height: 170 }) },
    './navigation/geometry': geometry, './occupancyManager': { OccupancyManager: { getReservations: () => reservations } },
    '@features/ui/AppConsole': { appLog() {} },
  });
  for (const side of ['west', 'east']) {
    const p = positions.SINGLE_BED_POSITIONS[side];
    furnitureObstacles.set('bed-' + side, { id: 'bed-' + side + ':0', owner: 'bed-double',
      polygon: geometry.rectangle(p.x, p.z, positions.BED_FRAME_WIDTH, positions.BED_FRAME_LENGTH), yMin: 0, yMax: 45 });
  }
  return { ...safety, cameraState, furnitureObstacles, reservations, movingFurniture, currentFurnitureTransforms };
}

it('refuse le réaménagement avec un occupant, une réservation entrante ou une sortie encore dans le passage', () => {
  const f = fixture();
  assert.equal(f.bedLayoutBlock(true), undefined);
  for (const id of ['bed-west', 'bed-double', 'desk-bollsidan-2', 'chair-office']) {
    f.reservations.push({ slot: id + ':use', characterId: 'native' });
    assert.match(f.bedLayoutBlock(true), /réservé/);
    f.reservations.length = 0;
  }
  f.movingFurniture.add('bed-east-position');
  assert.match(f.bedLayoutBlock(true), /déplacement/);
  f.movingFurniture.clear();
  // Vivida's recorded exit: outside the final mattress, but her body is still too close.
  f.cameraState.positions.vivida = { x: 56.0718, y: 0, z: 291.46587 };
  assert.match(f.bedLayoutBlock(true), /vivida/);
  f.cameraState.positions.vivida.z = 340;
  assert.equal(f.bedLayoutBlock(true), undefined);
});

it('suspend un pas de meuble si un acteur entre après le départ, puis reprend sans le déplacer', () => {
  const f = fixture(), from = f.currentFurnitureTransforms['bed-east-position'];
  const to = { ...from, x: from.x - 5 };
  f.cameraState.positions.robot = { x: from.x - positions.BED_FRAME_WIDTH / 2 - 15, y: 0, z: from.z };
  assert.equal(f.furnitureActorBlock('bed-east-position', from, to), 'robot');
  f.cameraState.positions.robot.z += positions.BED_FRAME_LENGTH;
  assert.equal(f.furnitureActorBlock('bed-east-position', from, to), undefined);
  assert.equal(f.currentFurnitureTransforms['bed-east-position'].x, from.x);
});
