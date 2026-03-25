import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { scene, camera, renderer, controls } from '../scene.js';
import {
  VIEWS, POV_ROOMS,
  enterWalk, exitWalk, enterPOV, resumeWalk,
  enter2DTop, exit2D, onResize,
  isWalkActive, requestRender, getOrthoCamera,
} from '../cameraManager.js';
import {
  ROOM_W, ROOM_D,
  LAYER_STRUCTURE, LAYER_EQUIPMENT, LAYER_FURNITURE, LAYER_GLB,
} from '../config.js';
import { toggleEastDoor } from '../structure/walls.js';
import { toggleFridgeDoor, toggleCabinetDoor } from '../structure/kitchen.js';
import { toggleBedStack, toggleBedVersion, toggleBedPosition, toggleSofaMode } from '../furniture/bed.js';
import { toggleSunnerstPosition } from '../furniture/sunnersta.js';
import { toggleDesksHeight, toggleDesk1Height, toggleDesk2Height, toggleDesk1Position, toggleDesk2Position } from '../furniture/desks.js';
import { toggleSmorkullPosition } from '../furniture/chair.js';
import { toggleAirPerformerPosition } from '../furniture/airPerformer.js';
import { setMirrorLayers } from '../furniture/mirrors.js';
import { toggleFreezerDoor } from '../decor/decor.js';
import { toggleWCLid } from '../structure/wc.js';
import { toggleCorridorDoors, toggleEntryDoor, toggleLivingDoor, toggleBathroomDoor } from '../structure/corridor.js';
import { toggleLamp } from '../furniture/lamp.js';
import { toggleCelShading } from './celShading.js';
import { setDronaLabelsVisible } from '../furniture/drona.js';
import { registerHoverAction, initHoverMenu } from './hoverMenu.js';
import { getWalkingMan } from '../decor/walkingMan.js';

