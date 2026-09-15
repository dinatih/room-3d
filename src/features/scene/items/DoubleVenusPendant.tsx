/**
 * DoubleVenusPendant.tsx — Pendentif double symbole de Vénus / féminin entrelacé
 * (sans chaîne), modélisé de façon 100% procédurale en Three.js / R3F.
 * 
 * Dimensions réelles (d'après spécifications) :
 * - Largeur : 30 mm (3.0 cm)
 * - Hauteur corps : 33 mm (3.3 cm), avec bélière ~40 mm (4.0 cm)
 * - Épaisseur métal : ~1.8–2.0 mm (0.18–0.20 cm)
 * - Finition : Acier inoxydable / argent poli miroir avec chanfreins (biseaux)
 */
import { useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { SceneItemProps } from '@shared/types';

// Dimensions en cm (1 unité = 1 cm)
const PENDANT_W = 3.0;
const PENDANT_H = 4.0;
const PENDANT_D = 0.42;

function createPendantBodyGeometry(): THREE.BufferGeometry {
  const shape = new THREE.Shape();

  const dx = 0.575;     // Décalage horizontal des centres des deux anneaux
  const Rout = 0.925;   // Rayon extérieur des anneaux
  const Rin = 0.700;    // Rayon intérieur des anneaux (largeur bande = 2.25 mm)
  const Yc = 2.05;      // Hauteur du centre des anneaux

  const wStem = 0.225;  // Largeur des tiges verticales
  const stemLeftX = -dx - wStem / 2;   // -0.6875
  const stemRightX = -dx + wStem / 2;  // -0.4625
  const rStemLeftX = dx - wStem / 2;   // +0.4625
  const rStemRightX = dx + wStem / 2;  // +0.6875

  const wBar = 2.30;    // Largeur de la traverse horizontale
  const barLeftX = -wBar / 2;
  const barRightX = wBar / 2;
  const barBotY = 0.45;
  const barTopY = 0.68;

  // Oeillet d'attache supérieur
  const eyeletY = 3.06;
  const eyeletRout = 0.23;
  const eyeletRin = 0.11;

  // Cuspides d'intersection des cercles extérieurs
  const yCuspDelta = Math.sqrt(Rout * Rout - dx * dx);
  const topCuspY = Yc + yCuspDelta;
  const botCuspY = Yc - yCuspDelta;

  // Jonction tige / anneau extérieur
  const dyStemMeet = Math.sqrt(Rout * Rout - Math.pow(wStem / 2, 2));
  const stemMeetY = Yc - dyStemMeet;

  // ── Contour extérieur (sens anti-horaire) ──
  const outerPts: THREE.Vector2[] = [];

  // Arc sommital de l'oeillet
  const N_EYE = 20;
  for (let i = 0; i <= N_EYE; i++) {
    const a = Math.PI * 0.08 + (Math.PI * 0.84 * i) / N_EYE;
    outerPts.push(new THREE.Vector2(eyeletRout * Math.cos(a), eyeletY + eyeletRout * Math.sin(a)));
  }

  // Cercle 1 extérieur (gauche)
  const aC1Top = Math.atan2(topCuspY + 0.08 - Yc, -0.15 + dx);
  const aC1Stem = Math.atan2(stemMeetY - Yc, stemLeftX + dx);
  const N_C1 = 64;
  for (let i = 0; i <= N_C1; i++) {
    const startA = aC1Top;
    const endA = aC1Stem + Math.PI * 2;
    const a = startA + (endA - startA) * (i / N_C1);
    outerPts.push(new THREE.Vector2(-dx + Rout * Math.cos(a), Yc + Rout * Math.sin(a)));
  }

  // Tige gauche : descente verticale vers la traverse
  outerPts.push(new THREE.Vector2(stemLeftX, barTopY));
  outerPts.push(new THREE.Vector2(barLeftX, barTopY));
  outerPts.push(new THREE.Vector2(barLeftX, barBotY));
  outerPts.push(new THREE.Vector2(stemLeftX, barBotY));

  // Pied de la tige gauche
  outerPts.push(new THREE.Vector2(stemLeftX, 0));
  outerPts.push(new THREE.Vector2(stemRightX, 0));
  outerPts.push(new THREE.Vector2(stemRightX, barBotY));

  // Traverse inférieure entre les tiges
  outerPts.push(new THREE.Vector2(rStemLeftX, barBotY));

  // Pied de la tige droite
  outerPts.push(new THREE.Vector2(rStemLeftX, 0));
  outerPts.push(new THREE.Vector2(rStemRightX, 0));
  outerPts.push(new THREE.Vector2(rStemRightX, barBotY));

  // Aile droite de la traverse
  outerPts.push(new THREE.Vector2(barRightX, barBotY));
  outerPts.push(new THREE.Vector2(barRightX, barTopY));
  outerPts.push(new THREE.Vector2(rStemRightX, barTopY));

  // Tige droite : remontée verticale vers l'anneau 2
  outerPts.push(new THREE.Vector2(rStemRightX, stemMeetY));

  // Cercle 2 extérieur (droite)
  const aC2Stem = Math.atan2(stemMeetY - Yc, rStemRightX - dx);
  const aC2Top = Math.atan2(topCuspY + 0.08 - Yc, 0.15 - dx);
  const N_C2 = 64;
  for (let i = 0; i <= N_C2; i++) {
    const a = aC2Stem + (aC2Top - aC2Stem) * (i / N_C2);
    outerPts.push(new THREE.Vector2(dx + Rout * Math.cos(a), Yc + Rout * Math.sin(a)));
  }

  shape.moveTo(outerPts[0].x, outerPts[0].y);
  for (let i = 1; i < outerPts.length; i++) {
    shape.lineTo(outerPts[i].x, outerPts[i].y);
  }
  shape.closePath();

  // ── TROU 1 : Évidement croissant gauche (sens horaire) ──
  const xIntL = (Rin * Rin - Rout * Rout) / (4 * dx);
  const yIntL = Math.sqrt(Rin * Rin - Math.pow(xIntL + dx, 2));

  const h1Pts: THREE.Vector2[] = [];
  const N_H1 = 40;
  const aC2TopL = Math.atan2(yIntL, xIntL - dx);
  const aC2BotL = Math.PI * 2 - aC2TopL;
  for (let i = 0; i <= N_H1; i++) {
    const a = aC2TopL + (aC2BotL - aC2TopL) * (i / N_H1);
    h1Pts.push(new THREE.Vector2(dx + Rout * Math.cos(a), Yc + Rout * Math.sin(a)));
  }
  const aC1TopL = Math.atan2(yIntL, xIntL + dx);
  const aC1BotL = -aC1TopL;
  const aC1Start = aC1BotL;
  const aC1End = -Math.PI * 2 + aC1TopL;
  for (let i = 0; i <= N_H1; i++) {
    const a = aC1Start + (aC1End - aC1Start) * (i / N_H1);
    h1Pts.push(new THREE.Vector2(-dx + Rin * Math.cos(a), Yc + Rin * Math.sin(a)));
  }
  const h1 = new THREE.Path();
  h1.moveTo(h1Pts[0].x, h1Pts[0].y);
  for (let i = 1; i < h1Pts.length; i++) h1.lineTo(h1Pts[i].x, h1Pts[i].y);
  h1.closePath();
  shape.holes.push(h1);

  // ── TROU 2 : Lentille centrale d'intersection (sens horaire) ──
  const yLens = Math.sqrt(Rin * Rin - dx * dx);
  const h2Pts: THREE.Vector2[] = [];
  const N_H2 = 32;
  const aLensC1 = Math.atan2(yLens, dx);
  for (let i = 0; i <= N_H2; i++) {
    const a = aLensC1 - (2 * aLensC1 * i) / N_H2;
    h2Pts.push(new THREE.Vector2(-dx + Rin * Math.cos(a), Yc + Rin * Math.sin(a)));
  }
  const aLensC2 = Math.atan2(yLens, -dx);
  const aC2Start = Math.PI * 2 - aLensC2;
  const aC2End = aLensC2;
  for (let i = 0; i <= N_H2; i++) {
    const a = aC2Start + (aC2End - aC2Start) * (i / N_H2);
    h2Pts.push(new THREE.Vector2(dx + Rin * Math.cos(a), Yc + Rin * Math.sin(a)));
  }
  const h2 = new THREE.Path();
  h2.moveTo(h2Pts[0].x, h2Pts[0].y);
  for (let i = 1; i < h2Pts.length; i++) h2.lineTo(h2Pts[i].x, h2Pts[i].y);
  h2.closePath();
  shape.holes.push(h2);

  // ── TROU 3 : Évidement croissant droit (miroir exact de 1) ──
  const h3 = new THREE.Path();
  const h3Pts: THREE.Vector2[] = [];
  for (let i = h1Pts.length - 1; i >= 0; i--) {
    h3Pts.push(new THREE.Vector2(-h1Pts[i].x, h1Pts[i].y));
  }
  h3.moveTo(h3Pts[0].x, h3Pts[0].y);
  for (let i = 1; i < h3Pts.length; i++) h3.lineTo(h3Pts[i].x, h3Pts[i].y);
  h3.closePath();
  shape.holes.push(h3);

  // ── TROU 4 : Trou de l'oeillet d'attache ──
  const h4 = new THREE.Path();
  const N_H4 = 24;
  for (let i = 0; i <= N_H4; i++) {
    const a = -(Math.PI * 2 * i) / N_H4;
    const pt = new THREE.Vector2(eyeletRin * Math.cos(a), eyeletY + eyeletRin * Math.sin(a));
    if (i === 0) h4.moveTo(pt.x, pt.y);
    else h4.lineTo(pt.x, pt.y);
  }
  h4.closePath();
  shape.holes.push(h4);

  // ── TROU 5 : Arche inférieure entre les tiges et les anneaux ──
  const h5 = new THREE.Path();
  const h5Pts: THREE.Vector2[] = [];
  h5Pts.push(new THREE.Vector2(stemRightX, barTopY));
  h5Pts.push(new THREE.Vector2(stemRightX, stemMeetY));

  const aStemInnerC1 = Math.atan2(stemMeetY - Yc, stemRightX + dx);
  const aCuspC1 = Math.atan2(botCuspY - Yc, 0 + dx);
  const N_H5 = 24;
  for (let i = 0; i <= N_H5; i++) {
    const a = aStemInnerC1 + (aCuspC1 - aStemInnerC1) * (i / N_H5);
    h5Pts.push(new THREE.Vector2(-dx + Rout * Math.cos(a), Yc + Rout * Math.sin(a)));
  }
  const aCuspC2 = Math.atan2(botCuspY - Yc, 0 - dx);
  const aStemInnerC2 = Math.atan2(stemMeetY - Yc, rStemLeftX - dx);
  for (let i = 0; i <= N_H5; i++) {
    const a = aCuspC2 + (aStemInnerC2 - aCuspC2) * (i / N_H5);
    h5Pts.push(new THREE.Vector2(dx + Rout * Math.cos(a), Yc + Rout * Math.sin(a)));
  }
  h5Pts.push(new THREE.Vector2(rStemLeftX, barTopY));

  h5.moveTo(h5Pts[0].x, h5Pts[0].y);
  for (let i = 1; i < h5Pts.length; i++) h5.lineTo(h5Pts[i].x, h5Pts[i].y);
  h5.closePath();
  shape.holes.push(h5);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.16,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 3,
    curveSegments: 32,
  });

  // Centrer en Z pour que Z=0 soit au milieu de l'épaisseur
  geo.translate(0, 0, -0.08);
  return geo;
}

