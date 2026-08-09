import { useRef, useLayoutEffect, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

export function ShibaInu() {
  const { scene, animations } = useGLTF('/models/shiba_inu_blender.glb');
  const { invalidate } = useThree();
  const mixerRef   = useRef<THREE.AnimationMixer | null>(null);
  const playingRef = useRef(false);
  const replayRef  = useRef<(() => void) | null>(null);

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

      playCurrent(); // Auto-play first time
      mixerRef.current = mixer;
    }

    return () => { mixerRef.current?.stopAllAction(); };
  }, [scene, animations, invalidate]);

  useEffect(() => {
    const handler = (e: Event) => {
      const { key } = (e as CustomEvent).detail as { key: string };
      if (key === 'shiba-replay' && replayRef.current) {
        replayRef.current();
      }
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

useGLTF.preload('/models/shiba_inu_blender.glb');
