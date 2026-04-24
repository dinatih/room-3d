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

// Trou évier centré à X=-30 (côté placard)
// HOLE_CZ en Y-shape : rotateX(-π/2) → y_shape = -z_monde, donc +3 = -3 cm en Z monde
const HOLE_W = 28;
const HOLE_D = 44.6;
const HOLE_CX = -30; // local X du centre du trou
const HOLE_CZ =  4;  // décalage -3 cm en Z monde

const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25, metalness: 0.05 });

export function Counter({ onSize }: SceneItemProps) {
  const geo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-W / 2, -D / 2);
    shape.lineTo( W / 2, -D / 2);
    shape.lineTo( W / 2,  D / 2);
    shape.lineTo(-W / 2,  D / 2);
    shape.closePath();

    const R  = 5; // rayon des coins (cm)
    const hx = HOLE_CX, hz = HOLE_CZ;
    const hw = HOLE_W / 2, hd = HOLE_D / 2;
    const hole = new THREE.Path();
    hole.moveTo(hx - hw + R, hz - hd);
    hole.lineTo(hx + hw - R, hz - hd);
    hole.absarc(hx + hw - R, hz - hd + R, R, -Math.PI / 2, 0, false);
    hole.lineTo(hx + hw, hz + hd - R);
    hole.absarc(hx + hw - R, hz + hd - R, R, 0, Math.PI / 2, false);
    hole.lineTo(hx - hw + R, hz + hd);
    hole.absarc(hx - hw + R, hz + hd - R, R, Math.PI / 2, Math.PI, false);
    hole.lineTo(hx - hw, hz - hd + R);
    hole.absarc(hx - hw + R, hz - hd + R, R, Math.PI, Math.PI * 3 / 2, false);
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
