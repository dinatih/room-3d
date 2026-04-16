/**
 * Walker : 3d-free-fire-model-jumsuit-male.glb
 * SkinnedMesh réel (JOINTS_0 + WEIGHTS_0) + animation Mixamo intégrée.
 * Squelette Mixamo/Free-Fire :
 *   bone_Hips_Dummy_01 → bone_Spine_010 → bone_Spine1_011 → … → bone_Neck_029 → bone_Head_030
 *                      → bone_LeftLegUpper_02 → bone_LeftLeg_03 → bone_LeftToe_05
 *                      → bone_RightLegUpper_06 → bone_RightLeg_07 → bone_RightToe_09
 *   bone_Spine1_011    → bone_LeftArm_015 → bone_LeftForeArm_016 → …
 *                      → bone_RightArm_032 → bone_RightForeArm_033 → …
 */
import * as THREE from 'three';
import { gltfLoader } from '../../utils/loaders.js';
import { LAYER_GLB } from '../../config.js';

const SHOE_H = 5; // cm — élévation semelles

// ── Clip de marche custom (fallback si pas d'animation GLB) ──
function buildWalkClip(root) {
  const T = 0.8;
  const times = [0, T * 0.25, T * 0.5, T * 0.75, T];

  function findBone(name) {
    let b = null;
    root.traverse(c => { if (c.isBone && c.name === name && !b) b = c; });
    return b;
  }
  function qx(deg) {
    const r = (deg * Math.PI) / 180 / 2;
    return new THREE.Quaternion(Math.sin(r), 0, 0, Math.cos(r));
  }
  function qt(boneName, ...deltas) {
    const rest = findBone(boneName)?.quaternion.clone() ?? new THREE.Quaternion();
    const flat = deltas.flatMap(d => {
      const q = rest.clone().multiply(d);
      return [q.x, q.y, q.z, q.w];
    });
    return new THREE.QuaternionKeyframeTrack(boneName + '.quaternion', times, flat);
  }

  const N = new THREE.Quaternion();
  return new THREE.AnimationClip('walk-freefire', T, [
    qt('bone_LeftLegUpper_02',  qx(30),  N,       qx(-30), N,       qx(30)),
    qt('bone_RightLegUpper_06', qx(-30), N,       qx(30),  N,       qx(-30)),
    qt('bone_LeftLeg_03',       qx(-5),  qx(-15), qx(-40), qx(-15), qx(-5)),
    qt('bone_RightLeg_07',      qx(-40), qx(-15), qx(-5),  qx(-15), qx(-40)),
    qt('bone_LeftArm_015',      qx(-20), N,       qx(20),  N,       qx(-20)),
    qt('bone_RightArm_032',     qx(20),  N,       qx(-20), N,       qx(20)),
    qt('bone_LeftForeArm_016',  qx(-10), qx(-5),  qx(10),  qx(-5),  qx(-10)),
    qt('bone_RightForeArm_033', qx(10),  qx(-5),  qx(-10), qx(-5),  qx(10)),
    qt('bone_Spine_010',
      new THREE.Quaternion(0, 0,  0.009, 0.99996), N,
      new THREE.Quaternion(0, 0, -0.009, 0.99996), N,
      new THREE.Quaternion(0, 0,  0.009, 0.99996),
    ),
  ]);
}

/**
 * Charge 3d-free-fire-model-jumsuit-male.glb et configure le mixer.
 * Utilise l'animation Mixamo intégrée ('mixamo.com') par défaut.
 * @param {THREE.Group}  animGroup  groupe parent pour le mesh
 * @param {THREE.Scene}  scene      scène racine (pour SkeletonHelper)
 * @param {Function}     onReady    callback({ mixer, action })
 */
export function load(animGroup, scene, onReady) {
  gltfLoader.load(
    'media/3d-free-fire-model-jumsuit-male.glb',
    (gltf) => {
      const mesh = gltf.scene;
      mesh.traverse(c => { c.layers.enable(LAYER_GLB); });

      const box  = new THREE.Box3().setFromObject(mesh);
      const size = box.getSize(new THREE.Vector3());
      mesh.scale.setScalar(170 / size.y);
      box.setFromObject(mesh);
      mesh.position.set(0, -box.min.y + SHOE_H, 0);
      mesh.rotation.y = Math.PI;

      const mixer = new THREE.AnimationMixer(mesh);

      // Animation Mixamo intégrée
      // Remplacer par buildWalkClip(mesh) pour le clip custom
      const clip   = gltf.animations[0];
      const action = mixer.clipAction(clip);
      action.setLoop(THREE.LoopRepeat);

      const skelHelper = new THREE.SkeletonHelper(mesh);
      skelHelper.material.linewidth = 3;

      animGroup.add(mesh);
      scene.add(skelHelper);
      onReady({ mixer, action });
    },
    undefined,
    err => console.error('3d-free-fire-model-jumsuit-male.glb:', err),
  );
}
