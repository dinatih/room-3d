import * as THREE from "three";
import { ROOM_W, WALL_H } from "./config.js";
import { renderer, scene as sceneRef, camera } from "./scene.js";

const screenTex = new THREE.TextureLoader().load('media/omarchy-screen.png', () => {
  renderer.render(sceneRef, camera);
});
screenTex.colorSpace = THREE.SRGBColorSpace;

export function buildTV(scene) {
  const TV_W = 70; // 70cm
  const TV_H = 40; // 40cm
  const TV_D = 1.5; // épaisseur
  const TV_Y = WALL_H - 10 - TV_H / 2; // 10cm du plafond

  const tvMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.3,
    metalness: 0.4,
  });
  const tv = new THREE.Mesh(new THREE.BoxGeometry(TV_W, TV_H, TV_D), tvMat);
  tv.position.set(ROOM_W - 25, TV_Y, 25);
  tv.rotation.y = (3 * Math.PI) / 4; // face vers le centre du séjour
  tv.castShadow = true;
  scene.add(tv);

  // Écran (face avant, légèrement en avant) — wallpaper Omarchy
  const screenMat = new THREE.MeshStandardMaterial({
    map: screenTex,
    roughness: 0.05,
    metalness: 0.3,
  });
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(TV_W - 3, TV_H - 3),
    screenMat,
  );
  screen.position.set(ROOM_W - 25, TV_Y, 25);
  screen.rotation.y = (3 * Math.PI) / 4 + Math.PI; // face vers le séjour
  screen.translateZ(TV_D / 2 + 0.1);
  scene.add(screen);
}
