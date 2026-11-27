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

export interface HairNode {
  bone: THREE.Bone;
  rootParent: THREE.Object3D;
  restQuat: THREE.Quaternion;
  relQuat: THREE.Quaternion;
  axis: THREE.Vector3;
  length: number;
  progress: number;
  tipWorld: THREE.Vector3;
  tipPrev: THREE.Vector3;
  needsReset: boolean;
}

export function buildHairChain(hairBones: THREE.Bone[]) {
  const bones = new Set(hairBones);
  const chain: HairNode[] = [];
  const nodes = new Map<THREE.Object3D, HairNode>();
  const strandRoots = new Map<HairNode, HairNode>();
  const strandLengths = new Map<HairNode, number>();

  for (const bone of [...bones].sort((a, b) => getDepth(a) - getDepth(b))) {
    if (!bone.parent) continue;

    const restQuat = (bone.userData.restQuat as THREE.Quaternion | undefined)?.clone() ?? bone.quaternion.clone();
    const parentNode = nodes.get(bone.parent);
    const child = bone.children.find(child => bones.has(child as THREE.Bone) && child.position.lengthSq() > 0);
    // Extend a terminal segment along the incoming segment in the bone's rest frame.
    const offset = child?.position.clone() ?? bone.position.clone().applyQuaternion(restQuat.clone().invert());
    const length = offset.length();
    if (length === 0) continue;

    const node: HairNode = {
      bone,
      rootParent: parentNode?.rootParent ?? bone.parent,
      restQuat,
      relQuat: parentNode ? parentNode.relQuat.clone().multiply(restQuat) : restQuat.clone(),
      axis: offset.divideScalar(length),
      length,
      progress: parentNode ? parentNode.progress + 1 : 0,
      tipWorld: new THREE.Vector3(),
      tipPrev: new THREE.Vector3(),
      needsReset: true,
    };
    const root = (parentNode && strandRoots.get(parentNode)) ?? node;
    strandRoots.set(node, root);
    strandLengths.set(root, node.progress);
    nodes.set(bone, node);
    chain.push(node);
  }
  for (const node of chain) {
    const root = strandRoots.get(node)!;
    node.progress /= Math.max(1, strandLengths.get(root)!);
  }
  return chain;
}
