import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { cameraState } from './cameraState';
import { useSceneStore } from './store/useSceneStore';
import { isHomeAssistantLinked, isHomeAssistantLight, useHomeAssistant } from '../home-assistant/connection';
import { isAgentInBathroom, isAgentInCorridor, isAgentInKitchen } from './ai/SpatialZone';

const SHUTOFF_DELAY_MS = 4000;

const LIGHT_ZONES = [
  { key: 'lampBath', check: isAgentInBathroom },
  { key: 'lampCorridor', check: isAgentInCorridor },
  { key: 'lampKitchen', check: isAgentInKitchen },
] as const;

function getActivePositions() {
  const positions = Object.values(cameraState.positions);
  if (
    cameraState.characterX !== undefined &&
    cameraState.characterZ !== undefined &&
    !cameraState.characterHidden &&
    !positions.some(p => p.x === cameraState.characterX && p.z === cameraState.characterZ)
  ) {
    positions.push({ x: cameraState.characterX, y: 0, z: cameraState.characterZ, yaw: 0 });
  }
  return positions;
}

/**
 * PresenceLightController — Contrôle automatique des lampes (SDB, couloir, coin cuisine KÖLVATTEN)
 * par capteurs de présence.
 */
export function PresenceLightController() {
  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout> | null>>({});

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      Object.values(timers).forEach(t => { if (t !== null) clearTimeout(t); });
    };
  }, []);

  useFrame(() => {
    const positions = getActivePositions();
    const { furniture } = useSceneStore.getState();

    for (const { key, check } of LIGHT_ZONES) {
      if (isHomeAssistantLight(key) && isHomeAssistantLinked(useHomeAssistant.getState())) {
        if (timersRef.current[key]) clearTimeout(timersRef.current[key]!);
        timersRef.current[key] = null;
        continue;
      }
      const occupied = positions.some(check);

      if (occupied) {
        if (timersRef.current[key]) {
          clearTimeout(timersRef.current[key]!);
          timersRef.current[key] = null;
        }
        if (!furniture[key]) {
          useSceneStore.setState(s => ({
            furniture: { ...s.furniture, [key]: true },
          }));
          cameraState.invalidate?.();
        }
      } else {
        if (!furniture[key] && timersRef.current[key]) {
          clearTimeout(timersRef.current[key]!);
          timersRef.current[key] = null;
        } else if (furniture[key] && !timersRef.current[key]) {
          timersRef.current[key] = setTimeout(() => {
            timersRef.current[key] = null;
            if (!(isHomeAssistantLight(key) && isHomeAssistantLinked(useHomeAssistant.getState())) && !getActivePositions().some(check) && useSceneStore.getState().furniture[key]) {
              useSceneStore.setState(s => ({
                furniture: { ...s.furniture, [key]: false },
              }));
              cameraState.invalidate?.();
            }
          }, SHUTOFF_DELAY_MS);
        }
      }
    }
  });

  return null;
}
