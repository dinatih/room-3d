/**
 * Walker.tsx — Lara Perfect (Personnage animé unique).
 */
import { useRef, useLayoutEffect, useMemo, Suspense } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import * as THREE from 'three';
import { cameraState } from '@features/scene/cameraState';
import { retargetMixamoClip, normalizeMixamoBoneNames, findBone, cacheRestStates } from './WalkerUtils';
import { GroundPoint } from './GroundPoint';
import { SkeletonView } from './SkeletonView';

const MIXAMO_WALK_GLB = 'media/glb-animations/happy_walk.glb';

interface WalkerProps { showSkeleton?: boolean; isPreview?: boolean; walkerAnim?: string; isPaused?: boolean; }

function InternalWalkerPerfect({ showSkeleton = false, isPreview = false, walkerAnim, isPaused, onSize }: WalkerProps & { onSize?: (dims: { w: number, d: number, h: number }) => void }) {
  const { scene } = useGLTFClone('media/glb/lara_perfect_v2.glb'), animPath = useMemo(() => (!walkerAnim || walkerAnim === 'tpose') ? null : `media/glb-animations/${walkerAnim}`, [walkerAnim]), animGltf = useGLTF(animPath || MIXAMO_WALK_GLB);
  const groupRef = useRef<THREE.Group>(null!), mixerRef = useRef<THREE.AnimationMixer | null>(null), actionRef = useRef<THREE.AnimationAction | null>(null), activeRef = useRef(false), fadeFrames = useRef(0);
  const { invalidate } = useThree();
  useLayoutEffect(() => {
    normalizeMixamoBoneNames(scene);
    
    // Blender export v2 is already scaled (100x) and centered at 0,0,0
    
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

export function Walker(props: WalkerProps & { onSize?: (dims: { w: number, d: number, h: number }) => void }) { return <Suspense fallback={null}><InternalWalkerPerfect {...props} /></Suspense>; }

useGLTF.preload('media/glb/lara_perfect_v2.glb');
