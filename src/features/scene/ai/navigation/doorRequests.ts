/** Open passage requests can coexist; closing an opening requires exclusive access. */
export type DoorKey = 'living' | 'bath' | 'entry' | 'glassRight' | 'glassLeft' | 'shower';
const queues = new Map<DoorKey, { id: string; mode: 'open' | 'closed'; granted: boolean }[]>();
/** The glass leaves share one opening and cannot grant competing reservations. */
export const doorOpeningKey = (key: DoorKey): DoorKey => key === 'glassLeft' ? 'glassRight' : key;
export function requestDoor(key: DoorKey, agentId: string, mode: 'open' | 'closed' = 'open'): boolean {
  key = doorOpeningKey(key);
  const queue = queues.get(key) ?? [];
  let entry = queue.find(e => e.id === agentId);
  if (entry) {
    if (entry.mode !== mode) entry.granted = false;
    entry.mode = mode;
  } else {
    entry = { id: agentId, mode, granted: false };
    queue.push(entry);
  }
  queues.set(key, queue);
  const index = queue.findIndex(e => e.id === agentId);
  // An existing passage must finish before an exclusive closure, even when
  // its owner queued after the actor now upgrading from open to closed.
  entry.granted = mode === 'closed'
    ? index === 0 && queue.every(e => e === entry || !e.granted)
    : (entry.granted || queue.slice(0, index).every(e => e.mode === 'open'));
  return entry.granted;
}
export function doorRequested(key: DoorKey): boolean { return queues.get(doorOpeningKey(key))?.some(e => e.mode === 'open' && e.granted) ?? false; }
export function releaseDoor(key: DoorKey, agentId: string): void {
  key = doorOpeningKey(key);
  const queue = queues.get(key)?.filter(e => e.id !== agentId);
  if (queue?.length) queues.set(key, queue); else queues.delete(key);
}
export function releaseAgentDoors(agentId: string, keep?: DoorKey): void {
  for (const key of queues.keys()) if (!keep || key !== doorOpeningKey(keep)) releaseDoor(key, agentId);
}