export function initEvents({ gridGroup, floorPlanGroup, buildingChildren }) {

  // ── État des toggles ──────────────────────────────────────────────────────
  let eastDoorState = false, freezerState = false, fridgeState = false;
  let cabinetState = false, bedState = true,  desksState = false, bedPosIdx = 0, sofaModeState = false, sunnerstaPosIdx = 0, desk1PosIdx = 0, desk2PosIdx = 0, smorkullPosIdx = 0, apPosIdx = 0;
  let desk1State   = false, desk2State  = false, wcLidState = false;
  let corrDoorsState = false, entryDoorState = false;
  let livingDoorState = false, bathroomDoorState = false, lampState = false;

  // ── Fonctions toggle ──────────────────────────────────────────────────────
  function doToggleEastDoor() {
    eastDoorState = toggleEastDoor();
    document.getElementById('door-toggle').textContent = `Porte-fenêtre : ${eastDoorState ? 'OUVERTE' : 'FERMÉE'}`;
    requestRender();
  }
  function doToggleFreezer() {
    freezerState = toggleFreezerDoor();
    document.getElementById('freezer-toggle').textContent = `Congélateur : ${freezerState ? 'OUVERT' : 'FERMÉ'}`;
    requestRender();
  }
  function doToggleFridge() {
    fridgeState = toggleFridgeDoor();
    document.getElementById('fridge-toggle').textContent = `Réfrigérateur : ${fridgeState ? 'OUVERT' : 'FERMÉ'}`;
    requestRender();
  }
  function doToggleCabinet() {
    cabinetState = toggleCabinetDoor();
    document.getElementById('cabinet-toggle').textContent = `Meuble évier : ${cabinetState ? 'OUVERT' : 'FERMÉ'}`;
    requestRender();
  }
  function doToggleBed() {
    bedState = toggleBedStack();
    document.getElementById('bed-toggle').textContent = `Lit : ${bedState ? 'EMPILÉ' : 'DÉPLIÉ'}`;
    requestRender();
  }
  function doToggleDesks() {
    desksState = toggleDesksHeight();
    document.getElementById('desk-toggle').textContent = `Bureaux : ${desksState ? 'DEBOUT' : 'ASSIS'}`;
    requestRender();
  }
  function doToggleDesk1()    { desk1State        = toggleDesk1Height();  requestRender(); }
  function doToggleDesk2()    { desk2State        = toggleDesk2Height();  requestRender(); }
  function doToggleWCLid() {
    wcLidState = toggleWCLid();
    document.getElementById('wc-lid-toggle').textContent = `WC abattant : ${wcLidState ? 'OUVERT' : 'FERMÉ'}`;
    requestRender();
  }
  function doToggleCorridorDoors() {
    corrDoorsState = toggleCorridorDoors();
    document.getElementById('corr-doors-toggle').textContent = `Portes couloir : ${corrDoorsState ? 'OUVERTES' : 'FERMÉES'}`;
    requestRender();
  }
  function doToggleEntryDoor()    { entryDoorState    = toggleEntryDoor();    requestRender(); }
  function doToggleLivingDoor()   { livingDoorState   = toggleLivingDoor();   requestRender(); }
  function doToggleBathroomDoor() { bathroomDoorState = toggleBathroomDoor(); requestRender(); }
  function doToggleLamp() {
    lampState = toggleLamp();
    document.getElementById('lamp-toggle').textContent = `Lampe OLA : ${lampState ? 'ON' : 'OFF'}`;
  }

  // ── Hover menu (actions 3D au survol) ─────────────────────────────────────
  registerHoverAction('door-toggle',          { getLabel: () => eastDoorState     ? 'Fermer' : 'Ouvrir',       execute: doToggleEastDoor });
  registerHoverAction('freezer-toggle',       { getLabel: () => freezerState      ? 'Fermer' : 'Ouvrir',       execute: doToggleFreezer });
  registerHoverAction('fridge-toggle',        { getLabel: () => fridgeState       ? 'Fermer' : 'Ouvrir',       execute: doToggleFridge });
  registerHoverAction('cabinet-toggle',       { getLabel: () => cabinetState      ? 'Fermer' : 'Ouvrir',       execute: doToggleCabinet });
  registerHoverAction('bed-toggle',           { getLabel: () => bedState          ? 'Déplier' : 'Empiler',     execute: doToggleBed });
  registerHoverAction('bed-position',         { getLabel: () => ['Pos 2 (∥ mur B)', 'Pos 3 (⊥ mur B)', 'Pos 1 (diagonale)'][bedPosIdx], execute: () => { bedPosIdx = toggleBedPosition(); } });
  registerHoverAction('bed-sofa',             { getLabel: () => sofaModeState ? 'Lit double' : 'Double canapé', execute: () => { sofaModeState = toggleSofaMode(); } });
  registerHoverAction('sunnersta-position',   { getLabel: () => sunnerstaPosIdx === 0 ? 'Devant congélateur' : 'Contre mur B', execute: () => { sunnerstaPosIdx = toggleSunnerstPosition(); } });
  registerHoverAction('desks-toggle',         { getLabel: () => desksState        ? 'Mode assis' : 'Mode debout', execute: doToggleDesks });
  registerHoverAction('desk1-toggle',         { getLabel: () => desk1State        ? 'Mode assis' : 'Mode debout', execute: doToggleDesk1 });
  registerHoverAction('desk1-position',       { getLabel: () => desk1PosIdx === 0 ? 'Pos 2 (∥ mur C)' : 'Pos 1 (mur A)', execute: () => { desk1PosIdx = toggleDesk1Position(); } });
  registerHoverAction('desk2-position',       { getLabel: () => desk2PosIdx === 0 ? 'Espace de travail' : 'Position initiale', execute: () => { desk2PosIdx = toggleDesk2Position(); } });
  registerHoverAction('desk2-toggle',         { getLabel: () => desk2State        ? 'Mode assis' : 'Mode debout', execute: doToggleDesk2 });
  registerHoverAction('smorkull-position',    { getLabel: () => ['Espace détente (pos 2)', 'Pos 3', 'Position bureau (pos 1)'][smorkullPosIdx], execute: () => { smorkullPosIdx = toggleSmorkullPosition(); } });
  registerHoverAction('air-performer-position', { getLabel: () => apPosIdx === 0 ? 'Pos 2 (Z=20)' : 'Pos 1 (mur B)', execute: () => { apPosIdx = toggleAirPerformerPosition(); } });
  registerHoverAction('wc-lid-toggle',        { getLabel: () => wcLidState        ? 'Fermer' : 'Ouvrir',       execute: doToggleWCLid });
  registerHoverAction('corr-doors-toggle',    { getLabel: () => corrDoorsState    ? 'Fermer' : 'Ouvrir',       execute: doToggleCorridorDoors });
  registerHoverAction('entry-door-toggle',    { getLabel: () => entryDoorState    ? 'Fermer' : 'Ouvrir',       execute: doToggleEntryDoor });
  registerHoverAction('living-door-toggle',   { getLabel: () => livingDoorState   ? 'Fermer' : 'Ouvrir',       execute: doToggleLivingDoor });
  registerHoverAction('bathroom-door-toggle', { getLabel: () => bathroomDoorState ? 'Fermer' : 'Ouvrir',       execute: doToggleBathroomDoor });
  registerHoverAction('lamp-toggle',          { getLabel: () => lampState         ? 'Éteindre' : 'Allumer',    execute: doToggleLamp });
  initHoverMenu(renderer, camera, scene);

  // ── Boutons sidebar ───────────────────────────────────────────────────────
  document.getElementById('door-toggle')?.addEventListener('click', doToggleEastDoor);
  document.getElementById('freezer-toggle')?.addEventListener('click', doToggleFreezer);
  document.getElementById('fridge-toggle')?.addEventListener('click', doToggleFridge);
  document.getElementById('cabinet-toggle')?.addEventListener('click', doToggleCabinet);
  document.getElementById('bed-toggle')?.addEventListener('click', doToggleBed);
  document.getElementById('desk-toggle')?.addEventListener('click', doToggleDesks);
  document.getElementById('wc-lid-toggle')?.addEventListener('click', doToggleWCLid);
  document.getElementById('corr-doors-toggle')?.addEventListener('click', doToggleCorridorDoors);
  document.getElementById('lamp-toggle')?.addEventListener('click', doToggleLamp);

  document.getElementById('bed-version-toggle')?.addEventListener('click', () => {
    const isGlb = toggleBedVersion();
    document.getElementById('bed-version-toggle').textContent = `Lit : ${isGlb ? 'GLB' : 'PROCÉDURAL'}`;
    requestRender();
  });

  document.getElementById('resume-walk')?.addEventListener('click', () => resumeWalk());

  // ── Flèches → Walking Man (hors mode walk) ────────────────────────────────
  addEventListener('keydown', (e) => {
    if (isWalkActive()) return;
    const wm = getWalkingMan();
    if (!wm) return;
    const STEP = 10, ROT = 0.1;
    if      (e.key === 'ArrowUp')    { wm.position.x -= Math.sin(wm.rotation.y) * STEP; wm.position.z -= Math.cos(wm.rotation.y) * STEP; }
    else if (e.key === 'ArrowDown')  { wm.position.x += Math.sin(wm.rotation.y) * STEP; wm.position.z += Math.cos(wm.rotation.y) * STEP; }
    else if (e.key === 'ArrowLeft')  { wm.rotation.y += ROT; }
    else if (e.key === 'ArrowRight') { wm.rotation.y -= ROT; }
    else return;
    e.preventDefault();
    requestRender();
  });

  // ── Plan ──────────────────────────────────────────────────────────────────
  let floorPlanMode = false;
  document.getElementById('plan-toggle')?.addEventListener('click', () => {
    floorPlanMode = !floorPlanMode;
    for (const obj of buildingChildren) obj.visible = !floorPlanMode;
    floorPlanGroup.visible = floorPlanMode;
    const btn = document.getElementById('plan-toggle');
    if (btn) btn.textContent = floorPlanMode ? 'Plan : ON' : 'Plan : OFF';
    requestRender();
  });

  // ── X-Ray ─────────────────────────────────────────────────────────────────
  let xrayMode = false;
  const savedMaterials = new Map();
  const xrayMat = new THREE.MeshPhysicalMaterial({
    color: 0x44aaff, transparent: true, opacity: 0.15,
    roughness: 0.1, metalness: 0.3, side: THREE.DoubleSide, depthWrite: false,
  });
  document.getElementById('xray-toggle')?.addEventListener('click', () => {
    xrayMode = !xrayMode;
    scene.traverse((obj) => {
      if (!obj.isMesh && !obj.isInstancedMesh) return;
      if (obj.parent === floorPlanGroup) return;
      if (xrayMode) { savedMaterials.set(obj, obj.material); obj.material = xrayMat; }
      else { const orig = savedMaterials.get(obj); if (orig) obj.material = orig; }
    });
    if (!xrayMode) savedMaterials.clear();
    const btn = document.getElementById('xray-toggle');
    if (btn) btn.textContent = xrayMode ? 'X-Ray : ON' : 'X-Ray : OFF';
    requestRender();
  });

  // ── Layer toggles ─────────────────────────────────────────────────────────
  function makeLayerToggle(btnId, layer, label) {
    let on = true;
    document.getElementById(btnId)?.addEventListener('click', () => {
      on = !on;
      const orthoCamera = getOrthoCamera();
      if (on)  { camera.layers.enable(layer);  if (orthoCamera) orthoCamera.layers.enable(layer);  }
      else     { camera.layers.disable(layer); if (orthoCamera) orthoCamera.layers.disable(layer); }
      const btn = document.getElementById(btnId);
      if (btn) btn.textContent = `${label} : ${on ? 'ON' : 'OFF'}`;
      requestRender();
    });
  }
  makeLayerToggle('layer-struct-toggle',    LAYER_STRUCTURE, 'Structure');
  makeLayerToggle('layer-equip-toggle',     LAYER_EQUIPMENT, 'Équipements');
  makeLayerToggle('layer-furniture-toggle', LAYER_FURNITURE, 'Mobilier');
  makeLayerToggle('layer-glb-toggle',       LAYER_GLB,       'GLB');

  {
    let on = false;
    document.getElementById('mirror-layers-toggle')?.addEventListener('click', () => {
      on = !on;
      setMirrorLayers(on);
      document.getElementById('mirror-layers-toggle').textContent = `Miroirs HD : ${on ? 'ON' : 'OFF'}`;
      requestRender();
    });
  }

  // ── Numéros Drona ─────────────────────────────────────────────────────────
  {
    let dronaLabelsOn = false;
    document.getElementById('drona-labels-toggle')?.addEventListener('click', () => {
      dronaLabelsOn = !dronaLabelsOn;
      setDronaLabelsVisible(dronaLabelsOn);
      document.getElementById('drona-labels-toggle').textContent = `N° Drona : ${dronaLabelsOn ? 'ON' : 'OFF'}`;
    });
  }

  // ── Cel-shading ───────────────────────────────────────────────────────────
  document.getElementById('cel-toggle')?.addEventListener('click', () => {
    const s = toggleCelShading(scene);
    document.getElementById('cel-toggle').textContent = `Cel-Shading : ${s ? 'ON' : 'OFF'}`;
  });

  // ── Grille ────────────────────────────────────────────────────────────────
  document.getElementById('grid-toggle')?.addEventListener('click', () => {
    gridGroup.visible = !gridGroup.visible;
    document.getElementById('grid-toggle').textContent = `Grille : ${gridGroup.visible ? 'ON' : 'OFF'}`;
    requestRender();
  });

  // ── VR (Google Cardboard / WebXR) ─────────────────────────────────────────
  const vrButton = VRButton.createButton(renderer);
  vrButton.style.bottom = '60px';
  document.body.appendChild(vrButton);

  const vrRig = new THREE.Group();
  scene.add(vrRig);
  vrRig.add(camera);

  let vrWalking = false;
  const xrController = renderer.xr.getController(0);
  xrController.addEventListener('selectstart', () => { vrWalking = true; });
  xrController.addEventListener('selectend',   () => { vrWalking = false; });
  vrRig.add(xrController);

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
        dir.y = 0; dir.normalize();
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

  // ── Resize ────────────────────────────────────────────────────────────────
  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    onResize();
    renderer.setSize(innerWidth, innerHeight);
    requestRender();
  });

  // ── Vues caméra (modal + raccourcis) ──────────────────────────────────────
  const viewsOverlay = document.getElementById('views-modal-overlay');
  const openViewsModal  = () => viewsOverlay.classList.add('visible');
  const closeViewsModal = () => viewsOverlay.classList.remove('visible');

  document.getElementById('views-toggle')?.addEventListener('click', openViewsModal);
  document.getElementById('views-modal-close')?.addEventListener('click', closeViewsModal);
  viewsOverlay?.addEventListener('click', (e) => { if (e.target === viewsOverlay) closeViewsModal(); });

  document.getElementById('quick-perspective')?.addEventListener('click', () => {
    exitWalk(); exitWalk(); exit2D();
    camera.position.set(...VIEWS.perspective.pos);
    controls.target.set(...VIEWS.perspective.target);
    controls.update(); requestRender();
  });
  document.getElementById('quick-top2d')?.addEventListener('click', () => enter2DTop());

  document.querySelectorAll('#views-modal button[data-view]').forEach((btn) => {
    btn.addEventListener('click', () => {
      closeViewsModal();
      if (btn.dataset.view === 'top2d') { enter2DTop(); return; }
      exitWalk(); exitWalk(); exit2D();
      const v = VIEWS[btn.dataset.view];
      if (!v) return;
      camera.position.set(...v.pos);
      controls.target.set(...v.target);
      controls.update(); requestRender();
    });
  });

  document.querySelectorAll('#views-modal button[data-pov]').forEach((btn) => {
    btn.addEventListener('click', () => {
      closeViewsModal();
      const room = POV_ROOMS[btn.dataset.pov];
      if (room) enterPOV(room.x, room.z);
    });
  });

  document.addEventListener('minimap-pov', (e) => {
    const { x, z } = e.detail;
    enterPOV(x, z);
  });
}
