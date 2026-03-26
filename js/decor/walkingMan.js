import * as THREE from 'three';
import { ROOM_W, ROOM_D } from '../config.js';
import {
  requestRender, addWalkFollower, removeWalkFollower,
  setInitialWalkPos, registerAnimTicker,
} from '../cameraManager.js';
import { setMinimapWalker } from '../ui/minimap.js';

// ── Walkers disponibles ───────────────────────────────────────
import { load as loadWalker1 } from './walkers/lara2026.js';
import { load as loadWalker2 } from './walkers/lara2026.js';

// ── Instances ─────────────────────────────────────────────────
// Chaque entrée : { group, mixer, action, skelHelper, active, fadeFrames }
const _walkers = [];
let _activeIdx = 0;

export function getWalkingMan() { return _walkers[_activeIdx]?.group ?? null; }

export function toggleSkeleton() {
  const w = _walkers[_activeIdx];
  if (!w?.skelHelper) return;
  w.skelHelper.visible = !w.skelHelper.visible;
  requestRender();
}

export function switchWalker() {
  if (_walkers.length < 2) return;
  const cur = _walkers[_activeIdx];
  if (cur.active) { cur.action?.fadeOut(0.15); cur.active = false; cur.fadeFrames = 0; }
  removeWalkFollower(cur.group);
  _activeIdx = (_activeIdx + 1) % _walkers.length;
  const next = _walkers[_activeIdx];
  addWalkFollower(next.group);
  setInitialWalkPos(next.group.position.x, next.group.position.z);
  setMinimapWalker(next.group);
  requestRender();
}

export function getActiveWalkerIdx() { return _activeIdx; }

// ── Ticker unique (gère le walker actif) ──────────────────────
registerAnimTicker((dt, isMoving) => {
  const w = _walkers[_activeIdx];
  if (!w?.mixer) return;
  if (isMoving && !w.active) {
    w.action.reset().fadeIn(0.15).play();
    w.active = true;
    w.fadeFrames = 0;
  } else if (!isMoving && w.active) {
    w.action.fadeOut(0.2);
    w.active = false;
    w.fadeFrames = 15;
  }
  if (w.active || w.fadeFrames > 0) {
    w.mixer.update(dt);
    if (!w.active && w.fadeFrames > 0) w.fadeFrames--;
    requestRender();
  }
});

// ── Construction d'un walker ──────────────────────────────────
function buildWalker(scene, loadFn, startX, startZ, isFirst, opts = {}) {
  const inst = { group: null, mixer: null, action: null, skelHelper: null, active: false, fadeFrames: 0 };
  _walkers.push(inst);

  const group = new THREE.Group();
  group.position.set(startX, 0, startZ);
  const animGroup = new THREE.Group();
  group.add(animGroup);
  inst.group = group;

  loadFn(animGroup, scene, ({ mixer, action, skelHelper }) => {
    inst.mixer      = mixer;
    inst.action     = action;
    inst.skelHelper = skelHelper ?? null;
    scene.add(group);
    if (isFirst) {
      addWalkFollower(group);
      setInitialWalkPos(startX, startZ);
      setMinimapWalker(group);
    }
    requestRender();
  }, opts);
}

export function buildWalkingMan(scene) {
  buildWalker(scene, loadWalker1, ROOM_W / 2,      ROOM_D / 2,      true);
  buildWalker(scene, loadWalker2, ROOM_W / 2 + 80, ROOM_D / 2 - 60, false,
    { topColor: 0xcc1111, topNodes: ['5_Shirt_1.0_0_0', '5_BackPack_1.0_0_0', '5_Shorts_1.0_0_0'],
      extraColors: [{ nodes: ['Object_116'], color: 0xcc1111 }] });
}


// ════════════════════════════════════════════════════════════
// ARCHIVE — ancien code (non utilisé)
// ════════════════════════════════════════════════════════════

// ── Ancien squelette custom (buildSkeleton + buildWalkClip) ──
// const CAP_HEIGHT = 181;
// const SHOE_H = 5;
//
// function buildBone(name, x, y, z) {
//   const b = new THREE.Bone(); b.name = name; b.position.set(x, y, z); return b;
// }
// function buildSkeleton(parent) {
//   const hips = buildBone('hips', 0, 85, 0);
//   // … (hiérarchie complète dans git history)
//   parent.add(hips); return hips;
// }
// function buildWalkClip() {
//   // AnimationClip pour squelette custom (bones 'leftUp', 'rightUp', etc.)
// }
//
// ── Ancien costume business suit ─────────────────────────────
// import { gltfLoader } from '../utils/loaders.js';
// import { mergeGlbByMaterial } from '../utils/mergeUtils.js';
// import { LAYER_GLB } from '../config.js';
// import { addWalkPitchFollower } from '../cameraManager.js';
//
// gltfLoader.load('media/man_black_business_suit.glb', (gltf) => {
//   const suit = gltf.scene;
//   const redFabric = new THREE.MeshStandardMaterial({ color: 0xcc1111, roughness: 0.85 });
//   suit.traverse(c => { c.layers.set(LAYER_GLB); if (c.isMesh) c.material = redFabric; });
//   const box = new THREE.Box3().setFromObject(suit);
//   suit.scale.setScalar(156 / box.getSize(new THREE.Vector3()).y);
//   box.setFromObject(suit);
//   suit.position.set(0, -box.min.y + SHOE_H - 85, 0);
//   suit.rotation.y = Math.PI;
//   mergeGlbByMaterial(suit);
//   hipsRoot.add(suit);
// });
//
// gltfLoader.load('media/baseball_cap.glb', (gltf) => {
//   const cap = gltf.scene;
//   const redMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.65 });
//   cap.traverse(c => { c.layers.set(LAYER_GLB); if (c.isMesh) c.material = redMat; });
//   const box = new THREE.Box3().setFromObject(cap);
//   cap.scale.setScalar(20 / box.getSize(new THREE.Vector3()).x);
//   box.setFromObject(cap);
//   cap.position.set(0, CAP_HEIGHT, 0);
//   cap.rotation.x = (-15 * Math.PI) / 180;
//   cap.userData.baseRotX = cap.rotation.x;
//   mergeGlbByMaterial(cap);
//   dirGroup.add(cap);
//   addWalkPitchFollower(cap);
// });
