import { createContext, useContext, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { useFrame, type RootState } from '@react-three/fiber';
import { CharacterRuntime, characterRuntimeStats, type RuntimeParticipant } from './characterRuntime';
import { isAppIdle } from '../idleState';
import { animationLibraryStats } from './animationLibrary';
import { cameraState } from '../cameraState';
import { pathfindingStats } from '../ai/navigation/pathfindingClient';
import { useNavigationEnabled } from '../ai/navigation/NavigationContext';

const RuntimeContext = createContext<CharacterRuntime<RootState> | null>(null);

export function CharacterRuntimeProvider({ children, isPreview }: { children: ReactNode; isPreview?: boolean }) {
  const navigationEnabled = useNavigationEnabled();
  const secondary = isPreview || !navigationEnabled;
  const [runtime] = useState(() => new CharacterRuntime<RootState>(secondary ? structuredClone(characterRuntimeStats) : characterRuntimeStats));
  useLayoutEffect(() => {
    if (!secondary) {
      Object.defineProperty(characterRuntimeStats, 'resources', { configurable: true, enumerable: true, get: animationLibraryStats });
      Object.defineProperty(characterRuntimeStats, 'agents', { configurable: true, enumerable: true, get: () => cameraState.positions });
      Object.defineProperty(characterRuntimeStats, 'navigation', { configurable: true, enumerable: true, get: () => pathfindingStats });
      Object.assign(window, { __CHARACTER_RUNTIME_STATS__: characterRuntimeStats });
    }
  }, [secondary]);
  useFrame((frame, delta) => {
    if (!isAppIdle()) runtime.tick(frame, Math.min(delta, 0.1));
  });
  return <RuntimeContext.Provider value={runtime}>{children}</RuntimeContext.Provider>;
}

export function useCharacterFrame(id: string, participant: RuntimeParticipant<RootState>): void {
  const runtime = useContext(RuntimeContext);
  if (!runtime) throw new Error('Character requires a CharacterRuntimeProvider');
  const latest = useRef(participant);
  useLayoutEffect(() => { latest.current = participant; });
  useLayoutEffect(() => runtime.register(id, {
    simulate: (frame, delta) => latest.current.simulate(frame, delta),
    animate: (frame, delta) => latest.current.animate(frame, delta),
  }), [runtime, id]);
}
