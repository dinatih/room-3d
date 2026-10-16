import { computeWorldTransform } from '../../animations/duoWorldTransform';
import type { DuoAnimationDef } from '../../animations/duoAnimations';
import { distance, insideObstacle, mergeObstacles, pointInRing, projectToSegment, type Point, type VisibilityGraph } from './geometry';
import { walkableSurfaces } from './architecture';

/** Find one anchor whose two roots remain navigable throughout the playlist. */
export function findDuoAnchor(anchor: [number, number, number], rotation: number, playlist: DuoAnimationDef[], graphA: VisibilityGraph, graphB: VisibilityGraph): [number, number, number] | null {
  const offsets = playlist.map(def => {
    const { posB } = computeWorldTransform([0, 0, 0], rotation, def.offsetB);
    return { x: posB[0], z: posB[2] };
  });
  // Translate each partner obstacle back into anchor space. Their union is
  // precisely the set of anchors which would strand either participant.
  const obstacles = mergeObstacles([
    ...graphA.obstacles,
    ...offsets.flatMap(offset => graphB.obstacles.map(rings => rings.map(ring => ring.map(p => ({ x: p.x - offset.x, z: p.z - offset.z }))))),
  ]);
  const preferred = { x: anchor[0], z: anchor[2] };
  const onGround = (p: Point) => walkableSurfaces.some(rings => pointInRing(p, rings[0]) && !rings.slice(1).some(hole => pointInRing(p, hole)));
  const valid = (p: Point) => onGround(p) && !insideObstacle(p, obstacles)
    && offsets.every(offset => {
      const partner = { x: p.x + offset.x, z: p.z + offset.z };
      return onGround(partner) && graphB.canReach(p, partner);
    });
  if (valid(preferred)) return anchor;
  const candidates = obstacles.flatMap(rings => rings.flatMap(ring => ring.flatMap((a, i) => [a, projectToSegment(preferred, a, ring[(i + 1) % ring.length])])));
  candidates.sort((a, b) => distance(a, preferred) - distance(b, preferred));
  const point = candidates.find(valid);
  return point ? [point.x, anchor[1], point.z] : null;
}
