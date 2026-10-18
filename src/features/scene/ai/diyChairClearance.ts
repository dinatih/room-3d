import { currentFurnitureTransforms, movingFurniture, type FurnitureTransform } from '../furniturePositions';
import { BATH_WEST_WALL, ROOM_D, FURNITURE_WALL_CLEARANCE } from '../wallData';
import { KALLAX_CUISINE_POSITION } from '../items/kallaxCuisineDrona';
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

// TATAY 26 × 36 cm. Park in front of the left column, clear of the Kallax face.
export const KITCHEN_TRASH_POSITION: FurnitureTransform = {
  x: BATH_WEST_WALL + 39 + 18, z: ROOM_D - 75.5 / 2 - 22, ry: Math.PI / 2,
};
const TRASH_PARKING: FurnitureTransform = {
  x: KALLAX_CUISINE_POSITION[0] + 20.124 + 18 + FURNITURE_WALL_CLEARANCE,
  z: KITCHEN_TRASH_POSITION.z + 36, ry: Math.PI / 2,
};
let trashOwner: string | null = null;
export function getKitchenTrashParking(): FurnitureTransform | undefined {
  return trashOwner ? TRASH_PARKING : undefined;
}
export function prepareKitchenStorageAccess(actorId: string): boolean {
  if (trashOwner && trashOwner !== actorId) return false;
  if (!prepareDiyChair(actorId)) return false;
  const current = currentFurnitureTransforms['trash-bin-position'];
  if (!current) return true;
  if (!trashOwner) {
    trashOwner = actorId;
    document.dispatchEvent(new Event('kitchen-trash-clearance'));
    return false;
  }
  return !movingFurniture.has('trash-bin-position')
    && current.x === TRASH_PARKING.x && current.z === TRASH_PARKING.z;
}
export function releaseKitchenStorageAccess(actorId: string): void {
  releaseDiyChair(actorId);
  if (trashOwner !== actorId) return;
  trashOwner = null;
  document.dispatchEvent(new Event('kitchen-trash-clearance'));
}
