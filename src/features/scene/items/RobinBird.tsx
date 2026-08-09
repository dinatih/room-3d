import { useRef, useLayoutEffect, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import * as THREE from 'three';

const GLB_PATH = 'media/glb/robin_bird.glb';

export function RobinBird({ isPreview = false, previewAnim = '' }: { isPreview?: boolean, previewAnim?: string }) {
  const { scene, animations } = useGLTFClone(GLB_PATH);
  const { invalidate } = useThree();
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  
  // Sequence state
  const isPlayingRef = useRef(false);
  const seqAnimIndexRef = useRef(0);
  const seqLoopCountRef = useRef(0);

  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);
    scene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());

    if (size.y > 0) {
      scene.scale.setScalar(10 / size.y); // Scale to 10cm height
    } else {
      scene.scale.setScalar(1);
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
      if (m.material) {
        const mat = m.material as THREE.MeshStandardMaterial;
        mat.metalness = 0;
        mat.roughness = 0.8;
      }
    });

    if (animations.length > 0) {
      const mixer = new THREE.AnimationMixer(scene);
      mixerRef.current = mixer;
    }

    return () => { mixerRef.current?.stopAllAction(); };
  }, [scene, animations]);

  // Handle Preview Animations or Initial Idle
  useEffect(() => {
    if (!mixerRef.current || animations.length === 0) return;
    
    mixerRef.current.stopAllAction();
    
    let targetAnimName = 'Robin_Bird_Idle';
    if (isPreview && previewAnim) {
      targetAnimName = previewAnim;
    }
    
    const clip = animations.find(a => a.name === targetAnimName) || animations[0];
    const action = mixerRef.current.clipAction(clip);
    action.setLoop(THREE.LoopRepeat, Infinity);
    action.reset().play();
    invalidate();
  }, [animations, invalidate, isPreview, previewAnim]);

  useEffect(() => {
    if (isPreview || !mixerRef.current) return;
    
    const onFinished = () => {
      if (!isPlayingRef.current || !mixerRef.current) return;
      
      seqLoopCountRef.current++;
      if (seqLoopCountRef.current >= 3) {
        seqLoopCountRef.current = 0;
        seqAnimIndexRef.current++;
        
        if (seqAnimIndexRef.current >= animations.length) {
          // Finished all animations
          isPlayingRef.current = false;
          mixerRef.current.stopAllAction();
          const idleClip = animations.find(a => a.name === 'Robin_Bird_Idle') || animations[0];
          mixerRef.current.clipAction(idleClip).setLoop(THREE.LoopRepeat, Infinity).play();
          invalidate();
          return;
        }
      }
      
      // Play next step in sequence
      const nextClip = animations[seqAnimIndexRef.current];
      mixerRef.current.stopAllAction();
      const action = mixerRef.current.clipAction(nextClip);
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
      action.reset().play();
      invalidate();
    };
    
    mixerRef.current.addEventListener('finished', onFinished);
    
    const handler = (e: Event) => {
      const { key } = (e as CustomEvent).detail as { key: string };
      
      if (key === 'robin-bird-replay' && mixerRef.current && animations.length > 0) {
        isPlayingRef.current = true;
        seqAnimIndexRef.current = 0;
        seqLoopCountRef.current = 0;
        
        mixerRef.current.stopAllAction();
        const action = mixerRef.current.clipAction(animations[0]);
        action.setLoop(THREE.LoopOnce, 1);
        action.clampWhenFinished = true;
        action.reset().play();
        invalidate();
      }
    };
    document.addEventListener('furniture-toggle', handler);
    return () => {
      mixerRef.current?.removeEventListener('finished', onFinished);
      document.removeEventListener('furniture-toggle', handler);
    };
  }, [invalidate, isPreview, animations]);

  useFrame((_, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta);
      if (isPlayingRef.current) {
        invalidate();
      }
    }
  });

  return <primitive object={scene} />;
}

useGLTF.preload(GLB_PATH);
