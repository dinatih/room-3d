/**
 * MannequinHead.tsx — Tête de mannequin (procédural).
 * Coordonnées locales : centré XZ, Y=0 = base épaules.
 */
import { useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import type { SceneItemProps } from '@shared/types';

const mannMat = new THREE.MeshStandardMaterial({ color: 0xf5f0eb, roughness: 0.5 });

export function MannequinHead({ onSize }: SceneItemProps) {
  const groupRef = useRef<THREE.Group>(null!);

  const SHOULDER_W = 41, SHOULDER_H = 8, SHOULDER_D = 22;
  const NECK_R = 4, NECK_H = 8;
  const HEAD_R = 8.9;

  useLayoutEffect(() => {
    groupRef.current.updateMatrixWorld(true);
    onSize(new THREE.Box3().setFromObject(groupRef.current).getSize(new THREE.Vector3()));
  }, []);

  return (
    <group ref={groupRef}>
      <mesh position={[0, SHOULDER_H / 2, 0]} castShadow material={mannMat}
        scale={[SHOULDER_W / 2, SHOULDER_H / 2, SHOULDER_D / 2]}>
        <sphereGeometry args={[1, 16, 8]} />
      </mesh>
      <mesh position={[0, SHOULDER_H + NECK_H / 2, 0]} castShadow material={mannMat}>
        <cylinderGeometry args={[NECK_R, NECK_R * 1.1, NECK_H, 12]} />
      </mesh>
      <mesh position={[0, SHOULDER_H + NECK_H + HEAD_R, 0]} castShadow material={mannMat}
        scale={[1, 1.15, 1]}>
        <sphereGeometry args={[HEAD_R, 16, 12]} />
      </mesh>
      <mesh position={[0, SHOULDER_H + NECK_H + HEAD_R, HEAD_R + 0.5]}
        rotation={[-Math.PI / 2, 0, 0]} material={mannMat}>
        <coneGeometry args={[1.2, 2.5, 6]} />
      </mesh>
    </group>
  );
}
