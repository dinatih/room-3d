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
import { LAYER_WALKER_DETAIL } from '@config';

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
  const idleTimerRef = useRef<number>(0);
  
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
        const m = o as THREE.Mesh;
        m.castShadow = m.receiveShadow = true;
        m.frustumCulled = false;
        if (m.material) {
            // Material might be an array or a single material
            const materials = Array.isArray(m.material) ? m.material : [m.material];
            materials.forEach(mat => {
                mat.transparent = false;
                mat.depthWrite = true;
                mat.side = THREE.FrontSide;
            });
            // Ensure the mesh doesn't block raycasting if it's a helper
            m.raycast = () => {}; 
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
        const helper = skeletonRef.current as THREE.SkeletonHelper;
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
      // Logic for preview instance: keep at origin, handle rotation via OrbitControls
      groupRef.current.position.set(0, 0, 0);
      groupRef.current.rotation.y = 0;
      groupRef.current.visible = true;
    } else {
      // Logic for scene instance: follow walker position from cameraState
      groupRef.current.position.set(cameraState.walkerX, 0, cameraState.walkerZ);
      groupRef.current.rotation.y = cameraState.walkYaw;
      groupRef.current.visible = !cameraState.walkerHidden;

      // HIDE WALKER FROM MAIN CAMERA IN WALK MODE (First Person)
      // We use LAYER_WALKER_DETAIL which is disabled on the main camera
      // but enabled on mirror cameras. This prevents the head from blocking
      // the view while keeping the character visible in reflections.
      const isFirstPerson = cameraState.mode === 'walk';
      scene.traverse(o => {
        if ((o as THREE.Mesh).isMesh) {
          o.layers.set(isFirstPerson ? LAYER_WALKER_DETAIL : 0);
        }
      });
    }

    // 2. Animation Logic
    const mixer = mixerRef.current;
    const actions = actionsRef.current;
    
    // Decouple animation target
    let target = isPreview ? (walkerAnim || 'idle') : (cameraState.isMoving ? 'walk' : 'idle');

    // Idle timer logic: if target is 'idle' and not in preview (or specifically idle in preview)
    // increment timer. If > 10s, stop updating mixer to save perf.
    if (target === 'idle' && !isPaused) {
        idleTimerRef.current += delta;
    } else {
        idleTimerRef.current = 0;
    }

    const isIdleTimeout = idleTimerRef.current > 10;

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
            idleTimerRef.current = 0; // Reset timer on animation change
        }
    }

    if (activeActionName.current !== 'tpose' && !isPaused && !isIdleTimeout) {
        mixer.update(delta);
    }

    // Only invalidate if we are actually animating or moving
    // If idle timeout reached, we stop calling invalidate() to allow the renderer to sleep
    if (!isIdleTimeout || cameraState.isMoving || isPreview) {
        invalidate();
    }
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
