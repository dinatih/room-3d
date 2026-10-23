import type { CameraSubjectId } from './cameraSubjects';

export type CameraMode = 'orbit' | 'follow' | 'fpv' | 'top' | 'iso';

export type ArrowControl = 'camera' | 'character';

export interface CameraZoomDetail {
  direction: 'in' | 'out';
  scope: 'scene' | 'preview';
  /** Fraction d'un clic pour les boutons de zoom amortis. */
  amount?: number;
}

export type CameraTarget =
  | CameraSubjectId
  | 'studio'
  | 'charactersGrid'
  | 'inventoryObjectGrid'
  | 'dog'
  | 'plane'
  | 'bird';

export type OrbitMouseMode = 'rotate' | 'translate';

export type CameraMovement = 'fix' | 'orbit' | 'follow';

export interface FollowPosition {
  x: number;
  y: number;
  z: number;
}

