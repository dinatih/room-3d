import * as THREE from 'three';
import { KALLAX_SE_X, KALLAX_SE_Z, KALLAX_SE_TOP } from './kallax.js';

// Meuble en T : pavé creux (ouvert sur l'avant)
const W = 22.5;  // largeur cm
const H = 55;    // hauteur cm
const D = 27.5;  // profondeur cm
const T = 1.5;   // épaisseur planches cm

const woodMat = new THREE.MeshStandardMaterial({
  color: 0xc8a46e,  // bois clair (chêne/bouleau)
  roughness: 0.85,
});

function addPanel(group, x, y, z, sx, sy, sz) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), woodMat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
}

export function buildMeubleT(scene) {
  const group = new THREE.Group();

  // Dessus
  addPanel(group,           0,   H - T / 2,           0,  W,   T,   D);
  // Dessous
  addPanel(group,           0,       T / 2,           0,  W,   T,   D);
  // Côté gauche
  addPanel(group, -W / 2 + T / 2,   H / 2,           0,  T,   H,   D);
  // Côté droit
  addPanel(group,  W / 2 - T / 2,   H / 2,           0,  T,   H,   D);
  // Ouvert sur toute la profondeur (pas de fond ni façade)

  // Même orientation que le groupe Kallax en dessous (rotation.y = π/2)
  group.rotation.y = Math.PI / 2;

  // Posé sur le dessus du Kallax 2×1+2×1 pivotés, centré
  group.position.set(KALLAX_SE_X, KALLAX_SE_TOP, KALLAX_SE_Z);

  scene.add(group);
}
