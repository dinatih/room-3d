import { AgentInstruction } from './aiTypes';

export type RoomId =
  | 'living'
  | 'corridor'
  | 'bathroom'
  | 'garden'
  | 'west_neighbor'
  | 'east_neighbor'
  | 'outdoor_corridor'
  | 'outdoor_garden';

/**
 * Détermine la pièce (RoomId) à partir de coordonnées 2D (x, z).
 * Repères architecturaux de l'appartement :
 * - Séjour (living) : -10 <= X <= 300 et 0 <= Z <= 400
 * - Couloir (corridor) : 192 <= X <= 310 et 400 < Z <= 580
 * - Salle de bain (bathroom) : -10 <= X < 192 et 400 <= Z <= 680
 * - Jardin intérieur / terrasse nord (garden) : -10 <= X <= 300 et -420 <= Z < 0
 * - Studio voisin Ouest (west_neighbor) : X < -10 et 0 <= Z <= 750 (terrasse à Z~100)
 * - Studio voisin Est (east_neighbor) : X > 300 et -420 <= Z <= 350 (terrasse à Z~-250)
 * - Extérieur Couloir / Sortie Sud-Ouest (outdoor_corridor) : Z > 680, ou (X > 270 && Z > 580), ou (X < -10 && Z > 750), ou (X > 300 && Z > 350)
 * - Extérieur Cours / Jardin Ouest & Grand Nord (outdoor_garden) : X < -100 et Z <= 0, ou Z < -420
 */
