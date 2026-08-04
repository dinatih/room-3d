import { AgentInstruction, ZoneNode } from './aiTypes';

export const ZONES: Record<string, ZoneNode> = {
  Start: { id: 'Start', x: 250, z: 300 },
  Couloir_Central: { id: 'Couloir_Central', x: 250, z: 350 },
  Couloir_Entree: { id: 'Couloir_Entree', x: 248, z: 535 }, // Dedans, devant porte d'entrée
  Sortie: { id: 'Sortie', x: 288, z: 603 }, // Dehors, devant la porte
  Couloir_SDB: { id: 'Couloir_SDB', x: 248, z: 560 }, // Devant porte SDB dans le couloir
  Devant_Vasque: { id: 'Devant_Vasque', x: 116, z: 545 }, // Devant la vasque dans SDB
  Entree_SDB: { id: 'Entree_SDB', x: 150, z: 560 }, // Juste à l'intérieur de la SDB
  Toilette: { id: 'Toilette', x: 50, z: 520 }, // Devant les toilettes
  Bureau_1: { id: 'Bureau_1', x: 73.5, z: 50 },
  Bureau_2: { id: 'Bureau_2', x: 200, z: 140 },
  Lit_Ouest: { id: 'Lit_Ouest', x: 120, z: 172 },
  Lit_Est: { id: 'Lit_Est', x: 210, z: 190 },
  Baignoire: { id: 'Baignoire', x: 120, z: -250 },
  Centre_SDB: { id: 'Centre_SDB', x: 60, z: 600 },
  Douche: { id: 'Douche', x: 15, z: 645 },
  Canape_Est: { id: 'Canape_Est', x: 270, z: -80 },
  Canape_Ouest: { id: 'Canape_Ouest', x: 100, z: -50 },
  Cuisine: { id: 'Cuisine', x: 80, z: 430 },
  Kallax_NE: { id: 'Kallax_NE', x: 240, z: 38 },
  Devant_Baie_Vitree: { id: 'Devant_Baie_Vitree', x: 200, z: 20 },
  Dans_Jardin: { id: 'Dans_Jardin', x: 200, z: -20 },
  Fond_Jardin: { id: 'Fond_Jardin', x: 150, z: -350 },
};
export const ACTION_GO_TO_TOILET: AgentInstruction[] = [
  // Aller vers la porte du salon
  { type: 'MOVE_TO', targetNodeId: 'Couloir_Central' },
  // Ouvrir la porte du salon
  { type: 'INTERACT', triggerEventKey: 'livingDoor', animation: 'idle', duration: 1.0 },

  // S'avancer dans le couloir jusqu'à la SDB
  { type: 'MOVE_TO', targetNodeId: 'Couloir_SDB' },
  // Ouvrir la porte de la SDB
  { type: 'INTERACT', triggerEventKey: 'bathroomDoor', animation: 'idle', duration: 1.5 },
  
  // Entrer et aller aux toilettes
  { type: 'MOVE_TO', targetNodeId: 'Entree_SDB' },
  { type: 'MOVE_TO', targetNodeId: 'Toilette' },
  
  // S'asseoir sur les toilettes (vers le Sud = 0)
  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_sitting_idle.glb', duration: 10.0, rotY: 0 },
  
  // Tirer la chasse (vers le Nord = Math.PI)
  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_shaking_hands_2.glb', duration: 2.0, rotY: Math.PI },
  
  // Aller au lavabo
  { type: 'MOVE_TO', targetNodeId: 'Devant_Vasque' },
  // Se laver les mains (vers l'Ouest = Math.PI / 2)
  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_shaking_hands_2.glb', duration: 4.0, rotY: Math.PI / 2 },

  // Sortir de la SDB
  { type: 'MOVE_TO', targetNodeId: 'Entree_SDB' },
  { type: 'MOVE_TO', targetNodeId: 'Couloir_SDB' },
  
  // Fermer la porte SDB
  { type: 'INTERACT', triggerEventKey: 'bathroomDoor', animation: 'idle', duration: 1.0 },

  // Revenir dans le salon
  { type: 'MOVE_TO', targetNodeId: 'Couloir_Central' },
  // Fermer la porte du salon
  { type: 'INTERACT', triggerEventKey: 'livingDoor', animation: 'idle', duration: 1.0 },
];

export const ACTION_SIT_DESK_1: AgentInstruction[] = [
  { type: 'MOVE_TO', targetNodeId: 'Bureau_1' },
  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_sitting_idle.glb', duration: 10.0, rotY: Math.PI },
];

export const ACTION_SIT_DESK_2: AgentInstruction[] = [
  { type: 'MOVE_TO', targetNodeId: 'Bureau_2' },
  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_sitting_idle.glb', duration: 10.0, rotY: Math.PI },
];

export const ACTION_BED_WEST: AgentInstruction[] = [
  { type: 'MOVE_TO', targetNodeId: 'Lit_Ouest' },
  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_female_sitting_pose_1.glb', duration: 10.0, rotY: -Math.PI / 2 },
];

export const ACTION_BED_EAST: AgentInstruction[] = [
  { type: 'MOVE_TO', targetNodeId: 'Lit_Est' },
  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_female_sitting_pose_1.glb', duration: 10.0, rotY: Math.PI / 2 },
];

