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

// Les conversions civiles ne changent qu’aux heures de changement d’offset.
// Préparer les 25 bornes horaires une seule fois par date réelle de Paris.
let day: { start: number; end: number; hours: number[] } | undefined;
function parisDay(now: Date | number) {
  const instant = Number(now);
  if (day && instant >= day.start && instant < day.end) return day;
  const [year, month, date] = calendar.format(now).split('-').map(Number);
  const midnight = Date.UTC(year, month - 1, date);
  const hours = Array.from({ length: 25 }, (_, hour) => {
    const wall = midnight + hour * 3600000;
    let utc = wall;
    for (let i = 0; i < 2; i++) {
      const parts = Object.fromEntries(localTime.formatToParts(utc).map(part => [part.type, part.value]));
      const local = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
      utc = wall - (local - utc);
    }
    return utc;
  });
  return day = { start: hours[0], end: hours[24], hours };
}

/** La date civile réelle de Paris se répète avec chaque journée accélérée du jeu. */
export function skyDate(hour: number, now: Date | number = Date.now()) {
  if (!Number.isFinite(hour) || hour < 0 || hour > 24) throw new Error('Invalid environment hour');
  const wholeHour = Math.floor(hour);
  return new Date(parisDay(now).hours[wholeHour] + (hour - wholeHour) * 3600000);
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

let last: { day: number; hour: number; value: ReturnType<typeof calculate> } | undefined;
function calculate(date: Date) {
  const sun = body(getPosition(date, LAT, LNG));
  return { date, sun, daylight: MathUtils.smoothstep(sun.elevation, -6, 0), moon: body(getMoonPosition(date, LAT, LNG)), illumination: getMoonIllumination(date) };
}
export function celestialState(hour = simulatedHour(), now: Date | number = Date.now()) {
  const date = parisDay(now);
  if (last?.day !== date.start || last.hour !== hour) last = { day: date.start, hour, value: calculate(skyDate(hour, now)) };
  return last.value;
}

export function solarElevation(hour: number, now: Date | number = Date.now()) {
  return celestialState(hour, now).sun.elevation;
}
export function daylight(hour: number, now: Date | number = Date.now()) {
  return celestialState(hour, now).daylight;
}

let track: { day: number; value: string } | undefined;
export function dayTimeTrack(now: Date | number = Date.now()) {
  const day = parisDay(now).start;
  if (track?.day !== day) {
    const nightColor = new Color('#234b80'), dayColor = new Color('#f4d78b'), color = new Color();
    const stops = Array.from({ length: 24 * 60 + 1 }, (_, minute) => {
      const elevation = getPosition(skyDate(minute / 60, now), LAT, LNG).altitude;
      color.copy(nightColor).lerp(dayColor, MathUtils.smoothstep(elevation, -6, 0));
      return `#${color.getHexString()} ${minute / (24 * 60) * 100}%`;
    });
    track = { day, value: `linear-gradient(to right, ${stops.join(', ')})` };
  }
  return track.value;
}
