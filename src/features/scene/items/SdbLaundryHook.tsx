import { useLayoutEffect } from 'react';
import * as THREE from 'three';
import type { SceneModelProps } from '@shared/types';

export const LAUNDRY_HOOK_HEIGHT = 10;
export const LAUNDRY_HOOK_GRIP_HEIGHT = 1.2;
const metal = new THREE.MeshStandardMaterial({ color: 0xb7b9bb, metalness: 0.8, roughness: 0.3 });

/** Small J hook with a circular fixing plate; upper face at local Y=10 cm. */
export function SdbLaundryHook({ onSize }: SceneModelProps) {
  useLayoutEffect(() => { onSize?.(new THREE.Vector3(4.3, LAUNDRY_HOOK_HEIGHT, 4)); }, [onSize]);
  return <group>
    <mesh position={[0, 9.7, 0]} material={metal}>
      <cylinderGeometry args={[2, 2, 0.6, 16]} />
    </mesh>
    <mesh position={[0, 7, 0]} material={metal}>
      <cylinderGeometry args={[0.4, 0.4, 4.8, 10]} />
    </mesh>
    <mesh position={[0, 2.6, 0]} rotation-z={-Math.PI / 2} material={metal}>
      <torusGeometry args={[1.8, 0.35, 6, 20, Math.PI * 1.5]} />
    </mesh>
  </group>;
}
