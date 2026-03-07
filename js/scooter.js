import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { LAYER_GLB } from "./config.js";
import { requestRender } from "./cameraManager.js";

export function buildScooter(scene) {
  new GLTFLoader().load('media/xiaomi_electric_scooter_4.glb', (gltf) => {
    const scooter = gltf.scene;

    const rawBox = new THREE.Box3().setFromObject(scooter);
    const rawSize = rawBox.getSize(new THREE.Vector3());
    // Hauteur réelle Xiaomi Scooter 4 : 113cm (guidon déplié)
    scooter.scale.setScalar(113 / rawSize.y);

    scooter.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(scooter);

    // Sol à Y=0, même position que l'ancien modèle procédural
    scooter.position.set(
      282 - (box.min.x + box.max.x) / 2,
      -box.min.y,
      460 - (box.min.z + box.max.z) / 2,
    );
    scooter.rotation.y = Math.PI;

    scooter.traverse(c => {
      c.layers.set(LAYER_GLB);
      if (c.isMesh) {
        c.castShadow = true;
        c.receiveShadow = true;
        c.frustumCulled = false;
      }
    });

    scene.add(scooter);
    requestRender();
  }, undefined, err => console.error('xiaomi_electric_scooter_4.glb:', err));
}
