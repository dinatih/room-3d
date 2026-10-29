/**
 * VacuumCleaner.tsx — Rowenta X-Force Flex 9.60 RH2038WO / RH2079WO (112×24.8×23.4 cm).
 * Modèle officiel Amazon AR découpé avec animation de détachement de la rallonge.
 */
import { useLayoutEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGLTFClone } from '../useGLTFClone';
import { glbLocalBBox } from '../glbUtils';
import { getObjectActionIds } from '../objectActions';
import type { SceneItemProps } from '@shared/types';

const GLB = 'items/rowenta-rh2079wo/rowenta-rh2079wo.glb';

export function VacuumCleaner({ actionState = {}, onSize, isPreview }: Partial<Omit<SceneItemProps, 'item'>>) {
  const { scene, animations } = useGLTFClone(GLB, true);
  const isDetached = !!actionState?.['vacuum-detach-tube'];
  const { invalidate } = useThree();
  const runtime = useRef<{ mixer: THREE.AnimationMixer; action: THREE.AnimationAction } | null>(null);

  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);
    scene.position.set(0, 0, 0);
    scene.rotation.set(0, 0, 0);

    const mixer = new THREE.AnimationMixer(scene);
    const clip = animations.find(a => a.name === 'detach_tube');
    if (!clip) throw new Error('VacuumCleaner: missing detach_tube animation');
    const action = mixer.clipAction(clip).play();
    action.paused = true;
    mixer.update(0);

    scene.scale.setScalar(100);
    const box = glbLocalBBox(scene);
    scene.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.min.y,
      -(box.min.z + box.max.z) / 2,
    );
    scene.userData.sceneItemRoot = scene.userData.skipMerge = true;
    scene.userData.hoverAction = {
      label: 'Aspirateur Rowenta X-Force Flex',
      actions: getObjectActionIds('vacuum-cleaner'),
    };
    runtime.current = { mixer, action };
    onSize?.(box.getSize(new THREE.Vector3()));
    return () => { mixer.stopAllAction(); mixer.uncacheRoot(scene); runtime.current = null; };
  }, [scene, animations, onSize]);

  useFrame((_, dt) => {
    const rt = runtime.current;
    if (!rt || (isPreview && actionState.previewPaused)) return;
    const duration = rt.action.getClip().duration;
    const target = isDetached ? duration : 0;
    if (rt.action.time === target) return;
    rt.action.time = THREE.MathUtils.clamp(rt.action.time + (isDetached ? dt : -dt), 0, duration);
    rt.mixer.update(0);
    invalidate();
  });

  return <primitive object={scene} />;
}

useGLTF.preload(GLB);
