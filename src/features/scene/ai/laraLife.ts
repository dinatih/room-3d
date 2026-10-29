export type LifeActivity = 'rest' | 'work' | 'walk' | 'meal' | 'sleep' | 'toilet' | 'shower' | 'wash-hands' | 'pause';
export type LifeNeeds = { rest: number; work: number; walk: number; meal: number; hygiene: number; toilet: number };
export const LIFE_PHASE_LABELS = {
  'prepare-meal': 'Préparer le repas', 'eat-meal': 'Manger', sleep: 'Dormir', 'wake-up': 'Se réveiller',
  'use-toilet': 'Aller aux toilettes', flush: 'Tirer la chasse', 'wash-hands': 'Se laver les mains', shower: 'Prendre une douche',
};
export type LifePhase = keyof typeof LIFE_PHASE_LABELS;
const LIFE_PHASE_EFFECTS: Record<LifePhase, LifeActivity | null> = {
  'prepare-meal': null, 'eat-meal': 'meal', sleep: 'sleep', 'wake-up': null,
  'use-toilet': 'toilet', flush: null, 'wash-hands': 'wash-hands', shower: 'shower',
};
export interface LifeCandidate {
  activity: Exclude<LifeActivity, 'pause'>;
  id: string;
  slotId: string;
  x: number;
  z: number;
}

// Gameplay seconds: needs become important in roughly two minutes.
export const LIFE_SETTINGS = { activitySeconds: 60, mealPreparationSeconds: 20, toiletSeconds: 30, handWashingSeconds: 15,
  sleepSeconds: 120, sleepPriority: 75, pauseSeconds: 20, priority: 35 };
const WALKING_MOVEMENT_RATE = -8; // A short walk satisfies roughly a minute of restlessness.
export const LIFE_LABELS: Record<LifeActivity, string> = {
  rest: 'Se reposer', work: 'S’occuper au bureau', walk: 'Prendre l’air au jardin', meal: 'Préparer et prendre un repas', sleep: 'Aller dormir', pause: 'Faire une pause',
  toilet: 'Aller aux toilettes puis se laver les mains', shower: 'Prendre une douche', 'wash-hands': 'Se laver les mains',
};
export const LIFE_NEED_LABELS: Record<keyof LifeNeeds, string> = {
  rest: 'Besoin de repos', work: 'Besoin de stimulation', walk: 'Envie de bouger', meal: 'Faim',
  hygiene: 'Besoin de se laver', toilet: 'Toilettes',
};
const MOOD_LABELS: Record<keyof LifeNeeds, string> = {
  rest: 'Fatiguée', work: 'Ennuyée', walk: 'Impatiente', meal: 'Affamée', hygiene: 'Inconfortable', toilet: 'Pressée',
};

/** Mood follows the most pressing unmet need, using the activity decision threshold. */
export function getLifeMood(needs: LifeNeeds) {
  const need = (Object.keys(LIFE_NEED_LABELS) as (keyof LifeNeeds)[])
    .reduce((highest, key) => needs[key] > needs[highest] ? key : highest);
  return needs[need] >= LIFE_SETTINGS.priority
    ? { label: MOOD_LABELS[need], cause: `${LIFE_NEED_LABELS[need]} : ${Math.round(needs[need])} %.`, uncomfortable: true }
    : { label: 'Épanouie', cause: 'Les besoins de Lara sont satisfaits.', uncomfortable: false };
}

const rates: Record<LifeActivity, LifeNeeds> = {
  pause: { rest: 0.35, work: 0.5, walk: 0.5, meal: 0.2, hygiene: 0.12, toilet: 0.18 },
  rest: { rest: -0.35, work: 0.5, walk: 0.5, meal: 0.2, hygiene: 0.12, toilet: 0.18 },
  work: { rest: 0.5, work: -1.5, walk: 0.6, meal: 0.2, hygiene: 0.12, toilet: 0.18 },
  walk: { rest: 0.4, work: -0.8, walk: 0, meal: 0.2, hygiene: 0.18, toilet: 0.18 },
  meal: { rest: 0.2, work: -0.4, walk: 0.3, meal: -1.5, hygiene: 0.12, toilet: 0.18 },
  sleep: { rest: -0.8, work: 0.2, walk: 0.2, meal: 0.1, hygiene: 0.06, toilet: 0.09 },
  toilet: { rest: 0.15, work: 0.2, walk: 0.3, meal: 0.2, hygiene: 0.12, toilet: -3 },
  shower: { rest: -0.1, work: -0.3, walk: 0.3, meal: 0.2, hygiene: -1.5, toilet: 0.18 },
  'wash-hands': { rest: 0.15, work: 0.2, walk: 0.3, meal: 0.2, hygiene: -0.1, toilet: 0.18 },
};

export function createLife() {
  return { needs: { rest: 20, work: 65, walk: 15, meal: 10, hygiene: 10, toilet: 5 } as LifeNeeds,
    handsDirty: false, lastActivity: null as LifeActivity | null };
}

/** Activity effects require an actual interaction; only real walking relieves movement. */
export function evolveLife(needs: LifeNeeds, seconds: number, activity: LifeActivity | null, moving: boolean): LifeNeeds {
  if (!Number.isFinite(seconds) || seconds < 0) throw new Error('Invalid life simulation duration');
  const rate = rates[activity ?? 'pause'];
  return Object.fromEntries(Object.entries(rate).map(([key, change]) => {
    const value = needs[key as keyof LifeNeeds];
    if (!Number.isFinite(value) || value < 0 || value > 100) throw new Error(`Invalid life need ${key}`);
    const delta = key === 'walk' && moving ? WALKING_MOVEMENT_RATE : change;
    return [key, Math.max(0, Math.min(100, value + delta * seconds))];
  })) as LifeNeeds;
}

export function chooseLifeActivity(needs: LifeNeeds, candidates: LifeCandidate[], position: { x: number; z: number }, last: LifeActivity | null): LifeCandidate | null {
  const distance = (candidate: LifeCandidate) => Math.hypot(candidate.x - position.x, candidate.z - position.z);
  const wantsSleep = needs.rest >= LIFE_SETTINGS.sleepPriority && candidates.some(candidate => candidate.activity === 'sleep');
  return candidates.filter(candidate => candidate.activity === 'wash-hands' || (candidate.activity === 'sleep' ? wantsSleep
    : !(candidate.activity === 'rest' && wantsSleep) && needs[lifeNeed(candidate.activity)] >= LIFE_SETTINGS.priority))
    .sort((a, b) => Number(b.activity === 'wash-hands') - Number(a.activity === 'wash-hands')
      || needs[lifeNeed(b.activity)] - needs[lifeNeed(a.activity)]
      || Number(a.activity === last) - Number(b.activity === last)
      || distance(a) - distance(b) || a.id.localeCompare(b.id) || a.slotId.localeCompare(b.slotId))[0] ?? null;
}

/** A short rest and a night in bed answer the same fatigue, with different recovery rates. */
export const lifeNeed = (activity: LifeCandidate['activity']): keyof LifeNeeds => activity === 'sleep' ? 'rest'
  : activity === 'shower' || activity === 'wash-hands' ? 'hygiene' : activity;

export const lifeEffect = (activity: LifeActivity | null, phase?: LifePhase): LifeActivity | null => phase
  ? LIFE_PHASE_EFFECTS[phase] : ['rest', 'work', 'walk', 'pause'].includes(activity ?? '') ? activity : null;
