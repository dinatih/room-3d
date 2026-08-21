import { AgentInstruction } from './aiTypes';

export type RoomId = 'living' | 'corridor' | 'bathroom' | 'garden' | 'outdoor_corridor' | 'outdoor_garden';

/**
 * Détermine la pièce (RoomId) à partir de coordonnées 2D (x, z).
 * Repères architecturaux de l'appartement :
 * - Séjour (living) : 0 <= Z <= 400
 * - Jardin (garden) : Z < 0 et X >= -100 (terrasse et jardin nord direct)
 * - Couloir (corridor) : Z > 400 et X >= 192
 * - Salle de bain (bathroom) : Z > 400 et X < 192
 * - Extérieur Couloir / Sortie Bâtiment B (outdoor_corridor) : Z > 400 et X < 192 (dehors au sud-ouest) ou X < -100 avec Z > 0
 * - Extérieur Cours / Jardin Bâtiment B (outdoor_garden) : X < -100 et Z <= 0, ou grand déport nord (Z < -500)
 */
export function getRoomFromCoords(x: number, z: number): RoomId {
  // Salle de bain complète (inclut le receveur de douche jusqu'à Z=675 et les sanitaires)
  if (x >= -10 && x < 192 && z >= 400 && z <= 680) {
    return 'bathroom';
  }

  // Extérieur Bâtiment B (Cour Jardin Ouest / Nord)
  if (x < -100 && z <= 100) {
    return 'outdoor_garden';
  }
  if (z < -500) {
    return 'outdoor_garden';
  }

  // Extérieur Bâtiment B (Sortie Couloir Sud-Ouest / Rue)
  if ((x < -100 && z > 100) || z > 680 || (x > 270 && z > 580)) {
    return 'outdoor_corridor';
  }

  // Jardin intérieur / terrasse
  if (z < 0) {
    return 'garden';
  }

  // Séjour
  if (z <= 400) {
    return 'living';
  }

  // Zone sud couloir (Z > 400 et X >= 192)
  return 'corridor';
}



/**
 * Définition d'un portail (passage entre deux pièces adjacentes).
 */
export interface RoomPortal {
  from: RoomId;
  to: RoomId;
  /** Instructions à exécuter pour traverser ce portail de `from` vers `to` */
  traverseInstructions: AgentInstruction[];
}

