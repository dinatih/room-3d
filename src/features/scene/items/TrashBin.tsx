import { useLayoutEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGLTFClone } from '../useGLTFClone';
import { glbLocalBBox } from '../glbUtils';
import { getObjectActionIds } from '../objectActions';
import type { SceneItemProps } from '@shared/types';

const GLB = 'items/trash-bin/tatay-smart-deco.glb';

export function TrashBin({ actionState = {}, onSize, isPreview = false }: Partial<Omit<SceneItemProps, 'item'>>) {
  const { scene, animations } = useGLTFClone(GLB);
  const isOpen = !!actionState?.['bin-toggle'];
  const { invalidate } = useThree();
  const rt = useRef<{ mixer: THREE.AnimationMixer; actions: THREE.AnimationAction[]; dur: number } | null>(null);

  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);
    scene.position.set(0, 0, 0);
    const mixer = new THREE.AnimationMixer(scene);
    const actions = animations.map(c => mixer.clipAction(c).play());
    const dur = animations[0]?.duration ?? 1;
    const box = glbLocalBBox(scene);
    scene.position.set(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2);
    scene.userData.sceneItemRoot = scene.userData.skipMerge = true;
    scene.userData.hoverAction = { label: 'Poubelle TATAY 25L', actions: getObjectActionIds('trash-bin') };
    rt.current = { mixer, actions, dur };
    mixer.setTime(0);
    onSize?.(box.getSize(new THREE.Vector3()));
    return () => { mixer.stopAllAction(); mixer.uncacheRoot(scene); rt.current = null; };
  }, [scene, animations, onSize]);

  useFrame((_, dt) => {
    const r = rt.current;
    if (!r || (isPreview && actionState.previewPaused)) return;
    const cur = r.actions[0]?.time ?? 0;
    const target = isOpen ? r.dur : 0;
    if (cur === target) return;
    const next = cur < target ? Math.min(target, cur + dt) : Math.max(target, cur - dt);
    for (const a of r.actions) a.time = next;
    r.mixer.update(0);
    invalidate();
  });

  return <primitive object={scene} />;
}

useGLTF.preload(GLB);
