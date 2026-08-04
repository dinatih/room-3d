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

  // Revenir à la position initiale
  { type: 'RETURN_TO_START' },
];
