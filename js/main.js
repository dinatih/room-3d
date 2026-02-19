import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ROOM_W, ROOM_D, WALL_H, DOOR_START, DOOR_END, NICHE_DEPTH, KITCHEN_Z } from './config.js';
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
import { buildMackapar } from './mackapar.js';
import { buildDecor } from './decor.js';
import { buildCorridor } from './corridor.js';
import { buildFloor } from './floor.js';
import { buildInstancedMeshes } from './instancedMeshes.js';
import { buildGrid } from './grid.js';
import { buildMinimap } from './minimap.js';
import { buildFloorPlan } from './floorplan.js';

// Charger la font avant de construire les labels
await loadFont();

buildWalls(scene);
buildKitchen(scene);
buildKallax(scene);
buildBed(scene);
buildMirrors(scene);
buildChair(scene);
buildDesks(scene);
buildMackapar(scene);
buildDecor(scene);
buildCorridor(scene);
buildFloor(allBricks);
buildInstancedMeshes(scene, allBricks);
buildGrid(scene);
buildMinimap();

// Snapshot des objets "bâtiment" (avant ajout du floor plan)
const buildingChildren = scene.children.filter(c => !c.isLight);

// Jardin : délimitation en pointillés (toujours visible)
{
  const Y = 0.5;
  const gardenMat = new THREE.LineDashedMaterial({
    color: 0x4a9e54, dashSize: 0.8, gapSize: 0.4,
  });
  const JC_Z = -14 - 19 * 32 / 31; // diagonale prolongée jusqu'à X=31
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
}

document.getElementById('xray-toggle')?.addEventListener('click', toggleXray);

// =============================================
// SOL ONLY MODE
// =============================================
let floorOnly = false;
const FLOOR_TYPES = new Set(['floor', 'grass', 'ground', 'grid']);

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
}

document.getElementById('floor-toggle')?.addEventListener('click', toggleFloorOnly);

// =============================================
// ZOOM TO CURSOR
// =============================================
let zoomToCursor = false;

document.getElementById('zoom-cursor-toggle')?.addEventListener('click', () => {
  zoomToCursor = !zoomToCursor;
  const btn = document.getElementById('zoom-cursor-toggle');
  if (btn) btn.textContent = zoomToCursor ? 'Zoom souris : ON' : 'Zoom souris : OFF';
});

const _zoomRay = new THREE.Raycaster();
const _zoomPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const _zoomHit = new THREE.Vector3();
const _zoomMouse = new THREE.Vector2();

renderer.domElement.addEventListener('wheel', (e) => {
  if (!zoomToCursor || is2D || povActive || walkActive) return;

  const rect = renderer.domElement.getBoundingClientRect();
  _zoomMouse.set(
    ((e.clientX - rect.left) / rect.width) * 2 - 1,
    -((e.clientY - rect.top) / rect.height) * 2 + 1
  );
  _zoomRay.setFromCamera(_zoomMouse, camera);
  if (!_zoomRay.ray.intersectPlane(_zoomPlane, _zoomHit)) return;

  const shift = _zoomHit.clone().sub(controls.target);
  const factor = e.deltaY < 0 ? 0.1 : -0.05;
  controls.target.addScaledVector(shift, factor);
}, true);

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
  exitPOV();
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
}

// =============================================
// POV MODE (point de vue 1ère personne)
// =============================================
const EYE_H = 18; // 1.8m
const POV_LOOK_DIST = 10;
const POV_ROT_SPEED = 0.03;

const POV_ROOMS = {
  living:   { x: ROOM_W / 2,                            z: ROOM_D / 2 },
  entry:    { x: (DOOR_START + ROOM_W) / 2,             z: ROOM_D + 7.5 },
  bathroom: { x: (-NICHE_DEPTH + DOOR_START) / 2,       z: (KITCHEN_Z + 60) / 2 },
  garden:   { x: 15,                                     z: -12 },
};

let povActive = false;
let povYaw = 0, povPitch = 0;
const povPos = { x: 0, y: EYE_H, z: 0 };
const keysPressed = new Set();

function enterPOV(x, z) {
  exit2D();
  exitWalk();
  povActive = true;
  povPos.x = x;
  povPos.y = EYE_H;
  povPos.z = z;
  povYaw = 0;
  povPitch = 0;
  camera.position.set(x, EYE_H, z);
  updatePOVLook();
  controls.enableRotate = false;
  controls.enablePan = false;
  controls.enableZoom = false;
}

function updatePOVLook() {
  const d = POV_LOOK_DIST;
  const cosP = Math.cos(povPitch);
  controls.target.set(
    povPos.x + Math.sin(povYaw) * cosP * d,
    povPos.y + Math.sin(povPitch) * d,
    povPos.z + Math.cos(povYaw) * cosP * d,
  );
  camera.position.set(povPos.x, povPos.y, povPos.z);
  controls.update();
}

function exitPOV() {
  if (!povActive) return;
  povActive = false;
  keysPressed.clear();
  controls.enableRotate = true;
  controls.enablePan = true;
  controls.enableZoom = true;
}

