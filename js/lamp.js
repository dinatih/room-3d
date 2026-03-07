import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { ROOM_W, ROOM_D, KALLAX_DEPTH } from './config.js';
import { kallaxW } from './kallax.js';
import { requestRender } from './cameraManager.js';

// KALLAX 2×1 + 2×1 pivotés (item 2) :
//   gStack.position = (ROOM_W - KALLAX_DEPTH/2, 0, ROOM_D - 60 - kallaxW(1)/2)
//   pile haute = 2 × kallaxW(2)  (chaque 2×1 pivoté totalW=75.5)
const STACK_X = ROOM_W - KALLAX_DEPTH / 2;                // 280.5
const STACK_Z = ROOM_D - 60 - kallaxW(1) / 2;             // 319.75
const STACK_TOP_Y = 2 * kallaxW(2);                       // 151 cm
const LAMP_ABOVE = 55.5;                                   // cm au-dessus du meuble

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
    const dx = ROOM_W / 2 - STACK_X;
    const dz = ROOM_D / 2 - STACK_Z;
    lamp.rotation.y = Math.atan2(dx, dz);

    // Poser la base de la lampe au niveau voulu (après scale)
    const box = new THREE.Box3().setFromObject(lamp);
    const baseY = STACK_TOP_Y + LAMP_ABOVE - box.min.y;  // 206.5 cm

    lamp.position.set(STACK_X, baseY, STACK_Z);
    lamp.castShadow  = true;
    lamp.receiveShadow = true;
    scene.add(lamp);

    // PointLight au niveau de l'abat-jour (80% de la hauteur du modèle)
    lampLight = new THREE.PointLight(0xfff5e0, 120000, 350, 2);
    lampLight.position.set(STACK_X, baseY + (box.max.y - box.min.y) * 0.8, STACK_Z);
    lampLight.visible = false;
    scene.add(lampLight);

    requestRender();
  }, undefined, err => console.error('ikea_lamp_ola.glb:', err));
}
