const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../support/load-ts.cjs');
const { applianceCommand, applianceAvailable } = require('../../src/features/home-assistant/appliances.ts');
const entity = (state, attributes) => ({ state, attributes });
test('HA shutter percent open is inverted exactly once; unavailable stop is rejected', () => {
  const cover = entity('open', { current_position: 50, supported_features: 7 });
  assert.equal(applianceCommand('glassDoorV2ShutterPos', cover, 70).data.position, 30);
  assert.equal(applianceAvailable('shutterStop', cover), false);
  assert.throws(() => applianceCommand('shutterStop', cover));
  assert.throws(() => applianceCommand('glassDoorV2ShutterPos', cover, NaN));
});
test('HA purifier uses reported modes and speed step', () => {
  assert.equal(applianceCommand('airPerformerMode', entity('heating', { options: ['fan', 'circulation', 'heating'] })).data.option, 'fan');
  assert.throws(() => applianceCommand('airPerformerMode', entity('heating', { options: ['fan'] }), 'auto'));
  assert.equal(applianceCommand('airPerformerSpeed', entity('on', { percentage: 100, percentage_step: 10, supported_features: 1 })).data.percentage, 10);
});
test('Power commands validate capability, availability and value', () => {
  assert.equal(applianceCommand('tvOn', entity('on', { supported_features: 256 })).service, 'turn_off');
  assert.equal(applianceCommand('tvOn', entity('off', { supported_features: 128 })).service, 'turn_on');
  assert.throws(() => applianceCommand('tvOn', entity('unavailable', { supported_features: 384 })));
  assert.throws(() => applianceCommand('tvOn', entity('off', { supported_features: 0 })));
  assert.throws(() => applianceCommand('tvOn', entity('on', { supported_features: 384 }), 'on'));
});
