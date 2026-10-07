import { BATHTUB } from '../bathtubData';

// The FBX timeline is 24 fps: left, right, swim, idle, eat, 50 frames each.
export const GOLDFISH_FRAMES = {
  'turn-left': [2, 51], 'turn-right': [52, 101], swim: [102, 151],
  idle: [152, 201], eat: [202, 251],
} as const;
export type FishMode = keyof typeof GOLDFISH_FRAMES;
export const WATER_Y = BATHTUB.waterHeight;
export const FISH_SPEED = 8; // cm/s: relaxed swimming, roughly half a body length per second.
export const FADE_SECONDS = 0.25;

export function fishHabitat(radius: number) {
  const r = BATHTUB.cornerRadius - BATHTUB.wallThickness - radius;
  const segment = BATHTUB.length / 2 - BATHTUB.cornerRadius;
  const bottom = BATHTUB.wallThickness + radius;
  const top = WATER_Y - radius;
  if (r <= 0 || bottom >= top) throw new Error('Goldfish does not fit inside the bathtub');
  return { r, segment, bottom, top };
}

export function pickFishTarget(radius: number, mode: 'swim' | 'eat', random = Math.random) {
  const { r, segment, bottom, top } = fishHabitat(radius);
  const angle = random() * Math.PI * 2;
  const distance = Math.sqrt(random()) * r;
  return {
    x: Math.cos(angle) * distance,
    y: mode === 'eat' ? top : bottom + random() * (top - bottom),
    z: (random() * 2 - 1) * segment + Math.sin(angle) * distance,
  };
}

export function shortestFishTurn(from: number, to: number) {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}
