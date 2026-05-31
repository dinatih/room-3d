/**
 * Walker.tsx — Personnages animés (Lara, WalkerRed, X-Bot).
 */
import { useRef, useLayoutEffect, useMemo, useEffect } from 'react';
import { useFrame, useThree, useLoader } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import * as THREE from 'three';
import { cameraState } from '@features/scene/cameraState';
import { LAYER_WALKER_DETAIL } from '@config';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

// ── Constants & Config ───────────────────────────────────────────────────────

const WALK_PERIOD = 0.7;
const HEAD_BONE = 'head_neck_upper_052';
const MIXAMO_HEAD_BONE = 'mixamorig_Head';
const MIXAMO_GLB = 'media/glb/lara_mixamo.glb';
const MIXAMO_WALK_GLB = 'media/glb-animations/walking.glb';
const XBOT_GLB = 'media/glb/character.glb';

const RED_MAT_NAMES = new Set(['5_BackPack_1.0_0_0', '5_Shorts_1.0_0_0']);
const RED_NODE_NAMES = new Set(['LARA_Object_113']);
const RED_COLOR = new THREE.Color(0xcc1111);

const HAIR_REGEX = /^head_hair_ponytail_/;
const HAIR_NODES = new Set(['Object_104', 'Object_111', 'Object_115', 'Object_116']);
const HAIR_COLORS = [new THREE.Color(0x000000), new THREE.Color(0x990000), new THREE.Color(0xffffff)];
const HAIR_GRAVITY = 980;
const HAIR_STIFFNESS = 0.03;
const HAIR_DAMPING = 0.08;

const FPS_LAYER_HIDE = new Set(['Object_95', 'Object_106', 'Object_107']);
const ALWAYS_HIDE_NAMES = new Set(['Object_117', 'Object_118']);

export const walkerMeshList: THREE.Mesh[] = [];

// ── Helpers ──────────────────────────────────────────────────────────────────

function normalizeBoneNames(root: THREE.Object3D): void {
  root.traverse(c => { if ((c as THREE.Bone).isBone) c.name = c.name.replace(/ /g, '_'); });
}

function normalizeMixamoBoneNames(root: THREE.Object3D): void {
  root.traverse(c => { if ((c as THREE.Bone).isBone) c.name = c.name.replace(/[ :]/g, '_'); });
}

function findBone(root: THREE.Object3D, name: string): THREE.Bone | null {
  let found: THREE.Bone | null = null;
  root.traverse(c => { if ((c as THREE.Bone).isBone && c.name === name && !found) found = c as THREE.Bone; });
  return found;
}

function cacheRestQuats(root: THREE.Object3D): void {
  root.traverse(c => { if ((c as THREE.Bone).isBone) (c as THREE.Bone).userData.restQuat = (c as THREE.Bone).quaternion.clone(); });
}

function quatAxisDeg(axis: string, deg: number): THREE.Quaternion {
  const r = (deg * Math.PI) / 180 / 2, s = Math.sin(r), c = Math.cos(r);
  return axis === 'X' ? new THREE.Quaternion(s, 0, 0, c) : axis === 'Y' ? new THREE.Quaternion(0, s, 0, c) : new THREE.Quaternion(0, 0, s, c);
}

// ── Shared Retargeting Logic ─────────────────────────────────────────────────

