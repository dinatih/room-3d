import { useRef, useLayoutEffect, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

export function ShibaInu() {
  const { scene, animations } = useGLTF('media/animated_dog_shiba_inu.glb');
  const { invalidate } = useThree();
  const mixerRef   = useRef<THREE.AnimationMixer | null>(null);
  const actionRef  = useRef<THREE.AnimationAction | null>(null);
  const playingRef = useRef(false);

  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    scene.scale.setScalar(40 / size.y);
    box.setFromObject(scene);
    scene.position.set(0, -box.min.y, 0);

    scene.traverse(c => {
      const m = c as THREE.Mesh;
      if (!m.isMesh) return;
      m.castShadow = true;
      m.receiveShadow = true;
      m.frustumCulled = false;
    });

    if (animations.length > 0) {
      const mixer = new THREE.AnimationMixer(scene);
      mixer.addEventListener('finished', () => { playingRef.current = false; });
      const action = mixer.clipAction(animations[0]);
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
      action.play();
      playingRef.current = true;
      mixerRef.current   = mixer;
      actionRef.current  = action;
      invalidate();
    }

    return () => { mixerRef.current?.stopAllAction(); };
  }, [scene, animations, invalidate]);

  useEffect(() => {
    const handler = (e: Event) => {
      const { key } = (e as CustomEvent).detail as { key: string };
      if (key !== 'shiba-replay' || !actionRef.current) return;
      actionRef.current.reset().play();
      playingRef.current = true;
      invalidate();
    };
    document.addEventListener('furniture-toggle', handler);
    return () => document.removeEventListener('furniture-toggle', handler);
  }, [invalidate]);

  useFrame((_, delta) => {
    if (!mixerRef.current) return;
    mixerRef.current.update(delta);
    if (playingRef.current) invalidate();
  });

  return <primitive object={scene} />;
}

useGLTF.preload('media/animated_dog_shiba_inu.glb');
