import type * as THREE from 'three';
import type { LaraVariant } from '../LaraVariants';
import type { CharacterConfig } from '../walkerConfig';

export interface WalkerProps {
  isPreview?: boolean;
  previewCharacterId?: string;
  previewHaircut?: string;
  previewHairColor?: string;
  characterIndex?: number;
  walkerAnim?: string;
  isPaused?: boolean;
  previewPosition?: [number, number, number];
  previewRotationY?: number;
}

export interface SingleCharacterProps extends WalkerProps {
  id: string;
  name: string;
  modelPath: string;
  isLara: boolean;
  targetHeight: number;
  isActive: boolean;
  animations: THREE.AnimationClip[];

  variant?: LaraVariant;
  isNPC?: boolean;
  npcPosition?: [number, number, number];
  npcRotationY?: number;
  sittingScene?: THREE.Group;
}

export type { CharacterConfig, LaraVariant };
