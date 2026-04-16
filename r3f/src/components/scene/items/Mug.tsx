/**
 * Mug.tsx — Mug rouge procédural.
 * Coordonnées locales : centré XZ, Y=0 = base.
 */
import { useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import type { SceneItemProps } from '../../../types';

const mugMat      = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.35 });
const mugInnerMat = new THREE.MeshStandardMaterial({ color: 0xf0e8dc, roughness: 0.5 });
const chocoMat    = new THREE.MeshStandardMaterial({ color: 0x6B4226, roughness: 0.6 });

export function Mug({ onSize }: SceneItemProps) {
  const groupRef = useRef<THREE.Group>(null!);

  const R = 4, H = 9.5, THICK = 0.4;
  const innerR = R - THICK;
  const innerH = H - THICK;

  useLayoutEffect(() => {
    groupRef.current.updateMatrixWorld(true);
    onSize(new THREE.Box3().setFromObject(groupRef.current).getSize(new THREE.Vector3()));
  }, []);

  return (
    <group ref={groupRef}>
      <mesh position={[0, H / 2, 0]} castShadow material={mugMat}>
        <cylinderGeometry args={[R, R * 0.92, H, 24, 1, true]} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} material={mugMat}>
        <circleGeometry args={[R * 0.92, 24]} />
      </mesh>
      <mesh position={[0, THICK + innerH / 2, 0]} material={mugInnerMat}>
        <cylinderGeometry args={[innerR, innerR * 0.92, innerH, 24, 1, true]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, H - 1.2, 0]} material={chocoMat}>
        <circleGeometry args={[innerR - 0.1, 24]} />
      </mesh>
      <mesh rotation={[0, 0, -Math.PI / 2]} position={[R, H * 0.48, 0]} castShadow material={mugMat}>
        <torusGeometry args={[2.2, 0.4, 8, 12, Math.PI]} />
      </mesh>
    </group>
  );
}