export const ROOM_PORTALS: RoomPortal[] = [
  // ── SÉJOUR <-> JARDIN (via Baie Vitrée) ──
  {
    from: 'living',
    to: 'garden',
    traverseInstructions: [
      { type: 'MOVE_TO', targetNodeId: 'living-glass-door' },
      { type: 'INTERACT', triggerEventKey: 'eastGlassDoor', triggerTargetState: true, animation: 'animations/interactions/anim_open_door_outwards.glb', duration: 0.4 },
      { type: 'MOVE_TO', targetNodeId: 'garden-patio' }
    ]
  },
  {
    from: 'garden',
    to: 'living',
    traverseInstructions: [
      { type: 'MOVE_TO', targetNodeId: 'garden-patio' },
      { type: 'INTERACT', triggerEventKey: 'eastGlassDoor', triggerTargetState: true, animation: 'animations/interactions/anim_open_door_outwards.glb', duration: 0.4 },
      { type: 'MOVE_TO', targetNodeId: 'living-glass-door' }
    ]
  },

  // ── SÉJOUR <-> COULOIR (via Porte Séjour) ──
  {
    from: 'living',
    to: 'corridor',
    traverseInstructions: [
      { type: 'MOVE_TO', targetNodeId: 'living-corridor-door' },
      { type: 'INTERACT', triggerEventKey: 'livingDoor', triggerTargetState: true, animation: 'animations/interactions/anim_open_door_outwards.glb', duration: 0.4 },
      { type: 'MOVE_TO', targetNodeId: 'corridor-entry-door' }
    ]
  },
  {
    from: 'corridor',
    to: 'living',
    traverseInstructions: [
      { type: 'MOVE_TO', targetNodeId: 'living-corridor-door' },
      { type: 'INTERACT', triggerEventKey: 'livingDoor', triggerTargetState: true, animation: 'animations/interactions/anim_open_door_outwards.glb', duration: 0.4 },
      { type: 'MOVE_TO', targetPos: [230, 0, 320] } // Avance dans le salon
    ]
  },


  // ── COULOIR <-> SALLE DE BAIN (via Porte SDB) ──
  {
    from: 'corridor',
    to: 'bathroom',
    traverseInstructions: [
      { type: 'MOVE_TO', targetNodeId: 'corridor-bathroom-door' },
      { type: 'INTERACT', triggerEventKey: 'bathroomDoor', triggerTargetState: true, animation: 'animations/interactions/anim_open_door_outwards.glb', duration: 0.4 },
      { type: 'MOVE_TO', targetNodeId: 'bathroom-entry' }
    ]
  },
  {
    from: 'bathroom',
    to: 'corridor',
    traverseInstructions: [
      { type: 'MOVE_TO', targetNodeId: 'bathroom-entry' },
      { type: 'INTERACT', triggerEventKey: 'bathroomDoor', triggerTargetState: true, animation: 'animations/interactions/anim_open_door_outwards.glb', duration: 0.4 },
      { type: 'MOVE_TO', targetNodeId: 'corridor-bathroom-door' }
    ]
  },

  // ── COULOIR <-> COULOIR EXTÉRIEUR (via Porte d'entrée) ──
  {
    from: 'corridor',
    to: 'outdoor_corridor',
    traverseInstructions: [
      { type: 'MOVE_TO', targetNodeId: 'corridor-entry-door' },
      { type: 'INTERACT', triggerEventKey: 'entryDoor', triggerTargetState: true, animation: 'animations/interactions/anim_open_door_outwards.glb', duration: 0.4 },
      { type: 'MOVE_TO', targetNodeId: 'outdoor-entry-door' },
      { type: 'INTERACT', triggerEventKey: 'entryDoor', triggerTargetState: false, duration: 0.4 }
    ]
  },
  {
    from: 'outdoor_corridor',
    to: 'corridor',
    traverseInstructions: [
      { type: 'MOVE_TO', targetNodeId: 'outdoor-entry-door' },
      { type: 'INTERACT', triggerEventKey: 'entryDoor', triggerTargetState: true, animation: 'animations/interactions/anim_open_door_outwards.glb', duration: 0.4 },
      { type: 'MOVE_TO', targetNodeId: 'corridor-entry-door' },
      { type: 'INTERACT', triggerEventKey: 'entryDoor', triggerTargetState: false, duration: 0.4 }
    ]
  },



  // ── COURS EXTÉRIEURE <-> COULOIR EXTÉRIEUR (Passage direct Cour Bât B) ──
  {
    from: 'outdoor_corridor',
    to: 'outdoor_garden',
    traverseInstructions: [
      { type: 'MOVE_TO', smartObjectId: 'building-b-corridor', slotId: 'visit' },
      { type: 'MOVE_TO', smartObjectId: 'building-b-garden', slotId: 'admire' }
    ]
  },
  {
    from: 'outdoor_garden',
    to: 'outdoor_corridor',
    traverseInstructions: [
      { type: 'MOVE_TO', smartObjectId: 'building-b-garden', slotId: 'admire' },
      { type: 'MOVE_TO', smartObjectId: 'building-b-corridor', slotId: 'visit' }
    ]
  }
];

/** Graphe d'adjacence des pièces pour BFS (recherche du chemin le plus court) */
const ADJACENCY: Record<RoomId, RoomId[]> = {
  living: ['garden', 'corridor'],
  corridor: ['living', 'bathroom', 'outdoor_corridor'],
  bathroom: ['corridor'],
  garden: ['living', 'outdoor_garden'],
  outdoor_corridor: ['corridor', 'outdoor_garden'],
  outdoor_garden: ['garden', 'outdoor_corridor']
};



/**
 * Calcule la séquence de pièces à traverser pour aller de `startRoom` à `targetRoom` (BFS).
 */
export function findRoomPath(startRoom: RoomId, targetRoom: RoomId): RoomId[] {
  if (startRoom === targetRoom) return [startRoom];

  const queue: Array<{ current: RoomId; path: RoomId[] }> = [
    { current: startRoom, path: [startRoom] }
  ];
  const visited = new Set<RoomId>([startRoom]);

  while (queue.length > 0) {
    const { current, path } = queue.shift()!;
    if (current === targetRoom) {
      return path;
    }

    const neighbors = ADJACENCY[current] || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push({ current: neighbor, path: [...path, neighbor] });
      }
    }
  }

  return [startRoom, targetRoom];
}

/**
 * Génère toutes les étapes de transition (waypoints et ouvertures de portes) nécessaires
 * pour naviguer de la position actuelle `startPos` jusqu'à la position cible `targetPos`.
 */
export function buildNavigationWaypoints(
  startPos: { x: number; z: number },
  targetPos: { x: number; z: number }
): AgentInstruction[] {
  const startRoom = getRoomFromCoords(startPos.x, startPos.z);
  const targetRoom = getRoomFromCoords(targetPos.x, targetPos.z);

  if (startRoom === targetRoom) {
    return []; // Pas de franchissement de mur
  }

  const roomPath = findRoomPath(startRoom, targetRoom);
  const instructions: AgentInstruction[] = [];

  for (let i = 0; i < roomPath.length - 1; i++) {
    const from = roomPath[i];
    const to = roomPath[i + 1];
    const portal = ROOM_PORTALS.find(p => p.from === from && p.to === to);
    if (portal) {
      instructions.push(...portal.traverseInstructions);
    }
  }

  return instructions;
}
