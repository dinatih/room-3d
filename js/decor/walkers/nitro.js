/**
 * Walker : nitro.glb
 * SkinnedMesh réel (JOINTS_0 + WEIGHTS_0) + animation 'Motion' intégrée.
 * Squelette CC3/RL avec scaleCompensation nodes.
 * Bones principaux :
 *   Pelvis_06 → Spine1_07 → … → Neck_010 → Head_011
 *   Pelvis_06 → LeftThigh_0281 → LeftKnee_0262 → LeftFoot_0282
 *   Pelvis_06 → RightThigh_0284 → RightKnee_0285 → RightFoot_0286
 *   Spine3_09 → LeftShoulder_0135 → LeftElbow_0136 → LeftElbow_Pt_1_0137 → LeftWrist_0138
 *   Spine3_09 → RightShoulder_0252 → RightElbow_0253 → RightElbow_Pt_1_0254 → RightWrist_0255
 */
import * as THREE from 'three';
import { gltfLoader } from '../../utils/loaders.js';
import { LAYER_GLB } from '../../config.js';

const SHOE_H = 5; // cm — élévation semelles

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
  return new THREE.AnimationClip('walk-nitro', T, [
    qt('LeftThigh_0281',       qx(30),  N,       qx(-30), N,       qx(30)),
    qt('RightThigh_0284',      qx(-30), N,       qx(30),  N,       qx(-30)),
    qt('LeftKnee_0262',        qx(-5),  qx(-15), qx(-40), qx(-15), qx(-5)),
    qt('RightKnee_0285',       qx(-40), qx(-15), qx(-5),  qx(-15), qx(-40)),
    qt('LeftElbow_0136',       qx(-20), N,       qx(20),  N,       qx(-20)),
    qt('RightElbow_0253',      qx(20),  N,       qx(-20), N,       qx(20)),
    qt('LeftElbow_Pt_1_0137',  qx(-10), qx(-5),  qx(10),  qx(-5),  qx(-10)),
    qt('RightElbow_Pt_1_0254', qx(10),  qx(-5),  qx(-10), qx(-5),  qx(10)),
    qt('Spine1_07',
      new THREE.Quaternion(0, 0,  0.009, 0.99996), N,
      new THREE.Quaternion(0, 0, -0.009, 0.99996), N,
      new THREE.Quaternion(0, 0,  0.009, 0.99996),
    ),
  ]);
  // Alternative : utiliser l'animation d'origine du GLB :
  // return null; // puis clipAction(gltf.animations[0]) dans load()
}

/**
 * Charge nitro.glb et configure le mixer de marche.
 * @param {THREE.Group}  animGroup  groupe parent pour le mesh
 * @param {THREE.Scene}  scene      scène racine (pour SkeletonHelper)
 * @param {Function}     onReady    callback({ mixer, action })
 */
export function load(animGroup, scene, onReady) {
  gltfLoader.load(
    'media/nitro.glb',
    (gltf) => {
      const mesh = gltf.scene;
      mesh.traverse(c => { c.layers.enable(LAYER_GLB); });

      const box  = new THREE.Box3().setFromObject(mesh);
      const size = box.getSize(new THREE.Vector3());
      mesh.scale.setScalar(170 / size.y);
      box.setFromObject(mesh);
      mesh.position.set(0, -box.min.y + SHOE_H, 0);
      mesh.rotation.y = Math.PI;

      const mixer  = new THREE.AnimationMixer(mesh);
      const action = mixer.clipAction(buildWalkClip(mesh));
      action.setLoop(THREE.LoopRepeat);

      const skelHelper = new THREE.SkeletonHelper(mesh);
      skelHelper.material.linewidth = 3;

      animGroup.add(mesh);
      scene.add(skelHelper);
      onReady({ mixer, action });
    },
    undefined,
    err => console.error('nitro.glb:', err),
  );
}
