/**
 * SingleCharacter.tsx — Façade de ré-export pour le module character/
 * Maintient la rétrocompatibilité complète avec le reste du projet.
 */

export {
  SingleCharacter,
  GroundPoint,
  HeartParachute,
  updateCharacterLayers,
  cacheDynamicGLTF,
  cacheRetargetedClip,
  useCharacterAnimations,
  useCharacterPhysics
} from './character';

export type {
  WalkerProps,
  SingleCharacterProps,
  CharacterConfig,
  LaraVariant
} from './character';

export { CHARACTERS, ACCESSORIES_MESH_NAMES, isCharacterVisibleInMode } from './walkerConfig';
export { isHeadMesh } from './characterParts';
export { WALKER_ANIM_OPTIONS } from './animOptions';
