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

/**
 * Positions possibles des meubles configurables par HoverMenu
 */
export const DESK1_POSITIONS = [
  { x: 73.5, z: 18 },
  { x: 22,   z: 74.5 },
  { x: 40,   z: 60 },
];

export const DESK2_POSITIONS = [
  { x: 200, z: 170 },
  { x: 85,  z: 151 },
];

export const SMORKULL_POSITIONS = [
  { x: 85,  z: 272 },
  { x: 150, z: 100 },
  { x: 150, z: 300 },
  { x: 240, z: 38 },
];

export const AIRPERFORMER_POSITIONS = [
  { x: 261, z: 65.5 },
  { x: 200, z: 100 },
];

/**
 * Récupère en temps réel la liste des obstacles physiques (meubles) au sol.
 * Prend en compte dynamiquement les positions sélectionnées dans l'HoverMenu via positionState.
 */
export function getActiveFurnitureObstacles(): FurnitureObstacle[] {
  const obstacles: FurnitureObstacle[] = [];

  // 1. Lit Ouest (Utåker principal) [position fixe x=74, z=151.5, dimensions 80x200]
  obstacles.push(
    { id: 'bed-west-n', name: 'Lit Ouest (Nord)', x: 74, z: 110, radius: 45, smartObjectIds: ['bed-west'] },
    { id: 'bed-west-s', name: 'Lit Ouest (Sud)', x: 74, z: 190, radius: 45, smartObjectIds: ['bed-west'] }
  );

  // 2. Lit Est (Utåker secondaire) [position x=270, z=190, dimensions 80x200]
  obstacles.push(
    { id: 'bed-east-n', name: 'Lit Est (Nord)', x: 270, z: 150, radius: 45, smartObjectIds: ['bed-east'] },
    { id: 'bed-east-s', name: 'Lit Est (Sud)', x: 270, z: 230, radius: 45, smartObjectIds: ['bed-east'] }
  );

  // 3. Bureau 1 (Bollsidan 1) — position dynamique
  const d1Idx = positionState['desk1-position']?.idx ?? 0;
  const d1Pos = DESK1_POSITIONS[d1Idx] || DESK1_POSITIONS[0];
  obstacles.push({
    id: 'desk-1',
    name: 'Bureau 1',
    x: d1Pos.x,
    z: d1Pos.z,
    radius: 40,
    smartObjectIds: ['desk-bollsidan-1']
  });

  // 4. Bureau 2 (Bollsidan 2) — position dynamique
  const d2Idx = positionState['desk2-position']?.idx ?? 0;
  const d2Pos = DESK2_POSITIONS[d2Idx] || DESK2_POSITIONS[0];
  obstacles.push({
    id: 'desk-2',
    name: 'Bureau 2',
    x: d2Pos.x,
    z: d2Pos.z,
    radius: 40,
    smartObjectIds: ['desk-bollsidan-2']
  });

  // 5. Chaise de bureau (Smörkull) — position dynamique
  const smorIdx = positionState['smorkull-position']?.idx ?? 0;
  const smorPos = SMORKULL_POSITIONS[smorIdx] || SMORKULL_POSITIONS[0];
  obstacles.push({
    id: 'smorkull-chair',
    name: 'Chaise de bureau Smörkull',
    x: smorPos.x,
    z: smorPos.z,
    radius: 35,
    smartObjectIds: ['chair-office']
  });

  // 6. Air Performer — position dynamique
  const airIdx = positionState['airperformer-position']?.idx ?? 0;
  const airPos = AIRPERFORMER_POSITIONS[airIdx] || AIRPERFORMER_POSITIONS[0];
  obstacles.push({
    id: 'air-performer',
    name: 'Purificateur Air Performer',
    x: airPos.x,
    z: airPos.z,
    radius: 25,
    smartObjectIds: ['air-performer']
  });

  // 7. Congélateur CHIQ [x=250, z=320]
  obstacles.push({
    id: 'freezer',
    name: 'Congélateur CHIQ',
    x: 250,
    z: 320,
    radius: 30,
    smartObjectIds: ['freezer']
  });

  // 8. Canapé de jardin Est [x=270, z=-110]
  obstacles.push({
    id: 'sofa-garden-east',
    name: 'Canapé Jardin Est',
    x: 270,
    z: -110,
    radius: 45,
    smartObjectIds: ['sofa-garden-east']
  });

  // 9. Canapé de jardin Ouest [x=100, z=-80]
  obstacles.push({
    id: 'sofa-garden-west',
    name: 'Canapé Jardin Ouest',
    x: 100,
    z: -80,
    radius: 45,
    smartObjectIds: ['sofa-garden-west']
  });

  // 10. Coffre-banc Jardin (ChestBench) [x=40, z=-90]
  obstacles.push({
    id: 'chest-bench',
    name: 'Coffre-banc Jardin',
    x: 40,
    z: -90,
    radius: 70,
    smartObjectIds: ['chest-bench']
  });

  // 11. Baignoire Jardin [x=120, z=-250]
  obstacles.push(
    { id: 'bathtub-1', name: 'Baignoire (Centre)', x: 120, z: -250, radius: 45, smartObjectIds: ['bathtub-garden'] },
    { id: 'bathtub-2', name: 'Baignoire (Ouest)',  x: 90,  z: -270, radius: 40, smartObjectIds: ['bathtub-garden'] },
    { id: 'bathtub-3', name: 'Baignoire (Est)',    x: 150, z: -230, radius: 40, smartObjectIds: ['bathtub-garden'] }
  );

  return obstacles;
}