function retargetMixamoClip(clip: THREE.AnimationClip, hipsRestPos?: THREE.Vector3): THREE.AnimationClip {
  const retargeted: THREE.KeyframeTrack[] = [];
  for (const track of clip.tracks) {
    let name = track.name;
    const slashIdx = name.lastIndexOf('/'); if (slashIdx >= 0) name = name.substring(slashIdx + 1);
    const dotIdx = name.lastIndexOf('.'); if (dotIdx < 0) continue;
    const bonePart = name.substring(0, dotIdx).replace(/[ :]/g, '_'), propPart = name.substring(dotIdx);
    name = bonePart + propPart;
    
    if (bonePart === '_rootJoint' || (propPart === '.position' && !bonePart.includes('Hips')) || propPart === '.scale') continue;
    
    const cloned = track.clone(); cloned.name = name;
    if (name === 'mixamorig_Hips.position') {
      const vals = cloned.values, rx = hipsRestPos?.x ?? 0, rz = hipsRestPos?.z ?? 0;
      for (let i = 0; i < vals.length; i += 3) { vals[i] = rx; vals[i+2] = rz; }
    }
    if (name === 'mixamorig_Hips.quaternion') {
      const vals = cloned.values, q = new THREE.Quaternion(), e = new THREE.Euler();
      for (let i = 0; i < vals.length; i += 4) {
        q.set(vals[i], vals[i+1], vals[i+2], vals[i+3]); e.setFromQuaternion(q, 'YXZ');
        e.z = 0; e.y *= 0.1; q.setFromEuler(e);
        vals[i] = q.x; vals[i+1] = q.y; vals[i+2] = q.z; vals[i+3] = q.w;
      }
    }
    retargeted.push(cloned);
  }
  return new THREE.AnimationClip(clip.name || 'walk-mixamo', clip.duration, retargeted);
}

// ── Custom V2 Walk Clip (for native Lara) ───────────────────────────────────

const V2_TRACKS: any[] = [
  { bone: 'leg_left_thigh_04',  axis: 'X', keys: [+24,   0, -22,   0, +24] },
  { bone: 'leg_right_thigh_08', axis: 'X', keys: [-22,   0, +24,   0, -22] },
  { bone: 'leg_left_knee_05',   axis: 'X', keys: [+30, +65,  +4, +14, +30] },
  { bone: 'leg_right_knee_09',  axis: 'X', keys: [ +4, +14, +30, +65,  +4] },
  { bone: 'leg_left_ankle_06',  axis: 'X', keys: [+18,  +8, -14,  -4, +18] },
  { bone: 'leg_right_ankle_010',axis: 'X', keys: [-14,  -4, +18,  +8, -14] },
  { bone: 'arm_left_shoulder_2_014',  space: 'parent', axis: 'X', keys: [+30, 0, -30, 0, +30], offsetAxis: 'Z', offsetDeg: -80 },
  { bone: 'arm_right_shoulder_2_033', space: 'parent', axis: 'X', keys: [-30, 0, +30, 0, -30], offsetAxis: 'Z', offsetDeg:  80 },
  { bone: 'arm_left_elbow_015',  axis: 'X', keys: [+22, +15,  +8, +15, +22] },
  { bone: 'arm_right_elbow_034', axis: 'X', keys: [ +8, +15, +22, +15,  +8] },
  { bone: 'spine_lower_012',     axis: 'Z', keys: [+4,   0, -4,   0, +4] },
  { bone: 'spine_upper_013',     axis: 'Z', keys: [-2,   0, +2,   0, -2] },
  { bone: 'head_neck_lower_051', axis: 'Z', keys: [-1,   0, +1,   0, -1] },
];

function buildWalkClip(root: THREE.Object3D): THREE.AnimationClip {
  const T = WALK_PERIOD, times = [0, T * 0.25, T * 0.5, T * 0.75, T], clipTracks: THREE.KeyframeTrack[] = [];
  for (const t of V2_TRACKS) {
    const bone = findBone(root, t.bone);
    if (!bone) continue;
    const rest = (bone.userData.restQuat as THREE.Quaternion)?.clone() ?? bone.quaternion.clone();
    const space = t.space ?? 'local';
    const offset = (t.offsetAxis && t.offsetDeg) ? quatAxisDeg(t.offsetAxis, t.offsetDeg) : null;
    let base = (space === 'parent') ? (offset ? offset.clone().multiply(rest) : rest.clone()) : (offset ? rest.clone().multiply(offset) : rest.clone());
    const flat: number[] = [];
    for (const deg of t.keys) {
      const delta = quatAxisDeg(t.axis, deg), q = (t.space === 'parent') ? delta.clone().multiply(base) : base.clone().multiply(delta);
      flat.push(q.x, q.y, q.z, q.w);
    }
    clipTracks.push(new THREE.QuaternionKeyframeTrack(t.bone + '.quaternion', times, flat));
  }
  return new THREE.AnimationClip('walk-v2', T, clipTracks);
}

// ── Hair Chain ───────────────────────────────────────────────────────────────

