import { SMART_OBJECTS } from './smartObjectRegistry';

/**
 * OccupancyManager — Système central de réservation et d'occupation des places assises et objets 3D.
 * Empêche que plusieurs personnages (joueur ou PNJs) s'assoient au même endroit (chaise de bureau, WC, canapé, lit...).
 */

interface SlotReservation {
  characterId: string;
  claimedAt: number;
}

export const BATHROOM_OBJECTS = new Set(['toilet', 'vasque-sdb', 'sdb-closet', 'shower']);

class SmartObjectOccupancyManager {
  // Clef: `${objectId}:${slotId}` -> { characterId, claimedAt }
  private occupiedSlots = new Map<string, SlotReservation>();

  private slotKey(objectId: string, slotId: string): string {
    return `${objectId}:${slotId}`;
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
    for (const [key, reservation] of this.occupiedSlots) {
      if (reservation.characterId === forCharacterId) continue;
      const separator = key.indexOf(':');
      const occupiedObject = key.slice(0, separator), occupiedSlot = key.slice(separator + 1);
      if (BATHROOM_OBJECTS.has(objectId) && BATHROOM_OBJECTS.has(occupiedObject)) return reservation.characterId;
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
    if (this.isSlotOccupied(objectId, slotId, characterId)) {
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
    if (!obj || !obj.slots.length) return null;

    if (BATHROOM_OBJECTS.has(objectId)) {
      for (const [k, r] of this.occupiedSlots.entries()) {
        const [occObj] = k.split(':');
        if (BATHROOM_OBJECTS.has(occObj) && r.characterId !== characterId) {
          return null;
        }
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
