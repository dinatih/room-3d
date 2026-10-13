import { WALL_DEFS, PILLAR_DEFS, WALL_THICKNESS, WALL_H, DiagWall, GARDEN_PANEL_DEFS, BATH_WEST_WALL, SHOWER_SOUTH_WALL } from '../../wallData';
import { NEIGHBOR_OFFSETS, EXTERIOR_GROUND, EXTERIOR_CORRIDOR } from '../../environmentData';
import { rectangle, union, type Polygon } from './geometry';
import type { NavigationObstacleDef } from './obstacles';

const local: NavigationObstacleDef[] = WALL_DEFS.filter(w => !w.segKind || w.segKind === 'wall').map((w, i) => ({
  id: `wall-${i}`, yMin: w.yBase ?? 0, yMax: (w.yBase ?? 0) + (w.h ?? WALL_H),
  polygon: w.axis === 'x' ? rectangle((w.x1 + w.x2) / 2, w.zc, w.x2 - w.x1, w.t ?? WALL_THICKNESS)
    : rectangle(w.xc, (w.z1 + w.z2) / 2, w.t ?? WALL_THICKNESS, w.z2 - w.z1),
}));
for (const p of PILLAR_DEFS) {
  const pillar = p as { id: string; x: number; z: number; w?: number; d?: number; rot?: number };
  local.push({ id: pillar.id, yMin: 0, yMax: WALL_H, polygon: rectangle(p.x, p.z, pillar.w ?? WALL_THICKNESS, pillar.d ?? WALL_THICKNESS, pillar.rot ?? 0) });
}
for (const [start, end] of [[0, DiagWall.door.start], [DiagWall.door.end, DiagWall.len]]) {
  const p = DiagWall.p((start + end) / 2, DiagWall.depth / 2);
  local.push({ id: `diagonal-${start}`, yMin: 0, yMax: WALL_H, polygon: rectangle(p.x, p.z, DiagWall.depth, end - start, DiagWall.rotY) });
}
for (const [i, p] of GARDEN_PANEL_DEFS.entries()) local.push({ id: `fence-${i}`, polygon: rectangle(p.cx, p.cz, p.w, p.d), yMin: p.cy - p.h / 2, yMax: p.cy + p.h / 2 });
// The fixed shower glass, beside its mobile leaf. The tray remains an interaction surface.
local.push({ id: 'shower-fixed-glass', polygon: rectangle(BATH_WEST_WALL + 10, SHOWER_SOUTH_WALL - 71, 20, 2), yMin: 20, yMax: 220 });

export const architectureObstacles = [{ x: 0, z: 0 }, ...NEIGHBOR_OFFSETS].flatMap((offset, i) => local.map(o => ({
  ...o, id: `${i}:${o.id}`, polygon: o.polygon.map(p => ({ x: p.x + offset.x, z: p.z + offset.z })),
})));
const { width, length } = EXTERIOR_CORRIDOR;
const corridorCenter = DiagWall.p(DiagWall.len / 2, DiagWall.depth / 2 + width / 2);
export const walkableSurfaces: Polygon[][] = union([
  rectangle(EXTERIOR_GROUND.x, EXTERIOR_GROUND.z, EXTERIOR_GROUND.width, EXTERIOR_GROUND.depth),
  rectangle(corridorCenter.x, corridorCenter.z, width, length, DiagWall.rotY),
]);
