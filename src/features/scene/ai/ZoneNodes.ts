import { AgentInstruction, ZoneNode } from './aiTypes';

/**
 * WAYPOINTS — Nœuds de navigation et de passage purs (portes, couloirs, transitions).
 * Les meubles et interactions spécifiques sont gérés via SMART_OBJECTS (smartObjectRegistry.ts).
 */
export const WAYPOINTS: Record<string, ZoneNode> = {
  Couloir_Central: { id: 'Couloir_Central', x: 230, z: 350 },
  Couloir_Entree: { id: 'Couloir_Entree', x: 248, z: 535 }, // Devant porte d'entrée
  Sortie: { id: 'Sortie', x: 288, z: 603 }, // Dehors, devant la porte
  Couloir_SDB: { id: 'Couloir_SDB', x: 248, z: 535 }, // Devant porte SDB dans le couloir
  Entree_SDB: { id: 'Entree_SDB', x: 150, z: 560 }, // Juste à l'intérieur de la SDB
  Devant_Baie_Vitree: { id: 'Devant_Baie_Vitree', x: 200, z: 20 },
  Dans_Jardin: { id: 'Dans_Jardin', x: 200, z: -50 },
  Devant_Jardin_Voisin_Ouest: { id: 'Devant_Jardin_Voisin_Ouest', x: -200, z: -100 },
  Devant_Jardin_Voisin_Est: { id: 'Devant_Jardin_Voisin_Est', x: 400, z: -500 },
};

/** Alias de rétro-compatibilité */
export const ZONES = WAYPOINTS;

export const ACTION_GO_TO_TOILET: AgentInstruction[] = [
  { type: 'USE_OBJECT', smartObjectId: 'toilet', slotId: 'use' },
  { type: 'INTERACT', smartObjectId: 'toilet', slotId: 'flush' },
  { type: 'USE_OBJECT', smartObjectId: 'vasque-sdb', slotId: 'wash-hands' },
];

export const ACTION_SIT_DESK_1: AgentInstruction[] = [
  { type: 'USE_OBJECT', smartObjectId: 'desk-bollsidan-1', slotId: 'work-sitting' },
];

export const ACTION_SIT_OFFICE_CHAIR: AgentInstruction[] = [
  { type: 'USE_OBJECT', smartObjectId: 'chair-office', slotId: 'sit' },
];

export const ACTION_SIT_DESK_2: AgentInstruction[] = [
  { type: 'USE_OBJECT', smartObjectId: 'desk-bollsidan-2', slotId: 'work-standing' },
];

export const ACTIONS_BED_WEST: AgentInstruction[][] = [
  [{ type: 'USE_OBJECT', smartObjectId: 'bed-west', slotId: 'seat-north' }],
  [{ type: 'USE_OBJECT', smartObjectId: 'bed-west', slotId: 'seat-middle' }],
  [{ type: 'USE_OBJECT', smartObjectId: 'bed-west', slotId: 'seat-south' }],
  [{ type: 'USE_OBJECT', smartObjectId: 'bed-west', slotId: 'lie-down' }]
];

export const ACTIONS_BED_EAST: AgentInstruction[][] = [
  [{ type: 'USE_OBJECT', smartObjectId: 'bed-east', slotId: 'seat-north' }],
  [{ type: 'USE_OBJECT', smartObjectId: 'bed-east', slotId: 'seat-middle' }],
  [{ type: 'USE_OBJECT', smartObjectId: 'bed-east', slotId: 'seat-south' }],
  [{ type: 'USE_OBJECT', smartObjectId: 'bed-east', slotId: 'lie-down' }]
];

export const ACTIONS_BATHTUB: AgentInstruction[][] = [
  [{ type: 'USE_OBJECT', smartObjectId: 'bathtub-garden', slotId: 'center' }],
  [{ type: 'USE_OBJECT', smartObjectId: 'bathtub-garden', slotId: 'west' }],
  [{ type: 'USE_OBJECT', smartObjectId: 'bathtub-garden', slotId: 'east' }]
];

export const ACTION_SHOWER: AgentInstruction[] = [
  { type: 'USE_OBJECT', smartObjectId: 'shower', slotId: 'take-shower' }
];

export const ACTIONS_GARDEN_SOFA_EAST: AgentInstruction[][] = [
  [{ type: 'USE_OBJECT', smartObjectId: 'sofa-garden-east', slotId: 'seat-1' }],
  [{ type: 'USE_OBJECT', smartObjectId: 'sofa-garden-east', slotId: 'seat-2' }]
];

export const ACTIONS_GARDEN_SOFA_WEST: AgentInstruction[][] = [
  [{ type: 'USE_OBJECT', smartObjectId: 'sofa-garden-west', slotId: 'seat-1' }],
  [{ type: 'USE_OBJECT', smartObjectId: 'sofa-garden-west', slotId: 'seat-2' }]
];

export const ACTION_COOKING: AgentInstruction[] = [
  { type: 'USE_OBJECT', smartObjectId: 'cuisine-group', slotId: 'cook' },
  { type: 'USE_OBJECT', smartObjectId: 'freezer', slotId: 'open-pick' },
];

export const ACTION_KALLAX_NE: AgentInstruction[] = [
  { type: 'USE_OBJECT', smartObjectId: 'kallax-ne', slotId: 'inspect' },
  { type: 'USE_OBJECT', smartObjectId: 'corridor-closet', slotId: 'open-tidy' },
  { type: 'USE_OBJECT', smartObjectId: 'mirror-south', slotId: 'admire' },
];

export const ACTION_FRESH_AIR: AgentInstruction[] = [
  { type: 'USE_OBJECT', smartObjectId: 'garden-fresh-air', slotId: 'breathe' }
];

export const ACTION_ENTREE_BAT_B: AgentInstruction[] = [
  { type: 'USE_OBJECT', smartObjectId: 'building-b-corridor', slotId: 'visit' }
];

export const ACTION_ENTREE_COURS_BAT_B: AgentInstruction[] = [
  { type: 'USE_OBJECT', smartObjectId: 'building-b-garden', slotId: 'admire' }
];

export const ACTION_FULL_TOUR: AgentInstruction[] = [
  ...ACTION_GO_TO_TOILET,
  ...ACTION_SIT_DESK_1,
  ...ACTION_SIT_DESK_2,
  ...ACTIONS_BED_WEST[0],
  ...ACTIONS_BED_EAST[0],
  ...ACTIONS_BATHTUB[0],
  ...ACTION_SHOWER,
  ...ACTIONS_GARDEN_SOFA_EAST[0],
  ...ACTIONS_GARDEN_SOFA_WEST[0],
  ...ACTION_COOKING,
  ...ACTION_KALLAX_NE,
  ...ACTION_FRESH_AIR,
  ...ACTION_ENTREE_BAT_B,
  ...ACTION_ENTREE_COURS_BAT_B,
  { type: 'RETURN_TO_START' }
];


