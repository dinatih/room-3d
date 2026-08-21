import { ZoneNode } from './aiTypes';

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
  Devant_Douche: { id: 'Devant_Douche', x: 45, z: 560 }, // Devant la porte de douche dans la SDB
  Devant_Baie_Vitree: { id: 'Devant_Baie_Vitree', x: 200, z: 20 },
  Dans_Jardin: { id: 'Dans_Jardin', x: 200, z: -50 },
  Devant_Jardin_Voisin_Ouest: { id: 'Devant_Jardin_Voisin_Ouest', x: -200, z: -100 },
  Devant_Jardin_Voisin_Est: { id: 'Devant_Jardin_Voisin_Est', x: 400, z: -500 },
};

/** Alias de rétro-compatibilité */
export const ZONES = WAYPOINTS;


