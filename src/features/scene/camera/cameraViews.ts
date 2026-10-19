import {
  ROOM_W, ROOM_D, WALL_H,
} from '../wallData';

// ── Presets caméra ────────────────────────────────────────────────────────────

const CX   = ROOM_W / 2;
const CY   = WALL_H / 2;
const CZ   = ROOM_D / 2;
const DIST = 1500;
const ISO  = 1500;

export interface CameraViewPreset {
  pos: [number, number, number];
  target: [number, number, number];
  projection?: 'persp' | 'ortho';
  zoom?: number;
}

export const VIEWS: Record<string, CameraViewPreset> = {
  top:         { pos: [CX, DIST, CZ + 0.1],               target: [CX, 0, CZ],          projection: 'ortho', zoom: 1 },
  front:       { pos: [CX, CY, CZ + DIST],                target: [CX, CY, CZ],         projection: 'ortho', zoom: 1 },
  back:        { pos: [CX, CY, CZ - DIST],                target: [CX, CY, CZ],         projection: 'ortho', zoom: 1 },
  left:        { pos: [CX - DIST, CY, CZ],                target: [CX, CY, CZ],         projection: 'ortho', zoom: 1 },
  right:       { pos: [CX + DIST, CY, CZ],                target: [CX, CY, CZ],         projection: 'ortho', zoom: 1 },
  bottom:      { pos: [CX, -DIST, CZ],                    target: [CX, 0, CZ],          projection: 'ortho', zoom: 1 },
  'iso-se':    { pos: [CX + ISO, ISO, CZ + ISO],          target: [CX, 0, CZ],          projection: 'ortho', zoom: 1 },
  'iso-nw':    { pos: [CX - ISO, ISO, CZ - ISO],          target: [CX, 0, CZ],          projection: 'ortho', zoom: 1 },
  'iso-ne':    { pos: [CX + ISO, ISO, CZ - ISO],          target: [CX, 0, CZ],          projection: 'ortho', zoom: 1 },
  'iso-sw':    { pos: [CX - ISO, ISO, CZ + ISO],          target: [CX, 0, CZ],          projection: 'ortho', zoom: 1 },
};

export const CAMERA_VIEW_HEIGHT = 800;
export const CAMERA_VIEW_FOV = 50;

/** Preserve direction and target-plane scale between the two projections. */
export function resolveCameraView(key: string, projection: 'ortho' | 'persp', fov = CAMERA_VIEW_FOV): CameraViewPreset {
  const view = VIEWS[key];
  if (!view) throw new Error(`Unknown camera view: ${key}`);
  if (projection === 'ortho') return { ...view, projection };
  const offset = view.pos.map((value, index) => value - view.target[index]);
  const distance = CAMERA_VIEW_HEIGHT / (2 * (view.zoom ?? 1) * Math.tan(fov * Math.PI / 360));
  const length = Math.hypot(...offset);
  const pos = offset.map((value, index) => view.target[index] + value * distance / length) as [number, number, number];
  return { pos, target: [...view.target], projection, zoom: 1 };
}
