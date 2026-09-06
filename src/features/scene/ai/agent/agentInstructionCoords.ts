import { AgentInstruction } from '../aiTypes';
import { WAYPOINTS } from '../ZoneNodes';
import { getSmartObject } from '../smartObjectRegistry';
import { resolveSlotAnimation } from '../animationPacks';
import { ResolvedInstructionCoords } from './agentTypes';

export function resolveInstructionCoords(
  instr: AgentInstruction,
  startPos: { x: number; z: number } | null
): ResolvedInstructionCoords {
  if (instr.type === 'RETURN_TO_START' && startPos) {
    return { tx: startPos.x, tz: startPos.z, label: 'point de départ' };
  }
  const waypointId = instr.targetWaypointId || instr.targetNodeId;
  if (waypointId && WAYPOINTS[waypointId]) {
    const node = WAYPOINTS[waypointId];
    return { tx: node.x, tz: node.z, label: node.name || node.id, rotY: instr.rotY ?? node.rotationY };
  }
  const obj = instr.smartObjectId ? getSmartObject(instr.smartObjectId) : undefined;
  if (obj) {
    const slot = instr.slotId
      ? (obj.slots.find(s => s.slotId === instr.slotId) ?? obj.slots[0])
      : obj.slots[0];
    const pos = slot ? (slot.approachOffset ?? slot.offset ?? obj.position) : obj.position;
    const resolved = slot ? resolveSlotAnimation(slot) : null;
    return {
      tx: pos[0],
      ty: pos[1],
      tz: pos[2],
      label: `${obj.name}${slot ? ` (${slot.name})` : ''}`,
      rotY: resolved?.rotY ?? slot?.rotY,
      anim: resolved?.animation ?? slot?.animation,
      duration: slot?.duration,
      repeatCount: slot?.repeatCount,
      repeatVariation: slot?.repeatVariation
    };
  }
  if (instr.targetPos) {
    return { tx: instr.targetPos[0], tz: instr.targetPos[2], label: `pos(${instr.targetPos[0].toFixed(0)}, ${instr.targetPos[2].toFixed(0)})` };
  }
  return { tx: 0, tz: 0, label: 'inconnu' };
}
