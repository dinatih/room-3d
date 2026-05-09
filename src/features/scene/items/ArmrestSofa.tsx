/**
 * ArmrestSofa.tsx — Canapé de jardin 160×60×90cm avec accoudoirs.
 * Coordonnées locales : X=profondeur centré, Z=largeur centré, Y=0=sol.
 * Placement monde dans Garden.tsx.
 */
import { useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { SceneItemProps } from '@shared/types';

const W = 160, D = 60, H = 90, SEAT_H = 40, BACK_T = 10, ARM_W = 10, ARM_H = 60, R = 6;

const redMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.7 });

export function ArmrestSofa({ onSize }: SceneItemProps) {
  const seatGeo = useMemo(() => new RoundedBoxGeometry(D, SEAT_H, W, 3, R), []);
  const backGeo = useMemo(() => new RoundedBoxGeometry(BACK_T, H, W, 3, R), []);
  const armGeo  = useMemo(() => new RoundedBoxGeometry(D, ARM_H, ARM_W, 3, R), []);

  useLayoutEffect(() => {
    onSize(new THREE.Vector3(D, H, W));
  }, []);

  return (
    <group>
      <mesh geometry={seatGeo} material={redMat}
        position={[0, SEAT_H / 2, 0]} castShadow receiveShadow />
      <mesh geometry={backGeo} material={redMat}
        position={[D / 2 - BACK_T / 2 - 0.5, H / 2, 0]} castShadow />
      {([-1, 1] as const).map(s => (
        <mesh key={s} geometry={armGeo} material={redMat}
          position={[0, ARM_H / 2, s * (W / 2 - ARM_W / 2)]} castShadow />
      ))}
    </group>
  );
}