interface HairNode { bone: THREE.Bone; restQuat: THREE.Quaternion; axis: THREE.Vector3; worldLength: number; tipWorld: THREE.Vector3; tipPrev: THREE.Vector3; }

function initHairChain(root: THREE.Object3D): HairNode[] {
  const bones: THREE.Bone[] = []; root.traverse(c => { if ((c as THREE.Bone).isBone && HAIR_REGEX.test(c.name)) bones.push(c as THREE.Bone); });
  root.updateMatrixWorld(true);
  return bones.map(bone => {
    let axis = new THREE.Vector3(0, 1, 0), length = 0.1;
    const child = bone.children.find(x => (x as THREE.Bone).isBone && HAIR_REGEX.test(x.name)) as THREE.Bone;
    if (child && child.position.lengthSq() > 1e-8) { length = child.position.length(); axis = child.position.clone().normalize(); }
    const tipWorld = new THREE.Vector3().setFromMatrixPosition(bone.matrixWorld).addScaledVector(axis.clone().transformDirection(bone.matrixWorld).normalize(), length * new THREE.Vector3().setFromMatrixScale(bone.matrixWorld).x);
    return { bone, restQuat: (bone.userData.restQuat as THREE.Quaternion)?.clone() ?? bone.quaternion.clone(), axis, worldLength: length * new THREE.Vector3().setFromMatrixScale(bone.matrixWorld).x, tipWorld, tipPrev: tipWorld.clone() };
  });
}

function updateHairPhysics(chain: HairNode[], dtIn: number): void {
  const dt = Math.min(dtIn, 0.05), _g = new THREE.Vector3(0, -HAIR_GRAVITY, 0);
  for (const node of chain) {
    const { bone, restQuat, axis, worldLength } = node, parent = bone.parent; if (!parent) continue;
    parent.updateMatrixWorld(); bone.updateMatrixWorld();
    const jW = new THREE.Vector3().setFromMatrixPosition(bone.matrixWorld), vel = new THREE.Vector3().subVectors(node.tipWorld, node.tipPrev).multiplyScalar(1 - HAIR_DAMPING);
    const next = node.tipWorld.clone().add(vel).addScaledVector(_g, dt * dt), qP = new THREE.Quaternion(); parent.getWorldQuaternion(qP);
    const rT = jW.clone().addScaledVector(axis.clone().applyQuaternion(restQuat).applyQuaternion(qP), worldLength);
    next.lerp(rT, HAIR_STIFFNESS); const dir = new THREE.Vector3().subVectors(next, jW); if (dir.length() < 1e-6) continue;
    dir.multiplyScalar(worldLength / dir.length()); node.tipPrev.copy(node.tipWorld); node.tipWorld.copy(jW).add(dir);
    const qT = new THREE.Quaternion().setFromUnitVectors(axis, dir.normalize().applyQuaternion(qP.invert()));
    bone.quaternion.copy(qT);
  }
}

// ── Main Walker Logic ────────────────────────────────────────────────────────

function setupCentering(scene: THREE.Object3D, height: number, hipsName: string) {
  scene.rotation.y = 0; scene.scale.set(1, 1, 1); scene.position.set(0, 0, 0);
  scene.updateMatrixWorld(true);

  // Measure initial size
  const box = new THREE.Box3().setFromObject(scene);
  const size = box.getSize(new THREE.Vector3());
  const factor = size.y > 0.001 ? height / size.y : 1;
  scene.scale.setScalar(factor);
  scene.updateMatrixWorld(true);

  // Alignment on Hips
  const hips = findBone(scene, hipsName);
  if (hips) {
    const hW = new THREE.Vector3(); hips.getWorldPosition(hW);
    // hW is in world space. Since scene is child of root and at origin, hW is relative to root.
    scene.position.x = -hW.x; scene.position.z = -hW.z;
  } else {
    const c = box.getCenter(new THREE.Vector3());
    scene.position.x = -c.x * factor; scene.position.z = -c.z * factor;
  }
  
  // Final grounding
  scene.updateMatrixWorld(true);
  const groundedBox = new THREE.Box3().setFromObject(scene);
  scene.position.y = -groundedBox.min.y;
}

