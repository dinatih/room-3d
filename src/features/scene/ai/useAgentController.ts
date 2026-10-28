import { useEffect, useLayoutEffect, useMemo } from 'react';
import { createAgentController } from './agentController';
import { cameraState } from '../cameraState';
import { CHARACTER_CONTROL_ANIMATIONS } from '../camera/cameraSubjects';
import { useSceneStore } from '../store/useSceneStore';
export { resetAgentDeployment, NPC_WALK_ANIMATIONS, getRandomNpcWalkAnimation } from './agentController';
export type { AgentState } from './agentController';

/** React owns lifetime; simulation state and instruction processing live in the engine. */
export function useAgentController(...args: Parameters<typeof createAgentController>) {
  const [id, scenario, loop = false, , onComplete, , , landingAnim = 'pistol-kneel-to-stand', enabled = true] = args;
  const controller = useMemo(() => createAgentController(...args), [id, enabled]);
  useLayoutEffect(() => { controller.configure({ scenario, loop, onComplete, landingAnim }); });
  useLayoutEffect(() => controller.connect(), [controller]);
  useEffect(() => {
    if (!enabled) return;
    const onDirection = (event: Event) => {
      const { key, pressed } = (event as CustomEvent<{ key: string; pressed: boolean }>).detail;
      if (!pressed || cameraState.animalTarget || cameraState.isIntroRunning || cameraState.mode === 'plane'
        || id !== useSceneStore.getState().activeCharacterId || !cameraState.positions[id]) return;
      const animation = key === 'character:Elevate' ? CHARACTER_CONTROL_ANIMATIONS.Elevate
        : key === 'character:Descend' ? CHARACTER_CONTROL_ANIMATIONS.Descend : null;
      if (animation) { controller.playControlAnimation(animation); cameraState.invalidate?.(); }
    };
    document.addEventListener('camera-direction-input', onDirection);
    return () => document.removeEventListener('camera-direction-input', onDirection);
  }, [controller, enabled, id]);
  return controller;
}
