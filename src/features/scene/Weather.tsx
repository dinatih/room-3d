import { WeatherAudio } from './WeatherAudio';
import { DEFAULT_WEATHER, WEATHER_SAVE_KEY, parseWeatherSave, type WeatherSave, type WeatherSettings } from './weatherPersistence';
import { advanceWeatherSurface, weatherSurface } from './weatherSurface';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BackSide, Color, MathUtils, ShaderMaterial, Vector2 } from 'three';
import { create } from 'zustand';
import { CategoryLayerGroup } from './sceneLayer';
import { LAYER_ENVIRONMENT } from '@config';
import { SKY_CENTER, SKY_RADIUS } from './skyBounds';
import { simulationClock } from './ai/laraLifeStore';
import { daylight, simulatedHour } from './DayNight';

let saved: WeatherSave | undefined;
let loadError: string | null = null;
if (typeof window !== 'undefined') {
  try {
    const text = window.localStorage.getItem(WEATHER_SAVE_KEY);
    if (text !== null) saved = parseWeatherSave(text);
  } catch (error) {
    console.error('Chargement météo impossible', error);
    loadError = 'Sauvegarde météo illisible. Elle est conservée ; réinitialisez-la pour reprendre la sauvegarde.';
  }
}
const weatherRuntime: Pick<WeatherSave, 'transition' | 'offset'> = { transition: saved?.transition ?? null, offset: saved?.offset ?? [0, 0] };
if (saved) Object.assign(weatherSurface, saved.surface);
const automaticParam = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('weatherAuto');
export const useWeather = create(() => ({ ...DEFAULT_WEATHER, ...saved?.settings, ...(automaticParam === null ? {} : { automatic: automaticParam !== '0' }), saveError: loadError }));
if (saved && saved.settings.automatic !== useWeather.getState().automatic) weatherRuntime.transition = null;

function saveWeather() {
  if (loadError) return;
  try {
    const state = useWeather.getState();
    const settings = Object.fromEntries(Object.keys(DEFAULT_WEATHER).map(key => [key, state[key as keyof WeatherSettings]])) as WeatherSettings;
    const text = JSON.stringify({ version: 1, settings, surface: weatherSurface, ...weatherRuntime } satisfies WeatherSave);
    if (window.localStorage.getItem(WEATHER_SAVE_KEY) !== text) window.localStorage.setItem(WEATHER_SAVE_KEY, text);
    if (state.saveError) useWeather.setState({ saveError: null });
  } catch (error) {
    if (!useWeather.getState().saveError) console.error('Sauvegarde météo impossible', error);
    useWeather.setState({ saveError: 'La sauvegarde météo a échoué. Vérifiez le stockage du navigateur.' });
  }
}
if (typeof window !== 'undefined') {
  useWeather.subscribe((state, previous) => {
    if (state.automatic === previous.automatic) return;
    weatherRuntime.transition = null;
    const url = new URL(window.location.href);
    url.searchParams.set('weatherAuto', state.automatic ? '1' : '0');
    window.history.replaceState(window.history.state, '', url);
  });
  window.addEventListener('popstate', () => useWeather.setState({ automatic: new URLSearchParams(window.location.search).get('weatherAuto') !== '0' }));
}
// Artistic cycle: six simulated hours per condition, thirty-minute transitions.
const PERIOD = 6 * 60;
const TRANSITION = 30;
const phases = [
  { coverage: 0.05, rain: 0, snow: 0, windSpeed: 1, windDirection: 90 },
  { coverage: 0.8, rain: 0, snow: 0, windSpeed: 4, windDirection: 120 },
  { coverage: 1, rain: 0.8, snow: 0, windSpeed: 7, windDirection: 150 },
  { coverage: 0.9, rain: 0, snow: 0.8, windSpeed: 2, windDirection: 90 },
];
export function automaticWeather(minutes: number) {
  if (!Number.isFinite(minutes) || minutes < 0) throw new Error('Invalid weather time');
  const phase = Math.floor(minutes / PERIOD) % phases.length;
  const from = phases[(phase + phases.length - 1) % phases.length], to = phases[phase];
  const blend = MathUtils.smoothstep(minutes % PERIOD, 0, TRANSITION);
  return Object.fromEntries(Object.keys(to).map(key => [key, MathUtils.lerp(from[key as keyof typeof from], to[key as keyof typeof to], blend)])) as typeof to;
}
const settings = [
  { key: 'snow', label: 'Neige', max: 1, step: 0.01, unit: '' },
  { key: 'rain', label: 'Pluie', max: 1, step: 0.01, unit: '' },
  { key: 'rainVolume', label: 'Volume pluie et vent', max: 1, step: 0.01, unit: '' },
  { key: 'coverage', label: 'Couverture nuageuse', max: 1, step: 0.01, unit: '' },
  { key: 'windSpeed', label: 'Vent', max: 20, step: 0.5, unit: ' m/s' },
  { key: 'windDirection', label: 'Direction du vent', max: 360, step: 1, unit: '°' },
] as const;

