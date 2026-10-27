const { it } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../support/load-ts.cjs');

const actions = load('src/features/scene/objectActionRegistry.ts', {
  './positionState': { positionState: {} },
  './furniturePositions': { DOUBLE_BED_POSITIONS: [] },
  './ai/smartObjectRegistry': {},
  './objectActions': {},
  '@features/inventory/inventoryData': { WIGS_ITEMS: [] },
});
const scene = {};

it('Ninja : sortir la grille ouvre la porte ; fermer rentre la grille sans éteindre la lumière', () => {
  const extended = actions.toggleObjectAction('ninja-rack', { 'ninja-light': true });
  assert.equal(extended.ninja, true);
  assert.equal(extended['ninja-rack'], true);
  const closed = actions.toggleObjectAction('ninja', extended);
  assert.equal(closed.ninja, false);
  assert.equal(closed['ninja-rack'], false);
  assert.equal(closed['ninja-light'], true);
});
const { useDoorOpen } = load('src/features/scene/items/useDoorOpen.ts', {
  '../utils/useFurnitureToggles': { useFurnitureToggles: () => scene },
});

for (const key of ['cabinet', 'utdrag', 'entryDoor', 'livingDoor', 'bathroomDoor', 'showerDoor', 'eastGlassDoor', 'glassDoorV2LeftOpen']) {
  it(`${key} : ouvrir, maintenir ouvert puis fermer, sans modifier la scène depuis l’aperçu`, () => {
    scene[key] = false;
    let preview = {};
    assert.match(actions.getActionLabel(key, false), /^(Ouvrir|Déplier)/);
    preview = actions.toggleObjectAction(key, preview);
    assert.equal(useDoorOpen(key, true, preview), true);
    assert.equal(useDoorOpen(key, false, preview), false);
    assert.match(actions.getActionLabel(key, preview[key]), /^(Fermer|Rentrer)/);
    scene[key] = true;
    preview = actions.toggleObjectAction(key, preview);
    assert.equal(useDoorOpen(key, true, preview), false);
    assert.equal(useDoorOpen(key, false, preview), true);
    scene[key] = false;
    assert.equal(useDoorOpen(key, false, preview), false);
  });
}
