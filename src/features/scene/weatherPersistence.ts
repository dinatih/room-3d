export const WEATHER_SAVE_KEY = 'room-3d-weather';
export const DEFAULT_WEATHER = { coverage: 0.35, windSpeed: 3, windDirection: 90, rain: 0, rainVolume: 0, snow: 0, automatic: true };
export type WeatherSettings = typeof DEFAULT_WEATHER;
export type WeatherSave = {
  version: 1;
  settings: WeatherSettings;
  surface: { snow: number; water: number };
  transition: { at: number; weather: WeatherSettings } | null;
  offset: [number, number];
};
const ranges = { coverage: 1, windSpeed: 20, windDirection: 360, rain: 1, rainVolume: 1, snow: 1 };

/** Validate before applying any saved values to shaders or simulation. */
export function parseWeatherSave(text: string): WeatherSave {
  const saved = JSON.parse(text) as WeatherSave;
  const number = (value: number, max = Infinity) => {
    if (!Number.isFinite(value) || value < 0 || value > max) throw new Error('Valeur météo sauvegardée invalide');
  };
  const settings = (value: WeatherSettings) => {
    if (!value || typeof value.automatic !== 'boolean') throw new Error('Réglages météo sauvegardés invalides');
    for (const [key, max] of Object.entries(ranges)) number(value[key as keyof typeof ranges], max);
  };
  if (!saved || saved.version !== 1 || !saved.surface || !Array.isArray(saved.offset) || saved.offset.length !== 2) throw new Error('Sauvegarde météo invalide');
  settings(saved.settings);
  number(saved.surface.snow, 1); number(saved.surface.water, 1);
  if (!saved.offset.every(Number.isFinite)) throw new Error('Décalage des nuages invalide');
  if (saved.transition !== null) {
    if (!saved.transition) throw new Error('Transition météo invalide');
    number(saved.transition.at); settings(saved.transition.weather);
  }
  return saved;
}