// ── Components ───────────────────────────────────────────────────────────────

export function Walker({ showSkeleton = false, isPreview = false, walkerAnim, isPaused }: any) {
  const { scene } = useGLTFClone('media/glb/lara_croft__2026_rigged.glb');
  const groupRef = useRef<THREE.Group>(null!), mixerRef = useRef<THREE.AnimationMixer | null>(null), actionRef = useRef<THREE.AnimationAction | null>(null), hairMatRef = useRef<THREE.MeshStandardMaterial | null>(null), hairChainRef = useRef<HairNode[]>([]), headBoneRef = useRef<THREE.Bone | null>(null), fpsHideRef = useRef<THREE.Object3D[]>([]), fpsCollapsedRef = useRef(false), activeRef = useRef(false), hairTRef = useRef(0), fadeFrames = useRef(0);
  const { scene: threeScene, invalidate } = useThree();

  useLayoutEffect(() => {
    normalizeBoneNames(scene);
    setupCentering(scene, 181, 'pelvis_03');

    scene.traverse(c => { if ((c as THREE.Mesh).isMesh) { (c as THREE.Mesh).castShadow = (c as THREE.Mesh).receiveShadow = true; (c as THREE.Mesh).frustumCulled = false; if ((c as THREE.Mesh).material) ((c as THREE.Mesh).material as THREE.MeshStandardMaterial).side = THREE.FrontSide; } });
    
    let hMat: THREE.MeshStandardMaterial | null = null;
    scene.traverse(c => { if ((c as THREE.Mesh).isMesh && HAIR_NODES.has(c.name) && !hMat) hMat = ((c as THREE.Mesh).material as THREE.MeshStandardMaterial).clone(); });
    if (!hMat) hMat = new THREE.MeshStandardMaterial();
    scene.traverse(c => { if ((c as THREE.Mesh).isMesh && HAIR_NODES.has(c.name)) (c as THREE.Mesh).material = hMat!; });
    hMat.emissiveIntensity = 1; hairMatRef.current = hMat;
    
    if (groupRef.current && !isPreview) {
      groupRef.current.position.set(cameraState.walker0X, 0, cameraState.walker0Z);
      groupRef.current.rotation.y = cameraState.walker0Yaw;
    }
    cacheRestQuats(scene);
    
    const mixer = new THREE.AnimationMixer(scene); mixerRef.current = mixer;
    if (walkerAnim !== 'tpose') {
      const action = mixer.clipAction(buildWalkClip(scene));
      action.setLoop(THREE.LoopRepeat, Infinity); actionRef.current = action;
      if (isPreview && !isPaused) { action.play(); activeRef.current = true; }
    } else {
      actionRef.current = null;
      scene.traverse(c => { if ((c as THREE.Bone).isBone && c.userData.restQuat) c.quaternion.copy(c.userData.restQuat); });
      activeRef.current = false;
    }
    
    hairChainRef.current = initHairChain(scene);
    headBoneRef.current = findBone(scene, HEAD_BONE);
    fpsHideRef.current = [];
    scene.traverse(c => { const n = c.name.startsWith('LARA_') ? c.name.substring(5) : c.name; if (FPS_LAYER_HIDE.has(n)) fpsHideRef.current.push(c); });
    scene.traverse(c => { const n = c.name.startsWith('LARA_') ? c.name.substring(5) : c.name; if (ALWAYS_HIDE_NAMES.has(n)) c.visible = false; });
    
    walkerMeshList.length = 0;
    scene.traverse(c => { if ((c as THREE.Mesh).isMesh) walkerMeshList.push(c as THREE.Mesh); });
    cameraState.walkerHeight0 = 181;
  }, [scene, isPreview, walkerAnim, isPaused]);

  useEffect(() => {
    if (!showSkeleton) return;
    const skel = new THREE.SkeletonHelper(scene); threeScene.add(skel);
    return () => { threeScene.remove(skel); };
  }, [scene, showSkeleton, threeScene]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const active = isPreview ? true : cameraState.activeWalkerIdx === 0;
    if (!isPreview) {
      if (active) {
        if (cameraState.isWalking) { cameraState.walker0X = cameraState.camX; cameraState.walker0Z = cameraState.camZ; cameraState.walker0Yaw = cameraState.walkYaw; }
        else { cameraState.walker0Yaw = cameraState.walkYaw; }
        cameraState.walkerX = cameraState.walker0X; cameraState.walkerZ = cameraState.walker0Z;
        groupRef.current.rotation.y = cameraState.walkYaw;
      } else { groupRef.current.rotation.y = cameraState.walker0Yaw; }
      groupRef.current.position.set(cameraState.walker0X, 0, cameraState.walker0Z);
      groupRef.current.visible = !(active && cameraState.walkerHidden);
    } else { groupRef.current.position.set(0, 0, 0); groupRef.current.visible = true; }
    
    const hF = active && cameraState.isWalking && !isPreview;
    if (hF !== fpsCollapsedRef.current) { fpsHideRef.current.forEach(m => m.layers.set(hF ? LAYER_WALKER_DETAIL : 0)); fpsCollapsedRef.current = hF; invalidate(); }
    
    if (active && cameraState.isWalking && !isPreview) {
      if (headBoneRef.current) {
        const r = headBoneRef.current.userData.restQuat as THREE.Quaternion, c = Math.max(-1.2, Math.min(1.2, cameraState.walkPitch));
        headBoneRef.current.quaternion.copy(r).multiply(quatAxisDeg('X', -(c * 180) / Math.PI));
      }
    }
    
    const mixer = mixerRef.current, action = actionRef.current, move = cameraState.isMoving && active;
    if (isPreview) {
      if (mixer && action && walkerAnim !== 'tpose' && !isPaused) {
        mixer.update(delta); if (hairChainRef.current.length > 0) updateHairPhysics(hairChainRef.current, delta); invalidate();
      }
      return;
    }
    if (mixer && action) {
      if (move && !activeRef.current) { action.reset().fadeIn(0.15).play(); activeRef.current = true; }
      else if (!move && activeRef.current) { action.fadeOut(0.2); activeRef.current = false; fadeFrames.current = 15; }
      if (activeRef.current || fadeFrames.current > 0) {
        mixer.update(delta); if (hairChainRef.current.length > 0) updateHairPhysics(hairChainRef.current, delta);
        if (!activeRef.current && fadeFrames.current > 0) fadeFrames.current--; invalidate();
      }
    }
    const hM = hairMatRef.current;
    if (hM) {
      if (move) {
        hairTRef.current += delta * 1.2; const t = hairTRef.current % 4, i = Math.floor(t);
        hM.emissive.lerpColors(HAIR_COLORS[i % 3], HAIR_COLORS[(i + 1) % 3], t - i);
      } else {
        hM.emissive.lerp(new THREE.Color(0), 0.05);
      }
    }
  });
  return <group ref={groupRef}><primitive object={scene} /></group>;
}

