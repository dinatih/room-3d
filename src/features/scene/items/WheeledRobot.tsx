import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Quaternion, Vector3, type Object3D } from 'three';
import type { SceneItemProps } from '@shared/types';
import { useGLTFClone } from '../useGLTFClone';
import { glbLocalBBox } from '../glbUtils';
import { isAppIdle } from '../idleState';
import { useRigidMeshBatches } from '../utils/useRigidMeshBatches';

export function WheeledRobot({ onSize, actionState, isPreview, modelId, driveSpeed, createMotion }: SceneItemProps & {
  modelId: string; driveSpeed: number;
  createMotion: (scene: Object3D) => (motion: string, seconds: number, distance: number, yaw: number) => void;
}) {
  const { scene } = useGLTFClone(`items/${modelId}/${modelId}.glb`);
  const animate = useMemo(() => createMotion(scene), [scene, createMotion]);
  const placement = useRef<Group>(null!);
  const time = useRef(0);
  const previous = useRef<{ position: Vector3; yaw: number } | undefined>(undefined);
  const position = useMemo(() => new Vector3(), []);
  const quaternion = useMemo(() => new Quaternion(), []);
  const forward = useMemo(() => new Vector3(), []);
  const motion = actionState[`${modelId}-motion`] ?? 'idle';
  const replay = actionState[`${modelId}-replay`];
  useLayoutEffect(() => {
    time.current = 0;
    animate(motion, 0, 0, 0);
  }, [animate, motion, replay]);
  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);
    scene.traverse(node => {
      if ('isMesh' in node && node.isMesh) { node.castShadow = true; node.receiveShadow = true; }
    });
    onSize(glbLocalBBox(scene).getSize(new Vector3()));
  }, [scene, onSize]);
  useFrame((state, delta) => {
    placement.current.getWorldPosition(position);
    placement.current.getWorldQuaternion(quaternion);
    forward.set(0, 0, 1).applyQuaternion(quaternion);
    const yaw = Math.atan2(forward.x, forward.z);
    const last = previous.current;
    const distance = last ? (position.x - last.position.x) * forward.x + (position.z - last.position.z) * forward.z : 0;
    const turn = last ? Math.atan2(Math.sin(yaw - last.yaw), Math.cos(yaw - last.yaw)) : 0;
    if (!last) previous.current = { position: new Vector3(), yaw };
    previous.current!.position.copy(position);
    previous.current!.yaw = yaw;
    if (isAppIdle() || actionState.isPaused) return;
    time.current += delta;
    const simulate = isPreview || (actionState.robotAutonomous === false && !actionState.robotManualDriving);
    animate(motion, time.current, simulate ? (motion === 'roll' ? driveSpeed * delta : 0) : distance, simulate ? 0 : turn);
    if (motion !== 'idle' || distance !== 0 || turn !== 0) state.invalidate();
  });
  const batches = useRigidMeshBatches(scene);
  return <group ref={placement}><primitive object={scene} /><primitive object={batches} /></group>;
}
