/**
 * Plan de travail cuisine — géométrie fidèle à Kitchen.tsx.
 * Dalle blanche avec trou rectangulaire pour l'évier BOHOLMEN.
 * Local coords : centré XZ, Y=0=dessous, Y=SLAB=dessus.
 */
import { useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { SceneItemProps } from '../../../types';

const W    = 102;   // KIT_W + 2
const D    = 62;    // KIT_D + 2
const SLAB = 3;

// Trou évier centré à X=-30 (côté placard), Z=0 — même position que Kitchen.tsx
const HOLE_W = 28;
const HOLE_D = 44.6;
const HOLE_CX = -30; // local X du centre du trou

const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25, metalness: 0.05 });

export function Counter({ onSize }: SceneItemProps) {
  const geo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-W / 2, -D / 2);
    shape.lineTo( W / 2, -D / 2);
    shape.lineTo( W / 2,  D / 2);
    shape.lineTo(-W / 2,  D / 2);
    shape.closePath();

    const hole = new THREE.Path();
    hole.moveTo(HOLE_CX - HOLE_W / 2, -HOLE_D / 2);
    hole.lineTo(HOLE_CX + HOLE_W / 2, -HOLE_D / 2);
    hole.lineTo(HOLE_CX + HOLE_W / 2,  HOLE_D / 2);
    hole.lineTo(HOLE_CX - HOLE_W / 2,  HOLE_D / 2);
    hole.closePath();
    shape.holes.push(hole);

    const g = new THREE.ExtrudeGeometry(shape, { depth: SLAB, bevelEnabled: false });
    g.rotateX(-Math.PI / 2);
    // After rotateX: shape XY → XZ, extrusion along +Y (0 → SLAB)
    return g;
  }, []);

  useLayoutEffect(() => {
    onSize(new THREE.Vector3(W, SLAB, D));
  }, []);

  return <mesh geometry={geo} material={mat} castShadow receiveShadow />;
}