export function WalkerRed({ showSkeleton = false, isPreview = false, walkerAnim, isPaused }: any) {
  const { scene } = useGLTFClone(MIXAMO_GLB), animPath = useMemo(() => (!walkerAnim || walkerAnim === 'tpose') ? null : `media/glb-animations/${walkerAnim}`, [walkerAnim]), animGltf = useGLTF(animPath || MIXAMO_WALK_GLB);
  const groupRef = useRef<THREE.Group>(null!), mixerRef = useRef<THREE.AnimationMixer | null>(null), actionRef = useRef<THREE.AnimationAction | null>(null), headBoneRef = useRef<THREE.Bone | null>(null), activeRef = useRef(false), fadeFrames = useRef(0);
  const { scene: threeScene, invalidate } = useThree();

  useLayoutEffect(() => {
    normalizeMixamoBoneNames(scene);
    setupCentering(scene, 173.4, 'mixamorig_Hips');

    scene.traverse(c => { if ((c as THREE.Mesh).isMesh) { (c as THREE.Mesh).castShadow = (c as THREE.Mesh).receiveShadow = true; (c as THREE.Mesh).frustumCulled = false; if ((c as THREE.Mesh).material) ((c as THREE.Mesh).material as THREE.MeshStandardMaterial).side = THREE.FrontSide; } });
    scene.traverse(c => { if ((c as THREE.Mesh).isMesh) { const m = (c as THREE.Mesh).material as THREE.MeshStandardMaterial; if (RED_MAT_NAMES.has(m?.name) || RED_NODE_NAMES.has(c.name)) { (c as THREE.Mesh).material = m.clone(); ((c as THREE.Mesh).material as THREE.MeshStandardMaterial).color.copy(RED_COLOR); ((c as THREE.Mesh).material as THREE.MeshStandardMaterial).map = null; } } });
    
    if (groupRef.current && !isPreview) { groupRef.current.position.set(cameraState.walker1X, 0, cameraState.walker1Z); groupRef.current.rotation.y = cameraState.walker1Yaw; }
    cacheRestQuats(scene); const mixer = new THREE.AnimationMixer(scene); mixerRef.current = mixer;
    
    if (walkerAnim !== 'tpose') {
      const raw = animGltf?.animations?.[0];
      if (raw) {
        const hPos = findBone(scene, 'mixamorig_Hips')?.position.clone();
        const clip = retargetMixamoClip(raw, hPos), action = mixer.clipAction(clip);
        action.setLoop(THREE.LoopRepeat, Infinity); actionRef.current = action;
        if (isPreview && !isPaused) { action.play(); activeRef.current = true; }
      }
    } else {
      actionRef.current = null;
      scene.traverse(c => { if ((c as THREE.Bone).isBone && c.userData.restQuat) c.quaternion.copy(c.userData.restQuat); });
      activeRef.current = false;
    }
    headBoneRef.current = findBone(scene, MIXAMO_HEAD_BONE); cameraState.walkerHeight1 = 173.4;
  }, [scene, animPath, animGltf, walkerAnim, isPreview, isPaused]);

  useEffect(() => { if (showSkeleton) { const skel = new THREE.SkeletonHelper(scene); threeScene.add(skel); return () => { threeScene.remove(skel); }; } }, [scene, showSkeleton, threeScene]);

  useFrame((_, delta) => {
    if (!groupRef.current) return; const active = isPreview ? true : cameraState.activeWalkerIdx === 1;
    if (!isPreview) {
      if (active) { if (cameraState.isWalking) { cameraState.walker1X = cameraState.camX; cameraState.walker1Z = cameraState.camZ; cameraState.walker1Yaw = cameraState.walkYaw; } else { cameraState.walker1Yaw = cameraState.walkYaw; } cameraState.walkerX = cameraState.walker1X; cameraState.walkerZ = cameraState.walker1Z; groupRef.current.rotation.y = cameraState.walkYaw; }
      else { groupRef.current.rotation.y = cameraState.walker1Yaw; }
      groupRef.current.position.set(cameraState.walker1X, 0, cameraState.walker1Z);
    } else { groupRef.current.position.set(0, 0, 0); }
    
    if (active && cameraState.isWalking && !isPreview) {
      if (headBoneRef.current) {
        const r = headBoneRef.current.userData.restQuat as THREE.Quaternion, c = Math.max(-1.2, Math.min(1.2, cameraState.walkPitch));
        headBoneRef.current.quaternion.copy(r).multiply(quatAxisDeg('X', -(c * 180) / Math.PI));
      }
    }
    
    const mixer = mixerRef.current, action = actionRef.current, move = cameraState.isMoving && active;
    if (isPreview) { if (mixer && action && walkerAnim !== 'tpose' && !isPaused) { mixer.update(delta); invalidate(); } return; }
    if (mixer && action) {
      if (move && !activeRef.current) { action.reset().fadeIn(0.15).play(); activeRef.current = true; } else if (!move && activeRef.current) { action.fadeOut(0.2); activeRef.current = false; fadeFrames.current = 15; }
      if (activeRef.current || fadeFrames.current > 0) { mixer.update(delta); if (!activeRef.current && fadeFrames.current > 0) fadeFrames.current--; invalidate(); }
    }
  });
  return <group ref={groupRef}><primitive object={scene} /></group>;
}

