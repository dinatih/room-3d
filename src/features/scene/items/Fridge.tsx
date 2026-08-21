/**
 * Fridge.tsx — Réfrigérateur LAGAN IKEA.
 * media/glb/LAGAN_anim.glb — body + door avec animation "door_open".
 * Coordonnées locales : centré X/Z, Y=0 = sol.
 *
 * Deux chemins pour déclencher l'anim :
 *  - Main scene : furniture-toggle { key: 'fridge' } (HoverMenu + SidePanel)
 *  - Inventory  : actionState['fridge-toggle'] (prop)
 */
import { useEffect, useLayoutEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import * as THREE from 'three';
import { removeGlbLines, glbLocalBBox } from '@features/scene/glbUtils';
import type { SceneItemProps } from '@shared/types';

const GLB = 'items/LAGAN_anim.glb';

export function Fridge({ actionState, onSize }: SceneItemProps) {
  const { scene, animations } = useGLTFClone(GLB);
  const mixerRef     = useRef<THREE.AnimationMixer | null>(null);
  const actionRef    = useRef<THREE.AnimationAction | null>(null);
  const openRef      = useRef(false);
  const animatingRef = useRef(false);
  const { invalidate } = useThree();

  useLayoutEffect(() => {
    removeGlbLines(scene);
    scene.scale.setScalar(100);
    scene.rotation.y = Math.PI;
    const box = glbLocalBBox(scene);
    scene.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.min.y,
      -(box.min.z + box.max.z) / 2,
    );
    onSize(box.getSize(new THREE.Vector3()));
    scene.userData.hoverAction = { label: 'Réfrigérateur LAGAN', actionId: 'fridge' };

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

  // Inventory path
  useEffect(() => {
    playDoor(!!(actionState['fridge-toggle']));
  }, [actionState['fridge-toggle']]);

  // Main scene path (HoverMenu dispatches key='fridge', SidePanel too)
  useEffect(() => {
    const handler = (e: Event) => {
      const { key } = (e as CustomEvent<{ key: string }>).detail;
      if (key === 'fridge') playDoor(!openRef.current);
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
