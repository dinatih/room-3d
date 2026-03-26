/**
 * Walker : lara_croft__2026_rigged.glb
 * SkinnedMesh réel (24 nodes) — pas d'animation intégrée → clip custom.
 * Squelette descriptif (noms lisibles) :
 *   pelvis_03 / root_hips_02
 *   leg_left_thigh_04 → leg_left_knee_05 → leg_left_ankle_06 → leg_left_toes_07
 *   leg_right_thigh_08 → leg_right_knee_09 → leg_right_ankle_010 → leg_right_toes_011
 *   spine_lower_012 → spine_upper_013
 *     → arm_left_shoulder_2_014 → arm_left_elbow_015 → arm_left_wrist_016
 *     → arm_right_shoulder_2_033 → arm_right_elbow_034 → arm_right_wrist_035
 *   head_neck_lower_051 → head_neck_upper_052 → … (facial bones détaillés)
 * ⚠️  Three.js remplace les espaces par _ dans les noms de bones au chargement.
 */
import * as THREE from 'three';
import { gltfLoader } from '../../utils/loaders.js';
import { LAYER_GLB } from '../../config.js';

const SHOE_H = 0; // modèle complet avec pieds inclus

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
  function qz(deg) {
    const r = (deg * Math.PI) / 180 / 2;
    return new THREE.Quaternion(0, 0, Math.sin(r), Math.cos(r));
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
  // Bras le long du corps : local-Z ≈ +Z monde → qz(-90) amène le bras G vers le bas,
  // qz(+90) pour le bras D. Ensuite qx pour le swing avant/arrière.
  const LA = qz(-90);  // bras gauche : position basse
  const RA = qz(90);   // bras droit  : position basse
  const lad = (deg) => LA.clone().multiply(qx(deg));
  const rad = (deg) => RA.clone().multiply(qx(deg));

  return new THREE.AnimationClip('walk-lara2026', T, [
    // ── Jambes ───────────────────────────────────────────────────
    qt('leg_left_thigh_04',        qx(30),   N,        qx(-30),  N,        qx(30)),
    qt('leg_right_thigh_08',       qx(-30),  N,        qx(30),   N,        qx(-30)),
    qt('leg_left_knee_05',         qx(8),    qx(30),   qx(60),   qx(30),   qx(8)),
    qt('leg_right_knee_09',        qx(60),   qx(30),   qx(8),    qx(30),   qx(60)),
    // ── Bras le long du corps + swing ────────────────────────────
    qt('arm_left_shoulder_2_014',  lad(20),  LA,       lad(-20), LA,       lad(20)),
    qt('arm_right_shoulder_2_033', rad(-20), RA,       rad(20),  RA,       rad(-20)),
    // ── Buste ────────────────────────────────────────────────────
    qt('spine_lower_012',
      new THREE.Quaternion(0, 0,  0.012, 0.99993), N,
      new THREE.Quaternion(0, 0, -0.012, 0.99993), N,
      new THREE.Quaternion(0, 0,  0.012, 0.99993),
    ),
  ]);
}

/**
 * @param {THREE.Group}  animGroup
 * @param {THREE.Scene}  scene
 * @param {Function}     onReady   callback({ mixer, action })
 */
export function load(animGroup, scene, onReady) {
  gltfLoader.load(
    'media/lara_croft__2026_rigged.glb',
    (gltf) => {
      const mesh = gltf.scene;
      mesh.traverse(c => { c.layers.enable(LAYER_GLB); });

      mesh.rotation.y = Math.PI;

      const box  = new THREE.Box3().setFromObject(mesh);
      const size = box.getSize(new THREE.Vector3());
      mesh.scale.setScalar(170 / size.y);
      box.setFromObject(mesh);
      mesh.position.set(0, -box.min.y + SHOE_H, 0);

      const mixer  = new THREE.AnimationMixer(mesh);
      const action = mixer.clipAction(buildWalkClip(mesh));
      action.setLoop(THREE.LoopRepeat);

      const skelHelper = new THREE.SkeletonHelper(mesh);
      skelHelper.material.linewidth = 3;
      skelHelper.visible = false;

      animGroup.add(mesh);
      scene.add(skelHelper);
      onReady({ mixer, action, skelHelper });
    },
    undefined,
    err => console.error('lara_croft__2026_rigged.glb:', err),
  );
}
