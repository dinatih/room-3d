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
test('AMF870 rotation uses the verified number entity, supports all arcs and rejects invalid steps', () => {
  const angle = entity('0', { min: 0, max: 350, step: 5 });
  for (const value of [0, 45, 90, 180, 270, 350, 125]) {
    assert.deepEqual(applianceCommand('airPerformerOscillation', angle, value), {
      domain: 'number', service: 'set_value', data: { entity_id: 'number.living_room', value },
    });
  }
  assert.equal(applianceCommand('airPerformerOscillation', entity('350', angle.attributes)).data.value, 0);
  for (const value of [NaN, 351, -5, 42, true, '90']) assert.throws(() => applianceCommand('airPerformerOscillation', angle, value));
  assert.throws(() => applianceCommand('airPerformerOscillation', entity('0', {}), 90));
});
test('AMF870 presets, temperatures, switches and display use their real HA services', () => {
  assert.deepEqual(applianceCommand('airPerformerPreset', entity('on', { supported_features: 8, preset_modes: ['auto', 'sleep', 'turbo'], preset_mode: 'auto' }), 'sleep'), {
    domain: 'fan', service: 'set_preset_mode', data: { entity_id: 'fan.living_room', preset_mode: 'sleep' },
  });
  assert.equal(applianceAvailable('airPerformerPreset', entity('on', { supported_features: 1 })), false);
  const temperature = entity('24', { min: 1, max: 37, step: 1 });
  assert.equal(applianceCommand('airPerformerTemperature', temperature, 26).data.value, 26);
  assert.throws(() => applianceCommand('airPerformerTemperature', temperature, 38));
  assert.equal(applianceCommand('airPerformerChildLock', entity('off', {})).service, 'turn_on');
  assert.equal(applianceCommand('airPerformerDisplay', entity('on', { brightness: 26 }), 50).data.brightness_pct, 50);
  assert.equal(applianceCommand('airPerformerDisplay', entity('on', {}), 0).service, 'turn_off');
  assert.equal(applianceCommand('airPerformerTimer', entity('Off', { options: ['Off', '30min', '1h'] })).data.option, '30min');
});
test('AMF870 speed and display state are converted without inventing unavailable measurements', () => {
  const { applianceValue } = require('../../src/features/home-assistant/appliances.ts');
  assert.equal(applianceCommand('airPerformerSpeed', entity('on', { supported_features: 1, percentage_step: 10 }), 7).data.percentage, 70);
  assert.equal(applianceValue('airPerformerSpeed', entity('on', { percentage: 70 })), 7);
  assert.equal(applianceValue('airPerformerSpeed', entity('off', { percentage: null })), undefined);
  assert.equal(applianceValue('airPerformerDisplay', entity('on', { brightness: 26 })), 10);
  assert.equal(applianceValue('airPerformerOscillation', entity('unavailable', {})), undefined);
});
