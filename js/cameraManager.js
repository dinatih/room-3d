import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ROOM_W, ROOM_D, WALL_H, DOOR_START, NICHE_DEPTH, KITCHEN_Z, LAYER_EQUIPMENT, LAYER_FURNITURE, LAYER_NETWORKS } from './config.js';
import { scene, camera, renderer, controls } from './scene.js';

const CX = ROOM_W / 2, CY = WALL_H / 2, CZ = ROOM_D / 2;
const DIST = 600;
const ISO = 450;

export const VIEWS = {
  perspective: { pos: [-200, 350, -150],      target: [CX, WALL_H / 3, CZ] },
  top:         { pos: [CX, DIST + 200, CZ], target: [CX, 0, CZ] },
  bottom:      { pos: [CX, -DIST, CZ],     target: [CX, 0, CZ] },
  front:       { pos: [CX, CY, CZ + DIST], target: [CX, CY, CZ] },
  back:        { pos: [CX, CY, CZ - DIST], target: [CX, CY, CZ] },
  left:        { pos: [CX - DIST, CY, CZ], target: [CX, CY, CZ] },
  right:       { pos: [CX + DIST, CY, CZ], target: [CX, CY, CZ] },
  'iso-se':    { pos: [CX + ISO, ISO, CZ + ISO], target: [CX, 0, CZ] },
  'iso-nw':    { pos: [CX - ISO, ISO, CZ - ISO], target: [CX, 0, CZ] },
};

export const POV_ROOMS = {
  living:   { x: ROOM_W / 2,                            z: ROOM_D / 2 },
  entry:    { x: (DOOR_START + ROOM_W) / 2,             z: ROOM_D + 75 },
  bathroom: { x: (-NICHE_DEPTH + DOOR_START) / 2,       z: (KITCHEN_Z + 600) / 2 },
  garden:   { x: 150,                                    z: -120 },
};

// =============================================
// WALK MODE (marche libre première personne)
// =============================================
const WALK_H = 180; // 1.80m
const WALK_SPEED = 2;
const MOUSE_SENS = 0.002;

let walkActive = false;
let walkYaw = 0, walkPitch = 0;
const walkPos = { x: 0, y: WALK_H, z: 0 };
const defaultControlsHint = 'Clic gauche : orbiter | Molette : zoom | Clic droit : pan';
const keysPressed = new Set();

export function isWalkActive() { return walkActive; }

export function enterWalk(x, z) {
  exitWalk();
  exit2D();
  walkActive = true;
  walkPos.x = x; walkPos.y = WALK_H; walkPos.z = z;
  walkYaw = 0; walkPitch = 0;
  camera.position.set(x, WALK_H, z);
  updateWalkLook();
  controls.enableRotate = false;
  controls.enablePan = false;
  controls.enableZoom = false;
  const c = document.getElementById('controls');
  if (c) c.textContent = 'Flèches / WASD : marcher | ←→ : pivoter | Ctrl+↑↓ : incliner | Alt+↑↓ : hauteur | Clic+glisser : regarder | Échap : quitter';
  requestRender();
}

export function exitWalk() {
  if (!walkActive) return;
  walkActive = false;
  walkDragging = false;
  keysPressed.clear();
  controls.enableRotate = true;
  controls.enablePan = true;
  controls.enableZoom = true;
  const c = document.getElementById('controls');
  if (c) c.textContent = defaultControlsHint;
  requestRender();
}

function updateWalkLook() {
  const d = 100;
  const cosP = Math.cos(walkPitch);
  controls.target.set(
    walkPos.x + Math.sin(walkYaw) * cosP * d,
    walkPos.y + Math.sin(walkPitch) * d,
    walkPos.z + Math.cos(walkYaw) * cosP * d,
  );
  camera.position.set(walkPos.x, walkPos.y, walkPos.z);
  controls.update();
}

