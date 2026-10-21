import { computeWorldTransform } from '../../animations/duoWorldTransform';
import type { DuoAnimationDef } from '../../animations/duoAnimations';
import type { GraphDefinition } from './queries';
import { readDuoAnchor, type NavigationGraph } from './pathfindingClient';
import { walkableSurfaces } from './architecture';

/** Find one anchor whose two roots remain navigable throughout the playlist. */
export function findDuoAnchor(anchor: [number, number, number], rotation: number, playlist: DuoAnimationDef[], graphA: NavigationGraph, graphB: NavigationGraph): [number, number, number] | null {
  const offsets = playlist.map(def => {
    const { posB } = computeWorldTransform([0, 0, 0], rotation, def.offsetB);
    return { x: posB[0], z: posB[2] };
  });
  const point = readDuoAnchor(graphA, { anchor: { x: anchor[0], z: anchor[2] }, offsets, partner: graphB.definition as GraphDefinition, surfaces: walkableSurfaces });
  return point ? [point.x, anchor[1], point.z] : null;
}
