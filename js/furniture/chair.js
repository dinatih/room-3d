import * as THREE from 'three';
import { gltfLoader } from '../utils/loaders.js';
import { mergeGlbByMaterial } from '../utils/mergeUtils.js';
import { requestRender } from '../cameraManager.js';
import { LAYER_GLB } from '../config.js';
import { addHoverTarget } from '../ui/hoverMenu.js';

/** Groupe parent de la chaise (+ bureau 2 en mode espace de travail). */
export const smorkullGroup = new THREE.Group();
smorkullGroup.userData.hoverAction = { label: 'Smörkull', actionId: 'smorkull-position' };

let smorkullPosIdx = 0;
let SMORKULL_POSITIONS = null; // initialisé après calcul chairCX dans le callback

export function toggleSmorkullPosition() {
  smorkullPosIdx = (smorkullPosIdx + 1) % 3;
  const p = SMORKULL_POSITIONS[smorkullPosIdx];
  smorkullGroup.position.set(p.x, 0, p.z);
  smorkullGroup.rotation.y = p.ry;
  requestRender();
  return smorkullPosIdx;
}

export function buildChair(scene) {

  gltfLoader.load('media/smorkull.glb', (gltf) => {
    const chair = gltf.scene;
    chair.traverse(c => {
      c.layers.set(LAYER_GLB);
    });

    const rawBox = new THREE.Box3().setFromObject(chair);
    const rawSize = rawBox.getSize(new THREE.Vector3());

    // Scaler pour que la hauteur = 128cm (Smörkull réel)
    // Le GLB (gltf-transform + draco) est Y-up → hauteur en rawSize.y
    const scaleF = 128 / rawSize.y;
    chair.scale.setScalar(scaleF);

    // Roue arrière vers mur A (180° par rapport à la précédente tentative)
    chair.rotation.set(0, Math.PI / 2, 0);

    // Forcer la mise à jour de matrixWorld pour un bbox correct
    chair.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(chair);
    const cz = (box.min.z + box.max.z) / 2;

    // smorkullGroup centré sur la chaise (centre XZ, sol Y=0)
    // box.min.x = extrémité de la roue arrière ; ouest à X=0 → centre X = (max-min)/2
    const chairCX = (box.max.x - box.min.x) / 2;
    smorkullGroup.position.set(chairCX, 0, 151);

    SMORKULL_POSITIONS = [
      { x: chairCX, z: 151, ry: 0 },            // pos 1 : devant bureau 2, face mur B (fenêtre)
      { x: 150,     z: 100, ry: Math.PI / 2 },  // pos 2 : espace détente, face mur C (nord)
      { x: 150,     z: 300, ry: Math.PI / 2 },  // pos 3
    ];

    // Chaise en local du groupe (centre du groupe = centre de la chaise)
    chair.position.set(-box.min.x - chairCX, 0, -cz);

    mergeGlbByMaterial(chair);
    chair.castShadow = true;
    chair.receiveShadow = true;
    smorkullGroup.add(chair);
    scene.add(smorkullGroup);
    addHoverTarget(smorkullGroup);
    requestRender();
  }, undefined, err => console.error('smorkull.glb:', err));
}
