import { BATH_EAST_WALL, BATH_WEST_WALL, BATH_NORTH_WALL, CORRIDOR_NORTH_WALL, ROOM_EAST_WALL, ROOM_SOUTH_WALL, ROOM_NORTH_WALL, DiagWall } from '../../wallData';
import { SPATIAL_ZONES_CONFIG } from '../SpatialZone';
import { DOOR_CONFIGS } from '../../doorObstacles';
import { getNavigationGraph, getObjectApproach, NavigationBlockedError } from './service';
import { getAgentProfile, hasAgentProfile } from './obstacles';
import { isAgentDestinationFree, getAgentObstacles } from '../agent/agentAvoidance';
import { distance, insideObstacle, type Point } from './geometry';

/** Intentional destinations are derived from room geometry, not mandatory transit nodes. */
export function getZoneDestination(id: string, agentId?: string, start?: Point, departureOwner?: string): Point {
  const radius = agentId && hasAgentProfile(agentId) ? getAgentProfile(agentId).radius : 0;
  const diagonal = (x: number) => DiagWall.A.z + (x - DiagWall.A.x) * DiagWall.slope;
  const roomX = ROOM_EAST_WALL / 2, bathX = (BATH_WEST_WALL + BATH_EAST_WALL) / 2, corridorX = (BATH_EAST_WALL + ROOM_EAST_WALL) / 2;
  const garden = SPATIAL_ZONES_CONFIG.find(zone => zone.id === 'garden')!.bounds;
  const centers: Record<string, Point> = {
    garden: { x: (garden.min[0] + garden.max[0]) / 2, z: (garden.min[2] + garden.max[2]) / 2 },
    living: { x: roomX, z: (ROOM_NORTH_WALL + ROOM_SOUTH_WALL) / 2 },
    bathroom: { x: bathX, z: (BATH_NORTH_WALL + diagonal(bathX)) / 2 },
    corridor: { x: corridorX, z: (CORRIDOR_NORTH_WALL + diagonal(corridorX)) / 2 },
    'entrance-outside': DiagWall.p(DiagWall.door.start + DiagWall.door.width / 2, DiagWall.depth + radius + DOOR_CONFIGS.entry.margin),
  };
  const center = centers[id];
  if (!center) throw new Error(`Unknown navigation destination ${id}`);
  if (!agentId || !hasAgentProfile(agentId)) return center;
  const graph = getNavigationGraph(getAgentProfile(agentId));
  if (start && departureOwner && insideObstacle(start, graph.obstacles)) start = getObjectApproach(departureOwner, center, agentId, start, true) ?? start;
  if (!start && !insideObstacle(center, graph.obstacles) && isAgentDestinationFree(agentId, center)) return center;
  const belongs = (p: Point) => id === 'living' ? p.x >= BATH_WEST_WALL && p.x <= ROOM_EAST_WALL && p.z >= ROOM_NORTH_WALL && p.z <= ROOM_SOUTH_WALL
    : id === 'bathroom' ? p.x >= BATH_WEST_WALL && p.x < BATH_EAST_WALL && p.z >= BATH_NORTH_WALL && p.z <= diagonal(p.x)
    : id === 'corridor' ? p.x >= BATH_EAST_WALL && p.x <= ROOM_EAST_WALL && p.z >= CORRIDOR_NORTH_WALL && p.z <= diagonal(p.x) : id === 'garden' ? p.x >= garden.min[0] && p.x <= garden.max[0] && p.z >= garden.min[2] && p.z <= garden.max[2] : true;
  let candidates = [...graph.vertices, ...getAgentObstacles(agentId).flat()].filter(p => belongs(p) && !insideObstacle(p, graph.obstacles));
  candidates.sort((a, b) => distance(a, center) - distance(b, center));
  if (!insideObstacle(center, graph.obstacles) && isAgentDestinationFree(agentId, center)) candidates.unshift(center);
  while (candidates.length) {
    const target = start ? graph.findReachable(start, candidates) : candidates[0];
    if (!target) break;
    if (isAgentDestinationFree(agentId, target)) return target;
    // Check live reservations after the worker replies, without changing every
    // query key whenever an unrelated actor moves during the calculation.
    candidates = candidates.slice(candidates.findIndex(p => p.x === target.x && p.z === target.z) + 1);
  }
  throw new NavigationBlockedError(`No free destination inside ${id}`, center);
}
