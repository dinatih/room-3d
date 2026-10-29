import { useLayoutEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGLTFClone } from '../useGLTFClone';
import { glbLocalBBox } from '../glbUtils';
import { getObjectActionIds } from '../objectActions';
import type { SceneItemProps } from '@shared/types';

/** Reversible GLB clips sharing one playback position, controlled by the registered action. */
export function createAnimatedGlbItem(path: string, objectId: string, label: string, { clipNames = ['lid_open'], scale = 100 }: {
  clipNames?: readonly string[]; scale?: number;
} = {}) {
  useGLTF.preload(path);
  const actionIds = getObjectActionIds(objectId);
  const [actionId] = actionIds;
  if (!actionId) throw new Error('Missing animation action for ' + objectId);

  return function AnimatedGlbItem({ actionState = {}, onSize, isPreview = false }: Partial<Omit<SceneItemProps, 'item'>>) {
    const { scene, animations } = useGLTFClone(path);
    const isOpen = !!actionState[actionId];
    const { invalidate } = useThree();
    const runtime = useRef<{ size: THREE.Vector3; mixer: THREE.AnimationMixer; actions: THREE.AnimationAction[] } | null>(null);

    useLayoutEffect(() => {
      scene.scale.set(1, 1, 1);
      scene.position.set(0, 0, 0);
      const mixer = new THREE.AnimationMixer(scene);
      const actions = clipNames.map(name => {
        const clip = animations.find(a => a.name === name);
        if (!clip) throw new Error(objectId + ': missing ' + name + ' animation');
        const action = mixer.clipAction(clip).play();
        action.paused = true;
        return action;
      });
      mixer.update(0);
      scene.scale.setScalar(scale);
      const box = glbLocalBBox(scene);
      scene.position.set(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2);
      scene.userData.sceneItemRoot = scene.userData.skipMerge = true;
      scene.userData.hoverAction = { label, actions: actionIds };
      runtime.current = { size: box.getSize(new THREE.Vector3()), mixer, actions };
      return () => { mixer.stopAllAction(); mixer.uncacheRoot(scene); runtime.current = null; };
    }, [scene, animations]);

    useLayoutEffect(() => {
      onSize?.(runtime.current!.size.clone());
    }, [scene, animations, onSize]);

    useFrame((_, dt) => {
      const rt = runtime.current;
      if (!rt || (isPreview && actionState.previewPaused)) return;
      const duration = rt.actions[0].getClip().duration;
      const target = isOpen ? duration : 0;
      if (rt.actions[0].time === target) return;
      const time = THREE.MathUtils.clamp(rt.actions[0].time + (isOpen ? dt : -dt), 0, duration);
      for (const action of rt.actions) action.time = time;
      rt.mixer.update(0);
      invalidate();
    });

    return <primitive object={scene} />;
  };
}
