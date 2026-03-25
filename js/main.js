import * as THREE from 'three';
import {
  GARDEN_JC_Z,
  LAYER_EQUIPMENT,
  LAYER_FURNITURE,
  LAYER_NETWORKS,
  LAYER_GLB,
} from './config.js';
import { scene, camera, renderer } from './scene.js';
import { loadFont } from './ui/labels.js';
import { requestRender } from './cameraManager.js';
import { buildWalls } from './structure/walls.js';
import { buildKitchen } from './structure/kitchen.js';
import { buildKallax } from './furniture/kallax.js';
import { buildBed } from './furniture/bed.js';
import { buildMirrors } from './furniture/mirrors.js';
import { buildChair } from './furniture/chair.js';
import { buildDesks } from './furniture/desks.js';
import { buildLaptop } from './furniture/laptop.js';
import { buildMackapar } from './furniture/mackapar.js';
import { buildDecor } from './decor/decor.js';
import { buildGarden } from './furniture/garden.js';
import { buildAltappen } from './furniture/altappen.js';
import { buildBackpacks } from './decor/backpacks.js';
import { buildTV } from './furniture/tv.js';
import { buildSunnersta } from './furniture/sunnersta.js';
import { buildAirPerformer } from './furniture/airPerformer.js';
import { buildScooter } from './decor/scooter.js';
import { buildSneakers } from './decor/sneakers.js';
import { buildCasquettes } from './decor/casquettes.js';
import { buildShoeHatRack } from './decor/shoehatrack.js';
import { buildWalkingMan } from './decor/walkingMan.js';
import { buildLamp } from './furniture/lamp.js';
import { buildMeubleT } from './furniture/meubleT.js';
import { buildBathroom } from './structure/bathroom.js';
import {
  buildGroundPlane, buildParquetMesh, buildTileMesh,
  buildConcreteSlab, buildGardenSlab, buildCeiling,
} from './structure/floor.js';
import { buildGrid } from './ui/grid.js';
import { buildMinimap } from './ui/minimap.js';
import { buildFloorPlan } from './ui/floorplan.js';
import { buildDevtools } from './ui/devtools.js';
import { buildInventory } from './ui/inventory.js';
import { initEvents } from './ui/events.js';

// ── Font ──────────────────────────────────────────────────────────────────────
await loadFont();

// ── Helper : tagger les objets ajoutés pendant un build ──────────────────────
function buildOnLayer(buildFn, layer) {
  const before = new Set();
  scene.traverse((obj) => before.add(obj));
  buildFn(scene);
  scene.traverse((obj) => {
    if (!before.has(obj)) obj.layers.set(obj.userData?.layerOverride ?? layer);
  });
}

// ── Activer tous les layers sur la caméra ─────────────────────────────────────
camera.layers.enable(LAYER_EQUIPMENT);
camera.layers.enable(LAYER_FURNITURE);
camera.layers.enable(LAYER_NETWORKS);
camera.layers.enable(LAYER_GLB);

// ── Construction de la scène ──────────────────────────────────────────────────

// Layer 0 : structure
buildWalls(scene);
buildGroundPlane(scene);
buildConcreteSlab(scene);
buildGardenSlab(scene);
buildCeiling(scene);

// Layer 1 : équipements
buildOnLayer(buildKitchen,  LAYER_EQUIPMENT);
buildOnLayer(buildBathroom, LAYER_EQUIPMENT);

// Layer 2 : mobilier
buildOnLayer(buildKallax,      LAYER_FURNITURE);
buildOnLayer(buildBed,         LAYER_FURNITURE);
buildOnLayer(buildMirrors,     LAYER_FURNITURE);
buildOnLayer(buildChair,       LAYER_FURNITURE);
buildOnLayer(buildDesks,       LAYER_FURNITURE);
buildOnLayer(buildLaptop,      LAYER_FURNITURE);
buildOnLayer(buildMackapar,    LAYER_FURNITURE);
buildOnLayer(buildDecor,       LAYER_FURNITURE);
buildOnLayer(buildGarden,      LAYER_FURNITURE);
buildAltappen(scene);
buildBackpacks(scene);
buildOnLayer(buildTV,          LAYER_FURNITURE);
buildOnLayer(buildSunnersta,   LAYER_FURNITURE);
buildOnLayer(buildAirPerformer,LAYER_FURNITURE);
buildOnLayer(buildScooter,     LAYER_FURNITURE);
buildSneakers(scene);
buildCasquettes(scene);
buildShoeHatRack(scene);
buildWalkingMan(scene);
buildOnLayer(buildMeubleT, LAYER_FURNITURE);
buildLamp(scene);

// Couloir (structure + placard)
// Sols texturés
buildParquetMesh(scene);
buildTileMesh(scene);

// ── UI ────────────────────────────────────────────────────────────────────────
const gridGroup = buildGrid(scene);
gridGroup.visible = false;
buildMinimap();
buildDevtools(scene, renderer);
const openInventory = buildInventory(scene);
document.getElementById('inventory-open')?.addEventListener('click', openInventory);

// Snapshot des objets "bâtiment" (avant ajout du plan)
const buildingChildren = scene.children.filter((c) => !c.isLight);

// Jardin : délimitation en pointillés
{
  const Y = 5;
  const gardenMat = new THREE.LineDashedMaterial({ color: 0x4a9e54, dashSize: 8, gapSize: 4 });
  const JC_Z = GARDEN_JC_Z;
  const pts = [
    [-10, -10], [-10, -140],
    [-10, -140], [310, JC_Z],
    [310, JC_Z], [310, -10],
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

// Plan 2D (caché par défaut)
const floorPlanGroup = buildFloorPlan();
floorPlanGroup.visible = false;
scene.add(floorPlanGroup);

// ── Event handlers (UI, toggles, VR, vues caméra) ────────────────────────────
initEvents({ gridGroup, floorPlanGroup, buildingChildren });

// ── Premier rendu ─────────────────────────────────────────────────────────────
requestRender();
window.__requestRender = requestRender;
window.__scene = scene;
