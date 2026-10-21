import type { ApproachRegion } from '../navigation/queries';
import { AgentInstruction } from '../aiTypes';
import { getObjectApproach, getDoorApproach, getContainingObjectOwner, NavigationBlockedError } from '../navigation/service';
import { getAgentProfile, hasAgentProfile } from '../navigation/obstacles';
import { protectDoor } from '../navigation/doorRequests';
import { cameraState } from '../../cameraState';
import { getZoneDestination } from '../navigation/destinations';
import { getSmartObject } from '../smartObjectRegistry';
import { resolveSlotAnimation } from '../../animations/animationResolver';
import { ResolvedInstructionCoords } from './agentTypes';

export function resolveInstructionCoords(
  instr: AgentInstruction,
  startPos: { x: number; y?: number; z: number; rotY?: number; owner?: string } | null,
  agentId?: string,
  currentPosition?: { x: number; z: number },
  departureOwner?: string
): ResolvedInstructionCoords {
  // Resolve accessibility from the actual furniture exit, before planning the next activity.
  if (agentId && currentPosition && hasAgentProfile(agentId)) departureOwner = getContainingObjectOwner(agentId, currentPosition) ?? departureOwner;
  if (instr.type === 'RETURN_TO_START' && startPos) {
    return { tx: startPos.x, ty: startPos.y, tz: startPos.z, rotY: startPos.rotY, owner: startPos.owner, label: 'point de départ' };
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
    const approach = instr.navigation !== 'interaction' && agentId && hasAgentProfile(agentId) ? getObjectApproach(obj.id, target, agentId, currentPosition, false, departureOwner) : target;
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
  if (instr.type === 'OBSERVE_OBJECT') {
    if (!obj) throw new Error(`Unknown observation target ${instr.smartObjectId}`);
    const goal = { x: obj.position[0], z: obj.position[2] };
    const approach = agentId && hasAgentProfile(agentId)
      ? getObjectApproach(obj.id, goal, agentId, currentPosition, false, departureOwner, true)
      : goal;
    if (!approach) throw new NavigationBlockedError(`No observation approach for ${obj.id}`, goal);
    return { tx: approach.x, ty: 0, tz: approach.z, label: obj.name,
      rotY: Math.atan2(goal.x - approach.x, goal.z - approach.z), anim: 'idle', duration: instr.duration };
  }
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
      ? getDoorApproach(instr.doorKey, profileId, { x: pos[0], z: pos[2] }, currentPosition, departureOwner)
      : isMoveOnly && obj.approachDoor && !slot?.approachOffset ? getDoorApproach(obj.approachDoor, profileId, undefined, currentPosition, departureOwner) : { x: pos[0], z: pos[2] };
    // Keep the interaction footprint stable through its exit step. A moving
    // reservation would rebuild the shared door graph on every walking frame.
    if (instr.protectedDoor && profileId && !instr.doorKey) {
      const body = getAgentProfile(profileId);
      protectDoor(instr.protectedDoor, profileId, { ...desired, y: cameraState.positions[profileId]?.y ?? 0, radius: body.radius, height: body.height });
    }
    const flexible = slot?.arrival === 'approach' || Boolean(obj.approachDoor) || obj.category === 'storage' || obj.category === 'outdoor';
    const usesApproach = isMoveOnly || flexible;
    const owner = slot?.navigationOwner ?? obj.id;
    let region: ApproachRegion | undefined;
    if (slot?.arrival === 'front') {
      const width = slot.approachWidth;
      if (!width || width <= 0) throw new Error(`Missing front approach width for ${obj.id}`);
      region = { x: obj.position[0], z: obj.position[2], rotation: obj.rotationY, width };
    }
    const approach = usesApproach && profileId && !(isMoveOnly && obj.approachDoor && !slot?.approachOffset) ? getObjectApproach(owner, desired, profileId, currentPosition, false, departureOwner, flexible, region) : desired;
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
