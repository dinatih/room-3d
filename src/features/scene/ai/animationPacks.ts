/**
 * animationPacks.ts — Registre des packs d'animations et poses pour les slots d'interaction.
 * Permet de regrouper des poses (ex: assises de face, assises de côté à 90°, etc.) avec
 * leur décalage de rotation optionnel (rotYOffset) et de sélectionner aléatoirement une pose.
 */

export interface AnimationPackItem {
  animation: string;
  rotYOffset?: number; // Décalage d'orientation en radians propre à l'animation
}

export interface AnimationPackDef {
  id: string;
  name: string;
  defaultRotYOffset?: number; // Décalage de rotation par défaut pour tout le pack (ex: Math.PI / 2 pour side_sitted_pack)
  animations: Array<string | AnimationPackItem>;
}

import { getRandomAnimationByQuery, resolveAnimationPath, getAnimationDef, getAnimationsByTags } from '../animations/animationResolver';

/**
 * Packs d'animations dérivés sémantiquement à partir des tags du registre.
 * Garantit que l'ajout d'une animation dans le registre (avec ses tags et son rotYOffset natif)
 * l'intègre automatiquement dans les packs correspondants, sans duplication de chemins.
 */
export const ANIMATION_PACKS: Record<string, AnimationPackDef> = {
  // ── ASSISE DE FACE (0°) ────────────────────────────────────────────────────
  seated_front: {
    id: 'seated_front',
    name: 'Poses assises de face',
    defaultRotYOffset: 0,
    get animations() {
      return getAnimationsByTags(['seated_front']).map((d) => ({
        animation: d.path,
        rotYOffset: d.defaultRotYOffset ?? 0,
      }));
    },
  },

  // ── ASSISE DE CÔTÉ (90° / π/2) ─────────────────────────────────────────────
  seated_side: {
    id: 'seated_side',
    name: 'Poses assises de côté (90°)',
    defaultRotYOffset: Math.PI / 2,
    get animations() {
      return getAnimationsByTags(['seated_side']).map((d) => ({
        animation: d.path,
        rotYOffset: d.defaultRotYOffset ?? Math.PI / 2,
      }));
    },
  },

  // ── ALLONGÉ SUR LE DOS / FACE ──────────────────────────────────────────────
  laying_front: {
    id: 'laying_front',
    name: 'Animations allongées de face (sur le dos)',
    defaultRotYOffset: Math.PI / 2,
    get animations() {
      return getAnimationsByTags(['laying_front']).map((d) => ({
        animation: d.path,
        rotYOffset: d.defaultRotYOffset ?? Math.PI / 2,
      }));
    },
  },

  // ── ALLONGÉ SUR LE CÔTÉ (Profil) ───────────────────────────────────────────
  laying_side: {
    id: 'laying_side',
    name: 'Animations allongées sur le côté',
    defaultRotYOffset: 0,
    get animations() {
      return getAnimationsByTags(['laying_side']).map((d) => ({
        animation: d.path,
        rotYOffset: d.defaultRotYOffset ?? 0,
      }));
    },
  },

  // ── TOUTES LES POSES ALLONGÉES ─────────────────────────────────────────────
  laying_pack: {
    id: 'laying_pack',
    name: 'Toutes les animations allongées',
    defaultRotYOffset: Math.PI / 2,
    get animations() {
      return getAnimationsByTags(['laying']).map((d) => ({
        animation: d.path,
        rotYOffset: d.defaultRotYOffset ?? Math.PI / 2,
      }));
    },
  },

  // ── TOUTES LES DANSES ──────────────────────────────────────────────────────
  all_dances: {
    id: 'all_dances',
    name: 'Toutes les danses',
    get animations() {
      return getAnimationsByTags(['dance']).map((d) => ({
        animation: d.path,
        rotYOffset: d.defaultRotYOffset ?? 0,
      }));
    },
  },
};

