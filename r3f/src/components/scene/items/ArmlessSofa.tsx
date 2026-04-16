/**
 * ArmlessSofa.tsx — Canapé de jardin 100×60×100cm sans accoudoirs.
 * Coordonnées locales : X=profondeur centré, Z=largeur centré, Y=0=sol.
 * Placement monde dans Garden.tsx.
 */
import { useLayoutEffect } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { SceneItemProps } from '../../../types';

const W = 100, D = 60, H = 100, SEAT_H = 40, BACK_T = 10, R = 6;

const redMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.7 });

export function ArmlessSofa({ onSize }: SceneItemProps) {
  useLayoutEffect(() => {
    onSize(new THREE.Vector3(D, H, W));
  }, []);

  return (
    <group>
      <RoundedBox args={[D, SEAT_H, W]} radius={R} smoothness={3}
        position={[0, SEAT_H / 2, 0]} castShadow receiveShadow material={redMat} />
      <RoundedBox args={[BACK_T, H, W]} radius={R} smoothness={3}
        position={[D / 2 - BACK_T / 2, H / 2, 0]} castShadow material={redMat} />
    </group>
  );
}
