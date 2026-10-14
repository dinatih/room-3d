import * as THREE from 'three';
import type { AgentProfile } from './obstacles';

/** Torso vertices measured during model setup; arms, hair and equipment do not widen the collider. */
export function measureHumanProfile(root: THREE.Object3D, height: number): AgentProfile {
  root.updateWorldMatrix(true, true);
  const inverse = root.matrixWorld.clone().invert();
  const box = new THREE.Box3();
  const vertex = new THREE.Vector3();
  const meshes: THREE.SkinnedMesh[] = [];
  root.traverse(node => { if ((node as THREE.SkinnedMesh).isSkinnedMesh) meshes.push(node as THREE.SkinnedMesh); });
  const nude = meshes.filter(m => /nude|naked/i.test(m.name));
  for (const mesh of nude.length ? nude : meshes) {
    mesh.skeleton.update();
    const indices = mesh.geometry.getAttribute('skinIndex'), weights = mesh.geometry.getAttribute('skinWeight');
    const positions = mesh.geometry.getAttribute('position');
    const matrix = inverse.clone().multiply(mesh.matrixWorld);
    for (let i = 0; i < positions.count; i++) {
      let dominant = 0;
      for (let j = 1; j < 4; j++) if (weights.getComponent(i, j) > weights.getComponent(i, dominant)) dominant = j;
      const bone = mesh.skeleton.bones[indices.getComponent(i, dominant)];
      if (!/spine|chest|pelvis|hip|torso/i.test(bone.name)) continue;
      // Skinning includes the armature's scale, which can differ from the mesh's
      // scale (Xbot embeds a 0.01 mesh transform under a centimetre armature).
      mesh.getVertexPosition(i, vertex).applyMatrix4(matrix);
      box.expandByPoint(vertex);
    }
  }
  if (box.isEmpty()) throw new Error(`No bind-pose body vertices for ${root.name}`);
  const size = box.getSize(new THREE.Vector3());
  // Root scale is excluded by the inverse above; apply it once to convert to scene centimetres.
  return { radius: Math.max(size.x * root.scale.x, size.z * root.scale.z) / 2, height };
}
