import * as THREE from 'three';
import { ROOM_W } from '../config.js';
import { KALLAX_SE_Z, KALLAX_SE_TOP, kallaxSEGroup } from './kallax.js';
import { KALLAX_DEPTH } from '../config.js';

// Meuble en T : pavé creux (ouvert sur l'avant)
const W = 22.5;  // largeur cm
const H = 55;    // hauteur cm
const D = 27.5;  // profondeur cm
const T = 1.5;   // épaisseur planches cm

// Position monde : collé contre mur B (X=ROOM_W), centré sur Kallax SE en Z
export const MEUBLE_T_X = ROOM_W - D / 2;  // 286.25
export const MEUBLE_T_Z = KALLAX_SE_Z;
export const MEUBLE_T_Y = KALLAX_SE_TOP;

const woodMat = new THREE.MeshStandardMaterial({
  color: 0xc8a46e,  // bois clair (chêne/bouleau)
  roughness: 0.85,
});
const whiteMat = new THREE.MeshStandardMaterial({
  color: 0xf5f0e8,  // bois blanc
  roughness: 0.85,
});

function addPanel(group, x, y, z, sx, sy, sz, mat = woodMat) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
}

export function buildMeubleT(scene) {
  const group = new THREE.Group();
  group.userData.inventoryId = 'meuble-t';

  // Dessus
  addPanel(group,           0,   H - T / 2,           0,  W,   T,   D);
  // Dessous
  addPanel(group,           0,       T / 2,           0,  W,   T,   D);
  // Côté gauche
  addPanel(group, -W / 2 + T / 2,   H / 2,           0,  T,   H,   D);
  // Côté droit
  addPanel(group,  W / 2 - T / 2,   H / 2,           0,  T,   H,   D);
  // Ouvert sur toute la profondeur (pas de fond ni façade)

  // Planche blanche (barre du T) : 80×3.7×23.5cm
  // Fond calé contre le fond du pavé (Z = -D/2), à 33cm du bas
  const PL = 80, PT = 3.7, PD = 23.5;
  const plankZ = -D / 2 + PD / 2;          // -13.75 + 11.75 = -2.0
  const plankY = 33 + PT / 2;              // 34.85
  addPanel(group, 0, plankY, plankZ, PL, PT, PD, whiteMat);

  // Coordonnées locales dans kallaxSEGroup (rotation.y = π/2)
  // local_rot.y = -π  →  world: π/2 + (-π) = -π/2 ✓
  group.rotation.y = -Math.PI;
  group.position.set(0, KALLAX_SE_TOP, (KALLAX_DEPTH - D) / 2);
  kallaxSEGroup.add(group);
}
