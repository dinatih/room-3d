import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { ROOM_W } from './config.js';
import { requestRender } from './cameraManager.js';

export function buildSunnersta(scene) {
  const loader = new GLTFLoader();

  loader.load('media/sunnersta_trolley_ikea.glb', (gltf) => {
    const trolley = gltf.scene;

    // Axe le plus grand → 90cm (hauteur Sunnersta réelle)
    // TODO: vérifier dimensions GLB brutes (calcul Python sur accessor min/max, potentiellement
    // faux car sans transforms de nœuds) : X≈114cm, Y≈97cm (min=-97→0), Z≈74cm.
    // Si décalage visuel constaté, recalculer avec Box3.setFromObject en console.
    const rawBox = new THREE.Box3().setFromObject(trolley);
    const rawSize = rawBox.getSize(new THREE.Vector3());
    const scaleF = 90 / Math.max(rawSize.x, rawSize.y, rawSize.z);
    trolley.scale.setScalar(scaleF);

    // Même orientation que la version procédurale :
    // longueur 56cm le long de Z, profondeur 36cm le long de X (vers mur B)
    trolley.rotation.y = Math.PI / 2;

    trolley.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(trolley);
    const cz = (box.min.z + box.max.z) / 2;

    // Face est contre mur B (X=ROOM_W), sol à Y=0
    // Centre Z = 299.5 - 56/2 = 271.5 (identique à la version procédurale)
    trolley.position.set(
      ROOM_W - box.max.x,
      -box.min.y,
      271.5 - cz,
    );

    trolley.traverse(c => {
      if (c.isMesh) {
        c.castShadow = true;
        c.receiveShadow = true;
        c.frustumCulled = false;
      }
    });

    scene.add(trolley);
    requestRender();
  }, undefined, err => console.error('sunnersta_trolley_ikea.glb:', err));
}
