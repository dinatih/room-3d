/**
 * LackShelf.tsx — Étagère LACK IKEA (procédural, blanc).
 * Coordonnées locales : centré XZ, Y=0 = bas de l'étagère.
 */
import { useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import type { SceneItemProps } from '../../../types';

const lackMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.3 });

export function LackShelf({ onSize }: SceneItemProps) {
  const groupRef = useRef<THREE.Group>(null!);

  useLayoutEffect(() => {
    groupRef.current.updateMatrixWorld(true);
    onSize(new THREE.Box3().setFromObject(groupRef.current).getSize(new THREE.Vector3()));
  }, []);

  return (
    <group ref={groupRef}>
      <mesh position={[0, 2.5, 0]} castShadow receiveShadow material={lackMat}>
        <boxGeometry args={[110, 5, 26]} />
      </mesh>
    </group>
  );
}
