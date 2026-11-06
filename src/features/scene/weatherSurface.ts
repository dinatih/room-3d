/** Normalised garden cover; durations are simulated minutes. */
export const weatherSurface = { snow: 0, water: 0 };
const SNOW_BUILD_MINUTES = 30;
const MELT_MINUTES = 90;
const PUDDLE_BUILD_MINUTES = 15;
const DRY_MINUTES = 120;

export function advanceWeatherSurface(surface: typeof weatherSurface, rain: number, snow: number, minutes: number) {
  if (![surface.snow, surface.water, rain, snow, minutes].every(Number.isFinite) || minutes < 0) throw new Error('Invalid weather surface state');
  const melted = Math.min(surface.snow, (1 - snow) * (1 + rain) * minutes / MELT_MINUTES);
  return {
    snow: Math.max(0, Math.min(1, surface.snow + snow * minutes / SNOW_BUILD_MINUTES - melted)),
    water: Math.max(0, Math.min(1, surface.water + rain * minutes / PUDDLE_BUILD_MINUTES + melted - (1 - rain) * minutes / DRY_MINUTES)),
  };
}
