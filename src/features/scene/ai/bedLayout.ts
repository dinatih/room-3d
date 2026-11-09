import { cameraState } from '../cameraState';
import { positionState } from '../positionState';
import { currentFurnitureTransforms, movingFurniture, SINGLE_BED_POSITIONS, DOUBLE_BED_POSITIONS, DESK1_POSITIONS, DESK2_POSITIONS, SMORKULL_POSITIONS, type FurnitureTransform } from '../furniturePositions';
import { furnitureObstacles, hasAgentProfile, getAgentProfile } from './navigation/obstacles';
import { convexHull, inflate, pointInRing } from './navigation/geometry';
import { OccupancyManager } from './occupancyManager';
import { appLog } from '@features/ui/AppConsole';

export const BED_LAYOUT_OBJECTS: Record<string, string> = {
  'bed-west-position': 'bed-west', 'bed-east-position': 'bed-east',
  'desk1-position': 'desk-bollsidan-1', 'desk2-position': 'desk-bollsidan-2', 'smorkull-position': 'chair-office',
};
export const bedDaytimePositions: Record<string, number> = {};

/** Check the whole swept body, including rotation, against real actor dimensions. */
export function furnitureActorBlock(key: string, from: FurnitureTransform, to: FurnitureTransform): string | undefined {
  const owner = BED_LAYOUT_OBJECTS[key];
  if (!owner) return;
  for (const obstacle of furnitureObstacles.values()) {
    if (obstacle.id !== owner && !obstacle.id.startsWith(`${owner}:`) && obstacle.owner !== owner) continue;
    const angle = to.ry - from.ry;
    const polygon = angle === 0 ? convexHull([...obstacle.polygon, ...obstacle.polygon.map(p => ({ x: p.x + to.x - from.x, z: p.z + to.z - from.z }))])
      : inflate([from, to], Math.max(...obstacle.polygon.map(p => Math.hypot(p.x - from.x, p.z - from.z))));
    for (const [id, p] of Object.entries(cameraState.positions)) {
      if (!hasAgentProfile(id)) continue;
      const body = getAgentProfile(id);
      if (p.y < obstacle.yMax && p.y + body.height > obstacle.yMin && pointInRing(p, inflate(polygon, body.radius))) return id;
    }
  }
}

export function bedLayoutBlock(double: boolean, index = positionState['bed-position']?.idx ?? 0): string | undefined {
  const reservations = OccupancyManager.getReservations();
  const occupied = reservations.find(r => ['bed-double', ...Object.values(BED_LAYOUT_OBJECTS)].includes(r.slot.split(':')[0]));
  if (occupied) return `Mobilier réservé par ${occupied.characterId}`;
  if (Object.keys(BED_LAYOUT_OBJECTS).some(key => movingFurniture.has(key))) return 'Mobilier en déplacement';
  const bed = DOUBLE_BED_POSITIONS[index], east = index === 1;
  const targets: Record<string, FurnitureTransform> = {
    'bed-west-position': double ? { ...bed.west, ry: Math.PI / 2 } : SINGLE_BED_POSITIONS.west,
    'bed-east-position': double ? { ...bed.east, ry: Math.PI / 2 } : SINGLE_BED_POSITIONS.east,
    'desk1-position': DESK1_POSITIONS[double ? east ? DESK1_POSITIONS.length - 1 : 1 : bedDaytimePositions['desk1-position'] ?? 0],
    'desk2-position': DESK2_POSITIONS[double ? east ? DESK2_POSITIONS.length - 1 : 1 : bedDaytimePositions['desk2-position'] ?? 0],
    'smorkull-position': SMORKULL_POSITIONS[double ? east ? SMORKULL_POSITIONS.length - 1 : 0 : bedDaytimePositions['smorkull-position'] ?? 0],
  };
  for (const [key, target] of Object.entries(targets)) {
    const current = currentFurnitureTransforms[key];
    if (!current) return `Position du mobilier indisponible : ${key}`;
    if (current.x === target.x && current.z === target.z && current.ry === target.ry) continue;
    const actor = furnitureActorBlock(key, current, target);
    if (actor) return `Passage du mobilier occupé par ${actor}`;
  }
}

export function refuseUnsafeBedLayout(double: boolean, index?: number): boolean {
  const reason = bedLayoutBlock(double, index);
  if (reason) appLog('system', `Réaménagement des lits différé : ${reason}`, { category: 'object', action: 'bed_layout_blocked', reason });
  return Boolean(reason);
}
