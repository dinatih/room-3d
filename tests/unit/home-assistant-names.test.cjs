const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../support/load-ts.cjs');
const { compareTuyaNames } = require('../../src/features/home-assistant/nameComparison.ts');
const device = (id, name, override, domain = 'tuya') => ({ id, name, name_by_user: override, identifiers: [[domain, id]], area_id: 'living', model: 'Lampe' });
test('Compare les noms du même appareil Tuya, sans confondre les entités ou les Hue', () => {
  const rows = compareTuyaNames([
    device('same', 'Barre', null), device('ola', 'Porte ', 'Lumière Séjour'), device('hue', 'Porte', 'Hue', 'hue'),
  ], [{ device_id: 'ola', platform: 'tuya', entity_id: 'light.porte', name: 'Nom entité' }], [{ area_id: 'living', name: 'Séjour' }]);
  assert.equal(rows.length, 2);
  assert.deepEqual(rows[0], { id: 'ola', tuyaName: 'Porte ', haName: 'Lumière Séjour', different: true, area: 'Séjour', model: 'Lampe', entities: [{ device_id: 'ola', platform: 'tuya', entity_id: 'light.porte', name: 'Nom entité' }] });
  assert.equal(rows[1].different, false);
});
test('Ne cache pas les différences d’espaces et indique explicitement les noms absents', () => {
  const rows = compareTuyaNames([device('space', 'Lampe ', 'Lampe'), device('absent', null, null)], [], []);
  assert.equal(rows[0].different, true);
  assert.equal(rows[0].area, 'Sans pièce');
  assert.equal(rows[1].tuyaName, null);
});