function createBailGeometry(): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  const N = 40;
  const pos: number[] = [];
  const indices: number[] = [];

  const thickness = 0.06; // 0.6 mm d'épaisseur de tôle pour la bélière

  // Paramétrisation de la boucle en goutte dans le plan Y-Z
  for (let i = 0; i < N; i++) {
    const t = (i / N) * Math.PI * 2;

    // Largeur évasée vers le haut (0.16 cm en bas dans l'oeillet, 0.42 cm au sommet)
    const w = 0.16 + (0.42 - 0.16) * Math.pow(Math.sin(t / 2), 1.2);

    const cy = 3.48;
    const ry = 0.44;
    const rz = 0.18;

    const y = cy - ry * Math.cos(t) + 0.05 * Math.sin(t / 2);
    const z = rz * Math.sin(t);

    // Vecteur tangent numérique
    const dt = 0.001;
    const yNext = cy - ry * Math.cos(t + dt) + 0.05 * Math.sin((t + dt) / 2);
    const zNext = rz * Math.sin(t + dt);
    const ty = yNext - y;
    const tz = zNext - z;
    const len = Math.sqrt(ty * ty + tz * tz);
    const ny = -tz / len;
    const nz = ty / len;

    const hw = w / 2;
    const ht = thickness / 2;

    // 4 sommets par tranche : Extérieur gauche/droit, Intérieur droit/gauche
    pos.push(-hw, y + ny * ht, z + nz * ht);
    pos.push( hw, y + ny * ht, z + nz * ht);
    pos.push( hw, y - ny * ht, z - nz * ht);
    pos.push(-hw, y - ny * ht, z - nz * ht);
  }

  // Triangulation des faces du ruban
  for (let i = 0; i < N; i++) {
    const next = (i + 1) % N;
    const b0 = i * 4;
    const b1 = next * 4;

    // Face extérieure
    indices.push(b0 + 0, b0 + 1, b1 + 1);
    indices.push(b0 + 0, b1 + 1, b1 + 0);

    // Tranche droite
    indices.push(b0 + 1, b0 + 2, b1 + 2);
    indices.push(b0 + 1, b1 + 2, b1 + 1);

    // Face intérieure
    indices.push(b0 + 2, b0 + 3, b1 + 3);
    indices.push(b0 + 2, b1 + 3, b1 + 2);

    // Tranche gauche
    indices.push(b0 + 3, b0 + 0, b1 + 0);
    indices.push(b0 + 3, b1 + 0, b1 + 3);
  }

  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export function DoubleVenusPendant({ onSize }: SceneItemProps) {
  const bodyGeo = useMemo(createPendantBodyGeometry, []);
  const bailGeo = useMemo(createBailGeometry, []);

  // Matériau acier inoxydable poli miroir
  const steelMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0xdedede,
    metalness: 0.95,
    roughness: 0.18,
    envMapIntensity: 1.2,
  }), []);

  useLayoutEffect(() => {
    onSize(new THREE.Vector3(PENDANT_W, PENDANT_H, PENDANT_D));
  }, [onSize]);

  return (
    <group userData={{ hoverAction: { label: 'Pendentif Double Vénus' } }}>
      {/* Corps du pendentif : double symbole ♀ entrelacé avec bélière */}
      <mesh
        geometry={bodyGeo}
        material={steelMaterial}
        castShadow
        receiveShadow
      />
      {/* Bélière d'attache supérieure passant dans l'oeillet */}
      <mesh
        geometry={bailGeo}
        material={steelMaterial}
        castShadow
        receiveShadow
      />
    </group>
  );
}
