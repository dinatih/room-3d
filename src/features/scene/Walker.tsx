/**
 * Walker.tsx — Personnages animés (Lara, WalkerRed, WalkerPerfect).
 */
import { useRef, useLayoutEffect, useMemo, useEffect, Suspense } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import * as THREE from 'three';
import { cameraState } from '@features/scene/cameraState';
import { LAYER_WALKER_DETAIL } from '@config';

import { type SceneItemProps } from '@shared/types';

// ── Constants & Config ───────────────────────────────────────────────────────

const WALK_PERIOD = 0.7;
const HEAD_BONE = 'head_neck_upper_052';
const MIXAMO_HEAD_BONE = 'mixamorig_Head';
const MIXAMO_GLB = 'media/glb/lara_mixamo.glb';
const MIXAMO_WALK_GLB = 'media/glb-animations/happy_walk.glb';

const RED_MAT_NAMES = new Set(['5_BackPack_1.0_0_0', '5_Shorts_1.0_0_0']);
const RED_NODE_NAMES = new Set(['LARA_Object_113']);
const RED_COLOR = new THREE.Color(0xcc1111);

const HAIR_REGEX = /^head_hair_ponytail_/;
const HAIR_NODES = new Set(['Object_104', 'Object_111', 'Object_115', 'Object_116']);
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

function cacheRestStates(root: THREE.Object3D): void {
  root.traverse(c => {
    if ((c as THREE.Bone).isBone) {
      (c as THREE.Bone).userData.restQuat = (c as THREE.Bone).quaternion.clone();
      (c as THREE.Bone).userData.restPos = (c as THREE.Bone).position.clone();
    }
  });
}

function quatAxisDeg(axis: string, deg: number): THREE.Quaternion {
  const r = (deg * Math.PI) / 180 / 2, s = Math.sin(r), c = Math.cos(r);
  return axis === 'X' ? new THREE.Quaternion(s, 0, 0, c) : axis === 'Y' ? new THREE.Quaternion(0, s, 0, c) : new THREE.Quaternion(0, 0, s, c);
}

// ── Shared Retargeting Logic ─────────────────────────────────────────────────

function retargetMixamoClip(clip: THREE.AnimationClip, restPos?: THREE.Vector3): THREE.AnimationClip {
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
      const vals = cloned.values, rx = restPos?.x ?? 0, rz = restPos?.z ?? 0;
      for (let i = 0; i < vals.length; i += 3) {
        vals[i] = rx;
        vals[i + 2] = rz;
      }
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
    const bone = findBone(root, t.bone); if (!bone) continue;
    const rest = (bone.userData.restQuat as THREE.Quaternion)?.clone() ?? bone.quaternion.clone();
    const offset = (t.offsetAxis && t.offsetDeg) ? quatAxisDeg(t.offsetAxis, t.offsetDeg) : null;
    let base = (t.space === 'parent') ? (offset ? offset.clone().multiply(rest) : rest.clone()) : (offset ? rest.clone().multiply(offset) : rest.clone());
    const flat: number[] = [];
    for (const deg of t.keys) {
      const delta = quatAxisDeg(t.axis, deg), q = (t.space === 'parent') ? delta.clone().multiply(base) : base.clone().multiply(delta);
      flat.push(q.x, q.y, q.z, q.w);
    }
    clipTracks.push(new THREE.QuaternionKeyframeTrack(t.bone + '.quaternion', times, flat));
  }
  return new THREE.AnimationClip('walk-v2', T, clipTracks);
}

// ── Centering Logic ──────────────────────────────────────────────────────────

/**
 * Centrage chirurgical : aligne le point milieu entre les deux chevilles (ou HIPS en fallback)
 * exactement au dessus du point [0, 0, 0] local du parent.
 */
