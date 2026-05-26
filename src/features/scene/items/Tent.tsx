/**
 * Tent.tsx — Tente Quechua 2 Seconds Easy 2P (ref 8784754) procédurale, dépliée.
 * Encombrement : 140×200×100cm. Toile verte.
 * Coordonnées locales : X/Z centrés, Y=0 = sol. Porte côté +Z.
 * Placement monde dans Placements.tsx (Garden).
 */
import { useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { SceneItemProps } from '@shared/types';

// ── Dimensions ───────────────────────────────────────────────────────────────
const W        = 140;  // largeur X
const D        = 200;  // profondeur Z
const H        = 100;  // hauteur Y
const FLOOR_T  = 1.2;

// ── Couleurs / matériaux Quechua ─────────────────────────────────────────────
const matFly = new THREE.MeshStandardMaterial({
  color: 0x2f6b32, roughness: 0.82, metalness: 0.04, side: THREE.DoubleSide,
});
const matPole  = new THREE.MeshStandardMaterial({ color: 0xe2e2e2, roughness: 0.4, metalness: 0.55 });

// ── Géométrie : superellipsoïde aplati (dôme Quechua) ────────────────────────
function buildSuperdome(
  w: number, d: number, h: number,
  n = 2.2, segX = 28, segZ = 36,
): THREE.BufferGeometry {
  const verts: number[] = [];
  const inds: number[] = [];
  for (let j = 0; j <= segZ; j++) {
    const z = THREE.MathUtils.lerp(-d / 2, d / 2, j / segZ);
    for (let i = 0; i <= segX; i++) {
      const x = THREE.MathUtils.lerp(-w / 2, w / 2, i / segX);
      const nx = Math.abs(x / (w / 2));
      const nz = Math.abs(z / (d / 2));
      const k = 1 - Math.pow(nx, n) - Math.pow(nz, n);
      const y = k > 0 ? h * Math.pow(k, 1 / n) : 0;
      verts.push(x, y, z);
    }
  }
  for (let j = 0; j < segZ; j++) {
    for (let i = 0; i < segX; i++) {
      const a = j * (segX + 1) + i;
      const b = a + 1;
      const c = a + (segX + 1);
      const d2 = c + 1;
      inds.push(a, c, b, b, c, d2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  g.setIndex(inds);
  g.computeVertexNormals();
  return g;
}

// ── Géométrie : arche tubulaire (corner→corner via apex parabolique) ─────────
function buildArchTube(
  p0: THREE.Vector3, p1: THREE.Vector3, apexY: number,
  radius = 0.7, samples = 28,
): THREE.BufferGeometry {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const x = THREE.MathUtils.lerp(p0.x, p1.x, t);
    const z = THREE.MathUtils.lerp(p0.z, p1.z, t);
    const y = apexY * 4 * t * (1 - t);
    pts.push(new THREE.Vector3(x, y, z));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  return new THREE.TubeGeometry(curve, 48, radius, 10, false);
}

// ── Composant ────────────────────────────────────────────────────────────────
export function Tent({ onSize }: SceneItemProps) {
  const geos = useMemo(() => {
    // Dôme principal (couchage)
    const dome = buildSuperdome(W, D, H, 2.15, 28, 36);
    dome.translate(0, FLOOR_T, 0);

    // Arches : deux mâts croisés en X, coin à coin du couchage
    const cNW = new THREE.Vector3(-W / 2 + 4, FLOOR_T, -D / 2 + 4);
    const cNE = new THREE.Vector3( W / 2 - 4, FLOOR_T, -D / 2 + 4);
    const cSW = new THREE.Vector3(-W / 2 + 4, FLOOR_T,  D / 2 - 4);
    const cSE = new THREE.Vector3( W / 2 - 4, FLOOR_T,  D / 2 - 4);
    const apex = H + 1.5;
    const arch1 = buildArchTube(cNW, cSE, apex);
    const arch2 = buildArchTube(cNE, cSW, apex);

    return {
      dome, arch1, arch2
    };
  }, []);

  useLayoutEffect(() => {
    onSize(new THREE.Vector3(W, H, D));
  }, []);

  return (
    <group>
      {/* Toile principale */}
      <mesh geometry={geos.dome} material={matFly} castShadow receiveShadow />

      {/* Arches croisées (mâts) — surfaces externes des poteaux */}
      <mesh geometry={geos.arch1} material={matPole} castShadow />
      <mesh geometry={geos.arch2} material={matPole} castShadow />

    </group>
  );
}
