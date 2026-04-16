import * as THREE from 'three';
import { gltfLoader } from '../utils/loaders.js';
import { mergeGlbByMaterial } from '../utils/mergeUtils.js';
import { LAYER_GLB } from '../config.js';
import { requestRender } from '../cameraManager.js';
import { sunnerstaMannequin } from '../furniture/sunnersta.js';

// HEAD_R=8.9, scale.y=1.15, SHOULDER_H=8, NECK_H=8
// Tête Sunnersta baseY=90 → centre tête = 90+8+8+8.9 = 114.9, sommet ≈ 125.1
const SUNNERSTA_HEAD_TOP = 90 + 8 + 8 + 8.9 * 1.15; // ≈ 125.2

export function buildCasquettes(scene) {
  const redMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.65 });

  gltfLoader.load(
    "media/baseball_cap.glb",
    (gltf) => {
      const source = gltf.scene;
      source.traverse((c) => {
        if (c.isMesh) c.material = redMat;
      });

      const box = new THREE.Box3().setFromObject(source);
      const size = box.getSize(new THREE.Vector3());
      const scale20 = 20 / size.x; // largeur 20cm

      mergeGlbByMaterial(source);

      function placeCap(x, y, z, rx, ry, rz, sc) {
        const cap = source.clone(true);
        cap.scale.setScalar(sc ?? scale20);
        cap.rotation.set(rx ?? 0, ry ?? 0, rz ?? 0);
        cap.position.set(x, y, z);
        cap.castShadow = true;
        cap.traverse((obj) => obj.layers.set(LAYER_GLB));
        return cap;
      }

      // 1) Mur B, au-dessus du lit — même position que la casquette procédurale
      //    rotation.z = π/2 : dome → -X (vers pièce), ouverture → +X (mur)
      scene.add(placeCap(297, 144, 173.5, Math.PI / 2, 0, Math.PI / 2));

      // 2) Sur tête de mannequin Sunnersta — enfant de sunnerstaMannequin (Y=90 dans le monde)
      //    Y relatif au plateau = SUNNERSTA_HEAD_TOP - 90 + 2 ≈ 37.2
      sunnerstaMannequin.add(placeCap(0, SUNNERSTA_HEAD_TOP - 90 + 2, 0, 0, Math.PI, 0, scale20 * 0.9));

      requestRender();
    },
    undefined,
    (err) => console.error("baseball_cap.glb:", err),
  );
}
