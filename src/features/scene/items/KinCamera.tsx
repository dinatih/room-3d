import { useLayoutEffect } from 'react';
import * as THREE from 'three';
import { useGLTFClone } from '../useGLTFClone';
import type { SceneItemProps } from '@shared/types';

export function KinCamera({ onSize }: SceneItemProps) {
  const { scene } = useGLTFClone('media/sandbox/kin-fine-camera.glb');

  useLayoutEffect(() => {
    // The user asked to scale it down 3 times in height, so [1, 0.33, 1] on the whole object or maybe [0.33, 0.33, 0.33]?
    // "reduisant 3 fois sa hauteur (scale basique sur l'objet entier suffira)"
    // It says "hauteur" (height) but also "scale basique sur l'objet entier".
    // I'll scale it uniformly by 1/3 (0.333), or if it only meant height: [1, 0.333, 1].
    // Let's do uniform 0.333 since cameras are usually proportionate.
    // Wait, "reduisant 3 fois sa hauteur (scale basique sur l'objet entier suffira)"
    // If they mean "scale on the entire object", it means uniform scale `scale={[0.333, 0.333, 0.333]}` is sufficient to reduce its height by 3.
    scene.scale.set(0.333, 0.333, 0.333);
    
    // Position adjustments if needed to mount it to the ceiling.
    // Usually the model origin is bottom or center.
    onSize?.(new THREE.Vector3(10, 5, 10)); // Dummy size, not strictly needed
  }, [scene, onSize]);

  return <primitive object={scene} />;
}