function setupCentering(scene: THREE.Object3D, height: number, hipsName: string) {
  scene.position.set(0, 0, 0); scene.scale.set(1, 1, 1); scene.rotation.set(0, 0, 0);
  scene.updateMatrixWorld(true);

  // 1. Calcul du scale pour atteindre la hauteur demandée
  const box = new THREE.Box3().setFromObject(scene), size = box.getSize(new THREE.Vector3());
  const factor = size.y > 0.001 ? height / size.y : 1;
  scene.scale.setScalar(factor);
  scene.updateMatrixWorld(true);

  // 2. Recherche du pivot horizontal (Chevilles ou Hanches)
  const lAnkle = findBone(scene, 'leg_left_ankle_06') || findBone(scene, 'mixamorig_LeftFoot');
  const rAnkle = findBone(scene, 'leg_right_ankle_010') || findBone(scene, 'mixamorig_RightFoot');
  const hips = findBone(scene, hipsName);

  const pivotW = new THREE.Vector3();
  if (lAnkle && rAnkle) {
    const p1 = new THREE.Vector3(), p2 = new THREE.Vector3();
    lAnkle.getWorldPosition(p1); rAnkle.getWorldPosition(p2);
    pivotW.addVectors(p1, p2).multiplyScalar(0.5);
  } else if (hips) {
    hips.getWorldPosition(pivotW);
  } else {
    box.setFromObject(scene); box.getCenter(pivotW);
  }

  // On décentre le modèle pour que le pivot calculé tombe sur 0,0 en X/Z
  const scenePosW = new THREE.Vector3(); scene.getWorldPosition(scenePosW);
  scene.position.x = -(pivotW.x - scenePosW.x);
  scene.position.z = -(pivotW.z - scenePosW.z);

  // 3. Calage au sol
  scene.updateMatrixWorld(true);
  const finalBox = new THREE.Box3().setFromObject(scene);
  scene.position.y = -finalBox.min.y;
}

// ── Components ───────────────────────────────────────────────────────────────

interface WalkerProps { showSkeleton?: boolean; isPreview?: boolean; walkerAnim?: string; isPaused?: boolean; }

function SkeletonView({ root, visible }: { root: THREE.Object3D, visible: boolean }) {
  const { scene: worldScene } = useThree();
  const helperRef = useRef<THREE.SkeletonHelper | null>(null);
  useEffect(() => {
    if (!visible) return;
    const helper = new THREE.SkeletonHelper(root);
    helper.matrixAutoUpdate = false; helper.matrix.identity();
    worldScene.add(helper); helperRef.current = helper;
    return () => { worldScene.remove(helper); helperRef.current = null; };
  }, [root, visible, worldScene]);
  useFrame(() => { if (helperRef.current) helperRef.current.update(); });
  return null;
}

function GroundPoint() {
  return (
    <group position={[0, 0.05, 0]} name="GroundPoint">
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[4, 5, 32]} />
        <meshBasicMaterial color="#0058a3" transparent opacity={0.6} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1, 16]} />
        <meshBasicMaterial color="#0058a3" />
      </mesh>
    </group>
  );
}

