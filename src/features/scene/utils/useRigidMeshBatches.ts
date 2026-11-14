import { useContext, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, type Object3D } from 'three';
import { createRigidMeshBatches } from './rigidMeshBatches';
import { SceneModelContext } from '../useGLTFClone';

/** Register after the model's animation callback so every pass sees its current pose. */
export function useRigidMeshBatches(scene: Object3D) {
  const inScene = useContext(SceneModelContext);
  const group = useMemo(() => new Group(), [scene]);
  const controller = useRef<ReturnType<typeof createRigidMeshBatches> | undefined>(undefined);
  useLayoutEffect(() => {
    controller.current = createRigidMeshBatches(scene, group);
    if (inScene) for (const mesh of controller.current.batches) mesh.castShadow = false;
    return () => { controller.current!.dispose(); controller.current = undefined; };
  }, [scene, group, inScene]);
  useFrame(() => controller.current!.update());
  return group;
}
