import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ROOM_W, ROOM_D, WALL_H, DOOR_START, NICHE_DEPTH, KITCHEN_Z, LAYER_EQUIPMENT, LAYER_FURNITURE, LAYER_NETWORKS, LAYER_GLB } from './config.js';
import { redrawMinimap } from './ui/minimap.js';
import { scene, camera, renderer, controls } from './scene.js';

const CX = ROOM_W / 2, CY = WALL_H / 2, CZ = ROOM_D / 2;
const DIST = 600;
const ISO = 450;

export const VIEWS = {
  perspective: { pos: [CX, 1000, -150],       target: [CX, WALL_H / 3, CZ] },
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
// Touches de déplacement suivies globalement (walk mode ET perspective) pour l'animation
const moveKeysDown = new Set();
const MOVE_KEYS = new Set(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','s','W','S']);

// Vitesse du personnage en mode perspective (unités/sec)
const PERSP_SPEED = 120;
const PERSP_ROT   = 1.5; // rad/sec

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
  redrawMinimap();
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
    walkPos.x - Math.sin(walkYaw) * cosP * d,
    walkPos.y + Math.sin(walkPitch) * d,
    walkPos.z - Math.cos(walkYaw) * cosP * d,
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
// PAPER AIRPLANE MODE
// =============================================
let planeActive = false;
let planeYaw = 0, planePitch = 0;

const PLANE_SPEED     = 300;  // cm/s
const PLANE_GRAVITY   = 0.4;  // rad/s — le nez tombe naturellement
const PLANE_PITCH_RT  = 1.6;  // rad/s — vitesse de cabrage clavier
const PLANE_YAW_RT    = 1.2;  // rad/s — vitesse de virage clavier

export function isPlaneActive() { return planeActive; }

export function togglePlane() {
  planeActive ? exitPlane() : enterPlane();
}

export function enterPlane() {
  exitWalk();
  exit2D();
  planeActive = true;

  // Initialise orientation depuis la caméra courante
  const dir = new THREE.Vector3().subVectors(controls.target, camera.position).normalize();
  planeYaw   = Math.atan2(-dir.x, -dir.z);
  planePitch = Math.asin(Math.max(-1, Math.min(1, dir.y)));

  walkPos.x = camera.position.x;
  walkPos.y = camera.position.y;
  walkPos.z = camera.position.z;

  controls.enableRotate = false;
  controls.enablePan    = false;
  controls.enableZoom   = false;

  const c = document.getElementById('controls');
  if (c) c.textContent = '✈ Avion en papier | ←→ : virer | ↑↓ : cabrer/piquer | Échap : quitter';
  requestRender();
}

export function exitPlane() {
  if (!planeActive) return;
  planeActive = false;
  keysPressed.clear();
  controls.enableRotate = true;
  controls.enablePan    = true;
  controls.enableZoom   = true;
  const c = document.getElementById('controls');
  if (c) c.textContent = defaultControlsHint;
  requestRender();
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

let _savedFog = null;

export function enter2DTop() {
  exitWalk();
  exitWalk();
  _savedFog = scene.fog;
  scene.fog = null; // le fog à Y=2000 assombrit ~70% de la scène

  if (!orthoCamera) {
    orthoCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 5000);
    orthoCamera.layers.enable(LAYER_EQUIPMENT);
    orthoCamera.layers.enable(LAYER_FURNITURE);
    orthoCamera.layers.enable(LAYER_NETWORKS);
    orthoCamera.layers.enable(LAYER_GLB);
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
  scene.fog = _savedFog; // restaurer le fog
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

export function removeWalkFollower(obj) {
  const idx = walkFollowers.indexOf(obj);
  if (idx !== -1) walkFollowers.splice(idx, 1);
}

// Followers dont rotation.x suit le pitch de la caméra walk
const pitchFollowers = [];
export function addWalkPitchFollower(obj) { pitchFollowers.push(obj); }

// Tickers d'animation : fn(dt, isMovingForward) appelé à chaque frame walk
const animTickers = [];
export function registerAnimTicker(fn) { animTickers.push(fn); }

export function setInitialWalkPos(x, z) {
  if (!walkActive) { walkPos.x = x; walkPos.z = z; }
}

let renderPending = false;
let dampingFrames = 0;
const DAMPING_TAIL = 60; // frames de damping après interaction
let _lastFrameTime = 0;

export function requestRender() {
  if (renderPending) return;
  renderPending = true;
  requestAnimationFrame(renderFrame);
}

export function startDamping() {
  dampingFrames = DAMPING_TAIL;
  requestRender();
}

function renderFrame(now) {
  const dt = _lastFrameTime ? Math.min((now - _lastFrameTime) / 1000, 0.1) : 0;
  _lastFrameTime = now;
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
      { walkPos.x -= fwdX; walkPos.z -= fwdZ; }
    if (!keysPressed.has('CtrlArrowDown') && !keysPressed.has('AltArrowDown') && (keysPressed.has('ArrowDown') || keysPressed.has('s')))
      { walkPos.x += fwdX; walkPos.z += fwdZ; }
    if (keysPressed.has('a'))
      { walkPos.x -= rgtX; walkPos.z -= rgtZ; }
    if (keysPressed.has('d'))
      { walkPos.x += rgtX; walkPos.z += rgtZ; }

    updateWalkLook();
  }

  // ── Mode avion en papier ─────────────────────────────────────
  if (planeActive) {
    // Virage gauche/droite
    if (keysPressed.has('ArrowLeft'))  planeYaw += PLANE_YAW_RT  * dt;
    if (keysPressed.has('ArrowRight')) planeYaw -= PLANE_YAW_RT  * dt;
    // Cabrer / piquer
    if (keysPressed.has('ArrowUp'))   planePitch += PLANE_PITCH_RT * dt;
    if (keysPressed.has('ArrowDown')) planePitch -= PLANE_PITCH_RT * dt;
    // Gravité : le nez retombe si on ne cabre pas activement
    const pitchTarget = keysPressed.has('ArrowUp') ? planePitch : planePitch - PLANE_GRAVITY * dt;
    planePitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 4, pitchTarget));

    // Déplacement dans la direction du nez
    const cosP = Math.cos(planePitch);
    walkPos.x -= Math.sin(planeYaw) * cosP * PLANE_SPEED * dt;
    walkPos.z -= Math.cos(planeYaw) * cosP * PLANE_SPEED * dt;
    walkPos.y += Math.sin(planePitch) * PLANE_SPEED * dt;

    // Mise à jour caméra (réutilise walkYaw/walkPitch/walkPos)
    walkYaw   = planeYaw;
    walkPitch = planePitch;
    updateWalkLook();
    requestRender();
  }

  // Mouvement du personnage en mode perspective (hors walk mode)
  if (!walkActive && moveKeysDown.size > 0) {
    for (const obj of walkFollowers) {
      if (moveKeysDown.has('ArrowLeft'))  obj.rotation.y += PERSP_ROT * dt;
      if (moveKeysDown.has('ArrowRight')) obj.rotation.y -= PERSP_ROT * dt;
      const step = PERSP_SPEED * dt;
      if (moveKeysDown.has('ArrowUp')   || moveKeysDown.has('w') || moveKeysDown.has('W'))
        { obj.position.x -= Math.sin(obj.rotation.y) * step; obj.position.z -= Math.cos(obj.rotation.y) * step; }
      if (moveKeysDown.has('ArrowDown') || moveKeysDown.has('s') || moveKeysDown.has('S'))
        { obj.position.x += Math.sin(obj.rotation.y) * step; obj.position.z += Math.cos(obj.rotation.y) * step; }
    }
    requestRender();
  }

  // Followers (ex: costume) calqués sur position/orientation de la caméra
  if (walkActive) {
    for (const obj of walkFollowers) {
      obj.position.x = walkPos.x;
      obj.position.z = walkPos.z;
      obj.rotation.y = walkYaw;
    }
    for (const obj of pitchFollowers) {
      obj.rotation.x = (obj.userData.baseRotX ?? 0) - walkPitch;
    }
  }
    // Tickers d'animation — isMoving indépendant du walk mode
  {
    const isMoving = moveKeysDown.size > 0;
    for (const fn of animTickers) fn(dt, isMoving, walkActive);
  }

  redrawMinimap(); // toujours à jour (walk mode ET déplacement manuel en vue perspective)

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
  if (MOVE_KEYS.has(e.key)) { moveKeysDown.add(e.key); requestRender(); }
  if (e.key === 'Escape' && walkActive)  { exitWalk();  requestRender(); return; }
  if (e.key === 'Escape' && planeActive) { exitPlane(); requestRender(); return; }
  if (planeActive) {
    if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) {
      keysPressed.add(e.key); e.preventDefault(); requestRender();
    }
    return;
  }
  if (e.key === 'p' || e.key === 'P') {
    exitWalk();
    exit2D();
    camera.position.set(...VIEWS.perspective.pos);
    controls.target.set(...VIEWS.perspective.target);
    controls.update();
    requestRender();
    return;
  }
  if (e.key === 'm' || e.key === 'M') { resumeWalk(); return; }
  if (e.key === 't' || e.key === 'T') { is2D ? exit2D() : enter2DTop(); requestRender(); return; }
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
  moveKeysDown.delete(e.key);
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
