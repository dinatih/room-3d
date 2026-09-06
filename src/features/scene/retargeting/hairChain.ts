import * as THREE from 'three';

export function getDepth(node: THREE.Object3D): number {
  let depth = 0;
  let curr: THREE.Object3D | null = node;
  while (curr && curr.parent) {
    depth++;
    curr = curr.parent;
  }
  return depth;
}

export function buildHairChain(hairBones: THREE.Bone[]) {
  const hairChain: any[] = [];
  const bones = [...hairBones].sort((a, b) => getDepth(a) - getDepth(b));

  if (bones.length > 0) {
    const baseParent = bones[0].parent;
    if (baseParent) {
      baseParent.updateMatrixWorld(true);
      const baseParentRestQuat = baseParent.getWorldQuaternion(new THREE.Quaternion());

      let prevAxis = new THREE.Vector3(0, -1, 0);
      for (const bone of bones) {
        let axis = prevAxis.clone();
        let length = 8.0;
        const child = bone.children.find(x => bones.includes(x as THREE.Bone));
        if (child && child.position.lengthSq() > 1e-8) {
          length = child.position.length();
          axis = child.position.clone().normalize();
        }
        prevAxis = axis.clone();
        bone.updateMatrixWorld(true);
        const jointWorld = new THREE.Vector3().setFromMatrixPosition(bone.matrixWorld);
        const worldScale = new THREE.Vector3().setFromMatrixScale(bone.matrixWorld);
        const tipDirWorld = axis.clone().transformDirection(bone.matrixWorld).normalize();

        let worldLength = length * worldScale.y;
        if (child) {
          const p1 = new THREE.Vector3().setFromMatrixPosition(bone.matrixWorld);
          const p2 = new THREE.Vector3().setFromMatrixPosition(child.matrixWorld);
          worldLength = p1.distanceTo(p2);
        }
        if (worldLength < 0.1) worldLength = 0.1;

        const tipWorld = jointWorld.clone().addScaledVector(tipDirWorld, worldLength);
        const boneRestQuat = bone.getWorldQuaternion(new THREE.Quaternion());
        const relQuat = baseParentRestQuat.clone().invert().multiply(boneRestQuat);

        hairChain.push({
          bone,
          restQuat: bone.quaternion.clone(),
          relQuat,
          axis,
          length,
          worldLength,
          tipWorld: tipWorld.clone(),
          tipPrev: tipWorld.clone(),
        });
      }
    }
  }
  return hairChain;
}
