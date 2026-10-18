import * as THREE from 'three';

export { CC3_TO_MIXAMO, BONE_SYNONYMS } from './boneMappings';
export { getDepth, buildHairChain } from './hairChain';
export { resolveTargetFingerBoneName, resolveTargetBoneName } from './boneResolver';
export { retargetClip } from './retargetClip';

export const _retargetCache: Record<string, THREE.AnimationClip> = {};
