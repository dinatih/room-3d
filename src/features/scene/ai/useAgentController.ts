import { useLayoutEffect, useMemo } from 'react';
import { createAgentController } from './agentController';
export { resetAgentDeployment, NPC_WALK_ANIMATIONS, getRandomNpcWalkAnimation } from './agentController';
export type { AgentState } from './agentController';

/** React owns lifetime; simulation state and instruction processing live in the engine. */
export function useAgentController(...args: Parameters<typeof createAgentController>) {
  const [id, scenario, loop = false, , onComplete, , , landingAnim = 'pistol-kneel-to-stand', enabled = true] = args;
  const controller = useMemo(() => createAgentController(...args), [id, enabled]);
  useLayoutEffect(() => { controller.configure({ scenario, loop, onComplete, landingAnim }); });
  useLayoutEffect(() => controller.connect(), [controller]);
  return controller;
}
