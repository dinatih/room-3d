import { Waypoint } from './aiTypes';

/**
 * WAYPOINTS — Nœuds de navigation et de passage purs (portes, couloirs, transitions).
 * Un Waypoint représente uniquement un point ou repère spatial ponctuel [x, y, z] (avec rotation optionnelle).
 * Les meubles et interactions spécifiques sont gérés via SMART_OBJECTS (smartObjectRegistry.ts).
 */
export const WAYPOINTS: Record<string, Waypoint> = {
  'living-corridor-door':   { id: 'living-corridor-door',   name: 'Séjour (Devant Porte)',       x: 230, z: 350 },
  'corridor-entry-door':    { id: 'corridor-entry-door',    name: 'Couloir (Devant Entrée)',     x: 255, z: 510 },
  'outdoor-entry-door':     { id: 'outdoor-entry-door',     name: 'Extérieur (Devant Porte)',    x: 288, z: 603 },
  'corridor-bathroom-door': { id: 'corridor-bathroom-door', name: 'Couloir (Devant Porte SDB)',  x: 235, z: 560 },
  'bathroom-entry':         { id: 'bathroom-entry',         name: 'Entrée Salle de bain',        x: 140, z: 560 },
  'bathroom-shower-entry':  { id: 'bathroom-shower-entry',  name: 'Devant Douche',               x: 25,  z: 570 },
  'living-glass-door':      { id: 'living-glass-door',      name: 'Séjour (Devant Baie Vitrée)', x: 200, z: 20  },
  'garden-patio':           { id: 'garden-patio',           name: 'Jardin (Terrasse)',           x: 200, z: -50 },
  'outdoor-garden-west':    { id: 'outdoor-garden-west',    name: 'Cour Ouest',                  x: -200, z: -100 },
  'outdoor-garden-east':    { id: 'outdoor-garden-east',    name: 'Cour Est',                    x: 400, z: -500 },
};





