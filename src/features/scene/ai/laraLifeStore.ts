import { create } from 'zustand';
import { createLife, lifeHousehold, LIFE_CHARACTER_IDS, LIFE_CHARACTER_LABELS, LIFE_SPEEDS, LIFE_MINUTES_PER_SECOND, type LifeCharacterId } from './laraLife';
import { homeDirt, type HomeDirt, type HomeRoom } from './lifeHousekeeping';

// Keep these objects stable: controllers hold references to their character's life.
export const characterLives = Object.fromEntries(LIFE_CHARACTER_IDS.map(id => [id, createLife(id)])) as Record<LifeCharacterId, ReturnType<typeof createLife>>;
export const simulationClock = { minutes: 0 };

export type LifeSnapshot = Pick<ReturnType<typeof createLife>, 'needs' | 'elapsedSeconds'> & { activity: string; reason: string; room: HomeRoom;
  current?: { status: string; animation: string; smartObjectId?: string; slotId?: string; animationRequest?: string } };
const initialSnapshot = (id: LifeCharacterId): LifeSnapshot => ({
  needs: { ...characterLives[id].needs }, elapsedSeconds: characterLives[id].elapsedSeconds,
  room: 'living', activity: 'En attente', reason: `${LIFE_CHARACTER_LABELS[id]} commence sa journée.`,
});
export const useLaraLifeStore = create<{
  home: HomeDirt;
  household: typeof lifeHousehold;
  characters: Record<LifeCharacterId, LifeSnapshot>;
  speed: typeof LIFE_SPEEDS[number];
}>(() => ({ household: { ...lifeHousehold }, home: { ...homeDirt }, characters: Object.fromEntries(LIFE_CHARACTER_IDS.map(id => [id, initialSnapshot(id)])) as Record<LifeCharacterId, LifeSnapshot>,
  speed: 1 }));

export function publishLife(id: LifeCharacterId, patch: Partial<LifeSnapshot>) {
  useLaraLifeStore.setState(state => ({ household: { ...lifeHousehold }, home: { ...homeDirt }, characters: { ...state.characters, [id]: { ...state.characters[id], ...patch } } }));
}

/** Called once per scene frame, before any character or environment simulation. */
export function advanceSimulationClock(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) throw new Error('Invalid simulation duration');
  if (!seconds) return;
  updateSimulationClock(simulationClock.minutes + seconds * useLaraLifeStore.getState().speed * LIFE_MINUTES_PER_SECOND);
}

/** Seek to the next occurrence of a clock time without inventing lived activities. */
export function advanceToTime(minute: number) {
  if (!Number.isInteger(minute) || minute < 0 || minute > 24 * 60) throw new Error('Invalid target time');
  const current = (8 * 60 + simulationClock.minutes) % (24 * 60);
  if (minute === Math.floor(current)) return;
  updateSimulationClock(simulationClock.minutes + (minute - current + 24 * 60) % (24 * 60));
}

function updateSimulationClock(minutes: number) {
  const previousMinute = Math.floor(simulationClock.minutes);
  simulationClock.minutes = minutes;
  for (const life of Object.values(characterLives)) life.elapsedSeconds = simulationClock.minutes;
  // The UI displays whole simulated minutes; live controllers keep the exact shared time.
  if (Math.floor(simulationClock.minutes) === previousMinute) return;
  useLaraLifeStore.setState(state => ({ characters: Object.fromEntries(LIFE_CHARACTER_IDS.map(id => [id, { ...state.characters[id], elapsedSeconds: simulationClock.minutes }])) as typeof state.characters }));
}