export function WalkerXBot({ showSkeleton = false, isPreview = false, walkerAnim, isPaused }: any) {
  const { scene } = useGLTFClone(XBOT_GLB), animPath = useMemo(() => (!walkerAnim || walkerAnim === 'tpose') ? null : `media/glb-animations/${walkerAnim}`, [walkerAnim]), animGltf = useGLTF(animPath || MIXAMO_WALK_GLB);
  const groupRef = useRef<THREE.Group>(null!), mixerRef = useRef<THREE.AnimationMixer | null>(null), actionRef = useRef<THREE.AnimationAction | null>(null), headBoneRef = useRef<THREE.Bone | null>(null), activeRef = useRef(false), fadeFrames = useRef(0);
  const { scene: threeScene, invalidate } = useThree();

  useLayoutEffect(() => {
    normalizeMixamoBoneNames(scene);
    setupCentering(scene, 173.4, 'mixamorig_Hips');

    scene.traverse(c => { if ((c as THREE.Mesh).isMesh) { (c as THREE.Mesh).castShadow = (c as THREE.Mesh).receiveShadow = true; (c as THREE.Mesh).frustumCulled = false; } });
    if (groupRef.current && !isPreview) { groupRef.current.position.set(cameraState.walker2X, 0, cameraState.walker2Z); groupRef.current.rotation.y = cameraState.walker2Yaw; }
    cacheRestQuats(scene); const mixer = new THREE.AnimationMixer(scene); mixerRef.current = mixer;
    
    if (walkerAnim !== 'tpose') {
      const raw = animGltf?.animations?.[0];
      if (raw) {
        const hPos = findBone(scene, 'mixamorig_Hips')?.position.clone(), clip = retargetMixamoClip(raw, hPos), action = mixer.clipAction(clip);
        action.setLoop(THREE.LoopRepeat, Infinity); actionRef.current = action;
        if (isPreview && !isPaused) { action.play(); activeRef.current = true; }
      }
    } else {
      actionRef.current = null;
      scene.traverse(c => { if ((c as THREE.Bone).isBone && c.userData.restQuat) c.quaternion.copy(c.userData.restQuat); });
      activeRef.current = false;
    }
    headBoneRef.current = findBone(scene, MIXAMO_HEAD_BONE); cameraState.walkerHeight2 = 173.4;
  }, [scene, animPath, animGltf, walkerAnim, isPreview, isPaused]);

  useEffect(() => { if (showSkeleton) { const skel = new THREE.SkeletonHelper(scene); threeScene.add(skel); return () => { threeScene.remove(skel); }; } }, [scene, showSkeleton, threeScene]);

  useFrame((_, delta) => {
    if (!groupRef.current) return; const active = isPreview ? true : cameraState.activeWalkerIdx === 2;
    if (!isPreview) {
      if (active) { if (cameraState.isWalking) { cameraState.walker2X = cameraState.camX; cameraState.walker2Z = cameraState.camZ; cameraState.walker2Yaw = cameraState.walkYaw; } else { cameraState.walker2Yaw = cameraState.walkYaw; } cameraState.walkerX = cameraState.walker2X; cameraState.walkerZ = cameraState.walker2Z; groupRef.current.rotation.y = cameraState.walkYaw; }
      else { groupRef.current.rotation.y = cameraState.walker2Yaw; }
      groupRef.current.position.set(cameraState.walker2X, 0, cameraState.walker2Z);
    } else { groupRef.current.position.set(0, 0, 0); }
    
    const mixer = mixerRef.current, action = actionRef.current, move = cameraState.isMoving && active;
    if (isPreview) { if (mixer && action && walkerAnim !== 'tpose' && !isPaused) { mixer.update(delta); invalidate(); } return; }
    if (mixer && action) {
      if (move && !activeRef.current) { action.reset().fadeIn(0.15).play(); activeRef.current = true; } else if (!move && activeRef.current) { action.fadeOut(0.2); activeRef.current = false; fadeFrames.current = 15; }
      if (activeRef.current || fadeFrames.current > 0) { mixer.update(delta); if (!activeRef.current && fadeFrames.current > 0) fadeFrames.current--; invalidate(); }
    }
  });
  return <group ref={groupRef}><primitive object={scene} /></group>;
}

useGLTF.preload('media/glb/lara_croft__2026_rigged.glb');
useGLTF.preload(MIXAMO_GLB);
useGLTF.preload(XBOT_GLB);
