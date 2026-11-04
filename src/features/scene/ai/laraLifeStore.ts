import { create } from 'zustand';
import { createLife, createLifeHousehold, lifeHousehold, LIFE_CHARACTER_IDS, LIFE_CHARACTER_LABELS, LIFE_SPEEDS, type LifeCharacterId } from './laraLife';
import { homeDirt, type HomeDirt, type HomeRoom } from './lifeHousekeeping';
import { LIFE_SAVE_KEY, parseLifeSave, type LifeSave } from './lifePersistence';

// Keep these objects stable: controllers hold references to their character's life.
export const characterLives = Object.fromEntries(LIFE_CHARACTER_IDS.map(id => [id, createLife(id)])) as Record<LifeCharacterId, ReturnType<typeof createLife>>;
let saved: LifeSave | undefined;
let loadError: string | null = null;
Object.assign(lifeHousehold, createLifeHousehold());
if (typeof window !== 'undefined') {
  try {
    const text = window.localStorage.getItem(LIFE_SAVE_KEY);
    if (text !== null) {
      saved = parseLifeSave(text);
      for (const id of LIFE_CHARACTER_IDS) Object.assign(characterLives[id], saved.characters[id]);
      Object.assign(homeDirt, saved.home);
      if (saved.household) Object.assign(lifeHousehold, saved.household);
    }
  } catch (error) {
    console.error('Chargement de la vie impossible', error);
    loadError = 'Sauvegarde de vie illisible ou incompatible. Elle est conservée. « Nouvelle vie » permet de recommencer toute la colocation.';
  }
}
export type LifeSnapshot = Pick<ReturnType<typeof createLife>, 'needs' | 'memory' | 'relationships' | 'elapsedSeconds'> & { activity: string; reason: string; room: HomeRoom };
const initialSnapshot = (id: LifeCharacterId): LifeSnapshot => ({
  needs: { ...characterLives[id].needs }, memory: { ...characterLives[id].memory }, relationships: { ...characterLives[id].relationships }, elapsedSeconds: characterLives[id].elapsedSeconds,
  room: 'living', activity: saved ? 'À reprendre' : 'En attente', reason: saved ? `${LIFE_CHARACTER_LABELS[id]} reprend sa vie sauvegardée.` : `${LIFE_CHARACTER_LABELS[id]} commence sa journée.`,
});
export const useLaraLifeStore = create<{
  home: HomeDirt;
  household: typeof lifeHousehold;
  characters: Record<LifeCharacterId, LifeSnapshot>;
  speed: typeof LIFE_SPEEDS[number];
  savedAt: number | null;
  saveError: string | null;
}>(() => ({ household: { ...lifeHousehold }, home: { ...homeDirt }, characters: Object.fromEntries(LIFE_CHARACTER_IDS.map(id => [id, initialSnapshot(id)])) as Record<LifeCharacterId, LifeSnapshot>,
  speed: saved?.speed ?? 1, savedAt: saved?.savedAt ?? null, saveError: loadError }));

let saveTimer: ReturnType<typeof setTimeout> | undefined;
let resetting = false;
export function saveLives() {
  clearTimeout(saveTimer);
  saveTimer = undefined;
  if (typeof window === 'undefined' || resetting || loadError) return;
  const { speed } = useLaraLifeStore.getState(), savedAt = Date.now();
  try {
    window.localStorage.setItem(LIFE_SAVE_KEY, JSON.stringify({ version: 1, savedAt, characters: characterLives, household: lifeHousehold, home: homeDirt, speed } satisfies LifeSave));
    useLaraLifeStore.setState({ savedAt, saveError: null });
  } catch (error) {
    if (!useLaraLifeStore.getState().saveError) console.error('Sauvegarde de la vie impossible', error);
    useLaraLifeStore.setState({ saveError: 'La sauvegarde locale a échoué. Vérifiez l’espace et les autorisations de stockage du navigateur.' });
  }
}

function restartLives() {
  resetting = true;
  clearTimeout(saveTimer);
  window.location.reload();
}

/** A new life always resets the entire simulation, including its transient sessions. */
export function resetLives() {
  try {
    window.localStorage.removeItem(LIFE_SAVE_KEY);
    restartLives();
  } catch (error) {
    console.error('Nouvelle vie impossible', error);
    resetting = false;
    useLaraLifeStore.setState({ saveError: 'Impossible de réinitialiser la sauvegarde locale.' });
  }
}

if (typeof window !== 'undefined') {
  // At most one write per wall-clock second, even at accelerated simulation speeds.
  useLaraLifeStore.subscribe((state, previous) => {
    if (!saveTimer && !resetting && !loadError && (state.characters !== previous.characters || state.speed !== previous.speed)) {
      saveTimer = setTimeout(saveLives, 1000);
    }
  });
  window.addEventListener('pagehide', saveLives);
  window.addEventListener('storage', event => { if (event.key === LIFE_SAVE_KEY && event.newValue === null) restartLives(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') saveLives(); });
}

export function publishLife(id: LifeCharacterId, patch: Partial<LifeSnapshot>) {
  useLaraLifeStore.setState(state => ({ household: { ...lifeHousehold }, home: { ...homeDirt }, characters: { ...state.characters, [id]: { ...state.characters[id], ...patch } } }));
}
