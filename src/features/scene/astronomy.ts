import { getPosition, getMoonPosition, getMoonIllumination, type Position } from 'suncalc';
import { Color, MathUtils, Vector3 } from 'three';
import { simulationClock } from './ai/laraLifeStore';

const LAT = Number(import.meta.env.VITE_STUDIO_LAT ?? 48.828);
const LNG = Number(import.meta.env.VITE_STUDIO_LNG ?? 2.376);
const orientation = MathUtils.degToRad(Number(import.meta.env.VITE_STUDIO_AZ ?? 90));
const calendar = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' });
const localTime = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });

export function simulatedHour() {
  return (8 + simulationClock.minutes / 60) % 24;
}

/** La date civile réelle de Paris se répète avec chaque journée accélérée du jeu. */
export function skyDate(hour: number, now = new Date()) {
  if (!Number.isFinite(hour) || hour < 0 || hour > 24) throw new Error('Invalid environment hour');
  const [year, month, day] = calendar.format(now).split('-').map(Number);
  const wall = Date.UTC(year, month - 1, day) + hour * 3600000;
  let instant = wall;
  // Résolution de l’heure civile, y compris l’offset été/hiver à Paris.
  for (let i = 0; i < 2; i++) {
    const parts = Object.fromEntries(localTime.formatToParts(instant).map(part => [part.type, part.value]));
    const local = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
    instant = wall - (local - Math.floor(instant / 1000) * 1000);
  }
  return new Date(instant);
}

function body(position: Position) {
  const azimuth = MathUtils.degToRad(position.azimuth);
  const elevation = MathUtils.degToRad(position.altitude);
  const east = Math.sin(azimuth) * Math.cos(elevation);
  const north = Math.cos(azimuth) * Math.cos(elevation);
  return {
    elevation: position.altitude,
    direction: new Vector3(Math.sin(orientation) * east + Math.cos(orientation) * north,
      Math.sin(elevation), Math.cos(orientation) * east - Math.sin(orientation) * north),
  };
}

let last: { key: string; value: ReturnType<typeof calculate> } | undefined;
function calculate(date: Date) {
  return { date, sun: body(getPosition(date, LAT, LNG)), moon: body(getMoonPosition(date, LAT, LNG)), illumination: getMoonIllumination(date) };
}
export function celestialState(hour = simulatedHour(), now = new Date()) {
  const key = `${calendar.format(now)}:${hour}`;
  if (last?.key !== key) last = { key, value: calculate(skyDate(hour, now)) };
  return last.value;
}

export function solarElevation(hour: number, now = new Date()) {
  return celestialState(hour, now).sun.elevation;
}
export function daylight(hour: number, now = new Date()) {
  return MathUtils.smoothstep(solarElevation(hour, now), -6, 0);
}

let track: { day: string; value: string } | undefined;
export function dayTimeTrack(now = new Date()) {
  const day = calendar.format(now);
  if (track?.day !== day) {
    const stops = Array.from({ length: 24 * 60 + 1 }, (_, minute) => {
      const color = new Color('#234b80').lerp(new Color('#f4d78b'), daylight(minute / 60, now));
      return `#${color.getHexString()} ${minute / (24 * 60) * 100}%`;
    });
    track = { day, value: `linear-gradient(to right, ${stops.join(', ')})` };
  }
  return track.value;
}
