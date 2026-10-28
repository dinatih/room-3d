import { useLayoutEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGLTFClone } from '../useGLTFClone';
import { glbLocalBBox } from '../glbUtils';
import { getObjectActionIds } from '../objectActions';
import type { SceneItemProps } from '@shared/types';

/** GLB storage with a reversible lid_open clip, controlled by its registered action. */
export function createLidGlbItem(path: string, objectId: string, label: string) {
  useGLTF.preload(path);
  const actions = getObjectActionIds(objectId);
  const [actionId] = actions;
  if (!actionId) throw new Error('Missing lid action for ' + objectId);

  return function LidGlbItem({ actionState = {}, onSize, isPreview = false }: Partial<Omit<SceneItemProps, 'item'>>) {
    const { scene, animations } = useGLTFClone(path);
    const isOpen = !!actionState[actionId];
    const { invalidate } = useThree();
    const runtime = useRef<{ mixer: THREE.AnimationMixer; action: THREE.AnimationAction } | null>(null);

    useLayoutEffect(() => {
      scene.scale.set(1, 1, 1);
      scene.position.set(0, 0, 0);
      const clip = animations.find(a => a.name === 'lid_open');
      if (!clip) throw new Error(objectId + ': missing lid_open animation');
      const mixer = new THREE.AnimationMixer(scene);
      const action = mixer.clipAction(clip).play();
      action.paused = true;
      mixer.update(0);
      scene.scale.setScalar(100);
      const box = glbLocalBBox(scene);
      scene.position.set(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2);
      scene.userData.sceneItemRoot = scene.userData.skipMerge = true;
      scene.userData.hoverAction = { label, actions };
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
  };
}
