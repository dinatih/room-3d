import * as THREE from 'three';
import { gltfLoader } from './loaders.js';
import { mergeGlbByMaterial } from './mergeUtils.js';
import { requestRender } from './cameraManager.js';
import { LAYER_GLB } from './config.js';

export function buildChair(scene) {

  const redMat = new THREE.MeshStandardMaterial({ color: 0xcc2020, roughness: 0.6 });

  gltfLoader.load('media/smorkull.glb', (gltf) => {
    const chair = gltf.scene;
    chair.traverse(c => {
      c.layers.set(LAYER_GLB);
      if (c.isMesh) {
        c.material = redMat;
        // boundingSphere calculée en bind-pose locale ≠ bbox réel après Ry(π/2) + position.
        // Sans ça, Three.js culle la chaise dès que la caméra dépasse le bord du bbox.
        c.frustumCulled = false;
      }
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

    // box.min.x = extrémité de la roue arrière (géométrie réelle, pas d'armature).
    // Mais le corps visible (siège, colonne) ne démarre qu'à ~40cm de là en World X
    // → décalage GLB entre l'origine Z=0 (pointe de roulette) et la masse visible.
    // 40cm = position réaliste devant bureau + évite artefact de clipping Reflector Nissedal.
    chair.position.set(40 - box.min.x, 0, 151 - cz);

    mergeGlbByMaterial(chair);
    chair.castShadow = true;
    chair.receiveShadow = true;
    scene.add(chair);
    requestRender();
  }, undefined, err => console.error('smorkull.glb:', err));
}
