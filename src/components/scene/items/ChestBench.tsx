/**
 * ChestBench.tsx — Coffre banc YITAHOME 100 Gal (122×55×62cm).
 * Coordonnées locales : X/Z centrés, Y=0 = sol.
 * Placement monde dans Garden.tsx.
 */
import { useLayoutEffect } from 'react';
import * as THREE from 'three';
import type { SceneItemProps } from '../../../types';

const L = 122, W = 55, H = 62, LID_H = 3;

const cbMat    = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.6 });
const cbLidMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.5 });
const handleMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.4 });

export function ChestBench({ onSize }: SceneItemProps) {
  useLayoutEffect(() => {
    onSize(new THREE.Vector3(W, H, L));
  }, []);

  return (
    <group>
      <mesh position={[0, (H - LID_H) / 2, 0]} castShadow receiveShadow material={cbMat}>
        <boxGeometry args={[W, H - LID_H, L]} />
      </mesh>
      <mesh position={[0, H - LID_H / 2, 0]} castShadow material={cbLidMat}>
        <boxGeometry args={[W + 1.5, LID_H, L + 1.5]} />
      </mesh>
      {([-1, 1] as const).map(dz => (
        <mesh key={dz} position={[0, H * 0.55, dz * (L / 2 + 0.8)]} material={handleMat}>
          <boxGeometry args={[15, 3, 1.5]} />
        </mesh>
      ))}
    </group>
  );
}
