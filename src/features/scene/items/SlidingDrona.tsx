import { useEffect, useLayoutEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { DroneCell } from './Drona';
import { useSceneStore } from '../store/useSceneStore';
import { glbLocalBBox } from '../glbUtils';
import { getObjectActionIds } from '../objectActions';
import { SMART_OBJECTS } from '../ai/smartObjectRegistry';
import { dronaPlayback } from './dronaPlayback';

/** One independently controlled box, sliding along the Kallax's local front. */
export function SlidingDrona({ objectId, label, actionId, duration, isPreview = false, actionState = {} }: {
  objectId: string; label: string; actionId: string; duration: number;
  isPreview?: boolean; actionState?: Record<string, any>;
}) {
  const ref = useRef<THREE.Group>(null!);
  const progress = useRef(0);
  const travel = useRef(0);
  const mode = useSceneStore(s => s.furniture.dronaMode);
  const sceneOpen = useSceneStore(s => !!s.extraStates[actionId]);
  const open = isPreview ? !!actionState[actionId] : sceneOpen;
  const { invalidate } = useThree();
  useLayoutEffect(() => {
    if (mode === 'hidden') return;
    travel.current = glbLocalBBox(ref.current).getSize(new THREE.Vector3()).z * 2 / 3;
    invalidate();
  }, [mode, invalidate]);
  useEffect(() => { invalidate(); }, [open, invalidate]);
  useFrame((_, delta) => {
    const target = open ? 1 : 0;
    const synchronized = dronaPlayback.get(actionId);
    progress.current = synchronized ?? (open ? Math.min(target, progress.current + delta / duration) : Math.max(target, progress.current - delta / duration));
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
    </group>
  );
}
