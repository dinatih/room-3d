const { it } = require('node:test');
const assert = require('node:assert/strict');
const { Vector3 } = require('three');
const { load } = require('../support/load-ts.cjs');
const { droneMovement, droneInput, useDroneControlStore } = load('src/features/scene/droneControls.ts', {
  zustand: require('zustand'), three: require('three'),
});
const movement = (keys, yaw = 0, pitch = 0) => droneMovement(new Set(keys), yaw, pitch, new Vector3());

it('déplace le drone selon le regard avec les deux dispositions de clavier et les flèches', () => {
  assert(movement(['z']).equals(movement(['w'])));
  assert(movement(['w']).equals(movement(['ArrowUp'])));
  assert(movement(['q']).equals(movement(['a'])));
  assert(movement(['a']).equals(movement(['ArrowLeft'])));
  assert(movement(['d']).equals(new Vector3(-1, 0, 0)));
  assert(movement(['z'], Math.PI / 2).distanceTo(new Vector3(1, 0, 0)) < 1e-12);
  assert(movement(['z'], 0, Math.PI / 4).distanceTo(new Vector3(0, Math.SQRT1_2, Math.SQRT1_2)) < 1e-12);
});
it('conserve la vitesse en diagonale et annule les commandes opposées', () => {
  assert(Math.abs(movement(['z', 'd', ' ']).length() - 1) < 1e-12);
  assert(movement(['z', 's', 'q', 'd', ' ', 'c']).equals(new Vector3()));
  assert(movement(['z', 'w', 'ArrowUp']).length() === 1);
});
it('monte et descend verticalement quelle que soit l’inclinaison de la caméra', () => {
  assert(movement([' '], 2, 1).equals(new Vector3(0, 1, 0)));
  assert(movement(['c'], 2, 1).equals(new Vector3(0, -1, 0)));
});
it('réserve Alt + flèches au regard tout en permettant le déplacement avec ZQSD', () => {
  assert(movement(['Alt', 'ArrowUp', 'ArrowRight']).equals(new Vector3()));
  assert(movement(['Alt', 'ArrowRight', 'z']).equals(movement(['z'])));
});
it('libère les entrées lors de la prise ou de la fin du pilotage', () => {
  for (const piloting of [true, false]) {
    droneInput.keys.add('z');
    useDroneControlStore.getState().setPiloting(piloting);
    assert.equal(droneInput.keys.size, 0);
    assert.equal(useDroneControlStore.getState().piloting, piloting);
  }
});
it('pilote avec la croix gauche et réserve la croix droite aux rotations', () => {
  for (const key of ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']) {
    assert(movement(['character:' + key]).equals(movement([key])));
    assert(movement(['camera:' + key]).equals(new Vector3()));
  }
  assert(movement(['character:Elevate'], 2, 1).equals(movement([' '], 2, 1)));
  assert(movement(['character:Descend'], 2, 1).equals(movement(['c'], 2, 1)));
  assert(movement(['Alt', 'ArrowLeft', 'character:ArrowUp']).equals(movement(['z'])));
});