export function getRoomFromCoords(x: number, z: number): RoomId {
  // Salle de bain complète (inclut le receveur de douche jusqu'à Z=680 et les sanitaires)
  if (x >= -10 && x < 192 && z >= 400 && z <= 680) {
    return 'bathroom';
  }

  // Couloir intérieur (Z > 400 et X >= 192 jusqu'à la porte d'entrée)
  if (x >= 192 && x <= 310 && z >= 400 && z <= 580) {
    return 'corridor';
  }

  // Studio voisin Ouest (Églantine) & sa terrasse
  if (x < -10 && z >= 0 && z <= 750) {
    return 'west_neighbor';
  }

  // Studio voisin Est (Damien) & sa terrasse
  if (x > 300 && z >= -420 && z <= 350) {
    return 'east_neighbor';
  }

  // Extérieur Bâtiment B (Sortie Couloir Sud-Ouest / Ruelle sud)
  if ((x < -10 && z > 750) || z > 680 || (x > 270 && z > 580) || (x > 300 && z > 350)) {
    return 'outdoor_corridor';
  }

  // Extérieur Bâtiment B (Cour Jardin Ouest / Nord)
  if (x < -100 && z <= 0) {
    return 'outdoor_garden';
  }
  if (z < -420) {
    return 'outdoor_garden';
  }

  // Jardin intérieur / terrasse nord
  if (z < 0) {
    return 'garden';
  }

  // Séjour intérieur
  if (z <= 400 && x >= -10 && x <= 300) {
    return 'living';
  }

  // Zone sud couloir
  if (z > 400) {
    return 'corridor';
  }

  return 'living';
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
      { type: 'MOVE_TO', targetWaypointId: 'living-glass-door' },
      { type: 'INTERACT', triggerEventKey: 'eastGlassDoor', triggerTargetState: true, duration: 0.4 },
      { type: 'MOVE_TO', targetWaypointId: 'garden-patio' }
    ]
  },
  {
    from: 'garden',
    to: 'living',
    traverseInstructions: [
      { type: 'MOVE_TO', targetWaypointId: 'garden-patio' },
      { type: 'INTERACT', triggerEventKey: 'eastGlassDoor', triggerTargetState: true, duration: 0.4 },
      { type: 'MOVE_TO', targetWaypointId: 'living-glass-door' },
      { type: 'MOVE_TO', targetPos: [200, 0, 80] } // Avance dans le salon
    ]
  },

  // ── SÉJOUR <-> COULOIR (via Porte Séjour) ──
  {
    from: 'living',
    to: 'corridor',
    traverseInstructions: [
      { type: 'MOVE_TO', targetWaypointId: 'living-corridor-door' },
      { type: 'INTERACT', triggerEventKey: 'livingDoor', triggerTargetState: true, duration: 0.4 },
      { type: 'MOVE_TO', targetWaypointId: 'corridor-entry-door' }
    ]
  },
  {
    from: 'corridor',
    to: 'living',
    traverseInstructions: [
      { type: 'MOVE_TO', targetWaypointId: 'living-corridor-door' },
      { type: 'INTERACT', triggerEventKey: 'livingDoor', triggerTargetState: true, duration: 0.4 },
      { type: 'MOVE_TO', targetPos: [230, 0, 320] } // Avance dans le salon
    ]
  },

  // ── COULOIR <-> SALLE DE BAIN (via Porte SDB) ──
  {
    from: 'corridor',
    to: 'bathroom',
    traverseInstructions: [
      { type: 'MOVE_TO', targetWaypointId: 'corridor-bathroom-door' },
      { type: 'INTERACT', triggerEventKey: 'bathroomDoor', triggerTargetState: true, duration: 0.4 },
      { type: 'MOVE_TO', targetWaypointId: 'bathroom-entry' }
    ]
  },
  {
    from: 'bathroom',
    to: 'corridor',
    traverseInstructions: [
      { type: 'MOVE_TO', targetWaypointId: 'bathroom-entry' },
      { type: 'INTERACT', triggerEventKey: 'bathroomDoor', triggerTargetState: true, duration: 0.4 },
      { type: 'MOVE_TO', targetWaypointId: 'corridor-bathroom-door' }
    ]
  },

  // ── COULOIR <-> COULOIR EXTÉRIEUR (via Porte d'entrée) ──
  {
    from: 'corridor',
    to: 'outdoor_corridor',
    traverseInstructions: [
      { type: 'INTERACT', triggerEventKey: 'entryDoor', triggerTargetState: true, duration: 0.4 },
      { type: 'MOVE_TO', targetWaypointId: 'outdoor-entry-door' },
      { type: 'INTERACT', triggerEventKey: 'entryDoor', triggerTargetState: false, duration: 0.4 }
    ]
  },
  {
    from: 'outdoor_corridor',
    to: 'corridor',
    traverseInstructions: [
      { type: 'MOVE_TO', targetWaypointId: 'outdoor-entry-door' },
      { type: 'INTERACT', triggerEventKey: 'entryDoor', triggerTargetState: true, duration: 0.4 },
      { type: 'MOVE_TO', targetWaypointId: 'corridor-entry-door' },
      { type: 'INTERACT', triggerEventKey: 'entryDoor', triggerTargetState: false, duration: 0.4 }
    ]
  },

  // ── JARDIN <-> STUDIO VOISIN OUEST (Passage par la terrasse Ouest) ──
  {
    from: 'garden',
    to: 'west_neighbor',
    traverseInstructions: [
      { type: 'MOVE_TO', targetWaypointId: 'outdoor-garden-west' },
      { type: 'MOVE_TO', targetWaypointId: 'west-neighbor-terrace' }
    ]
  },
  {
    from: 'west_neighbor',
    to: 'garden',
    traverseInstructions: [
      { type: 'MOVE_TO', targetWaypointId: 'west-neighbor-terrace' },
      { type: 'MOVE_TO', targetWaypointId: 'outdoor-garden-west' },
      { type: 'MOVE_TO', targetWaypointId: 'garden-patio' }
    ]
  },

  // ── JARDIN <-> STUDIO VOISIN EST (Contournement palissade bois vers terrasse Est) ──
  {
    from: 'garden',
    to: 'east_neighbor',
    traverseInstructions: [
      { type: 'MOVE_TO', targetWaypointId: 'garden-north' },
      { type: 'MOVE_TO', targetWaypointId: 'outdoor-garden-east' },
      { type: 'MOVE_TO', targetWaypointId: 'east-neighbor-terrace' }
    ]
  },
  {
    from: 'east_neighbor',
    to: 'garden',
    traverseInstructions: [
      { type: 'MOVE_TO', targetWaypointId: 'east-neighbor-terrace' },
      { type: 'MOVE_TO', targetWaypointId: 'outdoor-garden-east' },
      { type: 'MOVE_TO', targetWaypointId: 'garden-north' },
      { type: 'MOVE_TO', targetWaypointId: 'garden-patio' }
    ]
  },

  // ── JARDIN <-> COUR EXTÉRIEURE / JARDIN BÂTIMENT B ──
  {
    from: 'garden',
    to: 'outdoor_garden',
    traverseInstructions: [
      { type: 'MOVE_TO', targetWaypointId: 'outdoor-garden-west' }
    ]
  },
  {
    from: 'outdoor_garden',
    to: 'garden',
    traverseInstructions: [
      { type: 'MOVE_TO', targetWaypointId: 'outdoor-garden-west' },
      { type: 'MOVE_TO', targetWaypointId: 'garden-patio' }
    ]
  },

  // ── COUR EXTÉRIEURE <-> STUDIO VOISIN OUEST ──
  {
    from: 'outdoor_garden',
    to: 'west_neighbor',
    traverseInstructions: [
      { type: 'MOVE_TO', targetWaypointId: 'outdoor-garden-west' },
      { type: 'MOVE_TO', targetWaypointId: 'west-neighbor-terrace' }
    ]
  },
  {
    from: 'west_neighbor',
    to: 'outdoor_garden',
    traverseInstructions: [
      { type: 'MOVE_TO', targetWaypointId: 'west-neighbor-terrace' },
      { type: 'MOVE_TO', targetWaypointId: 'outdoor-garden-west' }
    ]
  },

  // ── COUR EXTÉRIEURE <-> STUDIO VOISIN EST ──
  {
    from: 'outdoor_garden',
    to: 'east_neighbor',
    traverseInstructions: [
      { type: 'MOVE_TO', targetWaypointId: 'outdoor-garden-east' },
      { type: 'MOVE_TO', targetWaypointId: 'east-neighbor-terrace' }
    ]
  },
  {
    from: 'east_neighbor',
    to: 'outdoor_garden',
    traverseInstructions: [
      { type: 'MOVE_TO', targetWaypointId: 'east-neighbor-terrace' },
      { type: 'MOVE_TO', targetWaypointId: 'outdoor-garden-east' }
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
  garden: ['living', 'west_neighbor', 'east_neighbor', 'outdoor_garden'],
  west_neighbor: ['garden', 'outdoor_garden'],
  east_neighbor: ['garden', 'outdoor_garden'],
  outdoor_corridor: ['corridor', 'outdoor_garden'],
  outdoor_garden: ['garden', 'west_neighbor', 'east_neighbor', 'outdoor_corridor']
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
