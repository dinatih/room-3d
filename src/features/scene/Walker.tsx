/**
 * Walker.tsx — Lara Perfect (Personnage animé unique).
 */
import { useRef, useLayoutEffect, useMemo, Suspense, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useHelper } from '@react-three/drei';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import * as THREE from 'three';
import { cameraState } from '@features/scene/cameraState';
import { retargetMixamoClip, normalizeMixamoBoneNames, findBone, cacheRestStates } from './WalkerUtils';

const MIXAMO_WALK_GLB = 'media/glb-animations/happy_walk.glb';

interface WalkerProps { showSkeleton?: boolean; isPreview?: boolean; walkerAnim?: string; isPaused?: boolean; glbPath?: string; walkerIdx?: number; }

// --- Internal Components ---
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

export const walkerMeshList: THREE.Mesh[] = [];

function InternalWalker({ showSkeleton = false, isPreview = false, walkerAnim = 'happy_walk.glb', isPaused, glbPath = 'media/glb/lara_perfect_v2.glb', walkerIdx = 0, onSize }: WalkerProps & { onSize?: (dims: { w: number, d: number, h: number }) => void }) {
  const { scene } = useGLTFClone(glbPath);
  const animPath = useMemo(() => {
    if (!walkerAnim || walkerAnim === 'tpose') return null;
    if (walkerAnim.startsWith('media/')) return walkerAnim;
    return `media/glb-animations/${walkerAnim}`;
  }, [walkerAnim]);
  
  const animGltf = useGLTF(animPath || MIXAMO_WALK_GLB);
  const groupRef = useRef<THREE.Group>(null!);
  const sceneRef = useRef<THREE.Object3D>(null!);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null), actionRef = useRef<THREE.AnimationAction | null>(null), activeRef = useRef(false), fadeFrames = useRef(0);
  const { invalidate } = useThree();

  // Official helper hook attached directly to character scene
  const helper = useHelper(showSkeleton ? sceneRef : null, THREE.SkeletonHelper);

  useEffect(() => {
    if (helper.current && (helper.current as any).material instanceof THREE.LineBasicMaterial) {
      const h = helper.current as any;
      h.material.depthTest = false;
      h.material.transparent = true;
      h.material.opacity = 1;
      h.material.color.set(0x00ff00);
      h.renderOrder = 2000;
    }
  }, [helper]);

  useLayoutEffect(() => {
    normalizeMixamoBoneNames(scene);
    
    // Model is bakéed at 173.4cm. No runtime scale needed.
    scene.scale.set(1, 1, 1);
    
    scene.traverse(c => { c.layers.set(0); if ((c as THREE.Mesh).isMesh) { (c as THREE.Mesh).castShadow = (c as THREE.Mesh).receiveShadow = true; (c as THREE.Mesh).frustumCulled = false; } });
    cacheRestStates(scene);
    
    // Find the highest bone parent (the armature root)
    let armature: THREE.Object3D = scene;
    scene.traverse(o => { 
      if ((o as any).isBone && o.parent && !o.parent.isBone && armature === scene) {
        armature = o.parent; 
      }
    });
    mixerRef.current = new THREE.AnimationMixer(armature);
    
    // Diagnostic
    console.log(`WALKER_DEBUG [${glbPath}]: Mixer root set to [${armature.name}].`);
    
    if (walkerAnim !== 'tpose') {
      const raw = animGltf?.animations?.[0];
      if (raw) {
        const hBone = findBone(scene, 'mixamorig_Hips');
        const clip = retargetMixamoClip(raw, hBone?.userData.restPos);
        const action = mixerRef.current.clipAction(clip);
        action.setLoop(THREE.LoopRepeat, Infinity); actionRef.current = action;
        if (isPreview && !isPaused) { action.play(); activeRef.current = true; }
      }
    } else {
      // RESET TO T-POSE
      scene.traverse(o => {
        if ((o as THREE.Bone).isBone) {
          const b = o as THREE.Bone;
          if (b.userData.restQuat) b.quaternion.copy(b.userData.restQuat);
          if (b.userData.restPos) b.position.copy(b.userData.restPos);
        }
      });
      if (mixerRef.current) mixerRef.current.stopAllAction();
      invalidate();
    }
    
    // Populate debug list
    walkerMeshList.length = 0;
    scene.traverse(c => { if ((c as THREE.Mesh).isMesh) walkerMeshList.push(c as THREE.Mesh); });
    walkerMeshList.sort((a, b) => a.name.localeCompare(b.name));

    if (onSize) {
      scene.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(scene), s = box.getSize(new THREE.Vector3());
      if (walkerIdx === 0) cameraState.walkerHeight0 = s.y;
      else if (walkerIdx === 1) cameraState.walkerHeight1 = s.y;
      else if (walkerIdx === 2) cameraState.walkerHeight2 = s.y;
      onSize({ w: s.x, d: s.z, h: s.y });
    }
    
    // Trust Blender bake for grounding
  }, [scene, animGltf, isPreview, walkerAnim, onSize]);
  
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const active = isPreview ? true : cameraState.activeWalkerIdx === walkerIdx;
    if (!isPreview) {
      if (active) {
        if (cameraState.isWalking) {
          if (walkerIdx === 0) { cameraState.walker0X = cameraState.camX; cameraState.walker0Z = cameraState.camZ; cameraState.walker0Yaw = cameraState.walkYaw; }
          else if (walkerIdx === 1) { cameraState.walker1X = cameraState.camX; cameraState.walker1Z = cameraState.camZ; cameraState.walker1Yaw = cameraState.walkYaw; }
          else if (walkerIdx === 2) { cameraState.walker2X = cameraState.camX; cameraState.walker2Z = cameraState.camZ; cameraState.walker2Yaw = cameraState.walkYaw; }
        } else {
          if (walkerIdx === 0) cameraState.walker0Yaw = cameraState.walkYaw;
          else if (walkerIdx === 1) cameraState.walker1Yaw = cameraState.walkYaw;
          else if (walkerIdx === 2) cameraState.walker2Yaw = cameraState.walkYaw;
        }
        cameraState.walkerX = (walkerIdx === 0) ? cameraState.walker0X : (walkerIdx === 1) ? cameraState.walker1X : cameraState.walker2X;
        cameraState.walkerZ = (walkerIdx === 0) ? cameraState.walker0Z : (walkerIdx === 1) ? cameraState.walker1Z : cameraState.walker2Z;
        groupRef.current.rotation.y = cameraState.walkYaw;
      } else {
        groupRef.current.rotation.y = (walkerIdx === 0) ? cameraState.walker0Yaw : (walkerIdx === 1) ? cameraState.walker1Yaw : cameraState.walker2Yaw;
      }
      const wx = (walkerIdx === 0) ? cameraState.walker0X : (walkerIdx === 1) ? cameraState.walker1X : cameraState.walker2X;
      const wz = (walkerIdx === 0) ? cameraState.walker0Z : (walkerIdx === 1) ? cameraState.walker1Z : cameraState.walker2Z;
      groupRef.current.position.set(wx, 0, wz);
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

  return (
    <group ref={groupRef}>
      <primitive ref={sceneRef} object={scene} />
      {!isPreview && <GroundPoint />}
    </group>
  );
}

export function Walker(props: WalkerProps & { onSize?: (dims: { w: number, d: number, h: number }) => void }) { return <Suspense fallback={null}><InternalWalker {...props} /></Suspense>; }
export function WalkerPerfect(props: WalkerProps & { onSize?: (dims: { w: number, d: number, h: number }) => void }) { return <Walker {...props} />; }

useGLTF.preload('media/glb/lara_perfect_v2.glb');
useGLTF.preload('media/glb/x_bot.glb');
