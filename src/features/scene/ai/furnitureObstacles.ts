import { positionState } from '../positionState';

export interface FurnitureObstacle {
  id: string;
  name: string;
  x: number;
  z: number;
  radius: number; // Rayon d'encombrement / collision au sol (cm)
  /** Si le meuble est la destination actuelle de l'agent, on ignore sa collision */
  smartObjectIds?: string[];
}

export {
  DESK1_POSITIONS,
  DESK2_POSITIONS,
  SMORKULL_POSITIONS,
  AIRPERFORMER_POSITIONS
} from '../furniturePositions';
import {
  DESK1_POSITIONS,
  DESK2_POSITIONS,
  SMORKULL_POSITIONS,
  AIRPERFORMER_POSITIONS
} from '../furniturePositions';

/**
 * Récupère en temps réel la liste des obstacles physiques (meubles) au sol.
 * Prend en compte dynamiquement les positions sélectionnées dans l'HoverMenu via positionState.
 */
// Obstacles statiques fixes
const STATIC_OBSTACLES: FurnitureObstacle[] = [
  // 1. Lit Ouest (Utåker principal) [position fixe x=74, z=151.5, dimensions 80x200]
  { id: 'bed-west-n', name: 'Lit Ouest (Nord)', x: 74, z: 110, radius: 45, smartObjectIds: ['bed-west'] },
  { id: 'bed-west-s', name: 'Lit Ouest (Sud)', x: 74, z: 190, radius: 45, smartObjectIds: ['bed-west'] },

  // 2. Lit Est (Utåker secondaire) [position x=270, z=190, dimensions 80x200]
  { id: 'bed-east-n', name: 'Lit Est (Nord)', x: 270, z: 150, radius: 45, smartObjectIds: ['bed-east'] },
  { id: 'bed-east-s', name: 'Lit Est (Sud)', x: 270, z: 230, radius: 45, smartObjectIds: ['bed-east'] },

  // 7. Congélateur CHIQ [x=250, z=320]
  { id: 'freezer', name: 'Congélateur CHIQ', x: 250, z: 320, radius: 30, smartObjectIds: ['freezer'] },

  // 8. Canapé de jardin Est [x=270, z=-110]
  { id: 'sofa-garden-east', name: 'Canapé Jardin Est', x: 270, z: -110, radius: 45, smartObjectIds: ['sofa-garden-east'] },

  // 9. Canapé de jardin Ouest [x=100, z=-80]
  { id: 'sofa-garden-west', name: 'Canapé Jardin Ouest', x: 100, z: -80, radius: 45, smartObjectIds: ['sofa-garden-west'] },

  // 10. Coffre-banc Jardin (ChestBench) [x=40, z=-90]
  { id: 'chest-bench', name: 'Coffre-banc Jardin', x: 40, z: -90, radius: 70, smartObjectIds: ['chest-bench'] },

  // 11. Baignoire Jardin [x=120, z=-250]
  { id: 'bathtub-1', name: 'Baignoire (Centre)', x: 120, z: -250, radius: 45, smartObjectIds: ['bathtub-garden'] },
  { id: 'bathtub-2', name: 'Baignoire (Ouest)',  x: 90,  z: -270, radius: 40, smartObjectIds: ['bathtub-garden'] },
  { id: 'bathtub-3', name: 'Baignoire (Est)',    x: 150, z: -230, radius: 40, smartObjectIds: ['bathtub-garden'] }
];

// Obstacles dynamiques dont la position dépend du HoverMenu / positionState
const DYNAMIC_OBSTACLE_TEMPLATES: FurnitureObstacle[] = [
  { id: 'desk-1', name: 'Bureau 1', x: 0, z: 0, radius: 40, smartObjectIds: ['desk-bollsidan-1'] },
  { id: 'desk-2', name: 'Bureau 2', x: 0, z: 0, radius: 40, smartObjectIds: ['desk-bollsidan-2'] },
  { id: 'smorkull-chair', name: 'Chaise de bureau Smörkull', x: 0, z: 0, radius: 35, smartObjectIds: ['chair-office'] },
  { id: 'air-performer', name: 'Purificateur Air Performer', x: 0, z: 0, radius: 25, smartObjectIds: ['air-performer'] },
];

let cachedObstacles: FurnitureObstacle[] = [...STATIC_OBSTACLES, ...DYNAMIC_OBSTACLE_TEMPLATES];
let lastD1Idx = -1;
let lastD2Idx = -1;
let lastSmorIdx = -1;
let lastAirIdx = -1;

/**
 * Récupère en temps réel la liste des obstacles physiques (meubles) au sol.
 * Met en cache la liste et ne la recalcule que lorsque les positions changent dans positionState.
 */
export function getActiveFurnitureObstacles(): readonly FurnitureObstacle[] {
  const d1Idx = positionState['desk1-position']?.idx ?? 0;
  const d2Idx = positionState['desk2-position']?.idx ?? 0;
  const smorIdx = positionState['smorkull-position']?.idx ?? 0;
  const airIdx = positionState['airperformer-position']?.idx ?? 0;

  if (d1Idx === lastD1Idx && d2Idx === lastD2Idx && smorIdx === lastSmorIdx && airIdx === lastAirIdx) {
    return cachedObstacles;
  }

  lastD1Idx = d1Idx;
  lastD2Idx = d2Idx;
  lastSmorIdx = smorIdx;
  lastAirIdx = airIdx;

  const d1Pos = DESK1_POSITIONS[d1Idx] || DESK1_POSITIONS[0];
  DYNAMIC_OBSTACLE_TEMPLATES[0].x = d1Pos.x;
  DYNAMIC_OBSTACLE_TEMPLATES[0].z = d1Pos.z;

  const d2Pos = DESK2_POSITIONS[d2Idx] || DESK2_POSITIONS[0];
  DYNAMIC_OBSTACLE_TEMPLATES[1].x = d2Pos.x;
  DYNAMIC_OBSTACLE_TEMPLATES[1].z = d2Pos.z;

  const smorPos = SMORKULL_POSITIONS[smorIdx] || SMORKULL_POSITIONS[0];
  DYNAMIC_OBSTACLE_TEMPLATES[2].x = smorPos.x;
  DYNAMIC_OBSTACLE_TEMPLATES[2].z = smorPos.z;

  const airPos = AIRPERFORMER_POSITIONS[airIdx] || AIRPERFORMER_POSITIONS[0];
  DYNAMIC_OBSTACLE_TEMPLATES[3].x = airPos.x;
  DYNAMIC_OBSTACLE_TEMPLATES[3].z = airPos.z;

  return cachedObstacles;
}
