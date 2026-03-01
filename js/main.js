import * as THREE from 'three';
import { ROOM_W, ROOM_D, DOOR_START, DOOR_END, GARDEN_JC_Z, LAYER_STRUCTURE, LAYER_EQUIPMENT, LAYER_FURNITURE, LAYER_NETWORKS } from './config.js';
import { scene, camera, renderer, controls } from './scene.js';
import { allBricks } from './brickHelpers.js';
import { loadFont } from './labels.js';
import { buildWalls, toggleEastDoor } from './walls.js';
import { buildKitchen } from './kitchen.js';
import { buildKallax } from './kallax.js';
import { buildBed, toggleBedStack } from './bed.js';
import { buildMirrors, setMirrorLayers } from './mirrors.js';
import { buildChair } from './chair.js';
import { buildDesks, toggleDesksHeight } from './desks.js';
import { buildLaptop } from './laptop.js';
import { buildMackapar } from './mackapar.js';
import { buildDecor } from './decor.js';
import { buildGarden } from './garden.js';
import { buildTV } from './tv.js';
import { buildSunnersta } from './sunnersta.js';
import { buildScooter } from './scooter.js';
import { buildCorridor } from './corridor.js';
import { buildBathroom } from './bathroom.js';
import { buildFloor, buildParquet, buildConcreteSlab } from './floor.js';
import { buildInstancedMeshes } from './instancedMeshes.js';
import { buildGrid } from './grid.js';
import { buildMinimap } from './minimap.js';
import { buildFloorPlan } from './floorplan.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import {
  VIEWS, POV_ROOMS,
  enterWalk, exitWalk, enterPOV,
  enter2DTop, exit2D, onResize,
  getOrthoCamera, getIs2D,
  requestRender, startDamping,
} from './cameraManager.js';
import {
  prepareBuildAnimation, startBuildAnimation,
  stopBuildAnimation, isBuildAnimating,
} from './buildAnimation.js';

// Charger la font avant de construire les labels
await loadFont();

// Helper : tag les objets ajoutés à scene pendant un build
function buildOnLayer(buildFn, layer) {
  const before = new Set();
  scene.traverse(obj => before.add(obj));
  buildFn(scene);
  scene.traverse(obj => {
    if (!before.has(obj))
      obj.layers.set(obj.userData?.layerOverride ?? layer);
  });
}

// Activer tous les layers sur la caméra
camera.layers.enable(LAYER_EQUIPMENT);
camera.layers.enable(LAYER_FURNITURE);
camera.layers.enable(LAYER_NETWORKS);

// Layer 0 : structure
buildWalls(scene);
buildFloor(allBricks);
buildConcreteSlab(scene);

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
buildOnLayer(buildGarden, LAYER_FURNITURE);
buildOnLayer(buildTV, LAYER_FURNITURE);
buildOnLayer(buildSunnersta, LAYER_FURNITURE);
buildOnLayer(buildScooter, LAYER_FURNITURE);

// Layer 0 (structure) + layer 2 (placard) : géré dans corridor.js
buildCorridor(scene);

// Parquet après tous les builds (couvre séjour + couloir + SDB)
buildParquet(allBricks);

buildInstancedMeshes(scene, allBricks);
prepareBuildAnimation(scene);
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

const xrController = renderer.xr.getController(0);
xrController.addEventListener('selectstart', () => { vrWalking = true; });
xrController.addEventListener('selectend', () => { vrWalking = false; });
vrRig.add(xrController);

// Snapshot des objets "bâtiment" (avant ajout du floor plan)
const buildingChildren = scene.children.filter(c => !c.isLight);

