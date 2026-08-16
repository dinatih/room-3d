import { AgentInstruction, ZoneNode } from './aiTypes';

export const ZONES: Record<string, ZoneNode> = {
  Couloir_Central: { id: 'Couloir_Central', x: 240, z: 350 },
  Couloir_Entree: { id: 'Couloir_Entree', x: 248, z: 535 }, // Dedans, devant porte d'entrée
  Sortie: { id: 'Sortie', x: 288, z: 603 }, // Dehors, devant la porte
  Couloir_SDB: { id: 'Couloir_SDB', x: 248, z: 535 }, // Devant porte SDB dans le couloir
  Devant_Vasque: { id: 'Devant_Vasque', x: 116, z: 545 }, // Devant la vasque dans SDB
  Entree_SDB: { id: 'Entree_SDB', x: 150, z: 560 }, // Juste à l'intérieur de la SDB
  Toilette: { id: 'Toilette', x: 50, z: 520 }, // Devant les toilettes
  Bureau_1: { id: 'Bureau_1', x: 73.5, z: 50 },
  Chaise_Bureau: { id: 'Chaise_Bureau', x: 85, z: 272 },
  Bureau_2: { id: 'Bureau_2', x: 200, z: 215 },
  Douche: { id: 'Douche', x: 15, z: 645 },
  Cuisine: { id: 'Cuisine', x: 80, z: 370 },
  Kallax_NE: { id: 'Kallax_NE', x: 240, z: 38 },
  Devant_Baie_Vitree: { id: 'Devant_Baie_Vitree', x: 200, z: 20 },
  Dans_Jardin: { id: 'Dans_Jardin', x: 200, z: -20 },
  Fond_Jardin: { id: 'Fond_Jardin', x: 150, z: -650 },
  Entree_Bat_B_Couloir: { id: 'Entree_Bat_B_Couloir', x: -350, z: 1002 },
  Entree_Cours_Bat_B_Jardin: { id: 'Entree_Cours_Bat_B_Jardin', x: -350, z: -200 },
  
  Placard_Couloir: { id: 'Placard_Couloir', x: 215, z: 435 },
  Placard_SDB: { id: 'Placard_SDB', x: 85, z: 610 },
  Congelateur: { id: 'Congelateur', x: 250, z: 320 },
  SDB_Drona_Ouest: { id: 'SDB_Drona_Ouest', x: 40, z: 490 },
  SDB_Drona_Est: { id: 'SDB_Drona_Est', x: 140, z: 490 },
  Miroir_Sud: { id: 'Miroir_Sud', x: 160, z: 350 },
  
  Lit_Ouest: { id: 'Lit_Ouest', x: 90, z: 80 },
  Lit_Ouest_2: { id: 'Lit_Ouest_2', x: 90, z: 150 },
  Lit_Ouest_3: { id: 'Lit_Ouest_3', x: 90, z: 220 },
  Lit_Ouest_Couche: { id: 'Lit_Ouest_Couche', x: 74, z: 150 },
  
  Lit_Est: { id: 'Lit_Est', x: 245, z: 120 },
  Lit_Est_2: { id: 'Lit_Est_2', x: 245, z: 190 },
  Lit_Est_3: { id: 'Lit_Est_3', x: 245, z: 260 },
  Lit_Est_Couche: { id: 'Lit_Est_Couche', x: 270, z: 190 },
  
  Canape_Est: { id: 'Canape_Est', x: 270, z: -20 },
  Canape_Est_2: { id: 'Canape_Est_2', x: 270, z: -80 },
  Canape_Est_3: { id: 'Canape_Est_3', x: 270, z: -140 },
  Canape_Est_Allonge: { id: 'Canape_Est_Allonge', x: 270, z: -80 },
  
  Canape_Ouest: { id: 'Canape_Ouest', x: 100, z: -20 },
  Canape_Ouest_2: { id: 'Canape_Ouest_2', x: 100, z: -60 },
  Canape_Ouest_3: { id: 'Canape_Ouest_3', x: 100, z: -100 },
  
  Baignoire: { id: 'Baignoire', x: 120, z: -250 },
  Baignoire_Ouest: { id: 'Baignoire_Ouest', x: 80, z: -280 },
  Baignoire_Est: { id: 'Baignoire_Est', x: 160, z: -220 },

  Devant_Jardin_Voisin_Ouest: { id: 'Devant_Jardin_Voisin_Ouest', x: 30, z: -200 },
  Devant_Jardin_Voisin_Est: { id: 'Devant_Jardin_Voisin_Est', x: 286, z: -200 },
};
export const ACTION_GO_TO_TOILET: AgentInstruction[] = [
  // Aller vers la porte du salon
  { type: 'MOVE_TO', targetNodeId: 'Couloir_Central' },
  // Ouvrir la porte du salon
  { type: 'INTERACT', triggerEventKey: 'livingDoor', triggerTargetState: true, animation: 'media/sandbox/anims/anim_open_door_outwards.glb', duration: 1.5 },

  // S'avancer dans le couloir jusqu'à la SDB
  { type: 'MOVE_TO', targetNodeId: 'Couloir_SDB' },
  // Ouvrir la porte de la SDB (On pousse la porte pour entrer)
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
  { type: 'INTERACT', triggerEventKey: 'bathroomDoor', triggerTargetState: true, animation: 'media/sandbox/anims/anim_open_door_outwards.glb', duration: 1.5 },

  // Revenir dans le salon
  { type: 'MOVE_TO', targetNodeId: 'Couloir_Central' },
  // Fermer la porte du salon (On pousse pour retourner au salon)
  { type: 'INTERACT', triggerEventKey: 'livingDoor', animation: 'idle', duration: 1.0 },
];

