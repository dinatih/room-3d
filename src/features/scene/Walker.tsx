/**
 * Walker.tsx — Personnage unique (Xbot Officiel).
 * Gère le chargement, les animations natives et le positionnement.
 */
import { useRef, useLayoutEffect, Suspense, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import * as THREE from 'three';
import { cameraState } from '@features/scene/cameraState';

const MODEL_PATH = 'media/sandbox/Xbot_official.glb';

interface WalkerProps { 
  showSkeleton?: boolean; 
  isPreview?: boolean;
  walkerAnim?: string;
  isPaused?: boolean;
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

function InternalWalker({ showSkeleton = false, isPreview = false, walkerAnim = 'idle', isPaused = false }: WalkerProps) {
  const { scene, animations } = useGLTFClone(MODEL_PATH);
  
  const groupRef = useRef<THREE.Group>(null!);
  const modelRef = useRef<THREE.Object3D>(null!);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionsRef = useRef<Record<string, THREE.AnimationAction>>({});
  const activeActionName = useRef<string>('');
  
  const { invalidate, scene: globalScene } = useThree();

  // 1. SETUP MODEL & MIXER (One-time or on model change)
  useLayoutEffect(() => {
    console.log(`WALKER_DEBUG: Setting up model ${MODEL_PATH}`);
    
    // Scale 100x (Official Xbot is in meters)
    scene.scale.set(100, 100, 100);
    
    // Reset and Center
    scene.position.set(0, 0, 0);
    scene.updateMatrixWorld(true);
    const hips = scene.getObjectByName('mixamorig:Hips');
    if (hips) {
        const worldPos = new THREE.Vector3();
        hips.getWorldPosition(worldPos);
        // We want worldPos.x/z to be 0.
        scene.position.x -= worldPos.x;
        scene.position.z -= worldPos.z;
        console.log(`WALKER_DEBUG: Centered Hips at ${worldPos.x.toFixed(2)}, ${worldPos.z.toFixed(2)}`);
    }

    scene.traverse(o => {
      if ((o as THREE.Mesh).isMesh) {
        o.castShadow = o.receiveShadow = true;
        o.frustumCulled = false;
        if ((o as THREE.Mesh).material) (o as THREE.Mesh).material.alphaMode = "OPAQUE";
      }
      if ((o as THREE.Bone).isBone) {
        const b = o as THREE.Bone;
        b.userData.restPos = b.position.clone();
        b.userData.restQuat = b.quaternion.clone();
      }
    });

    const mixer = new THREE.AnimationMixer(scene);
    mixerRef.current = mixer;
    actionsRef.current = {};

    animations.forEach(clip => {
      const action = mixer.clipAction(clip);
      actionsRef.current[clip.name] = action;
      action.enabled = true;
      action.play();
      action.setEffectiveWeight(0);
    });

    activeActionName.current = '';

    return () => {
        mixer.stopAllAction();
        mixer.uncacheRoot(scene);
    };
  }, [scene, animations]);

  // 2. SKELETON HELPER (Separate Effect to avoid re-initializing mixer)
  useEffect(() => {
    let helper: THREE.SkeletonHelper | null = null;
    if (showSkeleton) {
        helper = new THREE.SkeletonHelper(scene);
        (helper.material as THREE.LineBasicMaterial).color.set(0x00ffff);
        (helper.material as THREE.LineBasicMaterial).depthTest = false;
        helper.renderOrder = 9999;
        globalScene.add(helper);
    }
    return () => {
        if (helper) globalScene.remove(helper);
    };
  }, [scene, showSkeleton, globalScene]);

  useFrame((_, delta) => {
    if (!groupRef.current || !mixerRef.current) return;

    // 1. Update Position (World)
    if (!isPreview) {
      if (cameraState.isWalking) {
        cameraState.walker0X = cameraState.camX;
        cameraState.walker0Z = cameraState.camZ;
        cameraState.walker0Yaw = cameraState.walkYaw;
      }
      cameraState.walkerX = cameraState.walker0X;
      cameraState.walkerZ = cameraState.walker0Z;
      
      groupRef.current.position.set(cameraState.walker0X, 0, cameraState.walker0Z);
      groupRef.current.rotation.y = cameraState.walkYaw;
      groupRef.current.visible = !cameraState.walkerHidden;
    } else {
      groupRef.current.position.set(0, 0, 0);
      groupRef.current.rotation.y = 0;
      groupRef.current.visible = true;
    }

    // 2. Animation Logic
    const mixer = mixerRef.current;
    const actions = actionsRef.current;
    
    let targetAction = walkerAnim;
    if (!isPreview) {
        targetAction = cameraState.isMoving ? 'walk' : 'idle';
    }

    if (targetAction === 'tpose') {
        if (activeActionName.current !== 'tpose') {
            mixer.stopAllAction();
            scene.traverse(o => {
                if ((o as THREE.Bone).isBone) {
                    const b = o as THREE.Bone;
                    if (b.userData.restPos) b.position.copy(b.userData.restPos);
                    if (b.userData.restQuat) b.quaternion.copy(b.userData.restQuat);
                }
            });
            activeActionName.current = 'tpose';
        }
    } else {
        const to = actions[targetAction];
        if (to && activeActionName.current !== targetAction) {
            const from = activeActionName.current !== 'tpose' ? actions[activeActionName.current] : null;
            if (from) from.fadeOut(0.2);
            to.reset().fadeIn(0.2).play();
            to.setEffectiveWeight(1);
            activeActionName.current = targetAction;
        }
    }

    if (activeActionName.current !== 'tpose' && !isPaused) {
        mixer.update(delta);
    }
    invalidate();
  });

  return (
    <group ref={groupRef}>
      <primitive ref={modelRef} object={scene} />
      {!isPreview && <GroundPoint />}
    </group>
  );
}

export function Walker(props: WalkerProps) { 
  return (
    <Suspense fallback={null}>
      <InternalWalker {...props} />
    </Suspense>
  );
}

useGLTF.preload(MODEL_PATH);
