import type { AgentInstruction } from './aiTypes';
import {
  BATH_EAST_WALL, BATH_NORTH_WALL, BATH_WEST_WALL, CORRIDOR_EAST_WALL,
  CORRIDOR_NORTH_WALL, DiagWall, KITCHEN_EAST_WALL, KITCHEN_SOUTH_WALL,
  KITCHEN_WEST_WALL, ROOM_EAST_WALL, ROOM_NORTH_WALL, ROOM_SOUTH_WALL,
} from '../wallData';

export type RoomId =
  | 'living' | 'corridor' | 'bathroom' | 'garden'
  | 'west_neighbor' | 'east_neighbor' | 'outdoor_corridor' | 'outdoor_garden';

// Limites des zones de navigation extérieures, sans équivalent dans wallData.
const EXTERIOR_LIMITS = { westNeighborSouth: 750, eastNeighborSouth: 350, gardenNorth: -420, courtyardEast: -100 };

export function getRoomFromCoords(x: number, z: number): RoomId {
  if (!Number.isFinite(x) || !Number.isFinite(z)) throw new Error(`Invalid navigation coordinates: (${x}, ${z})`);

  const insideWidth = x >= BATH_WEST_WALL && x <= ROOM_EAST_WALL;
  const diagonalZ = DiagWall.A.z + (x - DiagWall.A.x) * DiagWall.slope;

  // La cuisine est une extension du séjour, ouverte au nord.
  if (insideWidth && z >= ROOM_NORTH_WALL && z <= ROOM_SOUTH_WALL) return 'living';
  if (x >= KITCHEN_WEST_WALL && x <= KITCHEN_EAST_WALL && z >= ROOM_SOUTH_WALL && z <= KITCHEN_SOUTH_WALL) return 'living';
  if (insideWidth && x < BATH_EAST_WALL && z >= BATH_NORTH_WALL && z <= diagonalZ) return 'bathroom';
  if (x >= BATH_EAST_WALL && x <= CORRIDOR_EAST_WALL && z >= CORRIDOR_NORTH_WALL && z <= diagonalZ) return 'corridor';

  if (x < BATH_WEST_WALL && z >= ROOM_NORTH_WALL && z <= EXTERIOR_LIMITS.westNeighborSouth) return 'west_neighbor';
  if (x > ROOM_EAST_WALL && z >= EXTERIOR_LIMITS.gardenNorth && z <= EXTERIOR_LIMITS.eastNeighborSouth) return 'east_neighbor';
  if (z > diagonalZ || (x < BATH_WEST_WALL && z > EXTERIOR_LIMITS.westNeighborSouth) || (x > ROOM_EAST_WALL && z > EXTERIOR_LIMITS.eastNeighborSouth)) return 'outdoor_corridor';
  if ((x < EXTERIOR_LIMITS.courtyardEast && z <= ROOM_NORTH_WALL) || z < EXTERIOR_LIMITS.gardenNorth) return 'outdoor_garden';
  if (z < ROOM_NORTH_WALL) return 'garden';

  // Les seuils de portes et les volumes entre cloisons appartiennent au couloir.
  return z > ROOM_SOUTH_WALL ? 'corridor' : 'living';
}

const move = (...waypoints: string[]): AgentInstruction[] =>
  waypoints.map(targetWaypointId => ({ type: 'MOVE_TO', targetWaypointId }));

// L'ordre des destinations départage les chemins de même longueur.
const ROOM_PORTALS: Record<RoomId, Partial<Record<RoomId, AgentInstruction[]>>> = {
  living: {
    garden: move('living-glass-door', 'garden-patio'),
    corridor: move('living-corridor-door', 'corridor-entry-door'),
  },
  corridor: {
    living: move('living-corridor-door', 'living-from-corridor'),
    bathroom: move('corridor-bathroom-door', 'bathroom-entry'),
    outdoor_corridor: move('corridor-entry-door', 'outdoor-entry-door'),
  },
  bathroom: {
    corridor: move('bathroom-entry', 'corridor-bathroom-door'),
  },
  garden: {
    living: move('garden-patio', 'living-glass-door', 'living-from-garden'),
    west_neighbor: move('outdoor-garden-west', 'west-neighbor-terrace'),
    east_neighbor: move('garden-north', 'outdoor-garden-east', 'east-neighbor-terrace'),
    outdoor_garden: move('outdoor-garden-west'),
  },
  west_neighbor: {
    garden: move('west-neighbor-terrace', 'outdoor-garden-west', 'garden-patio'),
    outdoor_garden: move('west-neighbor-terrace', 'outdoor-garden-west'),
  },
  east_neighbor: {
    garden: move('east-neighbor-terrace', 'outdoor-garden-east', 'garden-north', 'garden-patio'),
    outdoor_garden: move('east-neighbor-terrace', 'outdoor-garden-east'),
  },
  outdoor_corridor: {
    corridor: move('outdoor-entry-door', 'corridor-entry-door'),
    outdoor_garden: [
      { type: 'MOVE_TO', smartObjectId: 'building-b-corridor', slotId: 'visit' },
      { type: 'MOVE_TO', smartObjectId: 'building-b-garden', slotId: 'admire' },
    ],
  },
  outdoor_garden: {
    garden: move('outdoor-garden-west', 'garden-patio'),
    west_neighbor: move('outdoor-garden-west', 'west-neighbor-terrace'),
    east_neighbor: move('outdoor-garden-east', 'east-neighbor-terrace'),
    outdoor_corridor: [
      { type: 'MOVE_TO', smartObjectId: 'building-b-garden', slotId: 'admire' },
      { type: 'MOVE_TO', smartObjectId: 'building-b-corridor', slotId: 'visit' },
    ],
  },
};

/** Recherche en largeur : chaque arête correspond à un passage déclaré. */
export function findRoomPath(startRoom: RoomId, targetRoom: RoomId): RoomId[] {
  const queue: RoomId[][] = [[startRoom]];
  const visited = new Set<RoomId>([startRoom]);

  for (const path of queue) {
    const current = path[path.length - 1];
    if (current === targetRoom) return path;
    for (const neighbor of Object.keys(ROOM_PORTALS[current]) as RoomId[]) {
      if (visited.has(neighbor)) continue;
      visited.add(neighbor);
      queue.push([...path, neighbor]);
    }
  }
  throw new Error(`No navigation path from ${startRoom} to ${targetRoom}`);
}

export function buildNavigationWaypoints(
  startPos: { x: number; z: number },
  targetPos: { x: number; z: number }
): AgentInstruction[] {
  const path = findRoomPath(getRoomFromCoords(startPos.x, startPos.z), getRoomFromCoords(targetPos.x, targetPos.z));
  return path.slice(1).flatMap((to, i) => {
    const from = path[i];
    const instructions = ROOM_PORTALS[from][to];
    if (!instructions) throw new Error(`Missing navigation portal from ${from} to ${to}`);
    return instructions.map(instruction => ({ ...instruction }));
  });
}
