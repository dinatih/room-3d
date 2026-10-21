import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Vector3 } from 'three';
import { useGLTFClone } from '../useGLTFClone';
import { glbLocalBBox } from '../glbUtils';
import type { SceneItemProps } from '@shared/types';
import { createUnitreeMotion, measureUnitreeWalkSpeed } from './unitreeMotion';
import { isAppIdle } from '../idleState';
import { useRigidMeshBatches } from '../utils/useRigidMeshBatches';

function UnitreeModel({ model, onSize, actionState, isPreview }: SceneItemProps & { model: 'g1' | 'go2' }) {
  const { scene } = useGLTFClone(`items/unitree-${model}/unitree-${model}.glb`);
  const animate = useMemo(() => createUnitreeMotion(scene, model), [scene, model]);
  const time = useRef(0);
  const gaitTime = useRef(0);
  const placement = useRef<Group>(null!);
  const previousPosition = useRef<Vector3 | null>(null);
  const position = useMemo(() => new Vector3(), []);
  const walkSpeed = useMemo(() => measureUnitreeWalkSpeed(scene, model), [scene, model]);
  const motion = actionState[`unitree-${model}-motion`] ?? 'idle';
  const replay = actionState[`unitree-${model}-replay`];
  useLayoutEffect(() => {
    time.current = 0;
    gaitTime.current = 0;
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
    placement.current.getWorldPosition(position);
    const distance = previousPosition.current ? Math.hypot(position.x - previousPosition.current.x, position.z - previousPosition.current.z) : 0;
    if (!previousPosition.current) previousPosition.current = new Vector3();
    previousPosition.current.copy(position);
    if (motion === 'idle' || isAppIdle()) return;
    time.current += delta;
    const walking = motion === (model === 'g1' ? 'walk' : 'trot');
    gaitTime.current += isPreview || actionState.robotAutonomous === false ? delta : distance / walkSpeed;
    animate(motion, walking ? gaitTime.current : time.current, time.current);
    if (motion !== 'idle') state.invalidate();
  });
  const batches = useRigidMeshBatches(scene);
  return <group ref={placement}><primitive object={scene} /><primitive object={batches} /></group>;
}

export function UnitreeG1(props: SceneItemProps) {
  return <UnitreeModel {...props} model="g1" />;
}

export function UnitreeGo2(props: SceneItemProps) {
  return <UnitreeModel {...props} model="go2" />;
}
