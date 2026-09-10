/**
 * ChestBench.tsx — Coffre banc YITAHOME 100 Gal (122×55×62cm).
 * Coordonnées locales : X/Z centrés, Y=0 = sol.
 * Placement monde dans Garden.tsx.
 */
import { useLayoutEffect } from 'react';
import * as THREE from 'three';
import type { SceneItemProps } from '@shared/types';

const L = 122, W = 55, H = 62, LID_H = 3;

const cbMat    = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.6 });
const cbLidMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.5 });
const handleMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.4 });

export function ChestBench({ onSize }: SceneItemProps) {
  useLayoutEffect(() => {
    onSize(new THREE.Vector3(L, H, W));
  }, []);

  return (
    <group>
      <mesh position={[0, (H - LID_H) / 2, 0]} castShadow receiveShadow material={cbMat}>
        <boxGeometry args={[L, H - LID_H, W]} />
      </mesh>
      <mesh position={[0, H - LID_H / 2, 0]} castShadow material={cbLidMat}>
        <boxGeometry args={[L + 1.5, LID_H, W + 1.5]} />
      </mesh>
      {([-1, 1] as const).map(dx => (
        <mesh key={dx} position={[dx * (L / 2 + 0.8), H * 0.55, 0]} material={handleMat}>
          <boxGeometry args={[1.5, 3, 15]} />
        </mesh>
      ))}
    </group>
  );
}
