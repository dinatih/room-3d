import * as THREE from 'three';
import { ROOM_W, ROOM_D, WALL_H } from './config.js';
import { makeText } from './labels.js';

export function buildGrid(scene) {
  const GRID_Z_MAX = 80; // 8m au lieu de 4m

  // --- Axes XYZ ---
  const axesSize = Math.max(ROOM_W, GRID_Z_MAX) * 0.4;
  const axes = new THREE.AxesHelper(axesSize);
  axes.position.set(-3, 0, -3);
  scene.add(axes);

  // Labels axes
  makeText(scene, 'X', { color: '#ff4444', size: 1.5, x: -3 + axesSize + 1.5, y: 0.5, z: -3 });
  makeText(scene, 'Y', { color: '#44ff44', size: 1.5, x: -3, y: axesSize + 1.5, z: -3 });
  makeText(scene, 'Z', { color: '#4488ff', size: 1.5, x: -3, y: 0.5, z: -3 + axesSize + 1.5, rotY: -Math.PI / 2 });

  // --- Ticks le long de X ---
  for (let x = 0; x <= ROOM_W; x += 5) {
    makeText(scene, `${x}`, { color: '#ff8888', size: 0.8, x, y: 0.3, z: -2.5 });

    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x, 0.05, -1.5),
      new THREE.Vector3(x, 0.05, -0.2),
    ]);
    scene.add(new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0xff6666 })));
  }

  // --- Ticks le long de Z ---
  for (let z = 0; z <= GRID_Z_MAX; z += 5) {
    makeText(scene, `${z}`, { color: '#6688ff', size: 0.8, x: -2.5, y: 0.3, z, rotY: -Math.PI / 2 });

    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-1.5, 0.05, z),
      new THREE.Vector3(-0.2, 0.05, z),
    ]);
    scene.add(new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0x6688ff })));
  }

  // --- Labels des murs ---
  const labelY = WALL_H * 0.6;
  makeText(scene, 'MUR A OUEST (X=0)',  { size: 1.2, x: -3,         y: labelY, z: ROOM_D / 2, rotY: Math.PI / 2 });
  makeText(scene, 'MUR B EST (X=30)',   { size: 1.2, x: ROOM_W + 3, y: labelY, z: ROOM_D / 2, rotY: -Math.PI / 2 });
  makeText(scene, 'MUR C NORD (Z=0)',   { size: 1.2, x: ROOM_W / 2, y: labelY, z: -3 });
  makeText(scene, 'MUR D SUD (Z=40)',   { size: 1.2, x: ROOM_W / 2, y: labelY, z: ROOM_D + 3, rotY: Math.PI });

  // --- Grille au sol ---
  const gridMatMajor = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 });
  const gridMatMinor = new THREE.LineBasicMaterial({ color: 0xaaaaaa, transparent: true, opacity: 0.2 });
  const GRID_Y = 1.1;

  for (let x = 0; x <= ROOM_W; x += 5) {
    const mat = (x % 10 === 0) ? gridMatMajor : gridMatMinor;
    const g = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x, GRID_Y, 0),
      new THREE.Vector3(x, GRID_Y, GRID_Z_MAX),
    ]);
    scene.add(new THREE.Line(g, mat));
  }
  for (let z = 0; z <= GRID_Z_MAX; z += 5) {
    const mat = (z % 10 === 0) ? gridMatMajor : gridMatMinor;
    const g = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, GRID_Y, z),
      new THREE.Vector3(ROOM_W, GRID_Y, z),
    ]);
    scene.add(new THREE.Line(g, mat));
  }

  // Numéros sur la grille intérieure
  for (let x = 0; x <= ROOM_W; x += 10) {
    for (let z = 0; z <= GRID_Z_MAX; z += 10) {
      makeText(scene, `${x},${z}`, { color: '#ffffff', size: 0.6, x: x + 0.5, y: GRID_Y + 0.3, z: z + 0.5 });
    }
  }
}
