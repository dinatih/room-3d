export type SmartObjectCategory =
  | 'seating'      // Canapés, chaises, fauteuils
  | 'bed'          // Lits (repos, sommeil)
  | 'hygiene'      // Douche, lavabo, baignoire, WC
  | 'surface'      // Bureaux, plans de travail, tables
  | 'appliance'    // Four ninja, réfrigérateur, congélateur, Linky, Nest Mini
  | 'storage'      // Kallax, placards, armoires
  | 'door'         // Portes simples, coulissantes, baies vitrées
  | 'outdoor'      // Jardin, fond du jardin, entrées bâtiment
  | 'decor';       // Plantes, miroirs, oiseaux

export interface InteractionSlot {
  slotId: string;             // ex: 'seat_1', 'seat_2', 'lie_down', 'use'
  name: string;               // Label lisible
  offset: [number, number, number]; // Position relative ou absolue d'interaction [x, y, z]
  approachOffset?: [number, number, number]; // Position d'arrivée avant d'interagir
  rotY: number;               // Orientation (radians)
  animation?: string;         // Chemin vers le clip d'animation GLB
  duration?: number;          // Durée par défaut en secondes
  availableAnims?: string[];  // Variantes possibles pour l'aléatoire
  animations_random?: string | string[]; // Pack nommé (ex: 'sitted_front_pack', 'side_sitted_pack') ou liste d'anims
  triggerEventKey?: string;   // Event à déclencher (ex: 'wc-flush', 'eastGlassDoor')
  triggerTargetState?: boolean;
}

export interface SmartObjectDef {
  id: string;                 // Identifiant unique (ex: 'bed-west', 'toilet', 'sofa-garden-east')
  name: string;               // Nom affiché (ex: 'Lit Utåker Ouest')
  category: SmartObjectCategory;
  position: [number, number, number]; // Position monde de référence [x, y, z]
  rotationY?: number;         // Orientation monde de l'objet
  slots: InteractionSlot[];   // Slots d'interaction disponibles
  requiresDoorAccess?: { doorKey: string; approachNode?: string }; // Pré-conditions si nécessaire
}

export interface SmartAction {
  actionId: string;
  position: [number, number, number]; // [x, y, z] target
  rotationY: number; // orientation target
  animation?: string;
  duration?: number;
}

export type InteractionType =
  | 'sit'
  | 'sleep'
  | 'cook'
  | 'wash'
  | 'shower'
  | 'work'
  | 'relax'
  | 'dance'
  | 'admire'
  | 'storage';

/**
 * WAYPOINT : Repère spatial ponctuel [x, y, z] avec rotation optionnelle.
 * Sert au positionnement, au pathfinding et aux slots d'approche.
 */
export interface Waypoint {
  id: string;
  name?: string;
  x: number;
  y?: number;
  z: number;
  rotationY?: number;
}

/**
 * SPATIAL ZONE : Volume englobant 3D (Pièce, Jardin, etc.)
 */
export interface SpatialZoneDef {
  id: string;
  name: string;
  environment: 'indoor' | 'outdoor';
  bounds: {
    min: [number, number, number];
    max: [number, number, number];
  };
}

export type InstructionType = 'MOVE_TO' | 'INTERACT' | 'WAIT' | 'RETURN_TO_START' | 'USE_OBJECT';

export interface AgentInstruction {
  type: InstructionType;
  smartObjectId?: string; // target smart object ID
  slotId?: string; // specific slot inside the smart object
  targetWaypointId?: string; // Waypoint cible pour la navigation
  targetNodeId?: string; // rétro-compatibilité temporaire instruction JSON/scenarios
  targetPos?: [number, number, number]; // direct position instead of waypoint
  actionId?: string; // for INTERACT
  animation?: string; // animation to play
  duration?: number; // for WAIT or INTERACT
  triggerEventKey?: string; // event to dispatch
  triggerTargetState?: boolean; // optional target state to force
  rotY?: number; // target rotation to face during interaction
}