function InternalWalker({ showSkeleton = false, isPreview = false, walkerAnim, isPaused }: WalkerProps) {
  const { scene } = useGLTFClone('media/glb/lara_croft__2026_rigged.glb');
  const groupRef = useRef<THREE.Group>(null!), mixerRef = useRef<THREE.AnimationMixer | null>(null), actionRef = useRef<THREE.AnimationAction | null>(null), activeRef = useRef(false), fadeFrames = useRef(0), headBoneRef = useRef<THREE.Bone | null>(null), fpsHideRef = useRef<THREE.Object3D[]>([]), fpsCollapsedRef = useRef(false);
  const { invalidate } = useThree();

  useLayoutEffect(() => {
    normalizeBoneNames(scene); setupCentering(scene, 181, 'pelvis_03');
    scene.traverse(c => { c.layers.set(0); if ((c as THREE.Mesh).isMesh) { (c as THREE.Mesh).castShadow = (c as THREE.Mesh).receiveShadow = true; (c as THREE.Mesh).frustumCulled = false; } });
    cacheRestStates(scene); mixerRef.current = new THREE.AnimationMixer(scene);
    if (walkerAnim !== 'tpose') { const action = mixerRef.current.clipAction(buildWalkClip(scene)); action.setLoop(THREE.LoopRepeat, Infinity); actionRef.current = action; if (isPreview && !isPaused) { action.play(); activeRef.current = true; } }
    headBoneRef.current = findBone(scene, HEAD_BONE);
    fpsHideRef.current = []; scene.traverse(c => { const n = c.name.startsWith('LARA_') ? c.name.substring(5) : c.name; if (FPS_LAYER_HIDE.has(n)) fpsHideRef.current.push(c); });
    scene.traverse(c => { const n = c.name.startsWith('LARA_') ? c.name.substring(5) : c.name; if (ALWAYS_HIDE_NAMES.has(n)) c.visible = false; });
    if (!isPreview) {
      walkerMeshList.length = 0;
      scene.traverse(c => { if ((c as THREE.Mesh).isMesh) walkerMeshList.push(c as THREE.Mesh); });
    }
  }, [scene, isPreview, walkerAnim]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const active = isPreview ? true : cameraState.activeWalkerIdx === 0;
    if (!isPreview) {
      if (active) {
        if (cameraState.isWalking) { cameraState.walker0X = cameraState.camX; cameraState.walker0Z = cameraState.camZ; cameraState.walker0Yaw = cameraState.walkYaw; }
        else { cameraState.walker0Yaw = cameraState.walkYaw; }
        cameraState.walkerX = cameraState.walker0X; cameraState.walkerZ = cameraState.walker0Z; groupRef.current.rotation.y = cameraState.walkYaw;
      } else { groupRef.current.rotation.y = cameraState.walker0Yaw; }
      groupRef.current.position.set(cameraState.walker0X, 0, cameraState.walker0Z);
      groupRef.current.visible = !(active && cameraState.walkerHidden);
    } else { groupRef.current.position.set(0, 0, 0); groupRef.current.rotation.y = 0; groupRef.current.visible = true; }

    const hF = active && cameraState.isWalking && !isPreview;
    if (hF !== fpsCollapsedRef.current) { fpsHideRef.current.forEach(m => m.layers.set(hF ? LAYER_WALKER_DETAIL : 0)); fpsCollapsedRef.current = hF; invalidate(); }
    
    const mixer = mixerRef.current, action = actionRef.current, move = cameraState.isMoving && active;
    if (mixer && action) {
      if (isPreview) { if (!isPaused && walkerAnim !== 'tpose') { mixer.update(delta); invalidate(); } }
      else {
        if (move && !activeRef.current) { action.reset().fadeIn(0.15).play(); activeRef.current = true; }
        else if (!move && activeRef.current) { action.fadeOut(0.2); activeRef.current = false; fadeFrames.current = 15; }
        if (activeRef.current || fadeFrames.current > 0) {
          mixer.update(delta); if (!activeRef.current && fadeFrames.current > 0) fadeFrames.current--; invalidate();
        }
      }
    }
  });

  return <group ref={groupRef}><primitive object={scene} /><GroundPoint /><SkeletonView root={scene} visible={showSkeleton} /></group>;
}

export function Walker(props: WalkerProps) { return <Suspense fallback={null}><InternalWalker {...props} /></Suspense>; }

