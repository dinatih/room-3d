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

export const ANIMATION_PACKS: Record<string, AnimationPackDef> = {
  // ── PACK ASSISE DE FACE (Orientation de base 0°) ───────────────────────────
  sitted_front_pack: {
    id: 'sitted_front_pack',
    name: 'Poses assises de face',
    defaultRotYOffset: 0,
    animations: [
      'animations/poses_idles/anim_sitting_idle.glb',
      'animations/poses_idles/anim_sitting_2.glb',
      'animations/poses_idles/anim_sitting_thumbs_up.glb',
      'animations/poses_idles/anim_sitting_talking_1.glb',
      'animations/poses_idles/anim_sitting_talking.glb',
      'animations/poses_idles/anim_sitting_laughing.glb',
      'animations/combat/anim_sitting_gun_motion.glb',
      'animations/poses_idles/anim_sitting_disbelief.glb',
      'animations/poses_idles/anim_sitting.glb',
      'animations/poses_idles/anim_male_sitting_pose_2.glb',
      'animations/poses_idles/anim_male_sitting_pose_1.glb',
      'animations/poses_idles/anim_female_sitting_pose.glb',
      'animations/poses_idles/anim_cheering_while_sitting.glb',
      'animations/poses_idles/miley_armature_sit_talk.glb',
      'animations/poses_idles/miley_armature_sit_look_up_laugh.glb',
    ],
  },

  // ── PACK ASSISE DE CÔTÉ (Orientation décalée de 90° / π/2) ────────────────
  side_sitted_pack: {
    id: 'side_sitted_pack',
    name: 'Poses assises de côté (90°)',
    defaultRotYOffset: Math.PI / 2, // Rotation de départ décalée de 90°
    animations: [
      'animations/poses_idles/anim_female_sitting_pose_1.glb',
      'animations/poses_idles/anim_female_sitting_pose_2.glb',
      'animations/poses_idles/anim_female_sitting_pose_3.glb',
    ],
  },
};

/**
 * Résout une animation aléatoire ou définie et son orientation finale (avec rotY offset si nécessaire)
 * pour un slot d'interaction donné.
 */
export function resolveSlotAnimation(slot: {
  animation?: string;
  rotY: number;
  animations_random?: string | string[];
  availableAnims?: string[];
}): { animation: string; rotY: number } {
  const baseRotY = slot.rotY;

  // 1. Pack nommé (ex: 'sitted_front_pack' ou 'side_sitted_pack')
  if (typeof slot.animations_random === 'string' && ANIMATION_PACKS[slot.animations_random]) {
    const pack = ANIMATION_PACKS[slot.animations_random];
    const item = pack.animations[Math.floor(Math.random() * pack.animations.length)];
    if (typeof item === 'string') {
      return {
        animation: item,
        rotY: baseRotY + (pack.defaultRotYOffset ?? 0),
      };
    } else {
      return {
        animation: item.animation,
        rotY: baseRotY + (item.rotYOffset ?? pack.defaultRotYOffset ?? 0),
      };
    }
  }

  // 2. Tableau direct d'animations dans animations_random ou availableAnims
  const animList = Array.isArray(slot.animations_random)
    ? slot.animations_random
    : (slot.availableAnims && slot.availableAnims.length > 0 ? slot.availableAnims : null);

  if (animList && animList.length > 0) {
    const chosen = animList[Math.floor(Math.random() * animList.length)];
    return {
      animation: chosen,
      rotY: baseRotY,
    };
  }

  // 3. Animation unique spécifiée ou fallback sitting idle
  return {
    animation: slot.animation || 'animations/poses_idles/anim_sitting_idle.glb',
    rotY: baseRotY,
  };
}
