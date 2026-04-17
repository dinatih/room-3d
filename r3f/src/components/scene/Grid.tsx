/**
 * GridLayer.tsx — grille au sol + axes XYZ + chiffres de mesure.
 * Port fidèle de js/ui/grid.js.
 * Activé via layers.grid dans Studio.tsx.
 */
import { useMemo } from 'react';
import * as THREE from 'three';

// @ts-ignore
import { ROOM_W, ROOM_D, WALL_H } from '@config';

const GRID_X_MIN = -400;
const GRID_X_MAX =  700;
const GRID_Z_MIN = -400;
const GRID_Z_MAX =  800;
const GRID_Y     = 0.5;

const majorMat = new THREE.LineBasicMaterial({
  color: 0xffffff, transparent: true, opacity: 0.4, depthTest: false,
});
const minorMat = new THREE.LineBasicMaterial({
  color: 0xaaaaaa, transparent: true, opacity: 0.2, depthTest: false,
});

// ── Sprite texte (canvas, billboardé, sans dépendance CDN) ────────────────────

function makeSprite(text: string, color: string, worldSize: number): THREE.Sprite {
  const PX = 64;
  const w  = Math.ceil(text.length * PX * 0.58 + PX * 0.6);
  const h  = Math.ceil(PX * 1.3);
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.font = `bold ${PX}px sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, w / 2, h / 2);
  const mat = new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(canvas),
    transparent: true, depthTest: false,
  });
  const sp = new THREE.Sprite(mat);
  sp.scale.set(worldSize * (w / h), worldSize, 1);
  return sp;
}

// ── Groupe impératif (construit une seule fois) ───────────────────────────────

function buildGroup(): THREE.Group {
  const g = new THREE.Group();

  // ── Axes ──────────────────────────────────────────────────────────────────
  const axes = new THREE.AxesHelper(150);
  axes.position.set(-30, 0, -30);
  g.add(axes);

  // Libellés axes
  const axesSize = 150;
  for (const [txt, color, px, py, pz] of [
    ['X', '#ff4444', -30 + axesSize + 15, 5, -30],
    ['Y', '#44ff44', -30, axesSize + 15,  -30],
    ['Z', '#4488ff', -30, 5, -30 + axesSize + 15],
  ] as [string, string, number, number, number][]) {
    const sp = makeSprite(txt, color, 15);
    sp.position.set(px, py, pz);
    g.add(sp);
  }

  // ── Grille au sol ─────────────────────────────────────────────────────────
  const maj: THREE.Vector3[] = [], min: THREE.Vector3[] = [];
  for (let x = GRID_X_MIN; x <= GRID_X_MAX; x += 50) {
    const arr = x % 100 === 0 ? maj : min;
    arr.push(new THREE.Vector3(x, GRID_Y, GRID_Z_MIN), new THREE.Vector3(x, GRID_Y, GRID_Z_MAX));
  }
  for (let z = GRID_Z_MIN; z <= GRID_Z_MAX; z += 50) {
    const arr = z % 100 === 0 ? maj : min;
    arr.push(new THREE.Vector3(GRID_X_MIN, GRID_Y, z), new THREE.Vector3(GRID_X_MAX, GRID_Y, z));
  }
  const majSeg = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(maj), majorMat);
  const minSeg = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(min), minorMat);
  majSeg.renderOrder = minSeg.renderOrder = 999;
  g.add(majSeg, minSeg);

  // ── Ticks X ───────────────────────────────────────────────────────────────
  const tickMatX = new THREE.LineBasicMaterial({ color: 0xff6666 });
  const tickMatZ = new THREE.LineBasicMaterial({ color: 0x6688ff });
  for (let x = GRID_X_MIN; x <= GRID_X_MAX; x += 50) {
    const sp = makeSprite(`${x}`, '#ff8888', 8);
    sp.position.set(x, 3, -25);
    g.add(sp);
    const tGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x, 0.5, -15), new THREE.Vector3(x, 0.5, -2),
    ]);
    g.add(new THREE.Line(tGeo, tickMatX));
  }

  // ── Ticks Z ───────────────────────────────────────────────────────────────
  for (let z = GRID_Z_MIN; z <= GRID_Z_MAX; z += 50) {
    const sp = makeSprite(`${z}`, '#6688ff', 8);
    sp.position.set(-25, 3, z);
    g.add(sp);
    const tGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-15, 0.5, z), new THREE.Vector3(-2, 0.5, z),
    ]);
    g.add(new THREE.Line(tGeo, tickMatZ));
  }

  // ── Labels murs ───────────────────────────────────────────────────────────
  const labelY = WALL_H * 0.6;
  for (const [txt, px, py, pz] of [
    [`MUR A  X=0`,    -30,        labelY, ROOM_D / 2],
    [`MUR B  X=${ROOM_W}`, ROOM_W + 30, labelY, ROOM_D / 2],
    [`MUR C  Z=0`,    ROOM_W / 2, labelY, -30],
    [`MUR D  Z=${ROOM_D}`, ROOM_W / 2, labelY, ROOM_D + 30],
  ] as [string, number, number, number][]) {
    const sp = makeSprite(txt, '#dddddd', 12);
    sp.position.set(px, py, pz);
    g.add(sp);
  }

  // ── Coordonnées sur la grille (tous les 100cm) ────────────────────────────
  for (let x = GRID_X_MIN; x <= GRID_X_MAX; x += 100) {
    for (let z = GRID_Z_MIN; z <= GRID_Z_MAX; z += 100) {
      const sp = makeSprite(`${x},${z}`, '#ffffff', 6);
      sp.position.set(x + 5, GRID_Y + 3, z + 5);
      g.add(sp);
    }
  }

  return g;
}

// ── Composant ─────────────────────────────────────────────────────────────────

export function GridLayer() {
  const group = useMemo(buildGroup, []);
  return <primitive object={group} />;
}
