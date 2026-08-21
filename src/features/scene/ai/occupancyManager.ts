import { SMART_OBJECTS } from './smartObjectRegistry';

/**
 * OccupancyManager — Système central de réservation et d'occupation des places assises et objets 3D.
 * Empêche que plusieurs personnages (joueur ou PNJs) s'assoient au même endroit (chaise de bureau, WC, canapé, lit...).
 */

interface SlotReservation {
  characterId: string;
  claimedAt: number;
}

class SmartObjectOccupancyManager {
  // Clef: `${objectId}:${slotId}` -> { characterId, claimedAt }
  private occupiedSlots = new Map<string, SlotReservation>();

  private slotKey(objectId: string, slotId: string): string {
    return `${objectId}:${slotId}`;
  }

  /**
   * Vérifie si un slot donné est occupé par un AUTRE personnage.
   */
  isSlotOccupied(objectId: string, slotId: string, forCharacterId?: string): boolean {
    const key = this.slotKey(objectId, slotId);
    const res = this.occupiedSlots.get(key);
    if (res && (!forCharacterId || res.characterId !== forCharacterId)) {
      return true;
    }

    // Règles spécifiques d'exclusion mutuelle par meuble :
    
    // 1. Toilettes : occupation totale si quelqu'un est dessus ou tire la chasse
    if (objectId === 'toilet') {
      for (const [k, r] of this.occupiedSlots.entries()) {
        if (k.startsWith('toilet:') && (!forCharacterId || r.characterId !== forCharacterId)) {
          return true;
        }
      }
    }

    // 2. Lits (bed-west, bed-east) :
    // - Si quelqu'un est couché ('lie-down'), tout le lit est occupé.
    // - Si quelqu'un veut se coucher ('lie-down'), aucun slot de siège ne doit être pris.
    if (objectId.startsWith('bed-')) {
      if (slotId === 'lie-down') {
        for (const [k, r] of this.occupiedSlots.entries()) {
          if (k.startsWith(`${objectId}:`) && (!forCharacterId || r.characterId !== forCharacterId)) {
            return true;
          }
        }
      } else {
        const lieDownKey = this.slotKey(objectId, 'lie-down');
        const lieDownRes = this.occupiedSlots.get(lieDownKey);
        if (lieDownRes && (!forCharacterId || lieDownRes.characterId !== forCharacterId)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Obtient le nom ou l'ID du personnage occupant un slot.
   */
  getOccupant(objectId: string, slotId: string): string | null {
    const key = this.slotKey(objectId, slotId);
    const res = this.occupiedSlots.get(key);
    if (res) return res.characterId;

    if (objectId === 'toilet') {
      for (const [k, r] of this.occupiedSlots.entries()) {
        if (k.startsWith(`${objectId}:`)) return r.characterId;
      }
    }
    if (objectId.startsWith('bed-') && slotId === 'lie-down') {
      for (const [k, r] of this.occupiedSlots.entries()) {
        if (k.startsWith(`${objectId}:`)) return r.characterId;
      }
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

    if (preferredSlotId) {
      const preferred = obj.slots.find(s => s.slotId === preferredSlotId);
      if (preferred && !this.isSlotOccupied(objectId, preferred.slotId, characterId)) {
        return preferred.slotId;
      }
    }

    // Cherche parmi tous les slots de l'objet
    for (const slot of obj.slots) {
      if (!this.isSlotOccupied(objectId, slot.slotId, characterId)) {
        return slot.slotId;
      }
    }

    return null;
  }

  /**
   * Vérifie si un objet est totalement complet (aucun slot disponible).
   */
  isObjectFullyOccupied(objectId: string, characterId?: string): boolean {
    const obj = SMART_OBJECTS[objectId];
    if (!obj || !obj.slots.length) return false;
    return obj.slots.every(slot => this.isSlotOccupied(objectId, slot.slotId, characterId));
  }
}

export const OccupancyManager = new SmartObjectOccupancyManager();
