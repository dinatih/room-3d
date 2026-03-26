import * as THREE from 'three';
import { ROOM_W, ROOM_D } from '../config.js';
import {
  requestRender, addWalkFollower,
  setInitialWalkPos, registerAnimTicker,
} from '../cameraManager.js';
import { setMinimapWalker } from '../ui/minimap.js';

// ── Personnage actif ──────────────────────────────────────────
// Changer cette ligne pour switcher de personnage (nitro / lara / …)
import { load as loadWalker } from './walkers/lara2026.js';
// import { load as loadWalker } from './walkers/harley.js';
// import { load as loadWalker } from './walkers/ariel.js';
// import { load as loadWalker } from './walkers/freefire.js';
// import { load as loadWalker } from './walkers/nitro.js';
// import { load as loadWalker } from './walkers/lara.js';

// ── État d'animation ──────────────────────────────────────────
let walkingMan = null;
export function getWalkingMan() { return walkingMan; }

let _mixer      = null;
let _action     = null;
let _active     = false;
let _fadeFrames = 0;
let _skelHelper = null;

export function toggleSkeleton() {
  if (!_skelHelper) return;
  _skelHelper.visible = !_skelHelper.visible;
  requestRender();
}

export function buildWalkingMan(scene) {
  const group = new THREE.Group();
  group.position.set(ROOM_W / 2, 0, ROOM_D / 2);

  const animGroup = new THREE.Group();
  group.add(animGroup);

  // ── Ticker d'animation ────────────────────────────────────
  registerAnimTicker((dt, isMoving) => {
    if (!_mixer) return;
    if (isMoving && !_active) {
      _action.reset().fadeIn(0.15).play();
      _active = true;
      _fadeFrames = 0;
    } else if (!isMoving && _active) {
      _action.fadeOut(0.2);
      _active = false;
      _fadeFrames = 15;
    }
    if (_active || _fadeFrames > 0) {
      _mixer.update(dt);
      if (!_active && _fadeFrames > 0) _fadeFrames--;
      requestRender();
    }
  });

  // ── Chargement du personnage ──────────────────────────────
  // Le walker gère : GLB, scale, position, clip, mixer, SkeletonHelper.
  loadWalker(animGroup, scene, ({ mixer, action, skelHelper }) => {
    _mixer      = mixer;
    _action     = action;
    _skelHelper = skelHelper ?? null;
    walkingMan = group;
    setMinimapWalker(group);
    scene.add(group);
    addWalkFollower(group);
    setInitialWalkPos(group.position.x, group.position.z);
    requestRender();
  });
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
