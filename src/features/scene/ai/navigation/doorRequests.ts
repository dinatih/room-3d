/** An opening is reserved until the agent has cleared it. Manual pushes remain independent. */
export type DoorKey = 'living' | 'bath' | 'entry' | 'glassRight' | 'glassLeft' | 'shower';
const queues = new Map<DoorKey, string[]>();
/** The glass leaves share one opening and cannot grant competing reservations. */
export const doorOpeningKey = (key: DoorKey): DoorKey => key === 'glassLeft' ? 'glassRight' : key;
export function requestDoor(key: DoorKey, agentId: string): boolean {
  key = doorOpeningKey(key);
  const queue = queues.get(key) ?? [];
  if (!queue.includes(agentId)) queue.push(agentId);
  queues.set(key, queue);
  return queue[0] === agentId;
}
export function doorRequested(key: DoorKey): boolean { return Boolean(queues.get(doorOpeningKey(key))?.length); }
export function releaseDoor(key: DoorKey, agentId: string): void {
  key = doorOpeningKey(key);
  const queue = queues.get(key)?.filter(id => id !== agentId);
  if (queue?.length) queues.set(key, queue); else queues.delete(key);
}
export function releaseAgentDoors(agentId: string): void {
  for (const key of queues.keys()) releaseDoor(key, agentId);
}
