import type * as THREE from 'three';

export const FISHEYE_CANVAS_SIZE = 640;

export const ceilingCameraFeed: {
  canvas: HTMLCanvasElement | null;
  cameraGroup: THREE.Object3D | null;
} = {
  canvas: null,
  cameraGroup: null,
};
