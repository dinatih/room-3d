const { it } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../support/load-ts.cjs');

it('garde les activités du bâtiment B à l’intérieur du sol, avec un dégagement pour le corps', () => {
  const { EXTERIOR_GROUND } = require('../../src/features/scene/environmentData.ts');
  const { object } = load('src/features/scene/ai/smartObjectRegistry.ts', { fixture: { EXTERIOR_GROUND } }, source => {
    const begin = source.indexOf("  'building-b-corridor': {");
    const end = source.indexOf("  'building-b-garden':", begin);
    return `import { EXTERIOR_GROUND } from 'fixture'; const HUMAN_BODY_RADIUS = 20;
      export const object = ({${source.slice(begin, end)}})['building-b-corridor'];`;
  });
  for (const slot of object.slots) {
    const [x, , z] = slot.offset ?? object.position;
    assert(x > EXTERIOR_GROUND.x - EXTERIOR_GROUND.width / 2);
    assert(x < EXTERIOR_GROUND.x + EXTERIOR_GROUND.width / 2);
    assert(z > EXTERIOR_GROUND.z - EXTERIOR_GROUND.depth / 2);
    assert(z <= EXTERIOR_GROUND.z + EXTERIOR_GROUND.depth / 2 - 20);
  }
});

it('expose uniquement les lits présents dans la configuration active', () => {
  const positionState = {};
  const { getAllSmartObjectIds } = load('src/features/scene/ai/smartObjectRegistry.ts', { '../positionState': { positionState } }, source => {
    const begin = source.indexOf('export function getAllSmartObjectIds()');
    const end = source.indexOf('export function getSmartObjectsByCategory', begin);
    return `import { positionState } from '../positionState';
      const SMART_OBJECTS = { 'bed-double': {}, 'bed-west': {}, 'bed-east': {}, shower: {} };
      ${source.slice(begin, end)}`;
  });
  assert.deepEqual(getAllSmartObjectIds(), ['bed-west', 'bed-east', 'shower']);
  positionState['bed-double'] = { idx: 1 };
  assert.deepEqual(getAllSmartObjectIds(), ['bed-double', 'shower']);
  positionState['bed-double'].idx = 0;
  assert.deepEqual(getAllSmartObjectIds(), ['bed-west', 'bed-east', 'shower']);
});

it('réserve le sommeil des lits simples et doubles aux clips de sommeil, sans Gunplay', () => {
  const manifests = Object.fromEntries(['interx', 'fab', 'behave', 'kit', 'accad'].map(name => [`./${name}Manifest`, { [`${name.toUpperCase()}_ANIMATION_DEFINITIONS`]: [] }]));
  const registry = load('src/features/scene/animations/animationRegistry.ts', manifests);
  const { getAnimationsByTags, resolveSlotAnimationInfo } = load('src/features/scene/animations/animationResolver.ts', {
    './animationRegistry': registry, './duoAnimations': {},
  });
  const { beds } = load('src/features/scene/ai/smartObjectRegistry.ts', { furniture: require('../../src/features/scene/furniturePositions.ts') }, source => {
    const begin = source.indexOf("  'bed-double': {");
    const end = source.indexOf("\n  },", source.indexOf("  'bed-east': {", begin)) + 5;
    return `import { BED_FRAME_WIDTH, BED_FRAME_LENGTH } from 'furniture'; const HUMAN_BODY_RADIUS = 20; export const beds = { ${source.slice(begin, end)} };`;
  });
  const sleepIds = getAnimationsByTags('sleep').map(animation => animation.id);
  const furniture = require('../../src/features/scene/furniturePositions.ts');
  const positionState = { 'bed-position': { idx: 0 }, 'bed-double': { idx: 1 } };
  const fixtures = { ...furniture, positionState, HUMAN_BODY_RADIUS: 20, SMART_OBJECTS: beds,
    getObjectTransform: () => { const p = furniture.BED_DOUBLE_CENTER_POSITIONS[positionState['bed-position'].idx]; return { position: [p.x, 0, p.z], rotationY: p.ry }; } };
  const { getSmartObject } = load('src/features/scene/ai/smartObjectRegistry.ts', { fixtures }, source =>
    `import { positionState, HUMAN_BODY_RADIUS, BED_FRAME_WIDTH, BED_FRAME_LENGTH, DOUBLE_BED_POSITIONS, SMART_OBJECTS, getObjectTransform } from 'fixtures';\n${source.slice(source.indexOf('export function getSmartObject(objectId:'))}`);
  for (const side of [0, 1]) {
    positionState['bed-position'].idx = side;
    const bed = furniture.DOUBLE_BED_POSITIONS[side];
    const seats = getSmartObject('bed-double').slots.filter(slot => slot.slotId.startsWith('seat-'));
    assert.equal(seats.length, 2);
    assert.ok(seats[0].offset[2] < seats[1].offset[2]);
    for (const seat of seats) {
      const edge = side === 0 ? bed.east.x + furniture.BED_FRAME_WIDTH / 2 : bed.west.x - furniture.BED_FRAME_WIDTH / 2;
      assert.ok(side === 0 ? seat.offset[0] > edge : seat.offset[0] < edge, 'Pieds hors du matelas');
      assert.ok(side === 0 ? seat.approachOffset[0] > seat.offset[0] : seat.approachOffset[0] < seat.offset[0]);
      assert.equal(seat.offset[1], 0);
      assert.equal(seat.rotY, side === 0 ? Math.PI / 2 : 3 * Math.PI / 2);
    }
  }
  assert.ok(sleepIds.includes('laying-sleeping'));
  assert.ok(getAnimationsByTags('sleep').every(animation => !animation.tags.includes('transition')));
  assert.deepEqual(getAnimationsByTags('sleep-transition').map(animation => animation.id), ['lie-down-bed', 'get-up-bed']);
  assert.ok(getAnimationsByTags('laying').every(animation => !animation.id.startsWith('miley-')));
  for (const bed of Object.values(beds)) {
    for (const slot of bed.slots.filter(slot => slot.slotId.startsWith('lie-down'))) {
      const variants = resolveSlotAnimationInfo(slot).variants;
      assert.ok(variants.length > 0);
      assert.deepEqual(variants.map(variant => variant.canonicalId).sort(), [...sleepIds].sort());
    }
  }
  for (const id of ['gunplay', 'gunplay-1', 'gunplay-shooting']) {
    const animation = registry.ANIMATION_DEFINITIONS.find(animation => animation.id === id);
    assert.deepEqual(animation.tags, ['combat']);
  }
  const length = beds['bed-double'].slots.filter(slot => slot.slotId.startsWith('lie-down-length-'));
  assert.equal(beds['bed-double'].slots.length, 5, 'Deux assises et trois couchages dans la longueur');
  assert.equal(length.length, 3);
  assert.equal(length[1].offset[2], 0, 'Une place doit rester au milieu du lit');
  for (const slot of length) {
    assert.equal(slot.rotY, Math.PI / 2);
    for (const other of length) assert.ok(!slot.excludes.includes(other.slotId));
  }
});
