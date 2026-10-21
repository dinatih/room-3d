import * as THREE from 'three';

export interface RigNode {
  name: string; bone: boolean;
  position: number[]; quaternion: number[]; scale: number[];
  defaultPosition?: number[]; restLocalQuaternion?: number[];
  restWorldQuaternion?: number[]; restWorldPosition?: number[];
  children: RigNode[];
}
type RestObject = THREE.Object3D & {
  defaultPosition?: THREE.Vector3; restLocalQuaternion?: THREE.Quaternion;
  restWorldQuaternion?: THREE.Quaternion; restWorldPosition?: THREE.Vector3;
};

/** Only joints and their ancestors are required by retargeting. */
export function captureAnimationRig(root: THREE.Object3D): RigNode {
  const capture = (node: RestObject): RigNode | undefined => {
    const children = node.children.map(child => capture(child)).filter((child): child is RigNode => !!child);
    const bone = !!(node as THREE.Bone).isBone;
    if (!bone && !children.length && node !== root) return;
    return { name: node === root ? '' : node.name, bone,
      position: (node.defaultPosition ?? node.position).toArray(),
      quaternion: (node.restLocalQuaternion ?? node.quaternion).toArray(), scale: node.scale.toArray(),
      defaultPosition: node.defaultPosition?.toArray(), restLocalQuaternion: node.restLocalQuaternion?.toArray(),
      restWorldQuaternion: node.restWorldQuaternion?.toArray(), restWorldPosition: node.restWorldPosition?.toArray(), children,
    };
  };
  return capture(root)!;
}

export function restoreAnimationRig(node: RigNode): THREE.Object3D {
  const root: RestObject = node.bone ? new THREE.Bone() : new THREE.Group();
  root.name = node.name;
  root.position.fromArray(node.position); root.quaternion.fromArray(node.quaternion); root.scale.fromArray(node.scale);
  if (node.defaultPosition) root.defaultPosition = new THREE.Vector3().fromArray(node.defaultPosition);
  if (node.restLocalQuaternion) root.restLocalQuaternion = new THREE.Quaternion().fromArray(node.restLocalQuaternion);
  if (node.restWorldQuaternion) root.restWorldQuaternion = new THREE.Quaternion().fromArray(node.restWorldQuaternion);
  if (node.restWorldPosition) root.restWorldPosition = new THREE.Vector3().fromArray(node.restWorldPosition);
  for (const child of node.children) root.add(restoreAnimationRig(child));
  root.updateMatrixWorld(true);
  return root;
}

export interface ClipData {
  uuid: string; blendMode: THREE.AnimationBlendMode; name: string; duration: number;
  tracks: { name: string; type: string; times: Float32Array; values: Float32Array | string[] | boolean[]; interpolation: THREE.InterpolationModes }[];
}
export function captureAnimationClip(clip: THREE.AnimationClip): ClipData {
  return { uuid: clip.uuid, blendMode: clip.blendMode, name: clip.name, duration: clip.duration, tracks: clip.tracks.map(track => ({
    name: track.name, type: track.ValueTypeName, times: track.times, values: track.values, interpolation: track.getInterpolation(),
  })) };
}
export function restoreAnimationClip(clip: ClipData): THREE.AnimationClip {
  const tracks = clip.tracks.map(track => {
    const { name, times, values, interpolation } = track;
    switch (track.type) {
      case 'quaternion': return new THREE.QuaternionKeyframeTrack(name, times, values as Float32Array, interpolation);
      case 'vector': return new THREE.VectorKeyframeTrack(name, times, values as Float32Array, interpolation);
      case 'number': return new THREE.NumberKeyframeTrack(name, times, values as Float32Array, interpolation);
      case 'color': return new THREE.ColorKeyframeTrack(name, times, values as Float32Array, interpolation);
      case 'bool': return new THREE.BooleanKeyframeTrack(name, times, values as boolean[]);
      case 'string': return new THREE.StringKeyframeTrack(name, times, values as string[]);
      default: throw new Error(`Unsupported animation track type: ${track.type}`);
    }
  });
  return new THREE.AnimationClip(clip.name, clip.duration, tracks, clip.blendMode);
}
