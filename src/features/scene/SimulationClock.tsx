import { useFrame } from '@react-three/fiber';
import { advanceSimulationClock } from './ai/laraLifeStore';
import { cameraState } from './cameraState';
import { isAppIdle } from './idleState';

export function SimulationClock() {
  useFrame((_, delta) => {
    if (!document.hidden && cameraState.isSceneLaunched && !isAppIdle()) advanceSimulationClock(delta);
  }, -1);
  return null;
}
