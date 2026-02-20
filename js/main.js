import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'; // pour la caméra ortho 2D (les controls 3D sont dans scene.js)
import { ROOM_W, ROOM_D, WALL_H, DOOR_START, DOOR_END, NICHE_DEPTH, KITCHEN_Z, GARDEN_JC_Z, LAYER_STRUCTURE, LAYER_EQUIPMENT, LAYER_FURNITURE, LAYER_NETWORKS } from './config.js';
import { scene, camera, renderer, controls } from './scene.js';
import { allBricks } from './brickHelpers.js';
import { loadFont } from './labels.js';
import { buildWalls } from './walls.js';
import { buildKitchen } from './kitchen.js';
import { buildKallax } from './kallax.js';
import { buildBed } from './bed.js';
import { buildMirrors } from './mirrors.js';
import { buildChair } from './chair.js';
import { buildDesks } from './desks.js';
import { buildLaptop } from './laptop.js';
import { buildMackapar } from './mackapar.js';
import { buildDecor } from './decor.js';
import { buildCorridor } from './corridor.js';
import { buildBathroom } from './bathroom.js';
import { buildFloor, buildParquet } from './floor.js';
import { buildInstancedMeshes } from './instancedMeshes.js';
import { buildGrid } from './grid.js';
import { buildMinimap } from './minimap.js';
import { buildFloorPlan } from './floorplan.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';

// Charger la font avant de construire les labels
await loadFont();

// Helper : tag les objets ajoutés à scene pendant un build
function buildOnLayer(buildFn, layer) {
  const before = new Set(scene.children);
  buildFn(scene);
  for (const child of scene.children) {
    if (!before.has(child))
      child.traverse(obj => obj.layers.set(obj.userData?.layerOverride ?? layer));
  }
}

// Activer tous les layers sur la caméra
camera.layers.enable(LAYER_EQUIPMENT);
camera.layers.enable(LAYER_FURNITURE);
camera.layers.enable(LAYER_NETWORKS);

// Layer 0 : structure
buildWalls(scene);
buildFloor(allBricks);

// Layer 1 : équipements
buildOnLayer(buildKitchen, LAYER_EQUIPMENT);
buildOnLayer(buildBathroom, LAYER_EQUIPMENT);

// Layer 2 : mobilier
buildOnLayer(buildKallax, LAYER_FURNITURE);
buildOnLayer(buildBed, LAYER_FURNITURE);
buildOnLayer(buildMirrors, LAYER_FURNITURE);
buildOnLayer(buildChair, LAYER_FURNITURE);
buildOnLayer(buildDesks, LAYER_FURNITURE);
buildOnLayer(buildLaptop, LAYER_FURNITURE);
buildOnLayer(buildMackapar, LAYER_FURNITURE);
buildOnLayer(buildDecor, LAYER_FURNITURE);

// Layer 0 (structure) + layer 2 (placard) : géré dans corridor.js
buildCorridor(scene);

// Parquet après tous les builds (couvre séjour + couloir + SDB)
buildParquet(allBricks);

buildInstancedMeshes(scene, allBricks);
buildGrid(scene);
buildMinimap();

// =============================================
// VR MODE (Google Cardboard / WebXR)
// =============================================
const vrButton = VRButton.createButton(renderer);
vrButton.style.bottom = '60px';
document.body.appendChild(vrButton);

const vrRig = new THREE.Group();
scene.add(vrRig);
vrRig.add(camera);

let vrWalking = false;

// VR session handlers sont regroupés après la boucle de rendu

const xrController = renderer.xr.getController(0);
xrController.addEventListener('selectstart', () => { vrWalking = true; });
xrController.addEventListener('selectend', () => { vrWalking = false; });
vrRig.add(xrController);

// Snapshot des objets "bâtiment" (avant ajout du floor plan)
const buildingChildren = scene.children.filter(c => !c.isLight);

// Jardin : délimitation en pointillés (toujours visible)
{
  const Y = 0.5;
  const gardenMat = new THREE.LineDashedMaterial({
    color: 0x4a9e54, dashSize: 0.8, gapSize: 0.4,
  });
  const JC_Z = GARDEN_JC_Z;
  const pts = [
    [-1, -1],  [-1, -14],           // côté MA ext, 1.30m en -Z
    [-1, -14], [31, JC_Z],          // diagonale // MDiag → MB ext
    [31, JC_Z], [31, -1],           // côté MB ext, vertical
  ];
  for (let i = 0; i < pts.length; i += 2) {
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(pts[i][0], Y, pts[i][1]),
      new THREE.Vector3(pts[i + 1][0], Y, pts[i + 1][1]),
    ]);
    const line = new THREE.Line(geo, gardenMat);
    line.computeLineDistances();
    scene.add(line);
  }
}