// Jardin : délimitation en pointillés (toujours visible)
{
  const Y = 5;
  const gardenMat = new THREE.LineDashedMaterial({
    color: 0x4a9e54, dashSize: 8, gapSize: 4,
  });
  const JC_Z = GARDEN_JC_Z;
  const pts = [
    [-10, -10],  [-10, -140],           // côté MA ext, 1.30m en -Z
    [-10, -140], [310, JC_Z],          // diagonale // MDiag → MB ext
    [310, JC_Z], [310, -10],           // côté MB ext, vertical
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
    const orthoCamera = getOrthoCamera();
    if (on) { camera.layers.enable(layer); if (orthoCamera) orthoCamera.layers.enable(layer); }
    else { camera.layers.disable(layer); if (orthoCamera) orthoCamera.layers.disable(layer); }
    const btn = document.getElementById(btnId);
    if (btn) btn.textContent = `${label} : ${on ? 'ON' : 'OFF'}`;
    requestRender();
  });
}
makeLayerToggle('layer-struct-toggle', LAYER_STRUCTURE, 'Structure');
makeLayerToggle('layer-equip-toggle', LAYER_EQUIPMENT, 'Équipements');
makeLayerToggle('layer-furniture-toggle', LAYER_FURNITURE, 'Mobilier');

// Toggle miroirs HD (patch layers)
{
  let on = false;
  document.getElementById('mirror-layers-toggle')?.addEventListener('click', () => {
    on = !on;
    setMirrorLayers(on);
    document.getElementById('mirror-layers-toggle').textContent = `Miroirs HD : ${on ? 'ON' : 'OFF'}`;
    requestRender();
  });
}

// =============================================
// BED TOGGLE (Utåker stack/unstack)
// =============================================
document.getElementById('bed-toggle')?.addEventListener('click', () => {
  const s = toggleBedStack();
  document.getElementById('bed-toggle').textContent = `Lit : ${s ? 'EMPILÉ' : 'DÉPLIÉ'}`;
  requestRender();
});

// =============================================
// DESK TOGGLE (sit / stand)
// =============================================
document.getElementById('desk-toggle')?.addEventListener('click', () => {
  const s = toggleDesksHeight();
  document.getElementById('desk-toggle').textContent = `Bureaux : ${s ? 'DEBOUT' : 'ASSIS'}`;
  requestRender();
});

document.getElementById('door-toggle')?.addEventListener('click', () => {
  const s = toggleEastDoor();
  document.getElementById('door-toggle').textContent = `Porte-fenêtre : ${s ? 'OUVERTE' : 'FERMÉE'}`;
  requestRender();
});

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
// ANIMATION CONSTRUCTION
// =============================================
const buildBtn = document.getElementById('build-anim-toggle');
if (buildBtn) {
  buildBtn.addEventListener('click', () => {
    if (isBuildAnimating()) {
      stopBuildAnimation();
      buildBtn.textContent = '▶ Construction';
    } else {
      startBuildAnimation();
      buildBtn.textContent = '■ Stop';
    }
  });
  document.addEventListener('build-animation-complete', () => {
    buildBtn.textContent = '▶ Construction';
  });
}

// =============================================
// VR session handlers
// =============================================
const WALK_SPEED = 2;

renderer.xr.addEventListener('sessionstart', () => {
  exitWalk(); exit2D();
  controls.enabled = false;
  vrRig.position.set(ROOM_W / 2, 170, ROOM_D / 2);
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

// Premier rendu
requestRender();

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  onResize();
  renderer.setSize(innerWidth, innerHeight);
  requestRender();
});

// =============================================
// VUES CAMERA (modal + raccourcis)
// =============================================
const viewsOverlay = document.getElementById('views-modal-overlay');
function openViewsModal() { viewsOverlay.classList.add('visible'); }
function closeViewsModal() { viewsOverlay.classList.remove('visible'); }

document.getElementById('views-toggle')?.addEventListener('click', openViewsModal);
document.getElementById('views-modal-close')?.addEventListener('click', closeViewsModal);

// Raccourcis Perspective / 2D Dessus
document.getElementById('quick-perspective')?.addEventListener('click', () => {
  exitWalk(); exitWalk(); exit2D();
  camera.position.set(...VIEWS.perspective.pos);
  controls.target.set(...VIEWS.perspective.target);
  controls.update();
  requestRender();
});
document.getElementById('quick-top2d')?.addEventListener('click', () => enter2DTop());
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
console.log(`Porte: ${DOOR_START}-${DOOR_END} (80cm), 30cm du mur gauche`);