function InternalWalkerRed({ showSkeleton = false, isPreview = false, walkerAnim, isPaused }: WalkerProps) {
  const { scene } = useGLTFClone(MIXAMO_GLB), animPath = useMemo(() => (!walkerAnim || walkerAnim === 'tpose') ? null : `media/glb-animations/${walkerAnim}`, [walkerAnim]), animGltf = useGLTF(animPath || MIXAMO_WALK_GLB);
  const groupRef = useRef<THREE.Group>(null!), mixerRef = useRef<THREE.AnimationMixer | null>(null), actionRef = useRef<THREE.AnimationAction | null>(null), activeRef = useRef(false), fadeFrames = useRef(0);
  const { invalidate } = useThree();

  useLayoutEffect(() => {
    normalizeMixamoBoneNames(scene); setupCentering(scene, 173.4, 'mixamorig_Hips');
    scene.traverse(c => { if ((c as THREE.Mesh).isMesh) { (c as THREE.Mesh).castShadow = (c as THREE.Mesh).receiveShadow = true; (c as THREE.Mesh).frustumCulled = false; const m = (c as THREE.Mesh).material as THREE.MeshStandardMaterial; if (RED_MAT_NAMES.has(m?.name) || RED_NODE_NAMES.has(c.name)) { (c as THREE.Mesh).material = m.clone(); ((c as THREE.Mesh).material as THREE.MeshStandardMaterial).color.set(RED_COLOR); } } });
    cacheRestStates(scene); mixerRef.current = new THREE.AnimationMixer(scene);
    if (walkerAnim !== 'tpose') {
      const raw = animGltf?.animations?.[0];
      if (raw) {
        const hBone = findBone(scene, 'mixamorig_Hips');
        const clip = retargetMixamoClip(raw, hBone?.userData.restPos), action = mixerRef.current.clipAction(clip);
        action.setLoop(THREE.LoopRepeat, Infinity); actionRef.current = action;
        if (isPreview && !isPaused) { action.play(); activeRef.current = true; }
      }
    }
  }, [scene, animGltf, isPreview, walkerAnim]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const active = isPreview ? true : cameraState.activeWalkerIdx === 1;
    if (!isPreview) {
      if (active) {
        if (cameraState.isWalking) { cameraState.walker1X = cameraState.camX; cameraState.walker1Z = cameraState.camZ; cameraState.walker1Yaw = cameraState.walkYaw; }
        else { cameraState.walker1Yaw = cameraState.walkYaw; }
        cameraState.walkerX = cameraState.walker1X; cameraState.walkerZ = cameraState.walker1Z; groupRef.current.rotation.y = cameraState.walkYaw;
      } else { groupRef.current.rotation.y = cameraState.walker1Yaw; }
      groupRef.current.position.set(cameraState.walker1X, 0, cameraState.walker1Z);
      groupRef.current.visible = !(active && cameraState.walkerHidden);
    } else { groupRef.current.position.set(0, 0, 0); groupRef.current.rotation.y = 0; groupRef.current.visible = true; }
    
    const mixer = mixerRef.current, action = actionRef.current, move = cameraState.isMoving && active;
    if (mixer && action) {
      if (isPreview) { if (!isPaused && walkerAnim !== 'tpose') { mixer.update(delta); invalidate(); } }
      else {
        if (move && !activeRef.current) { action.reset().fadeIn(0.15).play(); activeRef.current = true; }
        else if (!move && activeRef.current) { action.fadeOut(0.2); activeRef.current = false; fadeFrames.current = 15; }
        if (activeRef.current || fadeFrames.current > 0) {
          mixer.update(delta); if (!activeRef.current && fadeFrames.current > 0) fadeFrames.current--; invalidate();
        }
      }
    }
  });

  return <group ref={groupRef}><primitive object={scene} /><GroundPoint /><SkeletonView root={scene} visible={showSkeleton} /></group>;
}

export function WalkerRed(props: WalkerProps) { return <Suspense fallback={null}><InternalWalkerRed {...props} /></Suspense>; }