// Floor plan (caché par défaut)
const floorPlanGroup = buildFloorPlan();
floorPlanGroup.visible = false;
scene.add(floorPlanGroup);

let floorPlanMode = false;
function toggleFloorPlan() {
  // Désactiver sol only si actif
  if (floorOnly) { floorOnly = false; document.getElementById('floor-toggle').textContent = 'Sol : OFF'; }
  floorPlanMode = !floorPlanMode;
  for (const obj of buildingChildren) obj.visible = !floorPlanMode;
  floorPlanGroup.visible = floorPlanMode;
  const btn = document.getElementById('plan-toggle');
  if (btn) btn.textContent = floorPlanMode ? 'Plan : ON' : 'Plan : OFF';
  requestRender();
}

document.getElementById('plan-toggle')?.addEventListener('click', toggleFloorPlan);

// =============================================
// X-RAY MODE
// =============================================
let xrayMode = false;
const savedMaterials = new Map();
const xrayMat = new THREE.MeshPhysicalMaterial({
  color: 0x44aaff,
  transparent: true,
  opacity: 0.15,
  roughness: 0.1,
  metalness: 0.3,
  side: THREE.DoubleSide,
  depthWrite: false,
});

function toggleXray() {
  xrayMode = !xrayMode;
  scene.traverse(obj => {
    if (!obj.isMesh && !obj.isInstancedMesh) return;
    if (obj.parent === floorPlanGroup) return;
    if (xrayMode) {
      savedMaterials.set(obj, obj.material);
      obj.material = xrayMat;
    } else {
      const orig = savedMaterials.get(obj);
      if (orig) obj.material = orig;
    }
  });
  if (!xrayMode) savedMaterials.clear();
  const btn = document.getElementById('xray-toggle');
  if (btn) btn.textContent = xrayMode ? 'X-Ray : ON' : 'X-Ray : OFF';
  requestRender();
}

document.getElementById('xray-toggle')?.addEventListener('click', toggleXray);

// =============================================
// LAYER TOGGLES
// =============================================
function makeLayerToggle(btnId, layer, label) {
  let on = true;
  document.getElementById(btnId)?.addEventListener('click', () => {
    on = !on;
    if (on) camera.layers.enable(layer);
    else camera.layers.disable(layer);
    const btn = document.getElementById(btnId);
    if (btn) btn.textContent = `${label} : ${on ? 'ON' : 'OFF'}`;
    requestRender();
  });
}
makeLayerToggle('layer-struct-toggle', LAYER_STRUCTURE, 'Structure');
makeLayerToggle('layer-equip-toggle', LAYER_EQUIPMENT, 'Équipements');
makeLayerToggle('layer-furniture-toggle', LAYER_FURNITURE, 'Mobilier');

// =============================================
// SOL ONLY MODE
// =============================================
let floorOnly = false;
const FLOOR_TYPES = new Set(['floor', 'tile', 'grass', 'ground', 'grid', 'parquet']);

function toggleFloorOnly() {
  // Désactiver plan si actif
  if (floorPlanMode) {
    floorPlanMode = false;
    floorPlanGroup.visible = false;
    document.getElementById('plan-toggle').textContent = 'Plan : OFF';
  }
  floorOnly = !floorOnly;
  for (const obj of buildingChildren) {
    obj.visible = floorOnly ? FLOOR_TYPES.has(obj.userData?.brickType) : true;
  }
  const btn = document.getElementById('floor-toggle');
  if (btn) btn.textContent = floorOnly ? 'Sol : ON' : 'Sol : OFF';
  requestRender();
}

document.getElementById('floor-toggle')?.addEventListener('click', toggleFloorOnly);

// =============================================
// CAMERAS
// =============================================
const CX = ROOM_W / 2, CY = WALL_H / 2, CZ = ROOM_D / 2;
const DIST = 60;

let activeCamera = camera;
let is2D = false;
let orthoCamera = null;
let orthoControls = null;

function updateOrthoFrustum() {
  if (!orthoCamera) return;
  const aspect = innerWidth / innerHeight;
  const viewH = 80;
  const viewW = viewH * aspect;
  orthoCamera.left = -viewW / 2;
  orthoCamera.right = viewW / 2;
  orthoCamera.top = viewH / 2;
  orthoCamera.bottom = -viewH / 2;
  orthoCamera.updateProjectionMatrix();
}

function enter2DTop() {
  exitWalk();
  exitWalk();

  if (!orthoCamera) {
    orthoCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 500);
  }
  updateOrthoFrustum();
  orthoCamera.up.set(0, 0, -1); // -Z vers le haut de l'écran (nord)
  orthoCamera.position.set(CX, 200, CZ);
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

