import type * as THREE from 'three';
import type { LaraVariant } from '../LaraVariants';
import type { CharacterConfig } from '../characterConfig';
import type { DuoAnimationDef } from '../animations/duoAnimations';

export interface CharacterGroupProps {
  isPreview?: boolean;
  previewCharacterId?: string;
  previewHaircut?: string;
  previewHairColor?: string;
  characterIndex?: number;
  totalCharacters?: number;
  walkerAnim?: string;
  isPaused?: boolean;
  previewPosition?: [number, number, number];
  previewRotationY?: number;
  duoAnimDef?: DuoAnimationDef;
  duoPartnerId?: string;
  isDuoRoleB?: boolean;
}

export interface CharacterProps extends CharacterGroupProps {
  id: string;
  name: string;
  modelPath: string;
  isLara: boolean;
  targetHeight: number;
  isActive: boolean;
  animations?: THREE.AnimationClip[];

  variant?: LaraVariant;
  isNPC?: boolean;
  npcPosition?: [number, number, number];
  npcRotationY?: number;
  sittingScene?: THREE.Group;
}

export type { CharacterConfig, LaraVariant };
