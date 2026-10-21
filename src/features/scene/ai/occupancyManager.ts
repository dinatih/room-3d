import { SMART_OBJECTS, getSmartObject } from './smartObjectRegistry';
import { cameraState } from '../cameraState';
import { CHARACTERS } from '../characterConfig';
import { useSceneStore } from '../store/useSceneStore';
import { BATH_WEST_WALL, BATH_EAST_WALL, BATH_NORTH_WALL, ROOM_NORTH_WALL, ROOM_SOUTH_WALL, ROOM_EAST_WALL, WALL_H } from '../wallData';

/**
 * OccupancyManager — Système central de réservation et d'occupation des places assises et objets 3D.
 * Empêche que plusieurs personnages (joueur ou PNJs) s'assoient au même endroit (chaise de bureau, WC, canapé, lit...).
 */

interface SlotReservation {
  characterId: string;
  claimedAt: number;
}

export const BATHROOM_OBJECTS = new Set(['toilet', 'vasque-sdb', 'sdb-closet', 'shower']);
export const BATHROOM_CAPACITY = 3;
export const LIVING_ROOM_NPC_CAPACITY = 8;
const humanIds = new Set(CHARACTERS.map(character => character.id));

/** Main room and its kitchen extension, excluding the entrance corridor. */
export function isInLivingRoom({ x, y = 0, z }: { x: number; y?: number; z: number }): boolean {
  return y >= 0 && y <= WALL_H && x >= BATH_WEST_WALL && x <= ROOM_EAST_WALL && z >= ROOM_NORTH_WALL
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

  getBathroomOccupants(forCharacterId?: string): Set<string> {
    const occupants = new Set<string>();
    for (const [key, reservation] of this.occupiedSlots) {
      if (forCharacterId && reservation.characterId === forCharacterId) continue;
      const separator = key.indexOf(':');
      const occupiedObject = key.slice(0, separator);
      if (BATHROOM_OBJECTS.has(occupiedObject)) occupants.add(reservation.characterId);
    }
    return occupants;
  }

  isLivingRoomObject(objectId: string, slotId?: string): boolean {
    const object = getSmartObject(objectId);
    if (!object) return false;
    const slot = object.slots.find(candidate => candidate.slotId === slotId?.split(':')[0]);
    const point = slot?.approachOffset ?? slot?.offset ?? object.position;
    return isInLivingRoom({ x: point[0], y: point[1], z: point[2] });
  }

  /** Present NPCs and incoming reservations each occupy one place; the player is excluded. */
  getLivingRoomOccupants(forCharacterId?: string): Set<string> {
    const activeId = useSceneStore.getState().activeCharacterId;
    const occupants = new Set<string>();
    for (const [id, position] of Object.entries(cameraState.positions)) {
      if (id !== activeId && id !== forCharacterId && humanIds.has(id) && isInLivingRoom(position)) occupants.add(id);
    }
    for (const [key, reservation] of this.occupiedSlots) {
      if (reservation.characterId === activeId || reservation.characterId === forCharacterId || !humanIds.has(reservation.characterId)) continue;
      const separator = key.indexOf(':');
      if (this.isLivingRoomObject(key.slice(0, separator), key.slice(separator + 1))) occupants.add(reservation.characterId);
    }
    return occupants;
  }

  hasLivingRoomCapacity(...characterIds: string[]): boolean {
    const activeId = useSceneStore.getState().activeCharacterId;
    if (characterIds.every(id => id === activeId || !humanIds.has(id))) return true;
    const occupants = this.getLivingRoomOccupants();
    for (const id of characterIds) if (id !== activeId && humanIds.has(id)) occupants.add(id);
    return occupants.size <= LIVING_ROOM_NPC_CAPACITY;
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
    if (this.isLivingRoomObject(objectId, slotId) && (forCharacterId
      ? !this.hasLivingRoomCapacity(forCharacterId)
      : this.getLivingRoomOccupants().size >= LIVING_ROOM_NPC_CAPACITY)) {
      return this.getLivingRoomOccupants(forCharacterId).values().next().value!;
    }
    if (BATHROOM_OBJECTS.has(objectId)) {
      const occupants = this.getBathroomOccupants(forCharacterId);
      if (occupants.size >= BATHROOM_CAPACITY) return [...occupants][0];
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
    if (this.isLivingRoomObject(objectId, preferredSlotId) && !this.hasLivingRoomCapacity(characterId)) return null;

    if (BATHROOM_OBJECTS.has(objectId)) {
      if (this.getBathroomOccupants(characterId).size >= BATHROOM_CAPACITY) {
        return null;
      }
    }

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
    if (this.isLivingRoomObject(objectId) && (characterId ? !this.hasLivingRoomCapacity(characterId) : this.getLivingRoomOccupants().size >= LIVING_ROOM_NPC_CAPACITY)) return true;
    if (this.isExclusiveObject(objectId)) {
      for (const [k, r] of this.occupiedSlots.entries()) {
        if (k.startsWith(`${objectId}:`) && (!characterId || r.characterId !== characterId)) {
          return true;
        }
      }
      return false;
    }
    return obj.slots.every(slot => this.isSlotOccupied(objectId, slot.slotId, characterId));
  }
}

export const OccupancyManager = new SmartObjectOccupancyManager();