function exit2D() {
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

// =============================================
// POV MODE (point de vue 1ère personne)
// =============================================
const POV_ROOMS = {
  living:   { x: ROOM_W / 2,                            z: ROOM_D / 2 },
  entry:    { x: (DOOR_START + ROOM_W) / 2,             z: ROOM_D + 7.5 },
  bathroom: { x: (-NICHE_DEPTH + DOOR_START) / 2,       z: (KITCHEN_Z + 60) / 2 },
  garden:   { x: 15,                                     z: -12 },
};

const keysPressed = new Set();

// POV = enterWalk à la position donnée
function enterPOV(x, z) {
  enterWalk(x, z);
}

addEventListener('keydown', (e) => {
  if (!walkActive) return;
  const k = e.key;
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(k)) {
    keysPressed.add(k);
    e.preventDefault();
    requestRender();
    return;
  }
  const lk = k.toLowerCase();
  if ('zqsdwa'.includes(lk) && lk.length === 1) {
    keysPressed.add(lk);
    e.preventDefault();
    requestRender();
  }
});

addEventListener('keyup', (e) => {
  keysPressed.delete(e.key);
  keysPressed.delete(e.key.toLowerCase());
});

// =============================================
// WALK MODE (marche libre première personne)
// =============================================
const WALK_H = 17; // 1.70m
const WALK_SPEED = 0.2;
const MOUSE_SENS = 0.002;

let walkActive = false;
let walkYaw = 0, walkPitch = 0;
const walkPos = { x: 0, y: WALK_H, z: 0 };
const defaultControlsHint = 'Clic gauche : orbiter | Molette : zoom | Clic droit : pan';

function enterWalk(x, z) {
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
  renderer.domElement.requestPointerLock();
  const c = document.getElementById('controls');
  if (c) c.textContent = 'Flèches / ZQSD : marcher | Souris : regarder | Échap : quitter';
  requestRender();
}

function exitWalk() {
  if (!walkActive) return;
  walkActive = false;
  keysPressed.clear();
  controls.enableRotate = true;
  controls.enablePan = true;
  controls.enableZoom = true;
  if (document.pointerLockElement) document.exitPointerLock();
  const c = document.getElementById('controls');
  if (c) c.textContent = defaultControlsHint;
  requestRender();
}

function updateWalkLook() {
  const d = 10;
  const cosP = Math.cos(walkPitch);
  controls.target.set(
    walkPos.x + Math.sin(walkYaw) * cosP * d,
    walkPos.y + Math.sin(walkPitch) * d,
    walkPos.z + Math.cos(walkYaw) * cosP * d,
  );
  camera.position.set(walkPos.x, walkPos.y, walkPos.z);
  controls.update();
}

document.addEventListener('mousemove', (e) => {
  if (!walkActive || !document.pointerLockElement) return;
  walkYaw -= e.movementX * MOUSE_SENS;
  walkPitch = Math.max(-1.4, Math.min(1.4, walkPitch - e.movementY * MOUSE_SENS));
  updateWalkLook();
  requestRender();
});

document.addEventListener('pointerlockchange', () => {
  if (walkActive && !document.pointerLockElement) exitWalk();
});

// =============================================
// ANIMATE (render on demand)
// =============================================
let renderPending = false;
let dampingFrames = 0;
const DAMPING_TAIL = 60; // frames de damping après interaction

export function requestRender() {
  if (renderPending) return;
  renderPending = true;
  requestAnimationFrame(renderFrame);
}

// Déclencher un rendu continu pendant N frames (damping / inertie)
function startDamping() {
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

    // Flèches haut/bas + ZQSD/WASD = translation
    if (keysPressed.has('ArrowUp') || keysPressed.has('z') || keysPressed.has('w'))
      { walkPos.x += fwdX; walkPos.z += fwdZ; }
    if (keysPressed.has('ArrowDown') || keysPressed.has('s'))
      { walkPos.x -= fwdX; walkPos.z -= fwdZ; }
    if (keysPressed.has('q') || keysPressed.has('a'))
      { walkPos.x -= rgtX; walkPos.z -= rgtZ; }
    if (keysPressed.has('d'))
      { walkPos.x += rgtX; walkPos.z += rgtZ; }

    updateWalkLook();
  }

  if (is2D && orthoControls) orthoControls.update();
  else controls.update();
  renderer.render(scene, activeCamera);

  // Continuer le rendu si interaction active ou damping en cours
  if (walkActive && keysPressed.size > 0) requestRender();
  if (dampingFrames > 0) { dampingFrames--; requestRender(); }
}

