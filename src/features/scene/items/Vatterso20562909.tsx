/**
 * Vatterso20562909.tsx — IKEA VÄTTERSÖ boîte de rangement articulée (156×72×79 cm).
 * Modèle GLB officiel avec animation d'ouverture du couvercle 'lid_open'.
 */
import { useLayoutEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGLTFClone } from '../useGLTFClone';
import { glbLocalBBox } from '../glbUtils';
import { getObjectActionIds } from '../objectActions';
import type { SceneItemProps } from '@shared/types';

const GLB = 'items/vatterso20562909/vatterso-animated.glb';

export function Vatterso20562909({ actionState, onSize, isPreview }: SceneItemProps) {
  const { scene, animations } = useGLTFClone(GLB, true);
  const isOpen = !!actionState?.['vatterso-open'];
  const { invalidate } = useThree();
  const runtime = useRef<{ mixer: THREE.AnimationMixer; action: THREE.AnimationAction } | null>(null);

  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);
    scene.position.set(0, 0, 0);
    const mixer = new THREE.AnimationMixer(scene);
    const clip = animations.find(a => a.name === 'lid_open');
    if (!clip) throw new Error('Vatterso: missing lid_open animation');
    const action = mixer.clipAction(clip).play();
    action.paused = true;
    mixer.update(0);
    scene.scale.setScalar(100);
    const box = glbLocalBBox(scene);
    scene.position.set(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2);
    scene.userData.sceneItemRoot = scene.userData.skipMerge = true;
    scene.userData.hoverAction = { label: 'Boîte Vättersö', actions: getObjectActionIds('vatterso20562909') };
    runtime.current = { mixer, action };
    onSize?.(box.getSize(new THREE.Vector3()));
    return () => { mixer.stopAllAction(); mixer.uncacheRoot(scene); runtime.current = null; };
  }, [scene, animations, onSize]);

  useFrame((_, dt) => {
    const rt = runtime.current;
    if (!rt || (isPreview && actionState.previewPaused)) return;
    const duration = rt.action.getClip().duration;
    const target = isOpen ? duration : 0;
    if (rt.action.time === target) return;
    rt.action.time = THREE.MathUtils.clamp(rt.action.time + (isOpen ? dt : -dt), 0, duration);
    rt.mixer.update(0);
    invalidate();
  });

  return <primitive object={scene} />;
}

useGLTF.preload(GLB);
