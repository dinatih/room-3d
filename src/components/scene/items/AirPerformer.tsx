/**
 * AirPerformer.tsx — Purificateur d'air Philips Air Performer.
 * Coordonnées locales : X/Z centrés, Y=0 = sol.
 * Placement monde dans Decor.tsx.
 */
import { useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { SceneItemProps } from '@shared/types';

const BASE_R = 12.5, BASE_H = 35;
const TOWER_H = 70, TOWER_R = 10, HOLE_R = 6;
const TOTAL_H = BASE_H + TOWER_H;

const darkMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.7, side: THREE.DoubleSide });

export function AirPerformer({ onSize }: SceneItemProps) {
  const towerGeo = useMemo(() => {
    const h = TOWER_H, r = TOWER_R, holeR = HOLE_R;
    const shape = new THREE.Shape();
    shape.absarc(0, h - r, r, Math.PI, 0, true);
    shape.absarc(0, r, r, 0, Math.PI, true);

    const hole = new THREE.Path();
    hole.absarc(0, h - 20 - holeR + 10, holeR, Math.PI, 0, true);
    hole.absarc(0, holeR + 10, holeR, 0, Math.PI, true);
    shape.holes.push(hole);

    return new THREE.ExtrudeGeometry(shape, { depth: 10, bevelEnabled: false });
  }, []);

  useLayoutEffect(() => {
    onSize(new THREE.Vector3(BASE_R * 2, TOTAL_H, BASE_R * 2));
  }, []);

  return (
    <group>
      {/* Base cylindrique */}
      <mesh position={[0, BASE_H / 2, 0]} material={darkMat}>
        <cylinderGeometry args={[BASE_R, BASE_R, BASE_H, 32]} />
      </mesh>
      {/* Tour */}
      <mesh geometry={towerGeo} material={darkMat} position={[0, BASE_H, -5]} />
    </group>
  );
}
