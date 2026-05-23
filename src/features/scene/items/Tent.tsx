/**
 * Tent.tsx — Tente Quechua 2 Seconds Easy 2P (ref 8784754) procédurale, dépliée.
 * Encombrement compact : 140×200×100cm (vestibule +Z inclus). Toile verte.
 * Coordonnées locales : X/Z centrés, Y=0 = sol. Vestibule côté +Z, porte côté +Z.
 * Placement monde dans Placements.tsx (Garden).
 */
import { useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { SceneItemProps } from '@shared/types';

// ── Dimensions ───────────────────────────────────────────────────────────────
const W        = 140;            // largeur X (totale)
const D_SLEEP  = 170;            // profondeur couchage Z
const VEST     = 30;             // vestibule avant (Z+)
const D_TOTAL  = D_SLEEP + VEST; // 200
const H        = 100;            // hauteur Y
const FLOOR_T  = 1.2;

// Décalage : on centre l'emprise totale en (0,0). Le dôme principal est donc
// décalé en Z de -VEST/2, et le vestibule est devant (Z+).
const DOME_CZ  = -VEST / 2;
const VEST_CZ  =  D_SLEEP / 2 + DOME_CZ; // = D_SLEEP/2 - VEST/2

// ── Couleurs / matériaux Quechua ─────────────────────────────────────────────
const matFly = new THREE.MeshStandardMaterial({
  color: 0x2f6b32, roughness: 0.82, metalness: 0.04, side: THREE.DoubleSide,
});
const matFlyVest = new THREE.MeshStandardMaterial({
  color: 0x255627, roughness: 0.82, metalness: 0.04, side: THREE.DoubleSide,
});
const matFloor = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.95 });
const matPole  = new THREE.MeshStandardMaterial({ color: 0xe2e2e2, roughness: 0.4, metalness: 0.55 });
const matMesh  = new THREE.MeshStandardMaterial({
  color: 0x202428, roughness: 0.9, transparent: true, opacity: 0.55, side: THREE.DoubleSide,
});
const matZip   = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5, metalness: 0.7 });
const matLogo  = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 });

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
    const dome = buildSuperdome(W, D_SLEEP, H, 2.15, 28, 36);
    dome.translate(0, FLOOR_T, DOME_CZ);

    // Vestibule : petit dôme aplati à l'avant. Sa moitié arrière s'enfonce
    // dans le dôme principal — masquée par occlusion.
    const vest = buildSuperdome(W * 0.82, VEST * 2.4, H * 0.62, 2.4, 18, 22);
    vest.translate(0, FLOOR_T, VEST_CZ);

    // Floor / tapis de sol (couchage uniquement)
    const floor = new THREE.BoxGeometry(W - 4, FLOOR_T, D_SLEEP - 4);

    // Arches : deux mâts croisés en X, coin à coin du couchage
    const cNW = new THREE.Vector3(-W / 2 + 4, FLOOR_T, DOME_CZ - D_SLEEP / 2 + 4);
    const cNE = new THREE.Vector3( W / 2 - 4, FLOOR_T, DOME_CZ - D_SLEEP / 2 + 4);
    const cSW = new THREE.Vector3(-W / 2 + 4, FLOOR_T, DOME_CZ + D_SLEEP / 2 - 4);
    const cSE = new THREE.Vector3( W / 2 - 4, FLOOR_T, DOME_CZ + D_SLEEP / 2 - 4);
    const apex = H + 1.5;
    const arch1 = buildArchTube(cNW, cSE, apex);
    const arch2 = buildArchTube(cNE, cSW, apex);

    // Porte arc (panneau moustiquaire) — face avant du dôme couchage
    const doorShape = new THREE.Shape();
    const dW = W * 0.42, dH = H * 0.78;
    doorShape.moveTo(-dW / 2, 0);
    doorShape.lineTo(-dW / 2, dH * 0.45);
    doorShape.bezierCurveTo(-dW / 2, dH, dW / 2, dH, dW / 2, dH * 0.45);
    doorShape.lineTo(dW / 2, 0);
    doorShape.lineTo(-dW / 2, 0);
    const door = new THREE.ShapeGeometry(doorShape, 24);
    // plaquée juste devant la face avant du dôme couchage
    door.translate(0, FLOOR_T + 0.2, DOME_CZ + D_SLEEP / 2 - 1.5);

    // Fermeture éclair (zip) : 2 segments verticaux sur l'arc porte
    const zipL = new THREE.BoxGeometry(0.6, dH * 0.9, 0.15);
    zipL.translate(-1.2, FLOOR_T + dH * 0.45, DOME_CZ + D_SLEEP / 2 - 1.0);
    const zipR = new THREE.BoxGeometry(0.6, dH * 0.9, 0.15);
    zipR.translate(1.2, FLOOR_T + dH * 0.45, DOME_CZ + D_SLEEP / 2 - 1.0);

    // Logo Quechua patch (petit rectangle blanc)
    const logo = new THREE.BoxGeometry(14, 4, 0.1);
    logo.translate(0, H * 0.75, DOME_CZ + D_SLEEP / 2 - 2.5);

    return {
      dome, vest, floor, arch1, arch2,
      door, zipL, zipR, logo,
    };
  }, []);

  useLayoutEffect(() => {
    onSize(new THREE.Vector3(W, H, D_TOTAL));
  }, []);

  return (
    <group>
      {/* Tapis de sol */}
      <mesh geometry={geos.floor} material={matFloor} receiveShadow
            position={[0, FLOOR_T / 2, DOME_CZ]} />

      {/* Toile principale + vestibule */}
      <mesh geometry={geos.dome} material={matFly} castShadow receiveShadow />
      <mesh geometry={geos.vest} material={matFlyVest} castShadow receiveShadow />

      {/* Arches croisées (mâts) — surfaces externes des poteaux */}
      <mesh geometry={geos.arch1} material={matPole} castShadow />
      <mesh geometry={geos.arch2} material={matPole} castShadow />

      {/* Panneau porte moustiquaire + zip + logo */}
      <mesh geometry={geos.door} material={matMesh} />
      <mesh geometry={geos.zipL} material={matZip} />
      <mesh geometry={geos.zipR} material={matZip} />
      <mesh geometry={geos.logo} material={matLogo} />
    </group>
  );
}
