import { AgentInstruction } from '../aiTypes';
import { WAYPOINTS } from '../ZoneNodes';
import { getSmartObject } from '../smartObjectRegistry';
import { resolveSlotAnimation } from '../../animations/animationResolver';
import { ResolvedInstructionCoords } from './agentTypes';

export function resolveInstructionCoords(
  instr: AgentInstruction,
  startPos: { x: number; z: number } | null
): ResolvedInstructionCoords {
  if (instr.type === 'RETURN_TO_START' && startPos) {
    return { tx: startPos.x, tz: startPos.z, label: 'point de départ' };
  }
  const waypointId = instr.targetWaypointId;
  if (waypointId && WAYPOINTS[waypointId]) {
    const node = WAYPOINTS[waypointId];
    return { tx: node.x, tz: node.z, label: node.name || node.id, rotY: instr.rotY ?? node.rotationY };
  }
  // Si targetPos est fourni explicitement, il est prioritaire (ex: Rôle B d'une animation Duo sur SmartObject)
  if (instr.targetPos) {
    const obj2 = instr.smartObjectId ? getSmartObject(instr.smartObjectId) : undefined;
    return {
      tx: instr.targetPos[0],
      ty: instr.targetPos[1],
      tz: instr.targetPos[2],
      label: obj2 ? `${obj2.name} (posB)` : `pos(${instr.targetPos[0].toFixed(0)}, ${instr.targetPos[2].toFixed(0)})`,
      rotY: instr.rotY,
    };
  }
  const obj = instr.smartObjectId ? getSmartObject(instr.smartObjectId) : undefined;
  if (obj) {
    const slot = instr.slotId
      ? (obj.slots.find(s => s.slotId === instr.slotId) ?? obj.slots[0])
      : obj.slots[0];
    const pos = (slot?.approachOffset ?? slot?.offset) ?? obj.position ?? [0, 0, 0];
    const resolved = slot ? resolveSlotAnimation(slot) : null;
    const finalRotY = resolved?.rotY ?? slot?.rotY;

    return {
      tx: pos[0],
      ty: pos[1],
      tz: pos[2],
      label: `${obj.name}${slot ? ` (${slot.name})` : ''}`,
      rotY: finalRotY,
      anim: resolved?.animation ?? slot?.animation,
      duration: slot?.duration,
      repeatCount: slot?.repeatCount,
      repeatVariation: slot?.repeatVariation
    };
  }
  return { tx: 0, tz: 0, label: 'inconnu' };
}
