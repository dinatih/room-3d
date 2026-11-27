import * as THREE from 'three';
import { VARIANT_ALIGNMENT_KEY } from '../animations/variantAlignment';
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
  const { scene, animations } = gltf;
  // The playback origin applies the manifest alignment after retargeting.
  const alignment = scene.children.find(node => node.userData[VARIANT_ALIGNMENT_KEY] === true);
  if (alignment) {
    scene.add(...alignment.children);
    scene.remove(alignment);
  }
  return { scene, animations };
}
