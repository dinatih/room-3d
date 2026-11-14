import { useLayoutEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { glbLocalBBox, mergeGlbByMaterial, removeGlbLines } from '../glbUtils';
import { useGLTFClone, preloadSceneGLTF } from '../useGLTFClone';
import { isAppIdle } from '../idleState';
import type { SceneModelProps } from '@shared/types';

const PATH = '/items/heart-earbuds-red/HeartEarbudsRed.glb';
preloadSceneGLTF(PATH);

/**
 * Écouteurs Bluetooth sans fil en forme de cœur (Rouge) + boîtier de charge LED.
 * Les LEDs des cœurs alternent lentement toutes les couleurs (cycle HSL).
 */
export function HeartEarbudsRed({ onSize }: SceneModelProps) {
  const { scene } = useGLTFClone(PATH);
  const ledMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const { invalidate } = useThree();

  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);
    removeGlbLines(scene);
    scene.scale.setScalar(100);
    mergeGlbByMaterial(scene);
    const box = glbLocalBBox(scene);
    scene.position.set(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2);

    ledMatRef.current = null;
    scene.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mat = mesh.material as THREE.MeshStandardMaterial | undefined;
      if (mat?.name === 'LedBlue') {
        const cloned = mat.clone();
        mesh.material = cloned;
        ledMatRef.current = cloned;
      }
    });

    onSize?.(box.getSize(new THREE.Vector3()));
  }, [scene, onSize]);

  useFrame(({ clock }) => {
    if (isAppIdle() || !ledMatRef.current) return;
    const hue = (clock.elapsedTime * 0.12) % 1;
    ledMatRef.current.color.setHSL(hue, 1, 0.55);
    ledMatRef.current.emissive.setHSL(hue, 1, 0.55);
    invalidate();
  });

  return <group><primitive object={scene} /></group>;
}
