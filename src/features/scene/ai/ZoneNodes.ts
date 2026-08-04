import { AgentInstruction, ZoneNode } from './aiTypes';

export const ZONES: Record<string, ZoneNode> = {
  Start: { id: 'Start', x: 250, z: 300 },
  Couloir_Central: { id: 'Couloir_Central', x: 250, z: 400 },
  Couloir_Entree: { id: 'Couloir_Entree', x: 280, z: 480 }, // Devant porte d'entrée
  Sortie: { id: 'Sortie', x: 350, z: 580 }, // Dehors
  Couloir_SDB: { id: 'Couloir_SDB', x: 250, z: 560 }, // Devant porte SDB dans le couloir
  Devant_Vasque: { id: 'Devant_Vasque', x: 116, z: 489 }, // Devant la vasque dans SDB
};

export const SCENARIO_VISITE_GUIDEE: AgentInstruction[] = [
  // Aller vers l'entrée
  { type: 'MOVE_TO', targetNodeId: 'Couloir_Central' },
  { type: 'MOVE_TO', targetNodeId: 'Couloir_Entree' },
  
  // Ouvrir la porte d'entrée
  { type: 'INTERACT', triggerEventKey: 'entry-door-toggle', animation: 'idle', duration: 1.5 },
  
  // Aller à la SDB
  { type: 'MOVE_TO', targetNodeId: 'Couloir_SDB' },
  
  // Ouvrir la porte de la SDB
  { type: 'INTERACT', triggerEventKey: 'bathroom-door-toggle', animation: 'idle', duration: 1.5 },
  
  // Entrer et aller devant la vasque
  { type: 'MOVE_TO', targetNodeId: 'Devant_Vasque' },
  
  // Faire une pose artistique devant le miroir (ex: anim_female_dynamic_pose ou custom)
  // On utilise une animation qui est chargée par défaut, ex. "pose_mirror" ou juste "idle"
  { type: 'INTERACT', animation: 'anim_female_dynamic_pose', duration: 4.0 },
  
  // Sortir
  { type: 'MOVE_TO', targetNodeId: 'Couloir_SDB' },
  
  // Fermer la porte SDB
  { type: 'INTERACT', triggerEventKey: 'bathroom-door-toggle', animation: 'idle', duration: 1.0 },
  
  // Aller vers la sortie
  { type: 'MOVE_TO', targetNodeId: 'Couloir_Entree' },
  
  // Fermer porte entrée (on interagit avant de sortir complètement si on veut, ou après)
  { type: 'MOVE_TO', targetNodeId: 'Sortie' },
  { type: 'INTERACT', triggerEventKey: 'entry-door-toggle', animation: 'idle', duration: 1.0 }
];