// Reprend le walk mode à la dernière position/orientation sans reset
export function resumeWalk() {
  if (walkActive) return;
  exit2D();
  walkActive = true;
  walkPos.y = WALK_H;
  camera.position.set(walkPos.x, walkPos.y, walkPos.z);
  updateWalkLook();
  controls.enableRotate = false;
  controls.enablePan = false;
  controls.enableZoom = false;
  const c = document.getElementById('controls');
  if (c) c.textContent = 'Flèches / WASD : marcher | ←→ : pivoter | Ctrl+↑↓ : incliner | Alt+↑↓ : hauteur | Clic+glisser : regarder | Échap : quitter';
  requestRender();
}

// POV = enterWalk à la position donnée
export function enterPOV(x, z) {
  enterWalk(x, z);
}

// =============================================
// 2D TOP VIEW (orthographic)
// =============================================
let is2D = false;
let activeCamera = camera;
let orthoCamera = null;
let orthoControls = null;

export function getActiveCamera() { return activeCamera; }
export function getIs2D() { return is2D; }
export function getOrthoCamera() { return orthoCamera; }

function updateOrthoFrustum() {
  if (!orthoCamera) return;
  const aspect = innerWidth / innerHeight;
  const viewH = 800;
  const viewW = viewH * aspect;
  orthoCamera.left = -viewW / 2;
  orthoCamera.right = viewW / 2;
  orthoCamera.top = viewH / 2;
  orthoCamera.bottom = -viewH / 2;
  orthoCamera.updateProjectionMatrix();
}

export function enter2DTop() {
  exitWalk();
  exitWalk();

  if (!orthoCamera) {
    orthoCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 5000);
    orthoCamera.layers.enable(LAYER_EQUIPMENT);
    orthoCamera.layers.enable(LAYER_FURNITURE);
    orthoCamera.layers.enable(LAYER_NETWORKS);
  }
  updateOrthoFrustum();
  orthoCamera.up.set(0, 0, -1); // -Z vers le haut de l'écran (nord)
  orthoCamera.position.set(CX, 2000, CZ);
  orthoCamera.lookAt(CX, 0, CZ);

  controls.enabled = false;

  if (orthoControls) orthoControls.dispose();
  orthoControls = new OrbitControls(orthoCamera, renderer.domElement);
  orthoControls.target.set(CX, 0, CZ);
  orthoControls.enableRotate = false;
  orthoControls.enableDamping = true;
  orthoControls.dampingFactor = 0.08;
  orthoControls.screenSpacePanning = true;
  orthoControls.update();

  activeCamera = orthoCamera;
  is2D = true;
  orthoControls.addEventListener('change', requestRender);
  orthoControls.addEventListener('start', startDamping);
  orthoControls.addEventListener('end', startDamping);
  requestRender();
}

export function exit2D() {
  if (!is2D) return;
  if (orthoControls) {
    orthoControls.dispose();
    orthoControls = null;
  }
  controls.enabled = true;
  activeCamera = camera;
  is2D = false;
  requestRender();
}

export function onResize() {
  if (is2D) updateOrthoFrustum();
}

// =============================================
// RENDER ON DEMAND
// =============================================
const walkFollowers = [];
export function addWalkFollower(obj) { walkFollowers.push(obj); }

// Followers dont rotation.x suit le pitch de la caméra walk
const pitchFollowers = [];
export function addWalkPitchFollower(obj) { pitchFollowers.push(obj); }

export function setInitialWalkPos(x, z) {
  if (!walkActive) { walkPos.x = x; walkPos.z = z; }
}

let renderPending = false;
let dampingFrames = 0;
const DAMPING_TAIL = 60; // frames de damping après interaction

export function requestRender() {
  if (renderPending) return;
  renderPending = true;
  requestAnimationFrame(renderFrame);
}

export function startDamping() {
  dampingFrames = DAMPING_TAIL;
  requestRender();
}

