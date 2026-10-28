import { useEffect, useRef, type ReactNode } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import type * as THREE from 'three';
import { DroneCell, useDronaGeo } from './Drona';
import { useDoorOpen } from './useDoorOpen';
import { getObjectActionIds } from '../objectActions';
import { SMART_OBJECTS } from '../ai/smartObjectRegistry';

/** One independently controlled box, sliding along the Kallax's local front. */
export function SlidingDrona({ objectId, duration, isPreview = false, actionState = {}, children }: {
  objectId: string; duration: number;
  isPreview?: boolean; actionState?: Record<string, any>;
  children?: ReactNode;
}) {
  const ref = useRef<THREE.Group>(null!);
  const progress = useRef(0);
  const geometry = useDronaGeo();
  const actions = getObjectActionIds(objectId);
  const [actionId] = actions;
  if (!actionId) throw new Error('DRONA: missing opening action for ' + objectId);
  const storage = SMART_OBJECTS[objectId];
  const open = useDoorOpen(actionId, isPreview, actionState);
  const { invalidate } = useThree();
  const travel = (geometry.boundingBox!.max.z - geometry.boundingBox!.min.z) * 2 / 3;
  useEffect(() => { invalidate(); }, [open, geometry, invalidate]);
  useFrame((_, delta) => {
    const target = open ? 1 : 0;
    progress.current = (open ? Math.min(target, progress.current + delta / duration) : Math.max(target, progress.current - delta / duration));
    ref.current.position.z = -travel * progress.current;
    if (progress.current !== target) invalidate();
  });
  return (
    <group ref={ref} name={objectId} userData={{ sceneItemRoot: true, skipMerge: true, hoverAction: {
      label: storage.name,
      actions: [
        ...actions,
        ...(!isPreview ? storage.slots.map(slot => `smart-object:::${objectId}:::${slot.slotId}`) : []),
      ],
    } }}>
      <DroneCell />
      {children}
    </group>
  );
}
