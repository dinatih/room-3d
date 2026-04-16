/**
 * Fniss.tsx — Corbeille FNISS IKEA (procédural, blanc).
 * Coordonnées locales : centré XZ, Y=0 = base.
 */
import { useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import type { SceneItemProps } from '../../../types';

const fnMat      = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.4 });
const fnInnerMat = new THREE.MeshStandardMaterial({ color: 0xe0e0e0, roughness: 0.3, side: THREE.BackSide });

const R_TOP = 14, R_BOT = 9.5, H = 28, T = 0.6;

export function Fniss({ onSize }: SceneItemProps) {
  const groupRef = useRef<THREE.Group>(null!);

  useLayoutEffect(() => {
    groupRef.current.updateMatrixWorld(true);
    onSize(new THREE.Box3().setFromObject(groupRef.current).getSize(new THREE.Vector3()));
  }, []);

  return (
    <group ref={groupRef}>
      <mesh position={[0, H / 2, 0]} castShadow material={fnMat}>
        <cylinderGeometry args={[R_TOP, R_BOT, H, 24, 1, true]} />
      </mesh>
      <mesh position={[0, H / 2, 0]} material={fnInnerMat}>
        <cylinderGeometry args={[R_TOP - T, R_BOT - T, H, 24, 1, true]} />
      </mesh>
      <mesh position={[0, 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]} material={fnMat}>
        <circleGeometry args={[R_BOT - T, 24]} />
      </mesh>
      <mesh position={[0, H, 0]} rotation={[Math.PI / 2, 0, 0]} material={fnMat}>
        <torusGeometry args={[R_TOP - T / 2, T, 8, 24]} />
      </mesh>
    </group>
  );
}
