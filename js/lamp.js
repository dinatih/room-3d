import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { ROOM_W, ROOM_D } from './config.js';
import { KALLAX_SE_X, KALLAX_SE_Z, KALLAX_SE_TOP } from './kallax.js';
import { requestRender } from './cameraManager.js';

const LAMP_ABOVE = 55.5; // cm au-dessus du meuble T

let lampLight = null;
let lampOn = false;

export function toggleLamp() {
  lampOn = !lampOn;
  if (lampLight) lampLight.visible = lampOn;
  requestRender();
  return lampOn;
}

export function buildLamp(scene) {
  const loader = new GLTFLoader();

  loader.load('media/ikea_lamp_ola.glb', (gltf) => {
    const lamp = gltf.scene;

    // GLB en mètres → convertir en cm
    lamp.scale.setScalar(100);

    // Remplacer uniquement les couleurs jaunes par du blanc (G-Base001, G-Shade001_2)
    lamp.traverse(c => {
      if (!c.isMesh || !c.material?.color) return;
      const hsl = {};
      c.material.color.getHSL(hsl);
      if (hsl.h > 0.08 && hsl.h < 0.20 && hsl.s > 0.2) {
        c.material = c.material.clone();
        c.material.color.set(0xffffff);
      }
    });

    // Orienter vers le centre du salon
    const dx = ROOM_W / 2 - KALLAX_SE_X;
    const dz = ROOM_D / 2 - KALLAX_SE_Z;
    lamp.rotation.y = Math.atan2(dx, dz);

    // Centrer la lampe sur le meuble T (le GLB n'est pas centré sur son origine)
    const box = new THREE.Box3().setFromObject(lamp);
    const cx = (box.min.x + box.max.x) / 2;
    const cz = (box.min.z + box.max.z) / 2;
    const baseY = KALLAX_SE_TOP + LAMP_ABOVE - box.min.y;

    lamp.position.set(KALLAX_SE_X - cx, baseY, KALLAX_SE_Z - cz);
    lamp.castShadow  = true;
    lamp.receiveShadow = true;
    scene.add(lamp);

    // PointLight au niveau de l'abat-jour (80% de la hauteur du modèle)
    lampLight = new THREE.PointLight(0xfff5e0, 120000, 350, 2);
    lampLight.position.set(KALLAX_SE_X - cx, baseY + (box.max.y - box.min.y) * 0.8, KALLAX_SE_Z - cz);
    lampLight.visible = false;
    scene.add(lampLight);

    requestRender();
  }, undefined, err => console.error('ikea_lamp_ola.glb:', err));
}
