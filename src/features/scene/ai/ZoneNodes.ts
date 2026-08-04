import { AgentInstruction, ZoneNode } from './aiTypes';

export const ZONES: Record<string, ZoneNode> = {
  Start: { id: 'Start', x: 250, z: 300 },
  Couloir_Central: { id: 'Couloir_Central', x: 250, z: 400 },
  Couloir_Entree: { id: 'Couloir_Entree', x: 248, z: 535 }, // Dedans, devant porte d'entrée
  Sortie: { id: 'Sortie', x: 288, z: 603 }, // Dehors, devant la porte
  Couloir_SDB: { id: 'Couloir_SDB', x: 248, z: 560 }, // Devant porte SDB dans le couloir
  Devant_Vasque: { id: 'Devant_Vasque', x: 116, z: 545 }, // Devant la vasque dans SDB
  Entree_SDB: { id: 'Entree_SDB', x: 150, z: 560 }, // Juste à l'intérieur de la SDB
};

export const SCENARIO_VISITE_GUIDEE: AgentInstruction[] = [
  // Aller devant la porte d'entrée (depuis la Sortie si on boucle, ou depuis sa position initiale)
  { type: 'MOVE_TO', targetNodeId: 'Sortie' },
  
  // Ouvrir la porte d'entrée
  { type: 'INTERACT', triggerEventKey: 'entryDoor', animation: 'idle', duration: 1.5 },
  
  // Entrer dans l'appartement
  { type: 'MOVE_TO', targetNodeId: 'Couloir_Entree' },
  
  // Aller à la SDB
  { type: 'MOVE_TO', targetNodeId: 'Couloir_SDB' },
  
  // Ouvrir la porte de la SDB
  { type: 'INTERACT', triggerEventKey: 'bathroomDoor', animation: 'idle', duration: 1.5 },
  
  // Passer la porte SDB
  { type: 'MOVE_TO', targetNodeId: 'Entree_SDB' },
  // Aller devant la vasque
  { type: 'MOVE_TO', targetNodeId: 'Devant_Vasque' },
  
  // Faire une pose artistique devant le miroir en le regardant (vers le Nord = Math.PI)
  { type: 'INTERACT', animation: 'anim_female_dynamic_pose', duration: 4.0, rotY: Math.PI },
  
  // Sortir
  { type: 'MOVE_TO', targetNodeId: 'Entree_SDB' },
  { type: 'MOVE_TO', targetNodeId: 'Couloir_SDB' },
  
  // Fermer la porte SDB
  { type: 'INTERACT', triggerEventKey: 'bathroomDoor', animation: 'idle', duration: 1.0 },
  
  // Aller vers la sortie
  { type: 'MOVE_TO', targetNodeId: 'Couloir_Entree' },
  
  // Fermer porte entrée (on interagit avant de sortir complètement si on veut, ou après)
  { type: 'MOVE_TO', targetNodeId: 'Sortie' },
  { type: 'INTERACT', triggerEventKey: 'entryDoor', animation: 'idle', duration: 1.0 }
];
