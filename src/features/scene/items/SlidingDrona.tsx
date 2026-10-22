import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { DroneCell, useDronaGeo } from './Drona';
import { useSceneStore } from '../store/useSceneStore';
import { getObjectActionIds } from '../objectActions';
import { SMART_OBJECTS } from '../ai/smartObjectRegistry';

/** One independently controlled box, sliding along the Kallax's local front. */
export function SlidingDrona({ objectId, label, actionId, duration, isPreview = false, actionState = {}, children }: {
  objectId: string; label: string; actionId: string; duration: number;
  isPreview?: boolean; actionState?: Record<string, any>;
  children?: ReactNode;
}) {
  const ref = useRef<THREE.Group>(null!);
  const progress = useRef(0);
  const travel = useRef(0);
  const geometry = useDronaGeo();
  const sceneOpen = useSceneStore(s => !!s.extraStates[actionId]);
  const open = isPreview ? !!actionState[actionId] : sceneOpen;
  const { invalidate } = useThree();
  useLayoutEffect(() => {
    geometry.computeBoundingBox();
    travel.current = geometry.boundingBox!.getSize(new THREE.Vector3()).z * 2 / 3;
    invalidate();
  }, [geometry, invalidate]);
  useEffect(() => { invalidate(); }, [open, invalidate]);
  useFrame((_, delta) => {
    const target = open ? 1 : 0;
    progress.current = (open ? Math.min(target, progress.current + delta / duration) : Math.max(target, progress.current - delta / duration));
    ref.current.position.z = -travel.current * progress.current;
    if (progress.current !== target) invalidate();
  });
  return (
    <group ref={ref} name={objectId} userData={{ animUnit: true, skipMerge: true, hoverAction: {
      label,
      actions: [
        ...getObjectActionIds(objectId),
        ...(!isPreview ? SMART_OBJECTS[objectId].slots.map(slot => `smart-object:::${objectId}:::${slot.slotId}`) : []),
      ],
    } }}>
      <DroneCell />
      {children}
    </group>
  );
}
