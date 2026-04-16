/**
 * ArmrestSofa.tsx — Canapé de jardin 160×60×90cm avec accoudoirs.
 * Coordonnées locales : X=profondeur centré, Z=largeur centré, Y=0=sol.
 * Placement monde dans Garden.tsx.
 */
import { useLayoutEffect } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { SceneItemProps } from '../../../types';

const W = 160, D = 60, H = 90, SEAT_H = 40, BACK_T = 10, ARM_W = 10, ARM_H = 60, R = 6;

const redMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.7 });

export function ArmrestSofa({ onSize }: SceneItemProps) {
  useLayoutEffect(() => {
    onSize(new THREE.Vector3(D, H, W));
  }, []);

  return (
    <group>
      <RoundedBox args={[D, SEAT_H, W]} radius={R} smoothness={3}
        position={[0, SEAT_H / 2, 0]} castShadow receiveShadow material={redMat} />
      <RoundedBox args={[BACK_T, H, W]} radius={R} smoothness={3}
        position={[D / 2 - BACK_T / 2, H / 2, 0]} castShadow material={redMat} />
      {([-1, 1] as const).map(s => (
        <RoundedBox key={s} args={[D, ARM_H, ARM_W]} radius={R} smoothness={3}
          position={[0, ARM_H / 2, s * (W / 2 - ARM_W / 2)]} castShadow material={redMat} />
      ))}
    </group>
  );
}
