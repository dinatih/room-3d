/**
 * MeubleT.tsx — Meuble TV BESTÅ en T (procédural).
 * Coordonnées locales : centré XZ, Y=0 = base du meuble.
 * Placement scène (sur Kallax SE, contre mur B) dans Decor.tsx.
 */
import { useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import type { SceneItemProps } from '@shared/types';

const woodMat       = new THREE.MeshStandardMaterial({ color: 0xc8a46e, roughness: 0.85 });
const whitePlanMat  = new THREE.MeshStandardMaterial({ color: 0xf5f0e8, roughness: 0.85 });

const W = 22.5, H = 55, D = 27.5, T = 1.5;
const PL = 80, PT = 3.7, PD = 23.5;
const plankY = 33 + PT / 2;
const plankZ = -D / 2 + PD / 2;

export function MeubleT({ onSize }: SceneItemProps) {
  const groupRef = useRef<THREE.Group>(null!);

  useLayoutEffect(() => {
    groupRef.current.updateMatrixWorld(true);
    onSize(new THREE.Box3().setFromObject(groupRef.current).getSize(new THREE.Vector3()));
  }, []);

  return (
    <group ref={groupRef}>
      {/* Dessus */}
      <mesh position={[0, H - T / 2, 0]} castShadow receiveShadow material={woodMat}>
        <boxGeometry args={[W, T, D]} />
      </mesh>
      {/* Dessous */}
      <mesh position={[0, T / 2, 0]} castShadow receiveShadow material={woodMat}>
        <boxGeometry args={[W, T, D]} />
      </mesh>
      {/* Côté gauche */}
      <mesh position={[-W / 2 + T / 2, H / 2, 0]} castShadow receiveShadow material={woodMat}>
        <boxGeometry args={[T, H, D]} />
      </mesh>
      {/* Côté droit */}
      <mesh position={[W / 2 - T / 2, H / 2, 0]} castShadow receiveShadow material={woodMat}>
        <boxGeometry args={[T, H, D]} />
      </mesh>
      {/* Planche blanche horizontale */}
      <mesh position={[0, plankY, plankZ]} castShadow material={whitePlanMat}>
        <boxGeometry args={[PL, PT, PD]} />
      </mesh>
    </group>
  );
}