export const ACTION_BATHTUB: AgentInstruction[] = [
  { type: 'MOVE_TO', targetNodeId: 'Devant_Baie_Vitree' },
  { type: 'INTERACT', triggerEventKey: 'eastGlassDoor', animation: 'idle', duration: 1.0 },
  { type: 'MOVE_TO', targetNodeId: 'Dans_Jardin' },
  { type: 'MOVE_TO', targetNodeId: 'Baignoire' },
  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_sitting_idle.glb', duration: 10.0, rotY: 0 },
  { type: 'MOVE_TO', targetNodeId: 'Dans_Jardin' },
  { type: 'MOVE_TO', targetNodeId: 'Devant_Baie_Vitree' },
  { type: 'INTERACT', triggerEventKey: 'eastGlassDoor', animation: 'idle', duration: 1.0 },
];

export const ACTION_SHOWER: AgentInstruction[] = [
  { type: 'MOVE_TO', targetNodeId: 'Couloir_Central' },
  { type: 'INTERACT', triggerEventKey: 'livingDoor', animation: 'idle', duration: 1.0 },
  { type: 'MOVE_TO', targetNodeId: 'Couloir_SDB' },
  { type: 'INTERACT', triggerEventKey: 'bathroomDoor', animation: 'idle', duration: 1.5 },
  { type: 'MOVE_TO', targetNodeId: 'Entree_SDB' },
  { type: 'MOVE_TO', targetNodeId: 'Centre_SDB' },
  { type: 'MOVE_TO', targetNodeId: 'Douche' },
  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_shaking_hands_2.glb', duration: 10.0, rotY: Math.PI / 2 },
  { type: 'MOVE_TO', targetNodeId: 'Centre_SDB' },
  { type: 'MOVE_TO', targetNodeId: 'Entree_SDB' },
  { type: 'MOVE_TO', targetNodeId: 'Couloir_SDB' },
  { type: 'INTERACT', triggerEventKey: 'bathroomDoor', animation: 'idle', duration: 1.0 },
  { type: 'MOVE_TO', targetNodeId: 'Couloir_Central' },
  { type: 'INTERACT', triggerEventKey: 'livingDoor', animation: 'idle', duration: 1.0 },
];

export const ACTION_GARDEN_SOFA_EAST: AgentInstruction[] = [
  { type: 'MOVE_TO', targetNodeId: 'Devant_Baie_Vitree' },
  { type: 'INTERACT', triggerEventKey: 'eastGlassDoor', animation: 'idle', duration: 1.0 },
  { type: 'MOVE_TO', targetNodeId: 'Dans_Jardin' },
  { type: 'MOVE_TO', targetNodeId: 'Canape_Est' },
  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_female_sitting_pose_3.glb', duration: 10.0, rotY: Math.PI },
  { type: 'MOVE_TO', targetNodeId: 'Dans_Jardin' },
  { type: 'MOVE_TO', targetNodeId: 'Devant_Baie_Vitree' },
  { type: 'INTERACT', triggerEventKey: 'eastGlassDoor', animation: 'idle', duration: 1.0 },
];

export const ACTION_GARDEN_SOFA_WEST: AgentInstruction[] = [
  { type: 'MOVE_TO', targetNodeId: 'Devant_Baie_Vitree' },
  { type: 'INTERACT', triggerEventKey: 'eastGlassDoor', animation: 'idle', duration: 1.0 },
  { type: 'MOVE_TO', targetNodeId: 'Dans_Jardin' },
  { type: 'MOVE_TO', targetNodeId: 'Canape_Ouest' },
  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_sitting_idle.glb', duration: 10.0, rotY: Math.PI },
  { type: 'MOVE_TO', targetNodeId: 'Dans_Jardin' },
  { type: 'MOVE_TO', targetNodeId: 'Devant_Baie_Vitree' },
  { type: 'INTERACT', triggerEventKey: 'eastGlassDoor', animation: 'idle', duration: 1.0 },
];

export const ACTION_COOKING: AgentInstruction[] = [
  { type: 'MOVE_TO', targetNodeId: 'Cuisine' },
  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_shaking_hands_2.glb', duration: 10.0, rotY: -Math.PI / 2 },
];

export const ACTION_KALLAX_NE: AgentInstruction[] = [
  { type: 'MOVE_TO', targetNodeId: 'Kallax_NE' },
  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_hand_raising.glb', duration: 5.0, rotY: -Math.PI / 2 },
];

export const ACTION_FRESH_AIR: AgentInstruction[] = [
  { type: 'MOVE_TO', targetNodeId: 'Devant_Baie_Vitree' },
  { type: 'INTERACT', triggerEventKey: 'eastGlassDoor', animation: 'idle', duration: 1.0 },
  { type: 'MOVE_TO', targetNodeId: 'Dans_Jardin' },
  { type: 'MOVE_TO', targetNodeId: 'Fond_Jardin' },
  { type: 'INTERACT', animation: 'idle', duration: 15.0, rotY: Math.PI },
  { type: 'MOVE_TO', targetNodeId: 'Dans_Jardin' },
  { type: 'MOVE_TO', targetNodeId: 'Devant_Baie_Vitree' },
  { type: 'INTERACT', triggerEventKey: 'eastGlassDoor', animation: 'idle', duration: 1.0 },
];

export const ACTION_FULL_TOUR: AgentInstruction[] = [
  ...ACTION_GO_TO_TOILET,
  ...ACTION_SIT_DESK_1,
  ...ACTION_SIT_DESK_2,
  ...ACTION_BED_WEST,
  ...ACTION_BED_EAST,
  ...ACTION_BATHTUB,
  ...ACTION_SHOWER,
  ...ACTION_GARDEN_SOFA_EAST,
  ...ACTION_GARDEN_SOFA_WEST,
  ...ACTION_COOKING,
  ...ACTION_KALLAX_NE,
  ...ACTION_FRESH_AIR,
  { type: 'RETURN_TO_START' }
];
