import * as THREE from 'three';
import { gltfLoader } from '../utils/loaders.js';
import { mergeGlbByMaterial } from '../utils/mergeUtils.js';
import { ROOM_W, LAYER_GLB } from '../config.js';
import { requestRender } from '../cameraManager.js';
import { addHoverTarget } from '../ui/hoverMenu.js';

let _trolley = null;
let sunnerstaPosIdx = 0;
let SUNNERSTA_POSITIONS = null;
let SURFACE_POSITIONS = null;

/** Groupe anchor pour tout ce qui est posé sur le Sunnersta. */
export const sunnerstaSurface  = new THREE.Group();
/** Groupe parent du mannequin + casquette (enfant de sunnerstaSurface). */
export const sunnerstaMannequin = new THREE.Group();

export function toggleSunnerstPosition() {
  sunnerstaPosIdx = (sunnerstaPosIdx + 1) % 2;
  const p = SUNNERSTA_POSITIONS[sunnerstaPosIdx];
  const s = SURFACE_POSITIONS[sunnerstaPosIdx];
  if (_trolley) {
    _trolley.rotation.y = p.ry;
    _trolley.position.set(p.x, _trolley.position.y, p.z);
    sunnerstaSurface.position.set(s.x, s.y, s.z);
    requestRender();
  }
  return sunnerstaPosIdx;
}

export function buildSunnersta(scene) {

  gltfLoader.load('media/sunnersta_trolley_ikea.glb', (gltf) => {
    const trolley = gltf.scene;
    _trolley = trolley;

    // Axe le plus grand → 90cm (hauteur Sunnersta réelle)
    // TODO: vérifier dimensions GLB brutes (calcul Python sur accessor min/max, potentiellement
    // faux car sans transforms de nœuds) : X≈114cm, Y≈97cm (min=-97→0), Z≈74cm.
    // Si décalage visuel constaté, recalculer avec Box3.setFromObject en console.
    const rawBox = new THREE.Box3().setFromObject(trolley);
    const rawSize = rawBox.getSize(new THREE.Vector3());
    const scaleF = 90 / Math.max(rawSize.x, rawSize.y, rawSize.z);
    trolley.scale.setScalar(scaleF);

    // ── Position 1 : face est contre mur B, centre Z=271.5 ─────────────────
    // Même orientation que la version procédurale :
    // longueur 56cm le long de Z, profondeur 36cm le long de X (vers mur B)
    trolley.rotation.y = Math.PI / 2;
    trolley.position.set(0, 0, 0);
    trolley.updateMatrixWorld(true);
    const box1 = new THREE.Box3().setFromObject(trolley);
    const cz1 = (box1.min.z + box1.max.z) / 2;
    const pos1 = { ry: Math.PI / 2, x: ROOM_W - box1.max.x, z: 271.5 - cz1 };

    // ── Position 2 : pivoté 90°, devant congélateur ─────────────────────────
    // Congélateur : centre X=24.5, FRZ_D=47 → face est (porte) à X=48
    const FRZ_EAST_X = 48;
    trolley.rotation.y = 0;
    trolley.position.set(0, 0, 0);
    trolley.updateMatrixWorld(true);
    const box2 = new THREE.Box3().setFromObject(trolley);
    const cz2 = (box2.min.z + box2.max.z) / 2;
    const pos2 = { ry: 0, x: FRZ_EAST_X - box2.min.x, z: 269.5 - cz2 };

    SUNNERSTA_POSITIONS = [pos1, pos2];

    // Positions du plateau (centre XZ du Sunnersta, Y=90 = hauteur réelle)
    const surfY = 90;
    SURFACE_POSITIONS = [
      { x: (box1.min.x + box1.max.x) / 2 + pos1.x, y: surfY, z: 271.5 },
      { x: 48 + (box2.max.x - box2.min.x) / 2,     y: surfY, z: 269.5 },
    ];

    // Appliquer position 1 (défaut)
    // Face est contre mur B (X=ROOM_W), sol à Y=0
    // Centre Z = 299.5 - 56/2 = 271.5 (identique à la version procédurale)
    trolley.rotation.y = pos1.ry;
    trolley.position.set(pos1.x, -box1.min.y, pos1.z);

    const s0 = SURFACE_POSITIONS[0];
    sunnerstaSurface.position.set(s0.x, s0.y, s0.z);
    sunnerstaSurface.add(sunnerstaMannequin);
    scene.add(sunnerstaSurface);

    trolley.userData.hoverAction = { label: 'Sunnersta', actionId: 'sunnersta-position' };

    trolley.traverse(c => {
      c.layers.set(LAYER_GLB); // inclut Mesh, Line, Points (contours GLB)
      if (c.isMesh) {
        c.castShadow = true;
        c.receiveShadow = true;
      }
    });

    mergeGlbByMaterial(trolley);
    scene.add(trolley);
    addHoverTarget(trolley);
    requestRender();
  }, undefined, err => console.error('sunnersta_trolley_ikea.glb:', err));
}
