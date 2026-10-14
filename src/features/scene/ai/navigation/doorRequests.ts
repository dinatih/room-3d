/** An opening is reserved until the agent has cleared it. Manual pushes remain independent. */
export type DoorKey = 'living' | 'bath' | 'entry' | 'glassRight' | 'glassLeft' | 'shower';
const queues = new Map<DoorKey, { id: string; mode: 'open' | 'closed' }[]>();
/** The glass leaves share one opening and cannot grant competing reservations. */
export const doorOpeningKey = (key: DoorKey): DoorKey => key === 'glassLeft' ? 'glassRight' : key;
export function requestDoor(key: DoorKey, agentId: string, mode: 'open' | 'closed' = 'open'): boolean {
  key = doorOpeningKey(key);
  const queue = queues.get(key) ?? [];
  const entry = queue.find(e => e.id === agentId);
  if (entry) entry.mode = mode; else queue.push({ id: agentId, mode });
  queues.set(key, queue);
  return queue[0].id === agentId;
}
export function doorRequested(key: DoorKey): boolean { return queues.get(doorOpeningKey(key))?.[0]?.mode === 'open'; }
export function releaseDoor(key: DoorKey, agentId: string): void {
  key = doorOpeningKey(key);
  const queue = queues.get(key)?.filter(e => e.id !== agentId);
  if (queue?.length) queues.set(key, queue); else queues.delete(key);
}
export function releaseAgentDoors(agentId: string, keep?: DoorKey): void {
  for (const key of queues.keys()) if (!keep || key !== doorOpeningKey(keep)) releaseDoor(key, agentId);
}
