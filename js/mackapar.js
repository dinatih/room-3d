import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { ROOM_D, NICHE_DEPTH, LAYER_GLB } from './config.js';
import { kallaxW } from './kallax.js';
import { requestRender } from './cameraManager.js';

export function buildMackapar(scene) {
  const loader = new GLTFLoader();

  // mpZ : bord avant du Kallax 2×4 (Sud) - demi-profondeur Mackapar
  const kallaxEdgeZ = ROOM_D - kallaxW(2);
  const mpZ = kallaxEdgeZ - 32 / 2;

  loader.load('media/mackapar_ikea.glb', (gltf) => {
    const mack = gltf.scene;

    // TODO: trouver le GLB de la version actuelle IKEA (200cm) pour éviter le scale.y approximatif.
    // Le GLB est en mètres et modélise l'ancienne version IKEA (193cm de haut).
    // IKEA a depuis allongé le produit à 200cm SANS changer largeur (78cm) ni profondeur (32cm).
    // → On corrige uniquement Y pour atteindre 200cm ; X et Z restent à ×100 (m→cm).
    // Conséquence : scale.y ≈ 103.6 déforme légèrement les composants horizontaux
    // (planches ~+3.6% d'épaisseur, tringle ~+3.6% de diamètre), imperceptible visuellement.
    const rawBox = new THREE.Box3().setFromObject(mack);
    const scaleY = 200 / (rawBox.max.y - rawBox.min.y); // ≈ 103.6
    mack.scale.set(100, scaleY, 100);

    // Rotation +90° autour de Y : largeur (77cm) le long de X (est-ouest),
    // profondeur (32cm) le long de Z (nord-sud).
    // +90° (vs -90°) place la face latérale est côté intérieur niche, la face lisse côté ouest → contre mur niche ouest.
    // Le GLB présente un excédent de ~10cm en X qui semble être un vestige d'accessoire (crochet ?)
    // retiré par l'auteur du modèle. En réalité, plusieurs crochets sont fixés sur la face latérale
    // (côté intérieur niche), mais ils ne sont pas modélisés dans ce GLB.
    // TODO: ajouter des crochets 3D sur la face latérale est du Mackapar.
    mack.rotation.y = Math.PI / 2;

    // Bounding box après scale + rotation
    const box = new THREE.Box3().setFromObject(mack);

    // Placer la face latérale ouest (box.min.x) à 3.5cm du mur niche ouest (X = -NICHE_DEPTH).
    // TODO: modéliser la plinthe en L (plus complexe qu'une simple bande plate).
    const PLINTHE = 3.5;
    const posX = -NICHE_DEPTH + PLINTHE - box.min.x;

    const cz = (box.min.z + box.max.z) / 2;
    mack.position.set(posX, -box.min.y, mpZ - cz);

    mack.traverse(c => {
      c.layers.set(LAYER_GLB);
      if (c.isMesh) {
        c.castShadow = true;
        c.receiveShadow = true;
      }
    });
    scene.add(mack);
    requestRender();
  }, undefined, err => console.error('mackapar_ikea.glb:', err));
}
