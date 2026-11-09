import { useLaraLifeStore, simulationClock } from './laraLifeStore';
import { LIFE_SETTINGS, lifeClock } from './laraLife';
import { useSceneStore } from '../store/useSceneStore';
import { cameraState } from '../cameraState';
import { OccupancyManager, isInRoom } from './occupancyManager';
import { bedLayoutBlock } from './bedLayout';
import { getSmartObject } from './smartObjectRegistry';
import { distance } from './navigation/geometry';
import { appLog } from '@features/ui/AppConsole';

/** An available housemate prepares the room; clock windows never move furniture themselves. */
export function mountBedRoutine() {
  let phase = '';
  let assigning = false;
  const attempted = new Set<string>();
  const update = () => {
    if (assigning) return;
    const { day, hour } = lifeClock(simulationClock.minutes);
    const night = hour >= 20 || hour < 6;
    const nextPhase = `${day}:${night}`;
    if (nextPhase !== phase) { phase = nextPhase; attempted.clear(); }
    if (!cameraState.isSceneLaunched || useSceneStore.getState().furniture.bedDouble === night || bedLayoutBlock(night)) return;
    const reservations = OccupancyManager.getReservations();
    if (reservations.some(r => r.slot.startsWith('bed-arrangement:'))) return;
    const lives = Object.entries(useLaraLifeStore.getState().characters);
    if (night && !lives.some(([id, life]) => cameraState.positions[id] && life.needs.rest >= LIFE_SETTINGS.priority)) return;
    const object = getSmartObject('bed-arrangement')!;
    const target = { x: object.position[0], z: object.position[2] };
    const candidates = lives.filter(([id, life]) => {
      const p = cameraState.positions[id];
      return !attempted.has(id) && id !== useSceneStore.getState().activeCharacterId && p && p.y === 0 && isInRoom('living', p)
        && life.current && ['IDLE', 'INTERACTING', 'FINISHED'].includes(life.current.status) && !life.current.smartObjectId
        && Object.values(life.needs).every(value => value < LIFE_SETTINGS.sleepPriority)
        && !reservations.some(r => r.characterId === id);
    });
    candidates.sort(([a], [b]) => distance(cameraState.positions[a], target) - distance(cameraState.positions[b], target));
    const actor = candidates[0]?.[0];
    if (!actor) return;
    attempted.add(actor);
    appLog(actor, night ? 'Prépare le lit double pour la nuit.' : 'Range les lits pour la journée.', {
      category: 'object', action: 'bed_layout_prepare', actors: [actor], object: { id: object.id, slotId: night ? 'double' : 'single' },
    });
    assigning = true;
    try { document.dispatchEvent(new CustomEvent('agent-force-smartobject', { detail: { targetId: actor, objectId: object.id, slotId: night ? 'double' : 'single' } })); }
    finally { assigning = false; }
  };
  const unsubscribe = useLaraLifeStore.subscribe(update);
  update();
  return unsubscribe;
}
