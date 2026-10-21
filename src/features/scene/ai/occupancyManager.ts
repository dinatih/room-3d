import { SMART_OBJECTS, getSmartObject } from './smartObjectRegistry';
import { cameraState } from '../cameraState';
import { CHARACTERS } from '../characterConfig';
import { useSceneStore } from '../store/useSceneStore';
import { BATH_WEST_WALL, BATH_EAST_WALL, BATH_NORTH_WALL, ROOM_NORTH_WALL, ROOM_SOUTH_WALL, ROOM_EAST_WALL, CORRIDOR_WEST_WALL, CORRIDOR_EAST_WALL, CORRIDOR_NORTH_WALL, WALL_H, DiagWall } from '../wallData';

/**
 * OccupancyManager — Système central de réservation et d'occupation des places assises et objets 3D.
 * Empêche que plusieurs personnages (joueur ou PNJs) s'assoient au même endroit (chaise de bureau, WC, canapé, lit...).
 */

interface SlotReservation {
  characterId: string;
  claimedAt: number;
}

export const ROOM_CAPACITIES = { living: 8, bathroom: 3, corridor: 2 } as const;
export type LimitedRoom = keyof typeof ROOM_CAPACITIES;
export const LIMITED_ROOMS = Object.keys(ROOM_CAPACITIES) as LimitedRoom[];
const humanIds = new Set(CHARACTERS.map(character => character.id));

/** Room interiors, independent of the visibility of their geometry. */
export function isInRoom(room: LimitedRoom, { x, y = 0, z }: { x: number; y?: number; z: number }): boolean {
  if (y < 0 || y > WALL_H || x < BATH_WEST_WALL) return false;
  if (room === 'corridor') return x >= CORRIDOR_WEST_WALL && x <= CORRIDOR_EAST_WALL && z >= CORRIDOR_NORTH_WALL
    && z <= DiagWall.A.z + (x - DiagWall.A.x) * DiagWall.slope;
  if (room === 'bathroom') return x <= BATH_EAST_WALL && z > BATH_NORTH_WALL
    && z <= DiagWall.A.z + (x - DiagWall.A.x) * DiagWall.slope;
  return x <= ROOM_EAST_WALL && z >= ROOM_NORTH_WALL
    && (z <= ROOM_SOUTH_WALL || (x <= BATH_EAST_WALL && z <= BATH_NORTH_WALL));
}

class SmartObjectOccupancyManager {
  // Clef: `${objectId}:${slotId}` -> { characterId, claimedAt }
  private occupiedSlots = new Map<string, SlotReservation>();

  private slotKey(objectId: string, slotId: string): string {
    return `${objectId}:${slotId}`;
  }

  canUseObject(objectId: string, characterId?: string): boolean {
    const owner = SMART_OBJECTS[objectId]?.ownerCharacterId;
    return !owner || owner === characterId;
  }

  isRoomObject(room: LimitedRoom, objectId: string, slotId?: string): boolean {
    const object = getSmartObject(objectId);
    if (!object) return false;
    const slot = object.slots.find(candidate => candidate.slotId === slotId?.split(':')[0]);
    const point = slot?.offset ?? object.position;
    return isInRoom(room, { x: point[0], y: point[1], z: point[2] });
  }

  /** Presence and incoming activities count once per character. Only the living room excludes the player. */
  getRoomOccupants(room: LimitedRoom, forCharacterId?: string): Set<string> {
    const activeId = room === 'living' ? useSceneStore.getState().activeCharacterId : undefined;
    const occupants = new Set<string>();
    for (const [id, position] of Object.entries(cameraState.positions)) {
      if (id !== activeId && id !== forCharacterId && humanIds.has(id) && isInRoom(room, position)) occupants.add(id);
    }
    for (const [key, reservation] of this.occupiedSlots) {
      if (reservation.characterId === activeId || reservation.characterId === forCharacterId || !humanIds.has(reservation.characterId)) continue;
      const separator = key.indexOf(':');
      if (this.isRoomObject(room, key.slice(0, separator), key.slice(separator + 1))) occupants.add(reservation.characterId);
    }
    return occupants;
  }

  hasRoomCapacity(room: LimitedRoom, ...characterIds: string[]): boolean {
    const activeId = room === 'living' ? useSceneStore.getState().activeCharacterId : undefined;
    if (characterIds.every(id => id === activeId || !humanIds.has(id))) return true;
    const occupants = this.getRoomOccupants(room);
    for (const id of characterIds) if (id !== activeId && humanIds.has(id)) occupants.add(id);
    return occupants.size <= ROOM_CAPACITIES[room];
  }

  /**
   * Indique si un objet est à usage exclusif (un seul personnage à la fois sur l'ensemble de ses slots).
   */
  isExclusiveObject(objectId: string): boolean {
    if (objectId === 'vasque-sdb' || objectId === 'toilet') return true;
    const obj = SMART_OBJECTS[objectId];
    return !!obj?.exclusive;
  }

