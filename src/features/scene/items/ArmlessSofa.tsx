/**
 * ArmlessSofa.tsx — Canapé de jardin 100×60×100cm sans accoudoirs.
 * Coordonnées locales : X/Z centrés, Y=0 = sol.
 */
import { useLayoutEffect } from 'react';
import * as THREE from 'three';
import type { SceneModelProps } from '@shared/types';
import { glbLocalBBox } from '../glbUtils';
import { useGLTFClone, preloadSceneGLTF } from '../useGLTFClone';

const PATH = '/items/armless-sofa/armless-sofa.glb';
preloadSceneGLTF(PATH);

export function ArmlessSofa({ onSize }: SceneModelProps) {
  const { scene } = useGLTFClone(PATH);

  useLayoutEffect(() => {
    scene.scale.setScalar(100);
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.userData.birdPerch = true;
      }
    });
    const box = glbLocalBBox(scene);
    scene.position.set(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2);
    onSize?.(box.getSize(new THREE.Vector3()));
  }, [scene, onSize]);

  return <primitive object={scene} />;
}
