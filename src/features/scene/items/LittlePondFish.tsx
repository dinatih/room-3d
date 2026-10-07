import { useLayoutEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGLTFClone } from '../useGLTFClone';
import { glbLocalBBox } from '../glbUtils';
import { isAppIdle } from '../idleState';

export function LittlePondFish() {
  const { scene, animations } = useGLTFClone('/items/little-pond-fish/little-pond-fish.glb');
  const mixer = useMemo(() => new THREE.AnimationMixer(scene), [scene]);
  const { invalidate } = useThree();
  const offset = useMemo(() => {
    const box = glbLocalBBox(scene);
    return new THREE.Vector3(
      -(box.min.x + box.max.x) / 2,
      -box.min.y,
      -(box.min.z + box.max.z) / 2,
    );
  }, [scene]);

  useLayoutEffect(() => {
    if (animations.length === 0) throw new Error('Petit bassin : animation manquante');
    scene.traverse(child => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    for (const clip of animations) mixer.clipAction(clip).play();
    invalidate();
    return () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(scene);
    };
  }, [scene, animations, mixer, invalidate]);

  useFrame((_, delta) => {
    if (isAppIdle()) return;
    mixer.update(delta);
    invalidate();
  });

  // Le FBX converti est en mètres ; la scène utilise des centimètres.
  return <group scale={100}><group position={offset}><primitive object={scene} /></group></group>;
}
