/**
 * Walker : lara_croft_rigged.glb
 * ⚠️  Le GLB a un squelette (51 bones) mais les meshes N'ONT PAS de skin weights
 * (pas d'attributs JOINTS_0/WEIGHTS_0). Les bones s'animent mais les vertices
 * ne se déforment pas — Lara reste statique visuellement.
 * Pour corriger : ré-exporter depuis Blender avec "Export Skinning" activé.
 *
 * Squelette Blender standard :
 *   _rootJoint → spine_00 → spine.001_01 → … → spine.004_04
 *     → shoulder.L_07 → upper_arm.L_08 → forearm.L_09 → hand.L_010
 *     → shoulder.R_012 → upper_arm.R_013 → forearm.R_014 → hand.R_015
 *   spine_00 → thigh.L_025 → shin.L_026 → foot.L_027 → toe.L_028
 *   spine_00 → thigh.R_032 → shin.R_033 → foot.R_034 → toe.R_035
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
  return new THREE.AnimationClip('walk-lara', T, [
    qt('thigh.L_025',     qx(30),  N,       qx(-30), N,       qx(30)),
    qt('thigh.R_032',     qx(-30), N,       qx(30),  N,       qx(-30)),
    qt('shin.L_026',      qx(-5),  qx(-15), qx(-40), qx(-15), qx(-5)),
    qt('shin.R_033',      qx(-40), qx(-15), qx(-5),  qx(-15), qx(-40)),
    qt('upper_arm.L_08',  qx(-20), N,       qx(20),  N,       qx(-20)),
    qt('upper_arm.R_013', qx(20),  N,       qx(-20), N,       qx(20)),
    qt('forearm.L_09',    qx(-10), qx(-5),  qx(10),  qx(-5),  qx(-10)),
    qt('forearm.R_014',   qx(10),  qx(-5),  qx(-10), qx(-5),  qx(10)),
    qt('spine_00',
      new THREE.Quaternion(0, 0,  0.009, 0.99996), N,
      new THREE.Quaternion(0, 0, -0.009, 0.99996), N,
      new THREE.Quaternion(0, 0,  0.009, 0.99996),
    ),
  ]);
}

/**
 * Charge lara_croft_rigged.glb et configure le mixer de marche.
 * @param {THREE.Group}  animGroup  groupe parent pour le mesh
 * @param {THREE.Scene}  scene      scène racine (pour SkeletonHelper)
 * @param {Function}     onReady    callback({ mixer, action })
 */
export function load(animGroup, scene, onReady) {
  gltfLoader.load(
    'media/lara_croft_rigged.glb',
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
    err => console.error('lara_croft_rigged.glb:', err),
  );
}
