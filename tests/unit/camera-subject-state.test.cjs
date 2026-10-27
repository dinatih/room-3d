const { it } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../support/load-ts.cjs');
const { CAMERA_SUBJECTS, selectAnimalCameraTarget } = load('src/features/scene/camera/cameraSubjects.ts', {});

it('déduit la cible observée du store, sans événement DOM ni copie d’état React', () => {
  for (const cameraMode of ['orbit', 'top', 'iso', 'plane', 'follow', 'fpv']) {
    for (const { id, target } of CAMERA_SUBJECTS) {
      const expected = id !== 'character' && ['follow', 'fpv'].includes(cameraMode) ? id : null;
      assert.equal(selectAnimalCameraTarget({ cameraMode, cameraTarget: id }), expected);
      assert.equal(selectAnimalCameraTarget({ cameraMode, cameraTarget: target }), expected);
    }
    for (const cameraTarget of ['studio', 'charactersGrid', 'inventoryObjectGrid', 'character', 'plane']) {
      assert.equal(selectAnimalCameraTarget({ cameraMode, cameraTarget }), null);
    }
  }
});

it('actualise immédiatement la cible quand le mode ou le sujet sélectionné change', () => {
  const { create } = require('zustand');
  const store = create(() => ({ cameraMode: 'fpv', cameraTarget: 'character' })), changes = [];
  const stop = store.subscribe(state => changes.push(selectAnimalCameraTarget(state)));
  store.setState({ cameraTarget: 'drone' });
  store.setState({ cameraMode: 'follow' });
  store.setState({ cameraTarget: 'shiba' });
  store.setState({ cameraMode: 'orbit' });
  assert.deepEqual(changes, ['drone', 'drone', 'shiba', null]);
  stop();
});