export const ACTION_SIT_DESK_1: AgentInstruction[] = [
  { type: 'MOVE_TO', targetNodeId: 'Bureau_1' },
  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_sitting_idle.glb', duration: 10.0, rotY: Math.PI },
];

export const ACTION_SIT_OFFICE_CHAIR: AgentInstruction[] = [
  { type: 'MOVE_TO', targetNodeId: 'Chaise_Bureau' },
  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_sitting_idle.glb', duration: 10.0, rotY: Math.PI / 2 },
];

export const ACTION_SIT_DESK_2: AgentInstruction[] = [
  { type: 'MOVE_TO', targetNodeId: 'Bureau_2' },
  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_texting_while_standing.glb', duration: 10.0, rotY: Math.PI },
];

export const ACTION_BED_WEST: AgentInstruction[] = [
  { type: 'MOVE_TO', targetNodeId: 'Lit_Ouest' },
  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_female_sitting_pose_1.glb', duration: 5.0, rotY: Math.PI / 2 },
  { type: 'MOVE_TO', targetNodeId: 'Lit_Ouest_2' },
  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_female_sitting_pose_1.glb', duration: 5.0, rotY: Math.PI / 2 },
  { type: 'MOVE_TO', targetNodeId: 'Lit_Ouest_3' },
  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_female_sitting_pose_1.glb', duration: 5.0, rotY: Math.PI / 2 },
  { type: 'MOVE_TO', targetNodeId: 'Lit_Ouest_Couche' },
  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_female_sitting_pose_1.glb', duration: 10.0, rotY: Math.PI / 2 },
];

export const ACTION_BED_EAST: AgentInstruction[] = [
  { type: 'MOVE_TO', targetNodeId: 'Lit_Est' },
  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_female_sitting_pose_1.glb', duration: 5.0, rotY: Math.PI / 2 },
  { type: 'MOVE_TO', targetNodeId: 'Lit_Est_2' },
  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_female_sitting_pose_1.glb', duration: 5.0, rotY: Math.PI / 2 },
  { type: 'MOVE_TO', targetNodeId: 'Lit_Est_3' },
  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_female_sitting_pose_1.glb', duration: 5.0, rotY: Math.PI / 2 },
  { type: 'MOVE_TO', targetNodeId: 'Lit_Est_Couche' },
  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_female_sitting_pose_1.glb', duration: 10.0, rotY: Math.PI / 2 },
];

