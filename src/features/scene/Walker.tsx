/**
 * Walker.tsx — Personnage unique (Xbot Officiel).
 * Gère le chargement, les animations natives et le positionnement.
 */
import { useRef, useLayoutEffect, Suspense, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useHelper } from '@react-three/drei';
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
  
  const { invalidate } = useThree();

  useLayoutEffect(() => {
    // 1. Scale & Setup
    scene.scale.set(100, 100, 100);
    scene.position.set(0, 0, 0);
    scene.rotation.set(0, 0, 0);

    // Center the character locally
    scene.updateMatrixWorld(true);
    const hips = scene.getObjectByName('mixamorig:Hips');
    if (hips) {
        const worldPos = new THREE.Vector3();
        hips.getWorldPosition(worldPos);
        scene.position.x -= worldPos.x;
        scene.position.z -= worldPos.z;
    }

    scene.traverse(o => {
      if ((o as THREE.Mesh).isMesh) {
        o.castShadow = o.receiveShadow = true;
        o.frustumCulled = false;
        if ((o as THREE.Mesh).material) {
            (o as THREE.Mesh).material.alphaMode = "OPAQUE";
            // Ensure the mesh doesn't block raycasting if it's a helper
            (o as THREE.Mesh).raycast = () => {}; 
        }
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

  // Use the standard hook for skeleton helper - much safer
  const skeletonRef = useHelper(showSkeleton ? modelRef : null, THREE.SkeletonHelper);

  useEffect(() => {
    if (skeletonRef.current) {
        const helper = skeletonRef.current;
        const mat = helper.material as THREE.LineBasicMaterial;
        mat.color.set(0x00ffff);
        mat.depthTest = false;
        helper.renderOrder = 99999;
        // CRITICAL: Prevent skeleton from blocking OrbitControls/Raycasting
        helper.raycast = () => {}; 
        helper.traverse(c => { c.raycast = () => {}; });
    }
  }, [skeletonRef, showSkeleton]);

  useFrame((_, delta) => {
    if (!groupRef.current || !mixerRef.current) return;

    // 1. Update Transform
    if (isPreview) {
      groupRef.current.position.set(0, 0, 0);
      groupRef.current.rotation.y = 0;
      groupRef.current.visible = true;
    } else {
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
    }

    // 2. Animation Logic
    const mixer = mixerRef.current;
    const actions = actionsRef.current;
    let target = isPreview ? (walkerAnim || 'idle') : (cameraState.isMoving ? 'walk' : 'idle');

    if (target === 'tpose') {
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
        const to = actions[target];
        if (to && activeActionName.current !== target) {
            const from = (activeActionName.current && activeActionName.current !== 'tpose') ? actions[activeActionName.current] : null;
            if (from) from.fadeOut(0.2);
            to.reset().fadeIn(0.2).play();
            to.setEffectiveWeight(1);
            activeActionName.current = target;
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
