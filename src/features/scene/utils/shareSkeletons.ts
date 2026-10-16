import type { Object3D, Skeleton, SkinnedMesh } from 'three';

/** Reuse identical skin palettes within one clone, never between characters. */
export function shareSkeletons(root: Object3D): void {
  const skeletons: Skeleton[] = [];
  root.traverse(object => {
    const mesh = object as SkinnedMesh;
    if (!mesh.isSkinnedMesh) return;
    const current = mesh.skeleton;
    const shared = skeletons.find(candidate =>
      candidate.bones.length === current.bones.length &&
      candidate.boneInverses.length === current.boneInverses.length &&
      candidate.bones.every((bone, index) => bone === current.bones[index]) &&
      candidate.boneInverses.every((inverse, index) => inverse.equals(current.boneInverses[index]))
    );
    if (shared) mesh.skeleton = shared;
    else skeletons.push(current);
  });
}
