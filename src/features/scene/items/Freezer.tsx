/**
 * Freezer.tsx — Réfrigérateur compact TILLREDA IKEA.
 * media/glb/TILLREDA_anim.glb — body + door avec animation "door_open".
 * Coordonnées locales : centré X/Z, Y=0 = sol.
 *
 * Deux chemins pour déclencher l'anim :
 *  - Main scene : furniture-toggle { key: 'freezerOpen' }
 *  - Inventory  : actionState['freezer-toggle'] (prop)
 */
import { useEffect, useLayoutEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import * as THREE from 'three';
import { removeGlbLines, glbLocalBBox } from '@features/scene/glbUtils';
import type { SceneItemProps } from '@shared/types';

const GLB = 'items/tillreda_anim/TILLREDA_anim.glb';

export function Freezer({ actionState, onSize }: SceneItemProps) {
  const { scene, animations } = useGLTFClone(GLB);
  const mixerRef     = useRef<THREE.AnimationMixer | null>(null);
  const actionRef    = useRef<THREE.AnimationAction | null>(null);
  const openRef      = useRef(false);
  const animatingRef = useRef(false);
  const { invalidate } = useThree();

  useLayoutEffect(() => {
    removeGlbLines(scene);
    scene.scale.setScalar(100);
    scene.rotation.y = Math.PI / 2;
    const blackMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3, metalness: 0.4 });
    scene.traverse(c => {
      if (!(c as THREE.Mesh).isMesh) return;
      (c as THREE.Mesh).material = blackMat;
    });
    const box = glbLocalBBox(scene);
    scene.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.min.y,
      -(box.min.z + box.max.z) / 2,
    );
    onSize(box.getSize(new THREE.Vector3()));
    scene.userData.hoverAction = { label: 'Congélateur CHIQ', actionId: 'freezer' };

    const mixer = new THREE.AnimationMixer(scene);
    mixer.addEventListener('finished', () => { animatingRef.current = false; });
    mixerRef.current = mixer;
    const clip = animations.find(c => c.name === 'door_open') ?? animations[0];
    if (clip) {
      const action = mixer.clipAction(clip);
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
      actionRef.current = action;
    }
  }, [scene]);

  const playDoor = (open: boolean) => {
    const action = actionRef.current;
    if (!action) return;
    if (open === openRef.current) return;
    openRef.current = open;
    animatingRef.current = true;
    action.paused  = false;
    action.enabled = true;
    if (open) {
      action.timeScale = 1;
      if (action.time >= action.getClip().duration) action.time = 0;
    } else {
      action.timeScale = -1;
      if (action.time <= 0) action.time = action.getClip().duration;
    }
    action.play();
    invalidate();
  };

  // Inventory path: react to actionState prop
  useEffect(() => {
    playDoor(!!(actionState['freezer-toggle']));
  }, [actionState['freezer-toggle']]);

  // Main scene path: react to furniture-toggle event
  useEffect(() => {
    const handler = (e: Event) => {
      const { key } = (e as CustomEvent<{ key: string }>).detail;
      if (key === 'freezer') playDoor(!openRef.current);
    };
    document.addEventListener('furniture-toggle', handler);
    return () => document.removeEventListener('furniture-toggle', handler);
  }, []);

  useFrame((_, delta) => {
    if (!animatingRef.current) return;
    mixerRef.current?.update(Math.min(delta, 0.033));
    invalidate();
  });

  return <primitive object={scene} />;
}

useGLTF.preload(GLB);
