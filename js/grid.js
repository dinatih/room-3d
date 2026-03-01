import * as THREE from 'three';
import { ROOM_W, ROOM_D, WALL_H } from './config.js';
import { makeText } from './labels.js';

export function buildGrid(scene) {
  const group = new THREE.Group();
  group.userData.brickType = 'grid';

  const GRID_X_MIN = -400; // -4m
  const GRID_X_MAX = 700;  // 7m (3m + 4m)
  const GRID_Z_MIN = -400; // -4m
  const GRID_Z_MAX = 800;  // 8m

  // --- Axes XYZ ---
  const axesSize = Math.max(ROOM_W, GRID_Z_MAX) * 0.4;
  const axes = new THREE.AxesHelper(axesSize);
  axes.position.set(-30, 0, -30);
  group.add(axes);

  // Labels axes
  makeText(group, 'X', { color: '#ff4444', size: 15, x: -30 + axesSize + 15, y: 5, z: -30 });
  makeText(group, 'Y', { color: '#44ff44', size: 15, x: -30, y: axesSize + 15, z: -30 });
  makeText(group, 'Z', { color: '#4488ff', size: 15, x: -30, y: 5, z: -30 + axesSize + 15, rotY: -Math.PI / 2 });

  // --- Ticks le long de X ---
  for (let x = GRID_X_MIN; x <= GRID_X_MAX; x += 50) {
    makeText(group, `${x}`, { color: '#ff8888', size: 8, x, y: 3, z: -25 });

    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x, 0.5, -15),
      new THREE.Vector3(x, 0.5, -2),
    ]);
    group.add(new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0xff6666 })));
  }

  // --- Ticks le long de Z ---
  for (let z = GRID_Z_MIN; z <= GRID_Z_MAX; z += 50) {
    makeText(group, `${z}`, { color: '#6688ff', size: 8, x: -25, y: 3, z, rotY: -Math.PI / 2 });

    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-15, 0.5, z),
      new THREE.Vector3(-2, 0.5, z),
    ]);
    group.add(new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0x6688ff })));
  }

  // --- Labels des murs ---
  const labelY = WALL_H * 0.6;
  makeText(group, 'MUR A OUEST (X=0)',  { size: 12, x: -30,         y: labelY, z: ROOM_D / 2, rotY: Math.PI / 2 });
  makeText(group, 'MUR B EST (X=300)',   { size: 12, x: ROOM_W + 30, y: labelY, z: ROOM_D / 2, rotY: -Math.PI / 2 });
  makeText(group, 'MUR C NORD (Z=0)',   { size: 12, x: ROOM_W / 2, y: labelY, z: -30 });
  makeText(group, 'MUR D SUD (Z=400)',   { size: 12, x: ROOM_W / 2, y: labelY, z: ROOM_D + 30, rotY: Math.PI });

  // --- Grille au sol ---
  const gridMatMajor = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4, depthTest: false });
  const gridMatMinor = new THREE.LineBasicMaterial({ color: 0xaaaaaa, transparent: true, opacity: 0.2, depthTest: false });
  const GRID_Y = 0;

  for (let x = GRID_X_MIN; x <= GRID_X_MAX; x += 50) {
    const mat = (x % 100 === 0) ? gridMatMajor : gridMatMinor;
    const g = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x, GRID_Y, GRID_Z_MIN),
      new THREE.Vector3(x, GRID_Y, GRID_Z_MAX),
    ]);
    const line = new THREE.Line(g, mat);
    line.renderOrder = 999;
    group.add(line);
  }
  for (let z = GRID_Z_MIN; z <= GRID_Z_MAX; z += 50) {
    const mat = (z % 100 === 0) ? gridMatMajor : gridMatMinor;
    const g = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(GRID_X_MIN, GRID_Y, z),
      new THREE.Vector3(GRID_X_MAX, GRID_Y, z),
    ]);
    const line = new THREE.Line(g, mat);
    line.renderOrder = 999;
    group.add(line);
  }

  // Numéros sur la grille intérieure
  for (let x = GRID_X_MIN; x <= GRID_X_MAX; x += 100) {
    for (let z = GRID_Z_MIN; z <= GRID_Z_MAX; z += 100) {
      makeText(group, `${x},${z}`, { color: '#ffffff', size: 6, x: x + 5, y: GRID_Y + 3, z: z + 5 });
    }
  }

  scene.add(group);
}
