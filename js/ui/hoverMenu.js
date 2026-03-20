import * as THREE from 'three';

const raycaster = new THREE.Raycaster();
raycaster.layers.enableAll(); // intersect objects on any layer
const pointer   = new THREE.Vector2();

// Map<actionId, { getLabel: () => string, execute: () => void }>
const actionRegistry = new Map();

// Interactive objects collected at init (groups/meshes with userData.hoverAction)
let targets = [];

/** Add a single target after init (for async-loaded objects like GLBs). */
export function addHoverTarget(obj) {
  if (!targets.includes(obj)) targets.push(obj);
}

let menuEl = null;
let labelEl = null;
let btnEl   = null;
let hideTimer = null;
let currentActionId = null;

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Register an interactive action.
 * @param {string} actionId - must match userData.hoverAction.actionId on the 3D object
 * @param {{ getLabel: () => string, execute: () => void }} config
 */
export function registerHoverAction(actionId, config) {
  actionRegistry.set(actionId, config);
}

/**
 * Initialize the hover menu after the scene is fully built.
 */
export function initHoverMenu(renderer, camera, scene) {
  menuEl  = document.getElementById('hover-menu');
  labelEl = menuEl.querySelector('.hm-label');
  btnEl   = menuEl.querySelector('.hm-btn');

  // Collect all tagged objects once
  scene.traverse(obj => {
    if (obj.userData.hoverAction) targets.push(obj);
  });

  // Button action
  btnEl.addEventListener('click', e => {
    e.stopPropagation();
    const cfg = actionRegistry.get(currentActionId);
    if (cfg) {
      cfg.execute();
      btnEl.textContent = cfg.getLabel();
    }
  });

  // Keep menu alive when cursor is inside it
  menuEl.addEventListener('pointerenter', cancelHide);
  menuEl.addEventListener('pointerleave', scheduleHide);

  // Throttled pointer tracking (~30 fps)
  let lastMove = 0;
  renderer.domElement.addEventListener('pointermove', e => {
    const now = performance.now();
    if (now - lastMove < 32) return;
    lastMove = now;

    onPointerMove(e, renderer, camera);
  });

  renderer.domElement.addEventListener('pointerleave', scheduleHide);
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal
// ─────────────────────────────────────────────────────────────────────────────

function onPointerMove(e, renderer, camera) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
  pointer.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);

  // Only raycast against registered interactive objects
  const hits = raycaster.intersectObjects(targets, true);

  let hovered = null;
  for (const hit of hits) {
    const action = resolveAction(hit.object);
    if (action) { hovered = { action, x: e.clientX, y: e.clientY }; break; }
  }

  if (hovered) {
    cancelHide();
    showMenu(hovered.action, hovered.x, hovered.y);
    renderer.domElement.style.cursor = 'pointer';
  } else {
    scheduleHide();
    renderer.domElement.style.cursor = '';
  }
}

/** Walk up the parent chain to find the nearest hoverAction. */
function resolveAction(obj) {
  let cur = obj;
  while (cur) {
    if (cur.userData?.hoverAction) return cur.userData.hoverAction;
    cur = cur.parent;
  }
  return null;
}

function showMenu({ label, actionId }, mouseX, mouseY) {
  const cfg = actionRegistry.get(actionId);
  if (!cfg) return;

  currentActionId     = actionId;
  labelEl.textContent = label;
  btnEl.textContent   = cfg.getLabel();

  // Pre-position before making visible
  placeNearCursor(mouseX, mouseY);
  menuEl.classList.remove('hm-hidden');
  // Refine after layout is known
  requestAnimationFrame(() => placeNearCursor(mouseX, mouseY));
}

function placeNearCursor(mx, my) {
  const mw = menuEl.offsetWidth  || 160;
  const mh = menuEl.offsetHeight || 70;
  const gap = 14;

  let x = mx + gap;
  let y = my - mh / 2;

  if (x + mw > window.innerWidth  - 8) x = mx - mw - gap;
  if (y < 8)                           y = 8;
  if (y + mh > window.innerHeight - 8) y = window.innerHeight - mh - 8;

  menuEl.style.left = x + 'px';
  menuEl.style.top  = y + 'px';
}

function scheduleHide() {
  if (!hideTimer) hideTimer = setTimeout(hideMenu, 420);
}

function cancelHide() {
  clearTimeout(hideTimer);
  hideTimer = null;
}

function hideMenu() {
  menuEl.classList.add('hm-hidden');
  hideTimer       = null;
  currentActionId = null;
  if (menuEl) menuEl.style.pointerEvents = '';
}
