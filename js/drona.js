import * as THREE from 'three';
import { gltfLoader } from './loaders.js';
import { mergeGlbByMaterial } from './mergeUtils.js';
import { requestRender } from './cameraManager.js';
import { LAYER_GLB } from './config.js';

// =============================================
// DRONA — ikea_DRONA_black.glb, peint en rouge
// Template chargé une fois, cloné pour chaque instance
// =============================================

const redMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.8 });
const seamMat = new THREE.LineBasicMaterial({ color: 0x660000 }); // coutures rouge foncé

let _tpl = null;   // false = en cours de chargement, object = prêt
let _rawBox = null;
const _pending = [];

// Global sequential counter — assigned in declaration order (Kallax before Decor)
let _dronaCounter = 0;

function makeDronaLabel(n) {
  const S = 128;
  const canvas = document.createElement('canvas');
  canvas.width = S; canvas.height = S;
  const ctx = canvas.getContext('2d');
  // Circle background
  ctx.beginPath();
  ctx.arc(S / 2, S / 2, S / 2 - 3, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(136,0,0,0.6)';
  ctx.lineWidth = 4;
  ctx.stroke();
  // Number
  ctx.fillStyle = '#880000';
  ctx.font = `bold ${n > 9 ? 54 : 66}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(n), S / 2, S / 2 + 3);

  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: tex, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.renderOrder = 10;
  sprite.scale.set(13, 13, 1);
  return sprite;
}

function ensureLoaded() {
  if (_tpl !== null) return;
  _tpl = false;
  gltfLoader.load('media/ikea_DRONA_black.glb', (gltf) => {
    _tpl = gltf.scene;
    const rawSize = new THREE.Box3().setFromObject(_tpl).getSize(new THREE.Vector3());
    _tpl.scale.setScalar(38 / rawSize.z);
    _tpl.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(_tpl);
    _tpl.position.set(
      -(box.min.x + box.max.x) / 2,
      -(box.min.y + box.max.y) / 2,
      -(box.min.z + box.max.z) / 2,
    );
    _tpl.traverse(c => { if (c.isMesh) c.material = redMat; });
    mergeGlbByMaterial(_tpl);
    for (const fn of _pending) fn();
    _pending.length = 0;
    requestRender();
  }, undefined, err => console.error('ikea_DRONA_black.glb:', err));
}

// Clone le template (déjà dimensionné + centré) dans le group donné
function buildInstance(group) {
  const clone = _tpl.clone(true);
  clone.traverse(c => {
    c.layers.set(LAYER_GLB);
    if (c.isMesh) {
      c.material = redMat;
      c.castShadow = true;
      c.receiveShadow = true;
    } else if (c.isLine) {
      c.visible = false;
    }
  });
  group.add(clone);
}

// ── API publique ────────────────────────────────────────────────────────────

export class Drona {
  constructor() {
    this.number = ++_dronaCounter;
    this.group = new THREE.Group();
    this.group.userData.dronaNumber = this.number;
    this.group.userData.inventoryId = `drona-${this.number}`;

    // Label positioned above center by default; setLabelUp() adjusts for pivoted dronas
    this._label = makeDronaLabel(this.number);
    this._label.position.set(0, 22, 0);
    this.group.add(this._label);

    ensureLoaded();
    if (_tpl) buildInstance(this.group);
    else _pending.push(() => buildInstance(this.group));
  }

  // Call after rotation.z = ±π/2 is applied to this.group, so label is visually above
  setLabelUp() {
    // With rotation.z = π/2 on the group, local +X maps to parent +Y
    this._label.position.set(22, 0, 0);
  }
}

export function addSingleDrona(parent, cx, cy, cz, rotY = 0) {
  const n = ++_dronaCounter;
  const group = new THREE.Group();
  group.userData.dronaNumber = n;
  group.userData.inventoryId = `drona-${n}`;
  group.position.set(cx, cy, cz);
  if (rotY) group.rotation.y = rotY;

  const label = makeDronaLabel(n);
  label.position.set(0, 22, 0);
  group.add(label);

  parent.add(group);
  ensureLoaded();
  if (_tpl) buildInstance(group);
  else _pending.push(() => buildInstance(group));
}
