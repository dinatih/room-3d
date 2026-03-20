import * as THREE from 'three';
import { gltfLoader } from '../utils/loaders.js';
import { mergeGlbByMaterial } from '../utils/mergeUtils.js';
import { requestRender } from '../cameraManager.js';
import { LAYER_GLB } from '../config.js';
import { KITCHEN_X1, DOOR_START, ROOM_D } from '../config.js';

// =============================================
// BASKETS – sleek_midnight_black_sneaker
// Placées sur le sol sous les 3 miroirs (mur D)
// =============================================
export function buildSneakers(scene) {
  // Centre X des 3 miroirs carrés (mur D)
  const MIRROR_CX = (KITCHEN_X1 + DOOR_START) / 2; // 160cm

  // Taille cible : ~28cm (longueur d'une basket)
  const TARGET_LENGTH = 28;

  gltfLoader.load('media/sneaker.glb', (gltf) => {
    const shoe = gltf.scene;

    // Auto-scale sur la dimension la plus longue horizontale (X ou Z)
    const rawBox = new THREE.Box3().setFromObject(shoe);
    const rawSize = rawBox.getSize(new THREE.Vector3());
    const longestH = Math.max(rawSize.x, rawSize.z);
    const s = TARGET_LENGTH / longestH;
    shoe.scale.setScalar(s);
    shoe.updateMatrixWorld(true);

    // Pied gauche (original)
    const left = shoe;

    // Pied droit : miroir local Z = flip bord intérieur/extérieur, garde la direction de la pointe
    const right = shoe.clone();
    right.scale.z *= -1;

    // Rotation +90° sur Y : longueur du pied (local X) pointe vers -Z (dans la pièce, dos au mur D)
    left.rotation.y  = Math.PI / 2;
    right.rotation.y = Math.PI / 2;

    // Après rotation PI/2 : local X → world -Z, local Z → world +X
    // → la largeur du pied (local Z) est maintenant selon X en world space

    // Calculer les dimensions utiles en world space depuis les rawSize
    const shoeWid = rawSize.z * s; // largeur pied = world X après rotation
    const GAP = 1; // 1cm entre les deux pieds

    // Sol
    const floorY = -rawBox.min.y * s;
    left.position.y  = floorY;
    right.position.y = floorY;

    // Séparation côte à côte sur X (world)
    left.position.x  =   shoeWid / 2 + GAP / 2;
    right.position.x = -(shoeWid / 2 + GAP / 2);

    // Centrer sur Z (contrer le décalage du bounding box original en X → world -Z)
    const localCenterX = (rawBox.min.x + rawBox.max.x) / 2 * s;
    left.position.z  = localCenterX;
    right.position.z = localCenterX;

    // Groupe paire
    const pair = new THREE.Group();
    pair.add(left);
    pair.add(right);

    // Première paire
    pair.position.set(MIRROR_CX + 40 - 50, 0, ROOM_D - 15);

    const redMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.6 });
    pair.traverse(c => {
      c.layers.set(LAYER_GLB);
      if (c.isMesh) {
        c.material = redMat;
        c.castShadow = true;
        c.receiveShadow = true;
      }
    });

    mergeGlbByMaterial(right);
    mergeGlbByMaterial(left);
    scene.add(pair);

    // Deuxième paire : clonée après merge + red → hérite des meshes fusionnés et de la couleur
    const PAIR_GAP = 3; // 3cm entre les deux paires
    const pairBox = new THREE.Box3().setFromObject(pair);
    const actualPairW = pairBox.max.x - pairBox.min.x;

    const pair2 = pair.clone();
    pair2.position.set(pair.position.x + actualPairW + PAIR_GAP, 0, ROOM_D - 15); // suit pair automatiquement
    scene.add(pair2);

    requestRender();
  }, undefined, err => console.error('sneaker.glb:', err));
}
