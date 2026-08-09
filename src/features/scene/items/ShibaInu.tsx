import { useRef, useLayoutEffect, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useHelper } from '@react-three/drei';
import { useSceneStore } from '@features/scene/store/useSceneStore';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import * as THREE from 'three';

export function ShibaInu({ isPreview = false, previewAnim = '', showSkeletonPreview = false }: { isPreview?: boolean, previewAnim?: string, showSkeletonPreview?: boolean }) {
  const { scene, animations } = useGLTFClone('/models/shiba_inu_blender.glb');
  const { invalidate } = useThree();
  const mixerRef   = useRef<THREE.AnimationMixer | null>(null);
  const playingRef = useRef(false);
  const replayRef  = useRef<(() => void) | null>(null);
  
  
  const showSkeletonGlobal = useSceneStore(s => s.layers.skeleton);
  const showSkeleton = isPreview ? showSkeletonPreview : showSkeletonGlobal;
  const modelRef = useRef<THREE.Group>(null);
  useHelper(showSkeleton ? modelRef as any : null, THREE.SkeletonHelper);

  // Handle Preview Animations
  useEffect(() => {
    if (!isPreview || !mixerRef.current || !previewAnim) return;
    
    // Map previewAnim ("idle", "jump", etc.) to actual animation names
    const animMap: Record<string, string> = {
      'idle': 'Dog|Dog|Idle',
      'jump': 'Dog|Dog|Jump',
      'run': 'Dog|Dog|Run',
      'sitdown': 'Dog|Dog|SitDown',
      'walk': 'Dog|Dog|Walk'
    };
    
    const targetAnimName = animMap[previewAnim] || 'Dog|Dog|Idle';
    const clip = animations.find(a => a.name === targetAnimName) || animations[0];
    
    if (clip) {
      mixerRef.current.stopAllAction();
      const action = mixerRef.current.clipAction(clip);
      action.setLoop(THREE.LoopRepeat, Infinity);
      action.clampWhenFinished = false;
      action.reset().play();
      playingRef.current = true;
    }
  }, [isPreview, previewAnim, animations]);

  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);
    scene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    console.log("SHIBA INU FBX->GLB SIZE:", size);

    if (size.y > 0) {
      scene.scale.setScalar(40 / size.y);
    } else {
      scene.scale.setScalar(1); // fallback
    }
    scene.updateMatrixWorld(true);
    const scaledBox = new THREE.Box3().setFromObject(scene);
    scene.position.set(0, -scaledBox.min.y, 0);

    scene.traverse(c => {
      const m = c as THREE.Mesh;
      if (!m.isMesh) return;
      m.castShadow = true;
      m.receiveShadow = true;
      m.frustumCulled = false;
    });

    if (animations.length > 0) {
      const mixer = new THREE.AnimationMixer(scene);
      let currentAnim = 0;

      const playCurrent = () => {
        if (currentAnim >= animations.length) {
          playingRef.current = false;
          return;
        }
        mixer.stopAllAction();
        const action = mixer.clipAction(animations[currentAnim]);
        action.setLoop(THREE.LoopRepeat, 3); // 3x repeats per animation
        action.clampWhenFinished = true;
        action.reset().play();
        playingRef.current = true;
        invalidate();
      };

      mixer.addEventListener('finished', () => {
        currentAnim++;
        playCurrent();
      });

      replayRef.current = () => {
        if (playingRef.current) return;
        currentAnim = 0;
        playCurrent();
      };

      if (!isPreview) {
        playCurrent(); // Auto-play first time
      }
      mixerRef.current = mixer;
    }

    return () => { mixerRef.current?.stopAllAction(); };
  }, [scene, animations, invalidate, isPreview]);

  useEffect(() => {
    if (isPreview) return;
    const handler = (e: Event) => {
      const { key } = (e as CustomEvent).detail as { key: string };
      if (key === 'shiba-replay' && replayRef.current) {
        replayRef.current();
      } else if (key.startsWith('shiba-play-') && mixerRef.current) {
        const idx = parseInt(key.split('-')[2], 10);
        if (!isNaN(idx) && animations[idx]) {
          mixerRef.current.stopAllAction();
          const action = mixerRef.current.clipAction(animations[idx]);
          action.setLoop(THREE.LoopRepeat, Infinity);
          action.clampWhenFinished = false;
          action.reset().play();
          playingRef.current = true;
          invalidate();
        }
      }
    };
    document.addEventListener('furniture-toggle', handler);
    return () => document.removeEventListener('furniture-toggle', handler);
  }, [invalidate, isPreview]);

  useFrame((_, delta) => {
    if (!mixerRef.current) return;
    mixerRef.current.update(delta);
    if (playingRef.current) invalidate();
  });

  return (
    <group ref={modelRef as any}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload('/models/shiba_inu_blender.glb');
