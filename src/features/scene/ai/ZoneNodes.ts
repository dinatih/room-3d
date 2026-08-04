import { AgentInstruction, ZoneNode } from './aiTypes';

export const ZONES: Record<string, ZoneNode> = {
  Start: { id: 'Start', x: 250, z: 300 },
  Couloir_Central: { id: 'Couloir_Central', x: 250, z: 400 },
  Couloir_Entree: { id: 'Couloir_Entree', x: 248, z: 535 }, // Dedans, devant porte d'entrée
  Sortie: { id: 'Sortie', x: 288, z: 603 }, // Dehors, devant la porte
  Couloir_SDB: { id: 'Couloir_SDB', x: 248, z: 560 }, // Devant porte SDB dans le couloir
  Devant_Vasque: { id: 'Devant_Vasque', x: 116, z: 545 }, // Devant la vasque dans SDB
  Entree_SDB: { id: 'Entree_SDB', x: 150, z: 560 }, // Juste à l'intérieur de la SDB
  Toilette: { id: 'Toilette', x: 50, z: 520 }, // Devant les toilettes
};

export const ACTION_GO_TO_TOILET: AgentInstruction[] = [
  // L'agent part de n'importe où. On l'envoie au couloir pour qu'il passe la porte.
  { type: 'MOVE_TO', targetNodeId: 'Couloir_SDB' },
  
  // Ouvrir la porte de la SDB
  { type: 'INTERACT', triggerEventKey: 'bathroomDoor', animation: 'idle', duration: 1.5 },
  
  // Entrer et aller aux toilettes
  { type: 'MOVE_TO', targetNodeId: 'Entree_SDB' },
  { type: 'MOVE_TO', targetNodeId: 'Toilette' },
  
  // S'asseoir sur les toilettes (vers le Sud = 0)
  { type: 'INTERACT', animation: 'anim_sitting_idle', duration: 10.0, rotY: 0 },
  
  // Sortir
  { type: 'MOVE_TO', targetNodeId: 'Entree_SDB' },
  { type: 'MOVE_TO', targetNodeId: 'Couloir_SDB' },
  
  // Fermer la porte SDB
  { type: 'INTERACT', triggerEventKey: 'bathroomDoor', animation: 'idle', duration: 1.0 },
];
