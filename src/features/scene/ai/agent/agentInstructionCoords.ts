import { AgentInstruction } from '../aiTypes';
import { getObjectApproach, getDoorApproach, NavigationBlockedError } from '../navigation/service';
import { hasAgentProfile } from '../navigation/obstacles';
import { getZoneDestination } from '../navigation/destinations';
import { getSmartObject } from '../smartObjectRegistry';
import { resolveSlotAnimation } from '../../animations/animationResolver';
import { ResolvedInstructionCoords } from './agentTypes';

export function resolveInstructionCoords(
  instr: AgentInstruction,
  startPos: { x: number; z: number } | null,
  agentId?: string,
  currentPosition?: { x: number; z: number },
  departureOwner?: string
): ResolvedInstructionCoords {
  if (instr.type === 'RETURN_TO_START' && startPos) {
    return { tx: startPos.x, tz: startPos.z, label: 'point de départ' };
  }
  if (instr.targetZoneId) {
    const pos = getZoneDestination(instr.targetZoneId, agentId, currentPosition, departureOwner);
    return { tx: pos.x, tz: pos.z, label: instr.targetZoneId, rotY: instr.rotY };
  }
  if (instr.targetLocalPos) {
    const obj = instr.smartObjectId ? getSmartObject(instr.smartObjectId) : undefined;
    if (!obj) throw new Error('A local navigation target requires a SmartObject');
    const [x, y, z] = instr.targetLocalPos, c = Math.cos(obj.rotationY), s = Math.sin(obj.rotationY);
    const target = { x: obj.position[0] + x * c + z * s, z: obj.position[2] - x * s + z * c };
    const approach = instr.navigation !== 'interaction' && agentId && hasAgentProfile(agentId) ? getObjectApproach(obj.id, target, agentId, currentPosition, false, departureOwner, instr.closedDoor) : target;
    if (!approach) throw new NavigationBlockedError(`No approach for ${obj.id}`, target);
    return { tx: approach.x, ty: obj.position[1] + y, tz: approach.z, label: obj.name, rotY: instr.rotY };
  }
  // Si targetPos est fourni explicitement, il est prioritaire (ex: Rôle A ou B d'une animation Duo sur SmartObject)
  if (instr.targetPos) {
    const obj2 = instr.smartObjectId ? getSmartObject(instr.smartObjectId) : undefined;
    const roleSuffix = instr.slotId?.includes('roleB')
      ? ' (posB)'
      : instr.slotId?.includes('roleA')
      ? ' (posA)'
      : '';
    return {
      tx: instr.targetPos[0],
      ty: instr.targetPos[1],
      tz: instr.targetPos[2],
      label: obj2 ? `${obj2.name}${roleSuffix}` : `pos(${instr.targetPos[0].toFixed(0)}, ${instr.targetPos[2].toFixed(0)})`,
      rotY: instr.rotY,
    };
  }
  const obj = instr.smartObjectId ? getSmartObject(instr.smartObjectId) : undefined;
  if (obj) {
    const slot = instr.slotId
      ? (obj.slots.find(s => s.slotId === instr.slotId) ?? obj.slots[0])
      : obj.slots[0];
    const isMoveOnly = instr.type === 'MOVE_TO';
    const pos = isMoveOnly
      ? (slot?.approachOffset ?? slot?.offset ?? obj.position ?? [0, 0, 0])
      : (slot?.offset ?? slot?.approachOffset ?? obj.position ?? [0, 0, 0]);
    const resolved = slot ? resolveSlotAnimation(slot) : null;
    const finalRotY = resolved?.rotY ?? slot?.rotY;

    const profileId = agentId && hasAgentProfile(agentId) ? agentId : undefined;
    const desired = isMoveOnly && instr.doorKey
      ? getDoorApproach(instr.doorKey, profileId, { x: pos[0], z: pos[2] }, currentPosition, departureOwner, instr.closedDoor)
      : isMoveOnly && obj.approachDoor ? getDoorApproach(obj.approachDoor, profileId, undefined, currentPosition, departureOwner, instr.closedDoor) : { x: pos[0], z: pos[2] };
    const flexible = slot?.arrival === 'approach' || Boolean(obj.approachDoor) || obj.category === 'storage' || obj.category === 'outdoor';
    const usesApproach = isMoveOnly || flexible;
    const owner = slot?.navigationOwner ?? obj.id;
    const approach = usesApproach && profileId && !(isMoveOnly && obj.approachDoor) ? getObjectApproach(owner, desired, profileId, currentPosition, false, departureOwner, instr.closedDoor, flexible) : desired;
    if (!approach) throw new NavigationBlockedError(`No approach for ${obj.id}`, desired);
    return {
      owner,
      tx: approach.x,
      ty: isMoveOnly ? 0 : pos[1],
      tz: approach.z,
      label: `${obj.name}${slot ? ` (${slot.name})` : ''}`,
      rotY: finalRotY,
      anim: resolved?.animation ?? slot?.animation,
      duration: slot?.duration,
      repeatCount: slot?.repeatCount,
      repeatVariation: slot?.repeatVariation
    };
  }
  if (instr.type === 'WAIT' || instr.type === 'ROTATE_360') return { tx: 0, tz: 0, label: instr.type };
  throw new Error(`Instruction without a destination: ${instr.type}`);
}
