import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { useGLTFClone } from '../useGLTFClone';
import { glbLocalBBox } from '../glbUtils';
import type { SceneItemProps } from '@shared/types';
import { createUnitreeMotion } from './unitreeMotion';
import { isAppIdle } from '../idleState';

function UnitreeModel({ model, onSize, actionState }: SceneItemProps & { model: 'g1' | 'go2' }) {
  const { scene } = useGLTFClone(`items/unitree-${model}/unitree-${model}.glb`);
  const animate = useMemo(() => createUnitreeMotion(scene, model), [scene, model]);
  const time = useRef(0);
  const motion = actionState[`unitree-${model}-motion`] ?? 'idle';
  const replay = actionState['unitree-replay'];
  useLayoutEffect(() => {
    time.current = 0;
    animate(motion, 0);
  }, [animate, motion, replay]);
  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);
    scene.traverse(node => {
      if ('isMesh' in node && node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });
    onSize(glbLocalBBox(scene).getSize(new Vector3()));
  }, [scene, onSize]);
  useFrame((state, delta) => {
    if (motion === 'idle' || isAppIdle()) return;
    time.current += delta;
    animate(motion, time.current);
    if (motion !== 'idle') state.invalidate();
  });
  return <primitive object={scene} />;
}

export function UnitreeG1(props: SceneItemProps) {
  return <UnitreeModel {...props} model="g1" />;
}

export function UnitreeGo2(props: SceneItemProps) {
  return <UnitreeModel {...props} model="go2" />;
}