function InternalWalkerPerfect({ showSkeleton = false, isPreview = false, walkerAnim, isPaused, onSize }: WalkerProps & { onSize?: (dims: { w: number, d: number, h: number }) => void }) {
  const { scene } = useGLTFClone('media/glb/lara_perfect.glb'), animPath = useMemo(() => (!walkerAnim || walkerAnim === 'tpose') ? null : `media/glb-animations/${walkerAnim}`, [walkerAnim]), animGltf = useGLTF(animPath || MIXAMO_WALK_GLB);
  const groupRef = useRef<THREE.Group>(null!), mixerRef = useRef<THREE.AnimationMixer | null>(null), actionRef = useRef<THREE.AnimationAction | null>(null), activeRef = useRef(false), fadeFrames = useRef(0);
  const { invalidate } = useThree();
  useLayoutEffect(() => {
    normalizeMixamoBoneNames(scene);
    setupCentering(scene, 173.4, 'mixamorig_Hips');
    scene.traverse(c => { c.layers.set(0); if ((c as THREE.Mesh).isMesh) { (c as THREE.Mesh).castShadow = (c as THREE.Mesh).receiveShadow = true; (c as THREE.Mesh).frustumCulled = false; } });
    cacheRestStates(scene);
    mixerRef.current = new THREE.AnimationMixer(scene);
    if (walkerAnim !== 'tpose') {
      const raw = animGltf?.animations?.[0];
      if (raw) {
        const hBone = findBone(scene, 'mixamorig_Hips');
        const clip = retargetMixamoClip(raw, hBone?.userData.restPos);
        const action = mixerRef.current.clipAction(clip);
        action.setLoop(THREE.LoopRepeat, Infinity); actionRef.current = action;
        if (isPreview && !isPaused) { action.play(); activeRef.current = true; }
      }
    }
    if (onSize) {
      scene.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(scene), s = box.getSize(new THREE.Vector3());
      onSize({ w: s.x, d: s.z, h: s.y });
    }
  }, [scene, animGltf, isPreview, walkerAnim, onSize]);
  
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const active = isPreview ? true : cameraState.activeWalkerIdx === 2;
    if (!isPreview) {
      if (active) {
        if (cameraState.isWalking) { cameraState.walker2X = cameraState.camX; cameraState.walker2Z = cameraState.camZ; cameraState.walker2Yaw = cameraState.walkYaw; }
        else { cameraState.walker2Yaw = cameraState.walkYaw; }
        cameraState.walkerX = cameraState.walker2X; cameraState.walkerZ = cameraState.walker2Z; groupRef.current.rotation.y = cameraState.walkYaw;
      } else { groupRef.current.rotation.y = cameraState.walker2Yaw; }
      groupRef.current.position.set(cameraState.walker2X, 0, cameraState.walker2Z);
      groupRef.current.visible = !(active && cameraState.walkerHidden);
    } else { groupRef.current.position.set(0, 0, 0); groupRef.current.rotation.y = 0; groupRef.current.visible = true; }
    
    const mixer = mixerRef.current, action = actionRef.current, move = cameraState.isMoving && active;
    if (mixer && action) {
      if (isPreview) { if (!isPaused && walkerAnim !== 'tpose') { mixer.update(delta); invalidate(); } }
      else {
        if (move && !activeRef.current) { action.reset().fadeIn(0.15).play(); activeRef.current = true; }
        else if (!move && activeRef.current) { action.fadeOut(0.2); activeRef.current = false; fadeFrames.current = 15; }
        if (activeRef.current || fadeFrames.current > 0) {
          mixer.update(delta); if (!activeRef.current && fadeFrames.current > 0) fadeFrames.current--; invalidate();
        }
      }
    }
  });

  return <group ref={groupRef}><primitive object={scene} /><GroundPoint /><SkeletonView root={scene} visible={showSkeleton} /></group>;
}

export function WalkerPerfect(props: WalkerProps & { onSize?: (dims: { w: number, d: number, h: number }) => void }) { return <Suspense fallback={null}><InternalWalkerPerfect {...props} /></Suspense>; }

useGLTF.preload('media/glb/lara_perfect.glb');
useGLTF.preload('media/glb/lara_croft__2026_rigged.glb');
useGLTF.preload(MIXAMO_GLB);
