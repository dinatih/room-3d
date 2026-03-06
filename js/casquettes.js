import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { LAYER_FURNITURE } from "./config.js";
import { requestRender } from "./cameraManager.js";

// HEAD_R=8.9, scale.y=1.15, SHOULDER_H=8, NECK_H=8
// Tête Sunnersta baseY=90 → centre tête = 90+8+8+8.9 = 114.9, sommet ≈ 125.1
const SUNNERSTA_HEAD_TOP = 90 + 8 + 8 + 8.9 * 1.15; // ≈ 125.2

export function buildCasquettes(scene) {
  const loader = new GLTFLoader();
  const redMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.65 });

  loader.load(
    "media/baseball_cap.glb",
    (gltf) => {
      const source = gltf.scene;
      source.traverse((c) => {
        if (c.isMesh) c.material = redMat;
      });

      const box = new THREE.Box3().setFromObject(source);
      const size = box.getSize(new THREE.Vector3());
      const scale20 = 20 / size.x; // largeur 20cm

      function placeCap(x, y, z, rx, ry, rz, sc) {
        const cap = source.clone(true);
        cap.scale.setScalar(sc ?? scale20);
        cap.rotation.set(rx ?? 0, ry ?? 0, rz ?? 0);
        cap.position.set(x, y, z);
        cap.castShadow = true;
        cap.traverse((obj) => {
          if (obj.isMesh) obj.layers.set(LAYER_FURNITURE);
        });
        scene.add(cap);
      }

      // 1) Mur B, au-dessus du lit — même position que la casquette procédurale
      //    rotation.z = π/2 : dome → -X (vers pièce), ouverture → +X (mur)
      placeCap(297, 144, 173.5, 0, 0, Math.PI / 2);

      // 2) Sur tête de mannequin Sunnersta (282, 90, 271.5)
      //    sommet tête ≈ 125.2cm, cap posé dessus
      placeCap(282, SUNNERSTA_HEAD_TOP + 1, 271.5, 0, Math.PI, 0, scale20 * 0.9);

      requestRender();
    },
    undefined,
    (err) => console.error("baseball_cap.glb:", err),
  );
}
