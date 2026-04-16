/**
 * Walker : low_ariel_combat_idle_01.glb
 * SkinnedMesh réel + animation combat-idle intégrée (1.30 s).
 * ⚠️  Personnage sans jambes (queue + ailes + bâton).
 *     L'animation anime uniquement le torse/bras/queue via un rig IK complexe.
 *     Bones déform : e_spine1_m, e_shoulder_r/l, e_elbow_r/l, e_wrist_r/l,
 *                    e_tail1..4_m, e_basic_r/l (ailes).
 */
import * as THREE from 'three';
import { gltfLoader } from '../../utils/loaders.js';
import { LAYER_GLB } from '../../config.js';

const SHOE_H = 5;

/**
 * Charge low_ariel_combat_idle_01.glb et configure le mixer.
 * @param {THREE.Group}  animGroup
 * @param {THREE.Scene}  scene
 * @param {Function}     onReady   callback({ mixer, action })
 */
export function load(animGroup, scene, onReady) {
  gltfLoader.load(
    'media/low_ariel_combat_idle_01.glb',
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
      const action = mixer.clipAction(gltf.animations[0]); // combat idle 1.30 s
      action.setLoop(THREE.LoopRepeat);

      const skelHelper = new THREE.SkeletonHelper(mesh);
      skelHelper.material.linewidth = 3;

      animGroup.add(mesh);
      scene.add(skelHelper);
      onReady({ mixer, action });
    },
    undefined,
    err => console.error('low_ariel_combat_idle_01.glb:', err),
  );
}
