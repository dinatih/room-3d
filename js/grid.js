import * as THREE from 'three';
import { ROOM_W, ROOM_D, WALL_H } from './config.js';
import { makeText } from './labels.js';

export function buildGrid(scene) {
  const group = new THREE.Group();
  group.userData.brickType = 'grid';

  const GRID_X_MIN = -40; // -4m
  const GRID_X_MAX = 70;  // 7m (3m + 4m)
  const GRID_Z_MIN = -40; // -4m
  const GRID_Z_MAX = 80;  // 8m

  // --- Axes XYZ ---
  const axesSize = Math.max(ROOM_W, GRID_Z_MAX) * 0.4;
  const axes = new THREE.AxesHelper(axesSize);
  axes.position.set(-3, 0, -3);
  group.add(axes);

  // Labels axes
  makeText(group, 'X', { color: '#ff4444', size: 1.5, x: -3 + axesSize + 1.5, y: 0.5, z: -3 });
  makeText(group, 'Y', { color: '#44ff44', size: 1.5, x: -3, y: axesSize + 1.5, z: -3 });
  makeText(group, 'Z', { color: '#4488ff', size: 1.5, x: -3, y: 0.5, z: -3 + axesSize + 1.5, rotY: -Math.PI / 2 });

  // --- Ticks le long de X ---
  for (let x = GRID_X_MIN; x <= GRID_X_MAX; x += 5) {
    makeText(group, `${x}`, { color: '#ff8888', size: 0.8, x, y: 0.3, z: -2.5 });

    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x, 0.05, -1.5),
      new THREE.Vector3(x, 0.05, -0.2),
    ]);
    group.add(new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0xff6666 })));
  }

  // --- Ticks le long de Z ---
  for (let z = GRID_Z_MIN; z <= GRID_Z_MAX; z += 5) {
    makeText(group, `${z}`, { color: '#6688ff', size: 0.8, x: -2.5, y: 0.3, z, rotY: -Math.PI / 2 });

    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-1.5, 0.05, z),
      new THREE.Vector3(-0.2, 0.05, z),
    ]);
    group.add(new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0x6688ff })));
  }

  // --- Labels des murs ---
  const labelY = WALL_H * 0.6;
  makeText(group, 'MUR A OUEST (X=0)',  { size: 1.2, x: -3,         y: labelY, z: ROOM_D / 2, rotY: Math.PI / 2 });
  makeText(group, 'MUR B EST (X=30)',   { size: 1.2, x: ROOM_W + 3, y: labelY, z: ROOM_D / 2, rotY: -Math.PI / 2 });
  makeText(group, 'MUR C NORD (Z=0)',   { size: 1.2, x: ROOM_W / 2, y: labelY, z: -3 });
  makeText(group, 'MUR D SUD (Z=40)',   { size: 1.2, x: ROOM_W / 2, y: labelY, z: ROOM_D + 3, rotY: Math.PI });

  // --- Grille au sol ---
  const gridMatMajor = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4, depthTest: false });
  const gridMatMinor = new THREE.LineBasicMaterial({ color: 0xaaaaaa, transparent: true, opacity: 0.2, depthTest: false });
  const GRID_Y = 0;

  for (let x = GRID_X_MIN; x <= GRID_X_MAX; x += 5) {
    const mat = (x % 10 === 0) ? gridMatMajor : gridMatMinor;
    const g = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x, GRID_Y, GRID_Z_MIN),
      new THREE.Vector3(x, GRID_Y, GRID_Z_MAX),
    ]);
    const line = new THREE.Line(g, mat);
    line.renderOrder = 999;
    group.add(line);
  }
  for (let z = GRID_Z_MIN; z <= GRID_Z_MAX; z += 5) {
    const mat = (z % 10 === 0) ? gridMatMajor : gridMatMinor;
    const g = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(GRID_X_MIN, GRID_Y, z),
      new THREE.Vector3(GRID_X_MAX, GRID_Y, z),
    ]);
    const line = new THREE.Line(g, mat);
    line.renderOrder = 999;
    group.add(line);
  }

  // Numéros sur la grille intérieure
  for (let x = GRID_X_MIN; x <= GRID_X_MAX; x += 10) {
    for (let z = GRID_Z_MIN; z <= GRID_Z_MAX; z += 10) {
      makeText(group, `${x},${z}`, { color: '#ffffff', size: 0.6, x: x + 0.5, y: GRID_Y + 0.3, z: z + 0.5 });
    }
  }

  scene.add(group);
}
