export type LifeActivity = 'rest' | 'work' | 'walk' | 'meal' | 'pause';
export type LifeNeeds = { rest: number; work: number; walk: number; meal: number };
export const LIFE_PHASE_LABELS = { 'prepare-meal': 'Préparer le repas', 'eat-meal': 'Manger' };
export interface LifeCandidate {
  activity: Exclude<LifeActivity, 'pause'>;
  id: string;
  slotId: string;
  x: number;
  z: number;
}

// Gameplay seconds: needs become important in roughly two minutes.
export const LIFE_SETTINGS = { activitySeconds: 60, mealPreparationSeconds: 20, pauseSeconds: 20, priority: 35 };
const WALKING_MOVEMENT_RATE = -8; // A short walk satisfies roughly a minute of restlessness.
export const LIFE_LABELS: Record<LifeActivity, string> = {
  rest: 'Se reposer', work: 'S’occuper au bureau', walk: 'Prendre l’air au jardin', meal: 'Préparer et prendre un repas', pause: 'Faire une pause',
};
export const LIFE_NEED_LABELS: Record<keyof LifeNeeds, string> = {
  rest: 'Besoin de repos', work: 'Besoin de stimulation', walk: 'Envie de bouger', meal: 'Faim',
};
const rates: Record<LifeActivity, LifeNeeds> = {
  pause: { rest: 0.35, work: 0.5, walk: 0.5, meal: 0.2 },
  rest: { rest: -1.5, work: 0.5, walk: 0.5, meal: 0.2 },
  work: { rest: 0.5, work: -1.5, walk: 0.6, meal: 0.2 },
  walk: { rest: 0.4, work: -0.8, walk: 0, meal: 0.2 },
  meal: { rest: 0.2, work: -0.4, walk: 0.3, meal: -1.5 },
};

export function createLife() {
  return { needs: { rest: 20, work: 65, walk: 15, meal: 10 } as LifeNeeds, lastActivity: null as LifeActivity | null };
}

/** Activity effects require an actual interaction; only real walking relieves movement. */
export function evolveLife(needs: LifeNeeds, seconds: number, activity: LifeActivity | null, moving: boolean): LifeNeeds {
  if (!Number.isFinite(seconds) || seconds < 0) throw new Error('Invalid life simulation duration');
  const rate = rates[activity ?? 'pause'];
  return Object.fromEntries(Object.entries(needs).map(([key, value]) => {
    if (!Number.isFinite(value) || value < 0 || value > 100) throw new Error(`Invalid life need ${key}`);
    const delta = key === 'walk' && moving ? WALKING_MOVEMENT_RATE : rate[key as keyof LifeNeeds];
    return [key, Math.max(0, Math.min(100, value + delta * seconds))];
  })) as LifeNeeds;
}

export function chooseLifeActivity(needs: LifeNeeds, candidates: LifeCandidate[], position: { x: number; z: number }, last: LifeActivity | null): LifeCandidate | null {
  const distance = (candidate: LifeCandidate) => Math.hypot(candidate.x - position.x, candidate.z - position.z);
  return candidates.filter(candidate => needs[candidate.activity] >= LIFE_SETTINGS.priority)
    .sort((a, b) => needs[b.activity] - needs[a.activity]
      || Number(a.activity === last) - Number(b.activity === last)
      || distance(a) - distance(b) || a.id.localeCompare(b.id) || a.slotId.localeCompare(b.slotId))[0] ?? null;
}
