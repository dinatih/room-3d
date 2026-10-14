import * as THREE from 'three';
import type { GLTF, GLTFLoaderPlugin } from 'three/examples/jsm/loaders/GLTFLoader.js';

/** Keep node transforms and joints without decoding unused models and textures. */
export const animationSourcePlugin = (): GLTFLoaderPlugin => ({
  name: 'AnimationSource',
  loadMesh: () => Promise.resolve(new THREE.Group()),
});

export interface AnimationSource {
  scene: THREE.Object3D;
  animations: THREE.AnimationClip[];
}

/** Drop the parser and its binary dependencies after loading the skeletal source. */
export function extractAnimationSource(gltf: Pick<GLTF, 'scene' | 'animations'>): AnimationSource {
  return { scene: gltf.scene, animations: gltf.animations };
}
