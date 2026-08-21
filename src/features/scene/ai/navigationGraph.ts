import { AgentInstruction } from './aiTypes';

export type RoomId = 'living' | 'corridor' | 'bathroom' | 'garden' | 'outdoor';

/**
 * Détermine la pièce (RoomId) à partir de coordonnées 2D (x, z).
 * Repères architecturaux de l'appartement :
 * - Séjour (living) : 0 <= Z <= 400
 * - Jardin (garden) : Z < 0 (dans le domaine de la terrasse/jardin nord, X dans [-100, 400], Z >= -500)
 * - Fond jardin / Extérieur nord : Z < -500 ou Z < 0 avec grand déport
 * - Couloir (corridor) : Z > 400 et X >= 192
 * - Salle de bain (bathroom) : Z > 400 et X < 192
 * - Bâtiment B / Extérieur ouest : X < -100
 */
export function getRoomFromCoords(x: number, z: number): RoomId {
  if (x < -100 || z > 800 || z < -500) {
    return 'outdoor';
  }
  if (z < 0) {
    return 'garden';
  }
  if (z <= 400) {
    return 'living';
  }
  // Zone sud (Z > 400)
  if (x < 192) {
    return 'bathroom';
  }
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
      { type: 'MOVE_TO', targetNodeId: 'Devant_Baie_Vitree' },
      { type: 'INTERACT', triggerEventKey: 'eastGlassDoor', triggerTargetState: true, animation: 'media/sandbox/anims/anim_open_door_outwards.glb', duration: 0.4 },
      { type: 'MOVE_TO', targetNodeId: 'Dans_Jardin' }
    ]
  },
  {
    from: 'garden',
    to: 'living',
    traverseInstructions: [
      { type: 'MOVE_TO', targetNodeId: 'Dans_Jardin' },
      { type: 'INTERACT', triggerEventKey: 'eastGlassDoor', triggerTargetState: true, animation: 'media/sandbox/anims/anim_open_door_outwards.glb', duration: 0.4 },
      { type: 'MOVE_TO', targetNodeId: 'Devant_Baie_Vitree' }
    ]
  },

  // ── SÉJOUR <-> COULOIR (via Porte Séjour) ──
  {
    from: 'living',
    to: 'corridor',
    traverseInstructions: [
      { type: 'MOVE_TO', targetNodeId: 'Couloir_Central' },
      { type: 'INTERACT', triggerEventKey: 'livingDoor', triggerTargetState: true, animation: 'media/sandbox/anims/anim_open_door_outwards.glb', duration: 0.4 },
      { type: 'MOVE_TO', targetNodeId: 'Couloir_Entree' }
    ]
  },
  {
    from: 'corridor',
    to: 'living',
    traverseInstructions: [
      { type: 'MOVE_TO', targetNodeId: 'Couloir_Central' },
      { type: 'INTERACT', triggerEventKey: 'livingDoor', triggerTargetState: true, animation: 'media/sandbox/anims/anim_open_door_outwards.glb', duration: 0.4 },
      { type: 'MOVE_TO', targetPos: [230, 0, 320] } // Avance dans le salon
    ]
  },

  // ── COULOIR <-> SALLE DE BAIN (via Porte SDB) ──
  {
    from: 'corridor',
    to: 'bathroom',
    traverseInstructions: [
      { type: 'MOVE_TO', targetNodeId: 'Couloir_SDB' },
      { type: 'INTERACT', triggerEventKey: 'bathroomDoor', triggerTargetState: true, duration: 0.4 },
      { type: 'MOVE_TO', targetNodeId: 'Entree_SDB' }
    ]
  },
  {
    from: 'bathroom',
    to: 'corridor',
    traverseInstructions: [
      { type: 'MOVE_TO', targetNodeId: 'Entree_SDB' },
      { type: 'INTERACT', triggerEventKey: 'bathroomDoor', triggerTargetState: true, duration: 0.4 },
      { type: 'MOVE_TO', targetNodeId: 'Couloir_SDB' }
    ]
  },

  // ── COULOIR <-> EXTÉRIEUR BÂTIMENT (via Porte d'entrée) ──
  {
    from: 'corridor',
    to: 'outdoor',
    traverseInstructions: [
      { type: 'MOVE_TO', targetNodeId: 'Couloir_Entree' },
      { type: 'INTERACT', triggerEventKey: 'entryDoor', triggerTargetState: true, duration: 0.4 },
      { type: 'MOVE_TO', targetNodeId: 'Sortie' }
    ]
  },
  {
    from: 'outdoor',
    to: 'corridor',
    traverseInstructions: [
      { type: 'MOVE_TO', targetNodeId: 'Sortie' },
      { type: 'INTERACT', triggerEventKey: 'entryDoor', triggerTargetState: true, duration: 0.4 },
      { type: 'MOVE_TO', targetNodeId: 'Couloir_Entree' }
    ]
  },

  // ── JARDIN <-> EXTÉRIEUR COURS/JARDIN VOISIN ──
  {
    from: 'garden',
    to: 'outdoor',
    traverseInstructions: [
      { type: 'MOVE_TO', targetNodeId: 'Dans_Jardin' }
    ]
  },
  {
    from: 'outdoor',
    to: 'garden',
    traverseInstructions: [
      { type: 'MOVE_TO', targetNodeId: 'Dans_Jardin' }
    ]
  }
];

/** Graphe d'adjacence des pièces pour BFS (recherche du chemin le plus court) */
const ADJACENCY: Record<RoomId, RoomId[]> = {
  living: ['garden', 'corridor'],
  corridor: ['living', 'bathroom', 'outdoor'],
  bathroom: ['corridor'],
  garden: ['living', 'outdoor'],
  outdoor: ['corridor', 'garden']
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