// VR : setAnimationLoop séparé (toujours 60fps en XR)
renderer.xr.addEventListener('sessionstart', () => {
  exitWalk(); exit2D();
  controls.enabled = false;
  vrRig.position.set(ROOM_W / 2, WALK_H, ROOM_D / 2);
  const hint = document.createElement('div');
  hint.textContent = 'Tap écran ou bouton Cardboard pour avancer';
  hint.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.8);color:#fff;padding:12px 24px;border-radius:8px;font-size:14px;z-index:9999;transition:opacity 0.5s';
  document.body.appendChild(hint);
  setTimeout(() => { hint.style.opacity = '0'; }, 4500);
  setTimeout(() => { hint.remove(); }, 5000);
  renderer.setAnimationLoop(() => {
    if (vrWalking) {
      const dir = new THREE.Vector3();
      camera.getWorldDirection(dir);
      dir.y = 0;
      dir.normalize();
      vrRig.position.addScaledVector(dir, WALK_SPEED);
    }
    renderer.render(scene, camera);
  });
});
renderer.xr.addEventListener('sessionend', () => {
  renderer.setAnimationLoop(null);
  vrWalking = false;
  controls.enabled = true;
  vrRig.position.set(0, 0, 0);
  camera.position.set(...VIEWS.perspective.pos);
  controls.target.set(...VIEWS.perspective.target);
  controls.update();
  requestRender();
});

// Déclencher le rendu sur les interactions OrbitControls
controls.addEventListener('change', requestRender);
controls.addEventListener('start', startDamping);
controls.addEventListener('end', startDamping);

// Premier rendu
requestRender();

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  if (is2D) updateOrthoFrustum();
  renderer.setSize(innerWidth, innerHeight);
  requestRender();
});

// =============================================
// VUES CAMERA
// =============================================
const ISO = 45;
const VIEWS = {
  perspective: { pos: [-20, 35, -15],      target: [CX, WALL_H / 3, CZ] },
  top:         { pos: [CX, DIST + 20, CZ], target: [CX, 0, CZ] },
  bottom:      { pos: [CX, -DIST, CZ],     target: [CX, 0, CZ] },
  front:       { pos: [CX, CY, CZ + DIST], target: [CX, CY, CZ] },
  back:        { pos: [CX, CY, CZ - DIST], target: [CX, CY, CZ] },
  left:        { pos: [CX - DIST, CY, CZ], target: [CX, CY, CZ] },
  right:       { pos: [CX + DIST, CY, CZ], target: [CX, CY, CZ] },
  'iso-se':    { pos: [CX + ISO, ISO, CZ + ISO], target: [CX, 0, CZ] },
  'iso-nw':    { pos: [CX - ISO, ISO, CZ - ISO], target: [CX, 0, CZ] },
};

// Position initiale = vue perspective
camera.position.set(...VIEWS.perspective.pos);
controls.target.set(...VIEWS.perspective.target);
controls.update();

// Modal vues
const viewsOverlay = document.getElementById('views-modal-overlay');
function openViewsModal() { viewsOverlay.classList.add('visible'); }
function closeViewsModal() { viewsOverlay.classList.remove('visible'); }

document.getElementById('views-toggle')?.addEventListener('click', openViewsModal);
document.getElementById('views-modal-close')?.addEventListener('click', closeViewsModal);
viewsOverlay?.addEventListener('click', (e) => { if (e.target === viewsOverlay) closeViewsModal(); });

// Boutons vues classiques (sortent du mode POV et 2D)
document.querySelectorAll('#views-modal button[data-view]').forEach(btn => {
  btn.addEventListener('click', () => {
    closeViewsModal();
    if (btn.dataset.view === 'top2d') {
      enter2DTop();
      return;
    }
    exitWalk();
    exitWalk();
    exit2D();
    const v = VIEWS[btn.dataset.view];
    if (!v) return;
    camera.position.set(...v.pos);
    controls.target.set(...v.target);
    controls.update();
    requestRender();
  });
});

// Boutons POV par pièce
document.querySelectorAll('#views-modal button[data-pov]').forEach(btn => {
  btn.addEventListener('click', () => {
    closeViewsModal();
    const room = POV_ROOMS[btn.dataset.pov];
    if (room) enterPOV(room.x, room.z);
  });
});

// Clic minimap → mode POV dans la pièce
document.addEventListener('minimap-pov', (e) => {
  const { x, z } = e.detail;
  enterPOV(x, z);
});


console.log(`LEGO Room: ${ROOM_W}x${ROOM_D}, ${allBricks.length} briques`);
console.log(`Porte: studs ${DOOR_START}-${DOOR_END} (80cm), 30cm du mur gauche`);
