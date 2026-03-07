import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { requestRender } from './cameraManager.js';
import { LAYER_GLB } from './config.js';

// =============================================
// DRONA — ikea_DRONA_black.glb, peint en rouge
// Template chargé une fois, cloné pour chaque instance
// =============================================

const redMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.8 });

let _tpl = null;   // false = en cours de chargement, object = prêt
let _rawBox = null;
const _pending = [];

function ensureLoaded() {
  if (_tpl !== null) return;
  _tpl = false;
  new GLTFLoader().load('media/ikea_DRONA_black.glb', (gltf) => {
    _tpl = gltf.scene;
    // Le GLB n'a pas d'unités réelles garanties, mais les proportions du modèle
    // sont fidèles à la Drona réelle. On scale uniformément sur la profondeur
    // connue (38cm = axe Z du GLB) — largeur et hauteur suivent les proportions.
    const rawSize = new THREE.Box3().setFromObject(_tpl).getSize(new THREE.Vector3());
    _tpl.scale.setScalar(38 / rawSize.z);
    _tpl.updateMatrixWorld(true);
    // Centrer le template à l'origine
    const box = new THREE.Box3().setFromObject(_tpl);
    _tpl.position.set(
      -(box.min.x + box.max.x) / 2,
      -(box.min.y + box.max.y) / 2,
      -(box.min.z + box.max.z) / 2,
    );
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
      c.frustumCulled = false;
    }
  });
  group.add(clone);
}

// ── API publique ────────────────────────────────────────────────────────────

export class Drona {
  constructor() {
    this.group = new THREE.Group();
    ensureLoaded();
    if (_tpl) buildInstance(this.group);
    else _pending.push(() => buildInstance(this.group));
  }
}

export function addSingleDrona(parent, cx, cy, cz, rotY = 0) {
  const group = new THREE.Group();
  group.position.set(cx, cy, cz);
  if (rotY) group.rotation.y = rotY;
  parent.add(group);
  ensureLoaded();
  if (_tpl) buildInstance(group);
  else _pending.push(() => buildInstance(group));
}
