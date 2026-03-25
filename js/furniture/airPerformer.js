import * as THREE from 'three';
import { requestRender } from '../cameraManager.js';

const AP_POSITIONS = [
  { x: 287.5, z: 230 }, // pos 1 : contre mur B, au sud de la Sunnersta
  { x: 246,   z:  20 }, // pos 2 : contre kallax nord
];
let apPosIdx = 0;
let _group = null;

export function toggleAirPerformerPosition() {
  apPosIdx = (apPosIdx + 1) % AP_POSITIONS.length;
  const p = AP_POSITIONS[apPosIdx];
  _group.position.set(p.x, 0, p.z);
  requestRender();
  return apPosIdx;
}

export function buildAirPerformer(scene) {
  const group = new THREE.Group();
  group.userData.inventoryId = 'air-performer';
  group.userData.hoverAction = { label: 'Air Performer', actionId: 'air-performer-position' };
  _group = group;

  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    roughness: 0.7,
    side: THREE.DoubleSide,
  });

  // 1. Base cylindrique (filtration) — rayon 12.5cm, hauteur 35cm
  const base = new THREE.Mesh(new THREE.CylinderGeometry(12.5, 12.5, 35, 32), darkMat);
  base.position.y = 17.5;
  group.add(base);

  // 2. Tour de ventilation (shape extrudée avec trou)
  const h = 70, r = 10;
  const towerShape = new THREE.Shape();
  towerShape.absarc(0, h - r, r, Math.PI, 0, true);
  towerShape.absarc(0, r, r, 0, Math.PI, true);

  const holeR = 6;
  const holePath = new THREE.Path();
  holePath.absarc(0, h - 20 - holeR + 10, holeR, Math.PI, 0, true);
  holePath.absarc(0, holeR + 10, holeR, 0, Math.PI, true);
  towerShape.holes.push(holePath);

  const tower = new THREE.Mesh(
    new THREE.ExtrudeGeometry(towerShape, { depth: 10, bevelEnabled: false }),
    darkMat,
  );
  // Tour centrée en Z, légèrement en retrait (côté mur B)
  tower.position.set(0, 35, -5);
  group.add(tower);

  const p0 = AP_POSITIONS[0];
  group.position.set(p0.x, 0, p0.z);

  scene.add(group);
}
