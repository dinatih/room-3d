const { it } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../support/load-ts.cjs');
const { CHARACTERS, DEFAULT_LARA_COUNT, LARA_COUNT_MODES, getDefaultSceneCharacterIds, isCharacterVisibleInMode } = require('../../src/features/scene/characterConfig.ts');
const state = { layers: { laraCount: DEFAULT_LARA_COUNT }, activeCharacterId: 'native' };
const grid = load('src/features/scene/character/characterGridUtils.ts', {
  '../characterConfig': { CHARACTERS, isCharacterVisibleInMode },
  './useCharacterGridStore': { useCharacterGridStore: { getState: () => ({}) } },
  '@features/scene/store/useSceneStore': { useSceneStore: { getState: () => state } },
});

it('chooses an occupied middle column for incomplete grids', () => {
  for (let count = 1; count <= CHARACTERS.length; count++) {
    const index = grid.getCharacterGridCenterIndex(count);
    assert(index >= 0 && index < count);
    const pos = grid.getCharacterGridPosition(index, count);
    assert(Math.abs(pos.x - grid.CHARACTER_GRID_CONFIG.centerX) <= grid.CHARACTER_GRID_CONFIG.colSpacing / 2);
  }
  assert.equal(grid.getCharacterGridCenterIndex(7), 2);
});

it('frames every row around the active character in perspective and ortho', () => {
  for (const count of [...LARA_COUNT_MODES, CHARACTERS.length]) {
    const view = grid.getCharacterGridCameraView(count);
    const ortho = grid.getCharacterGridOrthoViews(count).front;
    const halfHeight = (view.pos[2] - view.target[2]) * Math.tan(grid.CHARACTER_GRID_CONFIG.fov * Math.PI / 360);
    assert.deepEqual(view.target, grid.getCharacterGridActiveTarget(count));
    for (let index = 0; index < count; index++) {
      const pos = grid.getCharacterGridPosition(index, count);
      for (const y of [pos.y, pos.y + grid.CHARACTER_GRID_CONFIG.characterHeight]) {
        assert(Math.abs(y - view.target[1]) < halfHeight, `perspective: ${count} characters, row ${index}`);
        assert(Math.abs(y - ortho.target[1]) < ortho.viewH / 2, `ortho: ${count} characters, row ${index}`);
      }
    }
  }
});

it('ajoute Cha aux sept personnages présents par défaut sans remplacer personne', () => {
  assert.equal(DEFAULT_LARA_COUNT, 8);
  assert(LARA_COUNT_MODES.includes(DEFAULT_LARA_COUNT));
  assert.deepEqual(getDefaultSceneCharacterIds(DEFAULT_LARA_COUNT, 'native'), [
    'xbot', 'native', 'rosanna', 'marissa', 'delphina', 'sara', 'sabira', 'cha',
  ]);
  assert(isCharacterVisibleInMode('cha', DEFAULT_LARA_COUNT, 'native'));
});