function renderFrame() {
  renderPending = false;

  // Déplacement en mode marche
  if (walkActive && keysPressed.size > 0) {
    const fwdX = Math.sin(walkYaw) * WALK_SPEED;
    const fwdZ = Math.cos(walkYaw) * WALK_SPEED;
    const rgtX = fwdZ, rgtZ = -fwdX;

    // Flèches gauche/droite = rotation
    const KEY_ROT = 0.03;
    if (keysPressed.has('ArrowLeft'))  walkYaw += KEY_ROT;
    if (keysPressed.has('ArrowRight')) walkYaw -= KEY_ROT;

    // Ctrl + flèches haut/bas = inclinaison verticale de la caméra
    const KEY_PITCH = 0.02;
    if (keysPressed.has('CtrlArrowUp'))   walkPitch = Math.min(1.4, walkPitch + KEY_PITCH);
    if (keysPressed.has('CtrlArrowDown')) walkPitch = Math.max(-1.4, walkPitch - KEY_PITCH);

    // Alt + flèches haut/bas = hauteur de la caméra
    if (keysPressed.has('AltArrowUp'))   walkPos.y += WALK_SPEED;
    if (keysPressed.has('AltArrowDown')) walkPos.y -= WALK_SPEED;

    // Flèches haut/bas + ZQSD/WASD = translation (si Ctrl/Alt non enfoncé)
    if (!keysPressed.has('CtrlArrowUp') && !keysPressed.has('AltArrowUp') && (keysPressed.has('ArrowUp') || keysPressed.has('w')))
      { walkPos.x += fwdX; walkPos.z += fwdZ; }
    if (!keysPressed.has('CtrlArrowDown') && !keysPressed.has('AltArrowDown') && (keysPressed.has('ArrowDown') || keysPressed.has('s')))
      { walkPos.x -= fwdX; walkPos.z -= fwdZ; }
    if (keysPressed.has('a'))
      { walkPos.x -= rgtX; walkPos.z -= rgtZ; }
    if (keysPressed.has('d'))
      { walkPos.x += rgtX; walkPos.z += rgtZ; }

    updateWalkLook();
  }

  // Followers (ex: costume) calqués sur position/orientation de la caméra
  if (walkActive) {
    for (const obj of walkFollowers) {
      obj.position.x = walkPos.x;
      obj.position.z = walkPos.z;
      obj.rotation.y = walkYaw;
    }
    for (const obj of pitchFollowers) {
      obj.rotation.x = -walkPitch;
    }
  }

  if (is2D && orthoControls) orthoControls.update();
  else controls.update();
  renderer.render(scene, activeCamera);

  // Continuer le rendu si interaction active ou damping en cours
  if (walkActive && keysPressed.size > 0) requestRender();
  if (dampingFrames > 0) { dampingFrames--; requestRender(); }
}

// =============================================
// KEYBOARD + MOUSE event handlers
// =============================================
addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && walkActive) { exitWalk(); requestRender(); return; }
  if (!walkActive) return;
  const k = e.key;
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(k)) {
    keysPressed.add(k);
    if (e.ctrlKey && (k === 'ArrowUp' || k === 'ArrowDown'))
      keysPressed.add('Ctrl' + k);
    if (e.altKey && (k === 'ArrowUp' || k === 'ArrowDown'))
      keysPressed.add('Alt' + k);
    e.preventDefault();
    requestRender();
    return;
  }
  const lk = k.toLowerCase();
  if ('wasd'.includes(lk) && lk.length === 1) {
    keysPressed.add(lk);
    e.preventDefault();
    requestRender();
  }
});

addEventListener('keyup', (e) => {
  keysPressed.delete(e.key);
  keysPressed.delete(e.key.toLowerCase());
  keysPressed.delete('Ctrl' + e.key);
  keysPressed.delete('Alt' + e.key);
});

let walkDragging = false;
renderer.domElement.addEventListener('mousedown', (e) => {
  if (!walkActive || e.button !== 0) return;
  walkDragging = true;
});
document.addEventListener('mouseup', () => { walkDragging = false; });
document.addEventListener('mousemove', (e) => {
  if (!walkActive || !walkDragging) return;
  walkYaw -= e.movementX * MOUSE_SENS;
  walkPitch = Math.max(-1.4, Math.min(1.4, walkPitch - e.movementY * MOUSE_SENS));
  updateWalkLook();
  requestRender();
});

// Wire OrbitControls to render-on-demand
controls.addEventListener('change', requestRender);
controls.addEventListener('start', startDamping);
controls.addEventListener('end', startDamping);

// Set initial camera position
camera.position.set(...VIEWS.perspective.pos);
controls.target.set(...VIEWS.perspective.target);
controls.update();