  /**
   * Vérifie si un slot donné est occupé par un AUTRE personnage.
   */
  isSlotOccupied(objectId: string, slotId: string, forCharacterId?: string): boolean {
    return this.getOccupant(objectId, slotId, forCharacterId) !== null;
  }

  /** The same conflict rules serve availability checks and their diagnostic. */
  getOccupant(objectId: string, slotId: string, forCharacterId?: string): string | null {
    const slots = SMART_OBJECTS[objectId]?.slots;
    const requested = slots?.find(slot => slot.slotId === slotId);
    for (const room of LIMITED_ROOMS) {
      if (this.isRoomObject(room, objectId, slotId) && (forCharacterId
        ? !this.hasRoomCapacity(room, forCharacterId)
        : this.getRoomOccupants(room).size >= ROOM_CAPACITIES[room])) {
        return this.getRoomOccupants(room, forCharacterId).values().next().value!;
      }
    }
    for (const [key, reservation] of this.occupiedSlots) {
      if (reservation.characterId === forCharacterId) continue;
      const separator = key.indexOf(':');
      const occupiedObject = key.slice(0, separator), occupiedSlot = key.slice(separator + 1);
      if (occupiedObject !== objectId) continue;
      const occupied = slots?.find(slot => slot.slotId === occupiedSlot);
      if (occupiedSlot === slotId || this.isExclusiveObject(objectId)
        || requested?.excludes?.includes(occupiedSlot) || occupied?.excludes?.includes(slotId)) return reservation.characterId;
    }
    return null;
  }

  /**
   * Tente de réserver un slot pour un personnage.
   * Retourne true si succès, false si déjà occupé.
   */
  claimSlot(objectId: string, slotId: string, characterId: string): boolean {
    if (!this.canUseObject(objectId, characterId) || this.isSlotOccupied(objectId, slotId, characterId)) {
      return false;
    }
    const key = this.slotKey(objectId, slotId);
    this.occupiedSlots.set(key, {
      characterId,
      claimedAt: Date.now()
    });
    return true;
  }

  /**
   * Libère un slot spécifique pour un personnage.
   */
  releaseSlot(objectId: string, slotId: string, characterId: string): void {
    const key = this.slotKey(objectId, slotId);
    const res = this.occupiedSlots.get(key);
    if (res && res.characterId === characterId) {
      this.occupiedSlots.delete(key);
    }
  }

  /**
   * Libère TOUS les slots réservés par un personnage (par ex. quand il change d'action ou unmount).
   */
  releaseAllForCharacter(characterId: string): void {
    for (const [key, res] of this.occupiedSlots.entries()) {
      if (res.characterId === characterId) {
        this.occupiedSlots.delete(key);
      }
    }
  }

  /**
   * Trouve un slot disponible sur l'objet donné.
   * Si preferredSlotId est libre, le renvoie en priorité.
   * Sinon, cherche un autre slot libre du même objet.
   */
  getAvailableSlot(objectId: string, characterId: string, preferredSlotId?: string): string | null {
    const obj = SMART_OBJECTS[objectId];
    if (!obj || !obj.slots.length || !this.canUseObject(objectId, characterId)) return null;
    if (this.isExclusiveObject(objectId) && this.isObjectFullyOccupied(objectId, characterId)) {
      return null;
    }

    if (preferredSlotId) {
      const preferred = obj.slots.find(s => s.slotId === preferredSlotId);
      if (preferred && !this.isSlotOccupied(objectId, preferred.slotId, characterId)) {
        return preferred.slotId;
      }
    }

    // Cherche parmi tous les slots de l'objet de façon aléatoire pour varier les actions (dormir couché, assises variées...)
    // Les slots isDuo sont exclus — ils ne peuvent être utilisés qu'en session Duo coordonnée.
    const availableSlots = obj.slots.filter(slot =>
      !slot.isDuo && !this.isSlotOccupied(objectId, slot.slotId, characterId)
    );
    if (availableSlots.length > 0) {
      const randomSlot = availableSlots[Math.floor(Math.random() * availableSlots.length)];
      return randomSlot.slotId;
    }

    return null;
  }

  /**
   * Vérifie si un objet est totalement complet (aucun slot disponible).
   */
  isObjectFullyOccupied(objectId: string, characterId?: string): boolean {
    const obj = SMART_OBJECTS[objectId];
    if (!obj || !obj.slots.length) return false;
    if (this.isExclusiveObject(objectId)) {
      for (const [k, r] of this.occupiedSlots.entries()) {
        if (k.startsWith(`${objectId}:`) && (!characterId || r.characterId !== characterId)) {
          return true;
        }
      }
    }
    return obj.slots.every(slot => this.isSlotOccupied(objectId, slot.slotId, characterId));
  }
}

export const OccupancyManager = new SmartObjectOccupancyManager();