export function WeatherControls() {
  const weather = useWeather();
  return <fieldset className="p-2 border-bottom" onKeyDown={event => event.stopPropagation()}>
    <legend className="small fw-semibold mb-1">Météo</legend>
    <div className="form-check form-switch small">
      <input id="weather-auto" type="checkbox" className="form-check-input" checked={weather.automatic} onChange={event => useWeather.setState({ automatic: event.target.checked })} />
      <label htmlFor="weather-auto" className="form-check-label">Météo automatique</label>
    </div>
    {weather.automatic && <p className="small text-muted mb-1">Changement toutes les 6 h simulées (6 min à ×1), transition sur 30 min simulées.</p>}
    {weather.saveError && <div className="alert alert-warning small p-2" role="alert">
      {weather.saveError}
      <button className="btn btn-sm btn-outline-secondary mt-1" onClick={() => { window.localStorage.removeItem(WEATHER_SAVE_KEY); window.location.reload(); }}>Réinitialiser la météo</button>
    </div>}
    {settings.map(({ key, label, max, step, unit }) => <div key={key}>
      <label className="small form-label mb-0" htmlFor={`weather-${key}`}>{label} : {key === 'coverage' ? `${Math.round(weather[key] * 100)} %` : `${Math.round(weather[key] * 100) / 100}${unit}`}</label>
      <input id={`weather-${key}`} className="form-range" type="range" min={0} max={max} step={step} value={weather[key]} onChange={event => useWeather.setState({ [key]: Number(event.target.value), ...(key === 'rainVolume' ? {} : { automatic: false }) })} />
    </div>)}
  </fieldset>;
}

export function Weather() {
  useEffect(() => {
    const timer = window.setInterval(saveWeather, 1000);
    const visibility = () => { if (document.hidden) saveWeather(); };
    window.addEventListener('pagehide', saveWeather);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      window.clearInterval(timer); saveWeather();
      window.removeEventListener('pagehide', saveWeather);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, []);
  const previousMinutes = useRef(simulationClock.minutes);
  const material = useRef<ShaderMaterial>(null!);
  const uniforms = useMemo(() => ({ offset: { value: new Vector2(...weatherRuntime.offset) }, coverage: { value: 0 }, tint: { value: new Color() } }), []);
  useFrame((_, delta) => {
    const state = useWeather.getState();
    const minutes = simulationClock.minutes;
    const elapsed = minutes - previousMinutes.current;
    previousMinutes.current = minutes;
    if (state.automatic) {
      weatherRuntime.transition ??= { at: minutes, weather: state };
      const elapsed = Math.max(0, minutes - weatherRuntime.transition.at);
      const target = automaticWeather(minutes);
      const blend = MathUtils.smoothstep(elapsed, 0, TRANSITION);
      const next = Object.fromEntries(Object.entries(target).map(([key, value]) => [key, MathUtils.lerp(weatherRuntime.transition!.weather[key as keyof typeof target], value, blend)]));
      if (Object.entries(next).some(([key, value]) => state[key as keyof typeof target] !== value)) useWeather.setState(next);
    } else weatherRuntime.transition = null;
    const weather = useWeather.getState();
    Object.assign(weatherSurface, advanceWeatherSurface(weatherSurface, weather.rain, weather.snow, elapsed));
    const { coverage, windSpeed, windDirection } = useWeather.getState();
    const direction = windDirection * Math.PI / 180;
    // m/s to scene centimetres; drift stays continuous when wind settings change.
    const active = material.current.uniforms;
    active.offset.value.x += Math.cos(direction) * windSpeed * 100 * delta;
    active.offset.value.y += Math.sin(direction) * windSpeed * 100 * delta;
    weatherRuntime.offset = active.offset.value.toArray();
    active.coverage.value = coverage;
    active.tint.value.set('#182338').lerp(new Color('#edf1f5'), daylight(simulatedHour()));
  });
  return <CategoryLayerGroup layer={LAYER_ENVIRONMENT} register={false}>
    <WeatherAudio />
    <mesh position={SKY_CENTER} renderOrder={10} userData={{ isSky: true }}>
      <sphereGeometry args={[SKY_RADIUS * 0.75, 48, 32]} />
      <shaderMaterial ref={material} uniforms={uniforms} side={BackSide} transparent depthWrite={false}
        vertexShader={`varying vec3 direction; void main() { direction = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`}
        fragmentShader={`
          varying vec3 direction; uniform vec2 offset; uniform float coverage; uniform vec3 tint;
          float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
          float noise(vec2 p) {
            vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
            return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
          }
          void main() {
            vec3 ray = normalize(direction);
            if (ray.y <= 0.0) discard;
            vec2 p = ray.xz / max(ray.y, 0.05) * 3.0 - offset / 3000.0;
            float density = noise(p)*0.57 + noise(p*2.0)*0.28 + noise(p*4.0)*0.15;
            float alpha = smoothstep(1.0-coverage, 1.15-coverage, density) * smoothstep(0.0, 0.2, ray.y) * coverage;
            gl_FragColor = vec4(tint, alpha);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`} />
    </mesh>
  </CategoryLayerGroup>;
}
