/**
 * Walker : harley_quinn_hip_hop_dancing.glb
 * SkinnedMesh réel + animation Mixamo hip-hop dancing (7.07 s).
 * Squelette Mixamo standard :
 *   mixamorig:Hips → Spine → Spine1 → Spine2 → Neck → Head
 *                  → LeftShoulder → LeftArm → LeftForeArm
 *                  → RightShoulder → RightArm → RightForeArm
 *                  → LeftUpLeg → LeftLeg → LeftFoot → LeftToeBase
 *                  → RightUpLeg → RightLeg → RightFoot → RightToeBase
 */
import * as THREE from 'three';
import { gltfLoader } from '../../utils/loaders.js';
import { LAYER_GLB } from '../../config.js';

const SHOE_H = 5;

// ── Clip de marche custom (alternative à l'animation intégrée) ──
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
  return new THREE.AnimationClip('walk-harley', T, [
    qt('mixamorig:LeftUpLeg_056',   qx(30),  N,       qx(-30), N,       qx(30)),
    qt('mixamorig:RightUpLeg_00',   qx(-30), N,       qx(30),  N,       qx(-30)),
    qt('mixamorig:LeftLeg_057',     qx(-5),  qx(-15), qx(-40), qx(-15), qx(-5)),
    qt('mixamorig:RightLeg_061',    qx(-40), qx(-15), qx(-5),  qx(-15), qx(-40)),
    qt('mixamorig:LeftArm_09',      qx(-20), N,       qx(20),  N,       qx(-20)),
    qt('mixamorig:RightArm_033',    qx(20),  N,       qx(-20), N,       qx(20)),
    qt('mixamorig:LeftForeArm_010', qx(-10), qx(-5),  qx(10),  qx(-5),  qx(-10)),
    qt('mixamorig:RightForeArm_034',qx(10),  qx(-5),  qx(-10), qx(-5),  qx(10)),
    qt('mixamorig:Spine_02',
      new THREE.Quaternion(0, 0,  0.009, 0.99996), N,
      new THREE.Quaternion(0, 0, -0.009, 0.99996), N,
      new THREE.Quaternion(0, 0,  0.009, 0.99996),
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
    'media/harley_quinn_hip_hop_dancing.glb',
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
      // Animation Mixamo intégrée (hip-hop dancing 7.07 s)
      // Remplacer par buildWalkClip(mesh) pour le clip de marche custom
      const action = mixer.clipAction(gltf.animations[0]);
      action.setLoop(THREE.LoopRepeat);

      const skelHelper = new THREE.SkeletonHelper(mesh);
      skelHelper.material.linewidth = 3;

      animGroup.add(mesh);
      scene.add(skelHelper);
      onReady({ mixer, action });
    },
    undefined,
    err => console.error('harley_quinn_hip_hop_dancing.glb:', err),
  );
}
