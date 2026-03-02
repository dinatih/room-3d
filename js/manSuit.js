import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { ROOM_W, ROOM_D } from './config.js';
import { requestRender, addWalkFollower, setInitialWalkPos } from './cameraManager.js';

let suitModel = null;
export function getSuit() { return suitModel; }

export function buildManSuit(scene) {
  const loader = new GLTFLoader();

  const redFabric = new THREE.MeshStandardMaterial({
    color: 0xcc1111,
    roughness: 0.85,
    metalness: 0.0,
  });

  loader.load('media/man_black_business_suit.glb', (gltf) => {
    const model = gltf.scene;
    model.traverse(c => { if (c.isMesh) c.material = redFabric; });

    // Scale : costume (sans tête) ~145cm, chaussures ~5cm → total 150cm
    // On pose la semelle au sol et on lève de 5cm pour que le costume ne traîne pas
    const SHOE_H = 5; // hauteur estimée chaussures en cm
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const scale = 145 / size.y;
    model.scale.setScalar(scale);

    // Recentrer : semelle à Y=0, puis lever de SHOE_H
    box.setFromObject(model);
    model.position.set(ROOM_W / 2, -box.min.y + SHOE_H, ROOM_D / 2);

    model.castShadow = true;
    model.receiveShadow = true;
    // Layer 0 (défaut) : toujours visible, y compris dans les mirrors quand HD est off

    suitModel = model;
    scene.add(model);
    addWalkFollower(model);
    setInitialWalkPos(model.position.x, model.position.z); // suit suit la caméra en walk mode
    requestRender();
  }, undefined, err => console.error('man_black_business_suit.glb:', err));
}
