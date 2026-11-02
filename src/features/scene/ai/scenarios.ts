import { AgentInstruction } from './aiTypes';
import { getAllSmartObjects } from './smartObjectRegistry';

/** Snapshot active public objects at launch; each tour owns its instructions. */
export function buildGuidedTour(start: { x: number; z: number }): AgentInstruction[] {
  const remaining = getAllSmartObjects().filter(obj => !obj.ownerCharacterId);
  const instructions: AgentInstruction[] = [];
  let current = start;
  while (remaining.length) {
    const distance = (position: [number, number, number]) => Math.hypot(position[0] - current.x, position[2] - current.z);
    remaining.sort((a, b) => distance(a.position) - distance(b.position) || a.id.localeCompare(b.id));
    const next = remaining.shift()!;
    instructions.push({ type: 'OBSERVE_OBJECT', smartObjectId: next.id, duration: 2 });
    current = { x: next.position[0], z: next.position[2] };
  }
  instructions.push({ type: 'RETURN_TO_START' });
  return instructions;
}
