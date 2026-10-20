import {
  ROOM_W, ROOM_D, WALL_H,
} from '../wallData';

// ── Presets caméra ────────────────────────────────────────────────────────────

const CX   = ROOM_W / 2;
const CY   = WALL_H / 2;
const CZ   = ROOM_D / 2;
const DIST = 1500;

export interface CameraViewPreset {
  pos: [number, number, number];
  target: [number, number, number];
  zoom?: number;
  up?: [number, number, number];
}

export const CARDINAL_ANGLES: Record<string, number> = {
  north: Math.PI, 'north-east': 3 * Math.PI / 4, east: Math.PI / 2, 'south-east': Math.PI / 4,
  south: 0, 'south-west': -Math.PI / 4, west: -Math.PI / 2, 'north-west': -3 * Math.PI / 4,
  top: Math.PI, bottom: Math.PI,
};

export function computeCameraPreset(azimuth: number, elevation = 45): CameraViewPreset {
  const rad = elevation * Math.PI / 180;
  const isHorizontal = elevation === 0;
  const isZenith = elevation === 90;
  const isNadir = elevation === -90;

  const target: [number, number, number] = isHorizontal ? [CX, CY, CZ] : [CX, 0, CZ];
  const r = (isZenith || isNadir) ? 0.001 : DIST * Math.cos(rad);
  const y = DIST * Math.sin(rad);
  const dx = r * Math.sin(azimuth);
  const dz = r * Math.cos(azimuth);
  const pos: [number, number, number] = [target[0] + dx, target[1] + y, target[2] + dz];

  const up: [number, number, number] = isZenith
    ? [-Math.sin(azimuth), 0, -Math.cos(azimuth)]
    : isNadir
      ? [Math.sin(azimuth), 0, Math.cos(azimuth)]
      : [0, 1, 0];

  return { pos, target, zoom: 1, up };
}

export const VIEWS: Record<string, CameraViewPreset> = {
  north:        computeCameraPreset(Math.PI, 45),
  'north-east': computeCameraPreset(3 * Math.PI / 4, 45),
  east:         computeCameraPreset(Math.PI / 2, 45),
  'south-east': computeCameraPreset(Math.PI / 4, 45),
  south:        computeCameraPreset(0, 45),
  'south-west': computeCameraPreset(-Math.PI / 4, 45),
  west:         computeCameraPreset(-Math.PI / 2, 45),
  'north-west': computeCameraPreset(-3 * Math.PI / 4, 45),
  top:          computeCameraPreset(Math.PI, 90),
  bottom:       computeCameraPreset(Math.PI, -90),
};

export const CAMERA_VIEW_HEIGHT = 800;
export const CAMERA_VIEW_FOV = 50;

/** Preserve direction and target-plane scale between the two projections. */
export function resolveCameraView(key: string, projection: 'ortho' | 'persp', fov = CAMERA_VIEW_FOV, elevation?: number): CameraViewPreset & { projection: 'ortho' | 'persp' } {
  const azimuth = CARDINAL_ANGLES[key];
  const activeView = elevation !== undefined && azimuth !== undefined
    ? computeCameraPreset(azimuth, elevation)
    : (VIEWS[key] ?? (azimuth !== undefined ? computeCameraPreset(azimuth, 45) : undefined));

  if (!activeView) throw new Error(`Unknown camera view: ${key}`);
  if (projection === 'ortho') return { ...activeView, projection };
  const offset = activeView.pos.map((value, index) => value - activeView.target[index]);
  const distance = CAMERA_VIEW_HEIGHT / (2 * (activeView.zoom ?? 1) * Math.tan(fov * Math.PI / 360));
  const length = Math.hypot(...offset);
  const pos = offset.map((value, index) => activeView.target[index] + value * distance / length) as [number, number, number];
  return { pos, target: [...activeView.target], projection, zoom: 1, up: activeView.up };
}
