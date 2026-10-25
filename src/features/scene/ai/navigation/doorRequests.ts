/** Passage requests coexist; interactions limit the leaf's swing geometrically. */
export type DoorKey = 'living' | 'bath' | 'entry' | 'glassRight' | 'glassLeft' | 'shower';
export interface DoorProtection { x: number; z: number; y: number; radius: number; height: number }
const passages = new Map<DoorKey, Set<string>>();
const protections = new Map<DoorKey, Map<string, DoorProtection>>();
let protectionRevision = 0;
/** Both glass leaves serve the same opening, with an independent physical limit. */
export const doorOpeningKey = (key: DoorKey): DoorKey => key === 'glassLeft' ? 'glassRight' : key;
export const getDoorProtectionRevision = () => protectionRevision;
export function getDoorProtections(key: DoorKey): Iterable<DoorProtection> {
  return protections.get(doorOpeningKey(key))?.values() ?? [];
}
export function getAgentDoorProtection(key: DoorKey, agentId: string): DoorProtection | undefined {
  return protections.get(doorOpeningKey(key))?.get(agentId);
}
export function protectDoor(key: DoorKey, agentId: string, body: DoorProtection): void {
  if (![body.x, body.z, body.y, body.radius, body.height].every(Number.isFinite) || body.radius <= 0 || body.height <= 0) throw new Error(`Invalid door protection for ${agentId}`);
  key = doorOpeningKey(key);
  let entries = protections.get(key);
  if (!entries) { entries = new Map(); protections.set(key, entries); }
  const previous = entries.get(agentId);
  if (previous && previous.x === body.x && previous.z === body.z && previous.y === body.y && previous.radius === body.radius && previous.height === body.height) return;
  entries.set(agentId, { ...body });
  protectionRevision++;
}
export function requestDoor(key: DoorKey, agentId: string): void {
  key = doorOpeningKey(key);
  let entries = passages.get(key);
  if (!entries) { entries = new Set(); passages.set(key, entries); }
  entries.add(agentId);
}
export function doorRequested(key: DoorKey): boolean { return Boolean(passages.get(doorOpeningKey(key))?.size); }
export function releaseDoor(key: DoorKey, agentId: string): void {
  key = doorOpeningKey(key);
  const requests = passages.get(key);
  requests?.delete(agentId);
  if (!requests?.size) passages.delete(key);
  const bodies = protections.get(key);
  if (bodies?.delete(agentId)) protectionRevision++;
  if (!bodies?.size) protections.delete(key);
}
export function releaseAgentDoors(agentId: string, keep?: DoorKey): void {
  const retained = keep && doorOpeningKey(keep);
  for (const key of new Set([...passages.keys(), ...protections.keys()])) if (key !== retained) releaseDoor(key, agentId);
}

export function getDoorRequestDiagnostics() {
  return { revision: protectionRevision, passages: [...passages].map(([door, actors]) => ({ door, actors: [...actors] })),
    protections: [...protections].map(([door, actors]) => ({ door, actors: [...actors] })) };
}
