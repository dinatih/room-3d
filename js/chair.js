import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { requestRender } from './cameraManager.js';
import { LAYER_GLB } from './config.js';

export function buildChair(scene) {
  const loader = new GLTFLoader();

  const redMat = new THREE.MeshStandardMaterial({ color: 0xcc2020, roughness: 0.6 });

  loader.load('media/smorkull.glb', (gltf) => {
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

    // GLB en Z-up → dimensions brutes à scale=1
    const rawBox = new THREE.Box3().setFromObject(chair);
    const rawSize = rawBox.getSize(new THREE.Vector3());

    // Scaler pour que la hauteur = 128cm (Smörkull réel)
    const scaleF = 128 / rawSize.z;
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
    chair.position.set(40 - box.min.x, 0, 145 - cz);

    chair.castShadow = true;
    chair.receiveShadow = true;
    scene.add(chair);
    requestRender();
  }, undefined, err => console.error('smorkull.glb:', err));
}