export const ACTION_BATHTUB: AgentInstruction[] = [
  { type: 'MOVE_TO', targetNodeId: 'Devant_Baie_Vitree' },
  { type: 'INTERACT', triggerEventKey: 'eastGlassDoor', triggerTargetState: true, animation: 'media/sandbox/anims/anim_open_door_outwards.glb', duration: 1.5 },
  { type: 'MOVE_TO', targetNodeId: 'Dans_Jardin' },
  { type: 'MOVE_TO', targetNodeId: 'Baignoire' },
  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_sitting_idle.glb', duration: 5.0, rotY: 0 },
  { type: 'MOVE_TO', targetNodeId: 'Baignoire_Ouest' },
  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_sitting_idle.glb', duration: 5.0, rotY: 0 },
  { type: 'MOVE_TO', targetNodeId: 'Baignoire_Est' },
  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_sitting_idle.glb', duration: 5.0, rotY: 0 },
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
  { type: 'MOVE_TO', targetNodeId: 'Douche' },
  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_shaking_hands_2.glb', duration: 10.0, rotY: Math.PI / 2 },
  { type: 'MOVE_TO', targetNodeId: 'SDB_Drona_Ouest' },
  { type: 'INTERACT', animation: 'idle', duration: 3.0, rotY: Math.PI / 2 },
  { type: 'MOVE_TO', targetNodeId: 'SDB_Drona_Est' },
  { type: 'INTERACT', animation: 'idle', duration: 3.0, rotY: -Math.PI / 2 },
  { type: 'MOVE_TO', targetNodeId: 'Placard_SDB' },
  { type: 'INTERACT', animation: 'idle', duration: 3.0, rotY: -Math.PI / 2 },
  { type: 'MOVE_TO', targetNodeId: 'Entree_SDB' },
  { type: 'MOVE_TO', targetNodeId: 'Couloir_SDB' },
  { type: 'INTERACT', triggerEventKey: 'bathroomDoor', animation: 'idle', duration: 1.5 },
  { type: 'MOVE_TO', targetNodeId: 'Couloir_Central' },
  { type: 'INTERACT', triggerEventKey: 'livingDoor', animation: 'idle', duration: 1.0 },
];

export const ACTION_GARDEN_SOFA_EAST: AgentInstruction[] = [
  { type: 'MOVE_TO', targetNodeId: 'Devant_Baie_Vitree' },
  { type: 'INTERACT', triggerEventKey: 'eastGlassDoor', triggerTargetState: true, animation: 'media/sandbox/anims/anim_open_door_outwards.glb', duration: 1.5 },
  { type: 'MOVE_TO', targetNodeId: 'Dans_Jardin' },
  { type: 'MOVE_TO', targetNodeId: 'Canape_Est' },
  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_female_sitting_pose_3.glb', duration: 5.0, rotY: Math.PI },
  { type: 'MOVE_TO', targetNodeId: 'Canape_Est_2' },
  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_female_sitting_pose_3.glb', duration: 5.0, rotY: Math.PI },
  { type: 'MOVE_TO', targetNodeId: 'Canape_Est_3' },
  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_female_sitting_pose_3.glb', duration: 5.0, rotY: Math.PI },
  { type: 'MOVE_TO', targetNodeId: 'Dans_Jardin' },
  { type: 'MOVE_TO', targetNodeId: 'Devant_Baie_Vitree' },
  { type: 'INTERACT', triggerEventKey: 'eastGlassDoor', animation: 'idle', duration: 1.0 },
];

export const ACTION_GARDEN_SOFA_WEST: AgentInstruction[] = [
  { type: 'MOVE_TO', targetNodeId: 'Devant_Baie_Vitree' },
  { type: 'INTERACT', triggerEventKey: 'eastGlassDoor', triggerTargetState: true, animation: 'media/sandbox/anims/anim_open_door_outwards.glb', duration: 1.5 },
  { type: 'MOVE_TO', targetNodeId: 'Dans_Jardin' },
  { type: 'MOVE_TO', targetNodeId: 'Canape_Ouest' },
  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_sitting_idle.glb', duration: 5.0, rotY: Math.PI },
  { type: 'MOVE_TO', targetNodeId: 'Canape_Ouest_2' },
  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_sitting_idle.glb', duration: 5.0, rotY: Math.PI },
  { type: 'MOVE_TO', targetNodeId: 'Canape_Ouest_3' },
  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_sitting_idle.glb', duration: 5.0, rotY: Math.PI },
  { type: 'MOVE_TO', targetNodeId: 'Dans_Jardin' },
  { type: 'MOVE_TO', targetNodeId: 'Devant_Baie_Vitree' },
  { type: 'INTERACT', triggerEventKey: 'eastGlassDoor', animation: 'idle', duration: 1.0 },
];

