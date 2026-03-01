import * as THREE from 'three';
import { requestRender } from './cameraManager.js';

const ZERO_MATRIX = new THREE.Matrix4().makeScale(0, 0, 0);

let buildOrder = []; // [{ mesh, idx, matrix, sortY }] trié par Y croissant
let currentStep = 0;
let animating = false;
let rafId = null;
let bricksPerFrame = 8;

export function prepareBuildAnimation(scene) {
  const pos = new THREE.Vector3();
  const m = new THREE.Matrix4();
  buildOrder = [];

  // Clé de tri composée : Y + Z/1000 + X/100000
  // Briques et studs d'une même brique partagent les mêmes Y,Z,X → studs +0.001
  const key = (y, z, x) => y + z / 1000 + x / 100000;

  scene.traverse(obj => {
    if (obj.isInstancedMesh) {
      const sY = obj.userData.studBrickY || null;
      const sZ = obj.userData.studBrickZ || null;
      const sX = obj.userData.studBrickX || null;
      for (let i = 0; i < obj.count; i++) {
        obj.getMatrixAt(i, m);
        pos.setFromMatrixPosition(m);
        const sortY = sY
          ? key(sY[i], sZ[i], sX[i]) + 0.001   // stud : clé brique parente + epsilon
          : key(pos.y, pos.z, pos.x);            // brique normale
        buildOrder.push({ kind: 'instanced', mesh: obj, idx: i, matrix: m.clone(), sortY });
      }
    } else if (obj.isMesh && obj.userData.buildAnim) {
      buildOrder.push({ kind: 'mesh', mesh: obj, sortY: obj.position.y });
    }
  });

  buildOrder.sort((a, b) => a.sortY - b.sortY);

  // Viser ~10s d'animation à ~60fps
  bricksPerFrame = Math.max(1, Math.ceil(buildOrder.length / (10 * 60)));
}

export function isBuildAnimating() { return animating; }

export function startBuildAnimation() {
  if (rafId) cancelAnimationFrame(rafId);
  animating = true;
  currentStep = 0;

  // Masquer toutes les entrées
  const instancedMeshSet = new Set(buildOrder.filter(e => e.kind === 'instanced').map(e => e.mesh));
  for (const mesh of instancedMeshSet) {
    for (let i = 0; i < mesh.count; i++) mesh.setMatrixAt(i, ZERO_MATRIX);
    mesh.instanceMatrix.needsUpdate = true;
  }
  for (const e of buildOrder) {
    if (e.kind === 'mesh') e.mesh.visible = false;
  }
  requestRender();

  rafId = requestAnimationFrame(step);
}

export function stopBuildAnimation() {
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  animating = false;

  // Restaurer tout
  const affectedMeshes = new Set();
  for (const e of buildOrder) {
    if (e.kind === 'instanced') {
      e.mesh.setMatrixAt(e.idx, e.matrix);
      affectedMeshes.add(e.mesh);
    } else {
      e.mesh.visible = true;
    }
  }
  for (const mesh of affectedMeshes) mesh.instanceMatrix.needsUpdate = true;
  requestRender();
}

function step() {
  if (!animating) return;

  const end = Math.min(currentStep + bricksPerFrame, buildOrder.length);
  const affectedMeshes = new Set();

  for (let i = currentStep; i < end; i++) {
    const e = buildOrder[i];
    if (e.kind === 'instanced') {
      e.mesh.setMatrixAt(e.idx, e.matrix);
      affectedMeshes.add(e.mesh);
    } else {
      e.mesh.visible = true;
    }
  }

  for (const mesh of affectedMeshes) mesh.instanceMatrix.needsUpdate = true;
  requestRender();

  currentStep = end;

  if (currentStep < buildOrder.length) {
    rafId = requestAnimationFrame(step);
  } else {
    animating = false;
    rafId = null;
    document.dispatchEvent(new CustomEvent('build-animation-complete'));
  }
}
