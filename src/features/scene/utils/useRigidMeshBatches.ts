import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, type Object3D } from 'three';
import { createRigidMeshBatches } from './rigidMeshBatches';

/** Register after the model's animation callback so every pass sees its current pose. */
export function useRigidMeshBatches(scene: Object3D) {
  const group = useMemo(() => new Group(), [scene]);
  const controller = useRef<ReturnType<typeof createRigidMeshBatches>>();
  useLayoutEffect(() => {
    controller.current = createRigidMeshBatches(scene, group);
    return () => { controller.current!.dispose(); controller.current = undefined; };
  }, [scene, group]);
  useFrame(() => controller.current!.update());
  return group;
}