addEventListener('keydown', (e) => {
  if (!povActive && !walkActive) return;
  const k = e.key;
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(k)) {
    keysPressed.add(k);
    e.preventDefault();
    return;
  }
  if (walkActive) {
    const lk = k.toLowerCase();
    if ('zqsdwa'.includes(lk) && lk.length === 1) {
      keysPressed.add(lk);
      e.preventDefault();
    }
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
  exitPOV();
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
  walkYaw += e.movementX * MOUSE_SENS;
  walkPitch = Math.max(-1.4, Math.min(1.4, walkPitch - e.movementY * MOUSE_SENS));
  updateWalkLook();
});

document.addEventListener('pointerlockchange', () => {
  if (walkActive && !document.pointerLockElement) exitWalk();
});

// =============================================
// ANIMATE
// =============================================
(function animate() {
  requestAnimationFrame(animate);

  // Rotation fluide en mode POV
  if (povActive && keysPressed.size > 0) {
    if (keysPressed.has('ArrowLeft'))  povYaw -= POV_ROT_SPEED;
    if (keysPressed.has('ArrowRight')) povYaw += POV_ROT_SPEED;
    if (keysPressed.has('ArrowUp'))    povPitch = Math.min(povPitch + POV_ROT_SPEED, 1.2);
    if (keysPressed.has('ArrowDown'))  povPitch = Math.max(povPitch - POV_ROT_SPEED, -1.2);
    updatePOVLook();
  }

  // Déplacement en mode marche
  if (walkActive && keysPressed.size > 0) {
    const fwdX = Math.sin(walkYaw) * WALK_SPEED;
    const fwdZ = Math.cos(walkYaw) * WALK_SPEED;
    const rgtX = fwdZ, rgtZ = -fwdX;

    if (keysPressed.has('ArrowUp') || keysPressed.has('z') || keysPressed.has('w'))
      { walkPos.x += fwdX; walkPos.z += fwdZ; }
    if (keysPressed.has('ArrowDown') || keysPressed.has('s'))
      { walkPos.x -= fwdX; walkPos.z -= fwdZ; }
    if (keysPressed.has('ArrowLeft') || keysPressed.has('q') || keysPressed.has('a'))
      { walkPos.x -= rgtX; walkPos.z -= rgtZ; }
    if (keysPressed.has('ArrowRight') || keysPressed.has('d'))
      { walkPos.x += rgtX; walkPos.z += rgtZ; }

    updateWalkLook();
  }

  if (is2D && orthoControls) orthoControls.update();
  else controls.update();

  renderer.render(scene, activeCamera);
})();

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  if (is2D) updateOrthoFrustum();
  renderer.setSize(innerWidth, innerHeight);
});

// =============================================
// VUES CAMERA
// =============================================
const ISO = 45;
const VIEWS = {
  perspective: { pos: [50, 35, 55],       target: [CX, WALL_H / 3, CZ] },
  top:         { pos: [CX, DIST + 20, CZ], target: [CX, 0, CZ] },
  bottom:      { pos: [CX, -DIST, CZ],     target: [CX, 0, CZ] },
  front:       { pos: [CX, CY, CZ + DIST], target: [CX, CY, CZ] },
  back:        { pos: [CX, CY, CZ - DIST], target: [CX, CY, CZ] },
  left:        { pos: [CX - DIST, CY, CZ], target: [CX, CY, CZ] },
  right:       { pos: [CX + DIST, CY, CZ], target: [CX, CY, CZ] },
  'iso-se':    { pos: [CX + ISO, ISO, CZ + ISO], target: [CX, 0, CZ] },
  'iso-nw':    { pos: [CX - ISO, ISO, CZ - ISO], target: [CX, 0, CZ] },
};

// Boutons vues classiques (sortent du mode POV et 2D)
document.querySelectorAll('#views-list button[data-view]').forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.dataset.view === 'top2d') {
      enter2DTop();
      return;
    }
    exitPOV();
    exitWalk();
    exit2D();
    const v = VIEWS[btn.dataset.view];
    if (!v) return;
    camera.position.set(...v.pos);
    controls.target.set(...v.target);
    controls.update();
  });
});

// Boutons POV par pièce
document.querySelectorAll('#views-list button[data-pov]').forEach(btn => {
  btn.addEventListener('click', () => {
    const room = POV_ROOMS[btn.dataset.pov];
    if (room) enterPOV(room.x, room.z);
  });
});

// Clic minimap → mode POV dans la pièce
document.addEventListener('minimap-pov', (e) => {
  const { x, z } = e.detail;
  enterPOV(x, z);
});

// Toggle panneau vues
document.getElementById('views-toggle')?.addEventListener('click', () => {
  const list = document.getElementById('views-list');
  list.classList.toggle('hidden');
  const btn = document.getElementById('views-toggle');
  btn.textContent = list.classList.contains('hidden') ? 'Vues ▸' : 'Vues ▾';
});

// Bouton marche
document.getElementById('walk-btn')?.addEventListener('click', () => {
  enterWalk(ROOM_W / 2, ROOM_D / 2);
});

console.log(`LEGO Room: ${ROOM_W}x${ROOM_D}, ${allBricks.length} briques`);
console.log(`Porte: studs ${DOOR_START}-${DOOR_END} (80cm), 30cm du mur gauche`);
