import * as THREE from 'three';
import { ROOM_W, ROOM_D, WALL_H } from './config.js';

function makeTextSprite(text, color, fontSize = 48) {
  const canvas = document.createElement('canvas');
  const sz = 256;
  canvas.width = sz; canvas.height = sz;
  const ctx = canvas.getContext('2d');
  ctx.font = `bold ${fontSize}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(text, sz / 2, sz / 2);
  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: tex, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(3, 3, 1);
  return sprite;
}

export function buildGrid(scene) {
  // --- Axes XYZ ---
  const axesSize = Math.max(ROOM_W, ROOM_D) * 0.4;
  const axes = new THREE.AxesHelper(axesSize);
  axes.position.set(-3, 0, -3);
  scene.add(axes);

  // Labels axes
  const xLabel = makeTextSprite('X', '#ff4444');
  xLabel.position.set(-3 + axesSize + 1.5, 0.5, -3);
  scene.add(xLabel);

  const yLabel = makeTextSprite('Y', '#44ff44');
  yLabel.position.set(-3, axesSize + 1.5, -3);
  scene.add(yLabel);

  const zLabel = makeTextSprite('Z', '#4488ff');
  zLabel.position.set(-3, 0.5, -3 + axesSize + 1.5);
  scene.add(zLabel);

  // --- Grille numérotée au sol ---
  // Ticks le long de X
  for (let x = 0; x <= ROOM_W; x += 5) {
    const label = makeTextSprite(`${x}`, '#ff8888', 36);
    label.position.set(x, 0.3, -3);
    label.scale.set(2, 2, 1);
    scene.add(label);

    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x, 0.05, -1.5),
      new THREE.Vector3(x, 0.05, -0.2),
    ]);
    scene.add(new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0xff6666 })));
  }

  // Ticks le long de Z
  for (let z = 0; z <= ROOM_D; z += 5) {
    const label = makeTextSprite(`${z}`, '#6688ff', 36);
    label.position.set(-3, 0.3, z);
    label.scale.set(2, 2, 1);
    scene.add(label);

    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-1.5, 0.05, z),
      new THREE.Vector3(-0.2, 0.05, z),
    ]);
    scene.add(new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0x6688ff })));
  }

  // --- Labels des murs ---
  function makeWallLabel(text, x, y, z, bgColor) {
    const sprite = makeTextSprite(text, bgColor, 42);
    sprite.position.set(x, y, z);
    sprite.scale.set(4, 4, 1);
    scene.add(sprite);
  }

  const labelY = WALL_H * 0.6;
  makeWallLabel('MUR A (X=0)',    -3,           labelY, ROOM_D / 2,     '#ffdd44');
  makeWallLabel('MUR B (X=30)',   ROOM_W + 3,   labelY, ROOM_D / 2,     '#ffdd44');
  makeWallLabel('MUR C (Z=0)',    ROOM_W / 2,   labelY, -3,             '#ffdd44');
  makeWallLabel('MUR D (Z=40)',   ROOM_W / 2,   labelY, ROOM_D + 3,    '#ffdd44');

  // --- Grille au sol ---
  const gridMatMajor = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 });
  const gridMatMinor = new THREE.LineBasicMaterial({ color: 0xaaaaaa, transparent: true, opacity: 0.2 });

  const GRID_Y = 1.1;

  for (let x = 0; x <= ROOM_W; x += 5) {
    const mat = (x % 10 === 0) ? gridMatMajor : gridMatMinor;
    const g = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x, GRID_Y, 0),
      new THREE.Vector3(x, GRID_Y, ROOM_D),
    ]);
    scene.add(new THREE.Line(g, mat));
  }
  for (let z = 0; z <= ROOM_D; z += 5) {
    const mat = (z % 10 === 0) ? gridMatMajor : gridMatMinor;
    const g = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, GRID_Y, z),
      new THREE.Vector3(ROOM_W, GRID_Y, z),
    ]);
    scene.add(new THREE.Line(g, mat));
  }

  // Numéros sur la grille intérieure
  for (let x = 0; x <= ROOM_W; x += 10) {
    for (let z = 0; z <= ROOM_D; z += 10) {
      const label = makeTextSprite(`${x},${z}`, '#ffffff', 28);
      label.position.set(x + 1.5, GRID_Y + 0.3, z + 1.5);
      label.scale.set(1.8, 1.8, 1);
      scene.add(label);
    }
  }
}
