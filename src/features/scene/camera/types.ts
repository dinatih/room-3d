export type CameraMode = 'orbit' | 'follow' | 'fpv' | 'top' | 'ortho';

export type CameraTarget =
  | 'studio'
  | 'character'
  | 'charactersGrid'
  | 'inventoryObjectGrid'
  | 'dog'
  | 'cat'
  | 'plane'
  | 'bird';

export type OrbitMouseMode = 'rotate' | 'translate';

export type CameraMovement = 'fix' | 'orbit' | 'follow';

export interface FollowPosition {
  x: number;
  y: number;
  z: number;
}