export const ACTION_COOKING: AgentInstruction[] = [
  { type: 'MOVE_TO', targetNodeId: 'Cuisine' },
  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_shaking_hands_2.glb', duration: 10.0, rotY: -Math.PI / 2 },
  { type: 'MOVE_TO', targetNodeId: 'Congelateur' },
  { type: 'INTERACT', animation: 'idle', duration: 3.0, rotY: -Math.PI / 2 },
];

export const ACTION_KALLAX_NE: AgentInstruction[] = [
  { type: 'MOVE_TO', targetNodeId: 'Kallax_NE' },
  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_hand_raising.glb', duration: 5.0, rotY: -Math.PI / 2 },
  { type: 'MOVE_TO', targetNodeId: 'Placard_Couloir' },
  { type: 'INTERACT', animation: 'idle', duration: 3.0, rotY: Math.PI / 2 },
  { type: 'MOVE_TO', targetNodeId: 'Miroir_Sud' },
  { type: 'INTERACT', animation: 'idle', duration: 3.0, rotY: Math.PI },
];

export const ACTION_FRESH_AIR: AgentInstruction[] = [
  { type: 'MOVE_TO', targetNodeId: 'Devant_Baie_Vitree' },
  { type: 'INTERACT', triggerEventKey: 'eastGlassDoor', triggerTargetState: true, animation: 'media/sandbox/anims/anim_open_door_outwards.glb', duration: 1.5 },
  { type: 'MOVE_TO', targetNodeId: 'Dans_Jardin' },
  { type: 'MOVE_TO', targetNodeId: 'Fond_Jardin' },
  { type: 'INTERACT', animation: 'idle', duration: 10.0, rotY: Math.PI },
  { type: 'MOVE_TO', targetNodeId: 'Devant_Jardin_Voisin_Ouest' },
  { type: 'INTERACT', animation: 'idle', duration: 5.0, rotY: -Math.PI / 2 },
  { type: 'MOVE_TO', targetNodeId: 'Devant_Jardin_Voisin_Est' },
  { type: 'INTERACT', animation: 'idle', duration: 5.0, rotY: Math.PI / 2 },
  { type: 'MOVE_TO', targetNodeId: 'Dans_Jardin' },
  { type: 'MOVE_TO', targetNodeId: 'Devant_Baie_Vitree' },
  { type: 'INTERACT', triggerEventKey: 'eastGlassDoor', animation: 'idle', duration: 1.0 },
];

export const ACTION_ENTREE_BAT_B: AgentInstruction[] = [
  { type: 'MOVE_TO', targetNodeId: 'Couloir_Central' },
  { type: 'INTERACT', triggerEventKey: 'livingDoor', animation: 'idle', duration: 1.0 },
  { type: 'MOVE_TO', targetNodeId: 'Entree_Bat_B_Couloir' },
  { type: 'INTERACT', animation: 'idle', duration: 10.0, rotY: Math.PI / 2 },
  { type: 'MOVE_TO', targetNodeId: 'Couloir_Central' },
  { type: 'INTERACT', triggerEventKey: 'livingDoor', animation: 'idle', duration: 1.0 },
];

export const ACTION_ENTREE_COURS_BAT_B: AgentInstruction[] = [
  { type: 'MOVE_TO', targetNodeId: 'Devant_Baie_Vitree' },
  { type: 'INTERACT', triggerEventKey: 'eastGlassDoor', triggerTargetState: true, animation: 'media/sandbox/anims/anim_open_door_outwards.glb', duration: 1.5 },
  { type: 'MOVE_TO', targetNodeId: 'Dans_Jardin' },
  { type: 'MOVE_TO', targetNodeId: 'Entree_Cours_Bat_B_Jardin' },
  { type: 'INTERACT', animation: 'idle', duration: 10.0, rotY: Math.PI / 2 },
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
  ...ACTION_ENTREE_BAT_B,
  ...ACTION_ENTREE_COURS_BAT_B,
  { type: 'RETURN_TO_START' }
];
