const { it } = require('node:test');
const assert = require('node:assert/strict');
const { DEFAULT_WEATHER, parseWeatherSave } = require('../../src/features/scene/weatherPersistence.ts');
const snapshot = () => ({ version: 1, settings: { ...DEFAULT_WEATHER, automatic: false, snow: 0.7 }, surface: { snow: 0.3, water: 0.6 }, transition: { at: 42, weather: { ...DEFAULT_WEATHER } }, offset: [-120, 350] });

it('restaure réglages, surfaces, transition et nuages sans avancer une autre horloge', () => {
  const saved = snapshot();
  assert.deepEqual(parseWeatherSave(JSON.stringify(saved)), saved);
  saved.transition = null;
  assert.deepEqual(parseWeatherSave(JSON.stringify(saved)), saved);
});

it('rejette les données météo invalides avant de les appliquer', () => {
  for (const corrupt of [
    s => { s.version = 2; }, s => { s.settings.rain = -1; }, s => { s.settings.snow = 2; },
    s => { s.settings.windSpeed = 21; }, s => { s.settings.automatic = 'yes'; },
    s => { delete s.settings.coverage; }, s => { s.surface.water = null; }, s => { s.surface.snow = 3; },
    s => { s.transition.at = -10; }, s => { delete s.transition.weather; },
    s => { s.offset = [null, 1]; }, s => { s.offset = [0]; },
  ]) {
    const saved = snapshot(); corrupt(saved);
    assert.throws(() => parseWeatherSave(JSON.stringify(saved)));
  }
  for (const text of ['{', 'null', '[]', '{}']) assert.throws(() => parseWeatherSave(text));
});
