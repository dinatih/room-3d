import * as THREE from 'three';
import { gltfLoader } from '../utils/loaders.js';
import { mergeGlbByMaterial } from '../utils/mergeUtils.js';
import { ROOM_W, ROOM_D, LAYER_GLB } from '../config.js';
import { requestRender, addWalkFollower, addWalkPitchFollower, setInitialWalkPos } from '../cameraManager.js';
import { setMinimapWalker } from '../ui/minimap.js';

// Le Walking Man est un THREE.Group (scale = 1) qui contient :
//   - le costume (suit), enfant positionné localement
//   - une casquette à 181cm, enfant positionné localement
// Le groupe est le seul walk follower → suit + casquette bougent ensemble.

const CAP_HEIGHT = 181; // cm — hauteur de la casquette (bas de la calotte)
const SHOE_H = 5; // cm — élévation semelles

let walkingMan = null;
export function getWalkingMan() {
  return walkingMan;
}

export function buildWalkingMan(scene) {
  const group = new THREE.Group();
  group.position.set(ROOM_W / 2, 0, ROOM_D / 2);

  // Les GLBs GLTF font face à -Z par convention. On les tourne de π pour qu'ils
  // fassent face à +Z (direction de marche), sans toucher à la logique de mouvement.
  const dirGroup = new THREE.Group();
  dirGroup.rotation.y = Math.PI;
  group.add(dirGroup);

  let suitReady = false;
  let capReady = false;

  function onBothReady() {
    if (!suitReady || !capReady) return;
    walkingMan = group;
    setMinimapWalker(group);
    scene.add(group);
    addWalkFollower(group);
    setInitialWalkPos(group.position.x, group.position.z);
    requestRender();
  }

  // ── Costume ──────────────────────────────────────────────
  const redFabric = new THREE.MeshStandardMaterial({ color: 0xcc1111, roughness: 0.85 });

  gltfLoader.load(
    "media/man_black_business_suit.glb",
    (gltf) => {
      const suit = gltf.scene;
      suit.traverse((c) => {
        c.layers.set(LAYER_GLB);
        if (c.isMesh) c.material = redFabric;
      });

      const box = new THREE.Box3().setFromObject(suit);
      const size = box.getSize(new THREE.Vector3());
      suit.scale.setScalar(156 / size.y); // hauteur costume = 156cm → sommet à 161cm (181-20)
      box.setFromObject(suit); // recalculer après scale
      suit.position.set(0, -box.min.y + SHOE_H, 0); // semelle à SHOE_H cm
      suit.castShadow = true;
      suit.receiveShadow = true;
      mergeGlbByMaterial(suit);
      dirGroup.add(suit);
      suitReady = true;
      onBothReady();
    },
    undefined,
    (err) => console.error("man_black_business_suit.glb:", err),
  );

  // ── Casquette ─────────────────────────────────────────────
  const redMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.65 });

  gltfLoader.load(
    "media/baseball_cap.glb",
    (gltf) => {
      const cap = gltf.scene;
      cap.traverse((c) => {
        c.layers.set(LAYER_GLB);
        if (c.isMesh) c.material = redMat;
      });

      const box = new THREE.Box3().setFromObject(cap);
      const size = box.getSize(new THREE.Vector3());
      cap.scale.setScalar(20 / size.x); // largeur 20cm, groupe scale=1 → pas d'interférence
      cap.position.set(0, CAP_HEIGHT, 0); // local y = world y (groupe à y=0)
      cap.rotation.x = (-15 * Math.PI) / 180; // visière relevée (~30°)
      cap.userData.baseRotX = cap.rotation.x; // offset conservé en walk mode
      cap.castShadow = true;

      mergeGlbByMaterial(cap);
      dirGroup.add(cap);
      addWalkPitchFollower(cap); // rotation.x suit le pitch caméra en walk mode
      capReady = true;
      onBothReady();
    },
    undefined,
    (err) => console.error("baseball_cap.glb:", err),
  );
}
