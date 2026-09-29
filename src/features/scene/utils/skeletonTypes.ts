import type * as THREE from 'three';

export interface BoneHierarchyNode {
  name: string;
  bone?: THREE.Bone;
  children: BoneHierarchyNode[];
}

export interface SkeletonGroup {
  id: string;
  label: string;
  type: 'wig' | 'character' | 'other';
  meshNames: string[];
  rootNodes: BoneHierarchyNode[];
  totalBones: number;
}
