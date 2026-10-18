import { currentFurnitureTransforms, movingFurniture, type FurnitureTransform } from '../furniturePositions';
import { OccupancyManager } from './occupancyManager';
import { furnitureObstacles, getAgentProfile } from './navigation/obstacles';
import { inflate, pointInRing } from './navigation/geometry';
import { getSmartObject } from './smartObjectRegistry';

// Au pied des lits, hors de l'allée entre Bricolage et la poubelle.
const PARKING: FurnitureTransform = { x: 150, z: 330, ry: Math.PI / 2 };
let owner: string | null = null;

export function getDiyChairParking(): FurnitureTransform | undefined {
  return owner ? PARKING : undefined;
}

/** Reserve an unoccupied chair and wait for its rendered obstacle to finish moving. */
export function prepareDiyChair(actorId: string): boolean {
  if (owner && owner !== actorId) return false;
  const current = currentFurnitureTransforms['smorkull-position'];
  if (!owner) {
    if (!current) return true; // The furniture layer may be hidden.
    const [x, , z] = getSmartObject('drona-kitchen-diy')!.slots[0].offset!;
    const target = { x, z };
    const radius = getAgentProfile(actorId).radius;
    const blocked = [...furnitureObstacles.values()].some(obstacle => obstacle.owner === 'chair-office'
      && pointInRing(target, inflate(obstacle.polygon, radius)));
    if (!blocked) return true;
    if (OccupancyManager.getOccupant('chair-office', 'sit') || !OccupancyManager.claimSlot('chair-office', 'sit', actorId)) return false;
    owner = actorId;
    document.dispatchEvent(new Event('diy-chair-clearance'));
    return false;
  }
  return !!current && !movingFurniture.has('smorkull-position')
    && current.x === PARKING.x && current.z === PARKING.z && current.ry === PARKING.ry;
}

export function releaseDiyChair(actorId: string): void {
  if (owner !== actorId) return;
  owner = null;
  OccupancyManager.releaseSlot('chair-office', 'sit', actorId);
  document.dispatchEvent(new Event('diy-chair-clearance'));
}