// ── Alias pratiques & rétrocompatibilité ─────────────────────────────────────
ANIMATION_PACKS['seated_front_pack'] = ANIMATION_PACKS['seated_front'];
ANIMATION_PACKS['seated_side_pack']  = ANIMATION_PACKS['seated_side'];
ANIMATION_PACKS['sitted_front_pack'] = ANIMATION_PACKS['seated_front'];
ANIMATION_PACKS['side_sitted_pack']  = ANIMATION_PACKS['seated_side'];
ANIMATION_PACKS['sitting_front']     = ANIMATION_PACKS['seated_front'];
ANIMATION_PACKS['sitting_side']      = ANIMATION_PACKS['seated_side'];
ANIMATION_PACKS['laying_front_pack'] = ANIMATION_PACKS['laying_front'];
ANIMATION_PACKS['laying_side_pack']  = ANIMATION_PACKS['laying_side'];
ANIMATION_PACKS['lay_front']         = ANIMATION_PACKS['laying_front'];
ANIMATION_PACKS['lay_side']          = ANIMATION_PACKS['laying_side'];
ANIMATION_PACKS['lay_front_pack']    = ANIMATION_PACKS['laying_front'];
ANIMATION_PACKS['lay_side_pack']     = ANIMATION_PACKS['laying_side'];

/**
 * Résout une animation aléatoire ou définie et son orientation finale (avec rotY offset si nécessaire)

 * pour un slot d'interaction donné.
 *
 * Dans un pack nommé, chaque entrée peut être :
 *   - une string  : 'animations/poses_idles/anim_laying.glb' ou un alias 'texting', 'sit_idle'
 *   - un objet    : { animation: 'animations/poses_idles/anim_laying.glb', rotYOffset: Math.PI / 2 }
 */
export function resolveSlotAnimation(slot: {
  animation?: string;
  rotY?: number;
  animations_random?: string | string[];
  availableAnims?: string[];
}): { animation: string; rotY: number } {
  const baseRotY = slot.rotY ?? 0;

  // 1. Pack nommé historique (ex: 'laying_pack', 'seated_front', ...)
  if (typeof slot.animations_random === 'string' && ANIMATION_PACKS[slot.animations_random]) {
    const pack = ANIMATION_PACKS[slot.animations_random];
    const item = pack.animations[Math.floor(Math.random() * pack.animations.length)];
    if (typeof item === 'string') {
      const resolvedPath = resolveAnimationPath(item);
      const def = getAnimationDef(item);
      return {
        animation: resolvedPath,
        rotY: baseRotY + (def?.defaultRotYOffset ?? pack.defaultRotYOffset ?? 0),
      };
    } else {
      const resolvedPath = resolveAnimationPath(item.animation);
      return {
        animation: resolvedPath,
        rotY: baseRotY + (item.rotYOffset ?? pack.defaultRotYOffset ?? 0),
      };
    }
  }

  // 2. Requête par tags ou alias via animations_random (ex: 'tag:sitting', ['tag:dance'], ou un tag direct)
  if (typeof slot.animations_random === 'string') {
    const queryResult = getRandomAnimationByQuery(slot.animations_random);
    if (queryResult) {
      return {
        animation: queryResult.animation,
        rotY: baseRotY + (queryResult.rotYOffset ?? 0),
      };
    }
  }

  // 3. Tableau direct de strings (ou tags) dans animations_random ou availableAnims
  const animList = Array.isArray(slot.animations_random)
    ? slot.animations_random
    : (slot.availableAnims && slot.availableAnims.length > 0 ? slot.availableAnims : null);

  if (animList && animList.length > 0) {
    const chosen = animList[Math.floor(Math.random() * animList.length)];
    const queryResult = getRandomAnimationByQuery(chosen);
    if (queryResult) {
      return {
        animation: queryResult.animation,
        rotY: baseRotY + (queryResult.rotYOffset ?? 0),
      };
    }
    return {
      animation: resolveAnimationPath(chosen),
      rotY: baseRotY,
    };
  }

  // 4. Animation unique spécifiée par alias, id ou chemin direct, ou fallback
  if (slot.animation) {
    const def = getAnimationDef(slot.animation);
    return {
      animation: def ? def.path : resolveAnimationPath(slot.animation),
      rotY: baseRotY + (def?.defaultRotYOffset ?? 0),
    };
  }

  return {
    animation: resolveAnimationPath('sitting_idle'),
    rotY: baseRotY,
  };
}

