/**
 * ArmlessSofa.tsx — Canapé de jardin 100×60×100cm sans accoudoirs.
 * Coordonnées locales : X=profondeur centré, Z=largeur centré, Y=0=sol.
 * Placement monde dans Garden.tsx.
 */
import { useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { SceneItemProps } from '@shared/types';

const W = 100, D = 60, H = 100, SEAT_H = 40, BACK_T = 10, R = 6;

const redMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.7 });

export function ArmlessSofa({ onSize }: SceneItemProps) {
  const seatGeo = useMemo(() => new RoundedBoxGeometry(W, SEAT_H, D, 3, R), []);
  const backGeo = useMemo(() => new RoundedBoxGeometry(W, H, BACK_T, 3, R), []);

  useLayoutEffect(() => {
    onSize(new THREE.Vector3(W, H, D));
  }, []);

  return (
    <group>
      <mesh geometry={seatGeo} material={redMat}
        position={[0, SEAT_H / 2, 0]} castShadow receiveShadow />
      <mesh geometry={backGeo} material={redMat}
        position={[0, H / 2, -D / 2 + BACK_T / 2 + 0.5]} castShadow />
    </group>
  );
}
