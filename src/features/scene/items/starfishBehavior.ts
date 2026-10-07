import { BATHTUB } from '../bathtubData';
import model from './starfishModel.json';

export const STARFISH_COUNT = 3;
const CRAWL_SPEED = 0.6; // cm/s, slow movement along the bottom.
const RISE_SPEED = 2;
const SINK_SPEED = 3;
const DRIFT_SPEED = 0.3;
const BOB_HEIGHT = 0.35; // cm, gentle surface ripples.
const radius = BATHTUB.cornerRadius - BATHTUB.wallThickness - model.radius;
const segment = BATHTUB.length / 2 - BATHTUB.cornerRadius;
const bottom = BATHTUB.wallThickness + model.halfHeight;
const surface = BATHTUB.waterHeight - model.halfHeight - BOB_HEIGHT;
if (radius <= 0 || bottom >= surface) throw new Error('Starfish does not fit inside the bathtub');

type Point = { x: number; y: number; z: number };
type Mode = 'resting' | 'crawling' | 'rising' | 'floating' | 'sinking';
export type StarfishState = {
  position: Point;
  target: Point;
  mode: Mode;
  timer: number;
  age: number;
  yaw: number;
  phase: number;
};

function wait(random: () => number) { return 8 + random() * 12; }
function destination(y: number, random: () => number): Point {
  const angle = random() * Math.PI * 2;
  const distance = Math.sqrt(random()) * radius;
  return { x: Math.cos(angle) * distance, y, z: (random() * 2 - 1) * segment + Math.sin(angle) * distance };
}

export function createStarfishStarts(random = Math.random): StarfishState[] {
  // Separate starting zones keep the three randomly placed stars from overlapping.
  const zoneLength = 2 * segment / STARFISH_COUNT;
  if (zoneLength <= 2 * model.radius) throw new Error('Not enough room for three separate starfish');
  return Array.from({ length: STARFISH_COUNT }, (_, index) => {
    const position = {
      x: (random() * 2 - 1) * radius,
      y: bottom,
      z: -segment + (index + 0.5) * zoneLength + (random() - 0.5) * (zoneLength - 2 * model.radius),
    };
    return { position, target: { ...position }, mode: 'resting', timer: wait(random), age: 0, yaw: random() * Math.PI * 2, phase: random() * Math.PI * 2 };
  });
}

export function advanceStarfish(state: StarfishState, delta: number, random = Math.random) {
  state.age += delta;
  if (state.mode === 'resting') {
    state.timer -= delta;
    if (state.timer <= 0) {
      state.mode = random() < 0.65 ? 'crawling' : 'rising';
      state.target = destination(state.mode === 'crawling' ? bottom : surface, random);
    }
    return;
  }
  if (state.mode === 'floating') {
    state.timer -= delta;
    state.position.y = surface + Math.sin(state.age + state.phase) * BOB_HEIGHT;
    if (state.timer <= 0) {
      state.mode = 'sinking';
      state.target = destination(bottom, random);
    }
  }
  const p = state.position;
  const t = state.target;
  const dx = t.x - p.x;
  const dy = state.mode === 'floating' ? 0 : t.y - p.y;
  const dz = t.z - p.z;
  const distance = Math.hypot(dx, dy, dz);
  const speed = state.mode === 'crawling' ? CRAWL_SPEED : state.mode === 'rising' ? RISE_SPEED : state.mode === 'sinking' ? SINK_SPEED : DRIFT_SPEED;
  if (distance <= speed * delta) {
    p.x = t.x;
    p.z = t.z;
    if (state.mode !== 'floating') p.y = t.y;
    if (state.mode === 'rising') {
      state.mode = 'floating';
      state.timer = wait(random);
      state.target = destination(surface, random);
    } else if (state.mode === 'floating') {
      state.target = destination(surface, random);
    } else {
      state.mode = 'resting';
      state.timer = wait(random);
    }
  } else {
    p.x += dx / distance * speed * delta;
    p.y += dy / distance * speed * delta;
    p.z += dz / distance * speed * delta;
    const turn = Math.atan2(Math.sin(Math.atan2(dx, dz) - state.yaw), Math.cos(Math.atan2(dx, dz) - state.yaw));
    state.yaw += turn * (1 - Math.exp(-delta));
  }
}

// One random layout per app launch, preserved through React/Suspense remounts.
export const STARFISH_STARTS = createStarfishStarts();
