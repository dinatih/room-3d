/**
 * Phone.tsx — Téléphone OnePlus Nord 4.
 * Coordonnées locales : X/Z centrés, Y=0 = surface du bureau.
 * Placement monde dans LaptopDesk.tsx.
 */
import { useLayoutEffect } from 'react';
import * as THREE from 'three';
import type { SceneItemProps } from '../../../types';

const W = 7.5, D = 16.2, H = 0.8;

const caseMat     = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.4 });
const phoneScrMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.05, metalness: 0.3, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
const camMat      = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.6, roughness: 0.2 });

export function Phone({ onSize }: SceneItemProps) {
  useLayoutEffect(() => {
    onSize(new THREE.Vector3(W, H, D));
  }, []);

  return (
    <group>
      <mesh position={[0, H / 2, 0]} castShadow material={caseMat}>
        <boxGeometry args={[W, H, D]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, H + 0.01, 0]} material={phoneScrMat}>
        <planeGeometry args={[W - 0.6, D - 0.8]} />
      </mesh>
      <mesh position={[0, -0.01, -D / 2 + 3]} material={camMat}>
        <boxGeometry args={[3, 0.2, 3.5]} />
      </mesh>
    </group>
  );
}
