export type LifeActivity = 'affection' | 'yoga' | 'clean' | 'bath' | 'rest' | 'work' | 'read' | 'watch-tv' | 'social' | 'walk' | 'meal' | 'sleep' | 'toilet' | 'shower' | 'wash-hands' | 'pause';
export const LIFE_CHARACTER_IDS = ['native', 'cha', 'vivida', 'delphina', 'marissa', 'rosanna', 'sabira'] as const;
export type LifeCharacterId = typeof LIFE_CHARACTER_IDS[number];
export const LIFE_CHARACTER_LABELS = { native: 'Lara', cha: 'Cha', vivida: 'Vivida', delphina: 'Delphina', marissa: 'Marissa', rosanna: 'Rosanna', sabira: 'Sabira' };
export const LIFE_INITIAL_ACTIVITIES = { native: 'work', cha: 'walk', vivida: 'bath', delphina: 'shower', marissa: 'yoga', rosanna: 'rest', sabira: 'rest' } as const;
export const isLifeCharacter = (id: string | undefined): id is LifeCharacterId => LIFE_CHARACTER_IDS.some(characterId => characterId === id);
export type LifeNeeds = { rest: number; work: number; walk: number; meal: number; hygiene: number; toilet: number; company: number; environment: number };
type LifeExperience = { satisfaction: number; lastAt: number };
export type LifeMemory = Partial<Record<LifeActivity, LifeExperience & {
  places?: Record<string, LifeExperience>; periods?: Partial<Record<LifePeriod, number>>;
}>>;
export type LifeRelationships = Record<string, { seconds: number; lastAt: number; affinity?: number; activities?: Partial<Record<LifeActivity, number>> }>;
type LifePeriod = 'Nuit' | 'Matin' | 'Journée' | 'Soirée';
const lifePeriod = (hour: number): LifePeriod => hour < 6 || hour >= 22 ? 'Nuit' : hour < 10 ? 'Matin' : hour < 18 ? 'Journée' : 'Soirée';
const LEISURE_ACTIVITIES: LifeActivity[] = ['read', 'watch-tv', 'walk', 'social', 'affection', 'bath', 'yoga'];
export const lifeSocialActivity = (objectId?: string): 'social' | 'affection' | null => objectId === 'garden-conversation' ? 'social'
  : ['hugs-point', 'inyeong-cha-hugs-point', 'interx-affection-point', 'interx-affection-garden-point'].includes(objectId ?? '') ? 'affection' : null;
export const LIFE_PHASE_LABELS = {
  reaction: 'Réagir',
  'prepare-meal': 'Préparer le repas', 'eat-meal': 'Manger', sleep: 'Dormir', 'wake-up': 'Se réveiller',
  'use-toilet': 'Aller aux toilettes', flush: 'Tirer la chasse', 'wash-hands': 'Se laver les mains', shower: 'Prendre une douche',
  read: 'Lire sur sa tablette', 'watch-tv': 'Regarder la télé', social: 'Discuter', affection: 'Partager un moment d’affection', bath: 'Se détendre dans le bain', clean: 'Nettoyer', yoga: 'Faire du yoga chez Églantine',
};
export type LifePhase = keyof typeof LIFE_PHASE_LABELS;
const LIFE_PHASE_EFFECTS: Record<LifePhase, LifeActivity | null> = {
  reaction: null,
  'prepare-meal': null, 'eat-meal': 'meal', sleep: 'sleep', 'wake-up': null,
  'use-toilet': 'toilet', flush: null, 'wash-hands': 'wash-hands', shower: 'shower',
  read: 'read', 'watch-tv': 'watch-tv', social: 'social', affection: 'affection', bath: 'bath', clean: 'clean', yoga: 'yoga',
};
export interface LifeCandidate {
  activity: Exclude<LifeActivity, 'pause'>;
  id: string;
  slotId: string;
  x: number;
  z: number;
  urgency?: number;
  visits?: number;
}

// Gameplay seconds: needs become important in roughly two minutes.
export const LIFE_SETTINGS = { activitySeconds: 60, sleepPriority: 75, pauseSeconds: 20, socialRetrySeconds: 20, priority: 35 };
const WALKING_MOVEMENT_RATE = -8; // A short walk satisfies roughly a minute of restlessness.
export const LIFE_LABELS: Record<LifeActivity, string> = {
  yoga: 'Faire du yoga chez Églantine', clean: 'Entretenir la maison', bath: 'Se détendre dans le bain', rest: 'Se reposer', work: 'S’occuper au bureau', walk: 'Prendre l’air au jardin', meal: 'Préparer et prendre un repas', sleep: 'Aller dormir', pause: 'Faire une pause',
  toilet: 'Aller aux toilettes puis se laver les mains', shower: 'Prendre une douche', 'wash-hands': 'Se laver les mains',
  read: 'Lire sur sa tablette', 'watch-tv': 'Regarder la télé', social: 'Discuter avec un voisin', affection: 'Partager un moment d’affection',
};
export const LIFE_NEED_LABELS: Record<keyof LifeNeeds, string> = {
  rest: 'Besoin de repos', work: 'Besoin de stimulation', walk: 'Envie de bouger', meal: 'Faim',
  hygiene: 'Besoin de se laver', toilet: 'Toilettes', company: 'Besoin de compagnie', environment: 'Environnement à nettoyer',
};
const MOOD_LABELS: Record<keyof LifeNeeds, string> = {
  rest: 'Fatiguée', work: 'Ennuyée', walk: 'Impatiente', meal: 'Affamée', hygiene: 'Inconfortable', toilet: 'Pressée', company: 'Seule', environment: 'Gênée par la saleté',
};

/** Mood follows the most pressing unmet need, using the activity decision threshold. */
export function getLifeMood(needs: LifeNeeds) {
  const need = (Object.keys(LIFE_NEED_LABELS) as (keyof LifeNeeds)[])
    .reduce((highest, key) => needs[key] > needs[highest] ? key : highest);
  return needs[need] >= LIFE_SETTINGS.priority
    ? { label: MOOD_LABELS[need], cause: `${LIFE_NEED_LABELS[need]} : ${Math.round(needs[need])} %.`, uncomfortable: true }
    : { label: 'Épanouie', cause: 'Tous les besoins sont satisfaits.', uncomfortable: false };
}

const socialRates: LifeNeeds = { rest: 0.2, work: -1.5, walk: 0.2, meal: 0.2, hygiene: 0.12, toilet: 0.18, company: -1.5, environment: 0 };
const rates: Record<LifeActivity, LifeNeeds> = {
  pause: { rest: 0.35, work: 0.5, walk: 0.5, meal: 0.2, hygiene: 0.12, toilet: 0.18, company: 0.2, environment: 0 },
  yoga: { rest: 0.4, work: -1.2, walk: -0.8, meal: 0.2, hygiene: 0.18, toilet: 0.18, company: 0.2, environment: 0 },
  clean: { rest: 0.5, work: -0.3, walk: 0.3, meal: 0.2, hygiene: 0.18, toilet: 0.18, company: 0.2, environment: 0 },
  bath: { rest: -0.35, work: -0.3, walk: 0.3, meal: 0.2, hygiene: -0.1, toilet: 0.18, company: 0.2, environment: 0 },
  rest: { rest: -0.35, work: 0.5, walk: 0.5, meal: 0.2, hygiene: 0.12, toilet: 0.18, company: 0.2, environment: 0 },
  work: { rest: 0.5, work: -1.5, walk: 0.6, meal: 0.2, hygiene: 0.12, toilet: 0.18, company: 0.2, environment: 0 },
  walk: { rest: 0.4, work: -0.8, walk: 0, meal: 0.2, hygiene: 0.18, toilet: 0.18, company: 0.2, environment: 0 },
  meal: { rest: -0.35, work: -0.4, walk: 0.3, meal: -1.5, hygiene: 0.12, toilet: 0.18, company: 0.2, environment: 0 },
  sleep: { rest: -0.8, work: 0.2, walk: 0.2, meal: 0.1, hygiene: 0.06, toilet: 0.09, company: 0.05, environment: 0 },
  toilet: { rest: 0.15, work: 0.2, walk: 0.3, meal: 0.2, hygiene: 0.12, toilet: -3, company: 0.2, environment: 0 },
  shower: { rest: -0.1, work: -0.3, walk: 0.3, meal: 0.2, hygiene: -1.5, toilet: 0.18, company: 0.2, environment: 0 },
  'wash-hands': { rest: 0.15, work: 0.2, walk: 0.3, meal: 0.2, hygiene: -0.1, toilet: 0.18, company: 0.2, environment: 0 },
  read: { rest: 0.2, work: -1.2, walk: 0.4, meal: 0.2, hygiene: 0.12, toilet: 0.18, company: 0.2, environment: 0 },
  'watch-tv': { rest: 0.1, work: -1, walk: 0.5, meal: 0.2, hygiene: 0.12, toilet: 0.18, company: 0.2, environment: 0 },
  social: socialRates, affection: socialRates,
};

// Symmetric personal relationships: dislike, friend, best friend. Shared time stays factual.
const INITIAL_RELATIONSHIPS: [LifeCharacterId, LifeCharacterId, number][] = [
  ['cha', 'delphina', -1], ['cha', 'marissa', -1], ['sabira', 'cha', 2],
  ['sabira', 'rosanna', 1], ['sabira', 'marissa', -1],
];
export const lifeAffinity = (a: string, b: string) => INITIAL_RELATIONSHIPS.find(([x, y]) => x === a && y === b || x === b && y === a)?.[2] ?? 0;

export function createLife(characterId: LifeCharacterId) {
  return { characterId, needs: { rest: 0, work: 65, walk: 15, meal: 10, hygiene: 10, toilet: 5, company: 10, environment: 0 } as LifeNeeds,
    elapsedSeconds: 0, memory: {} as LifeMemory, relationships: Object.fromEntries(INITIAL_RELATIONSHIPS.filter(([a, b]) => a === characterId || b === characterId)
      .map(([a, b, affinity]) => [a === characterId ? b : a, { seconds: 0, lastAt: 0, affinity }])) as LifeRelationships, handsDirty: false, places: {} as Record<string, number>, lastActivity: null as LifeActivity | null };
}

export function rememberLifeConversation(life: { characterId: LifeCharacterId; relationships: LifeRelationships; elapsedSeconds: number }, partnerId: string, seconds: number, activity?: LifeActivity) {
  if (!partnerId || partnerId === life.characterId || !Number.isFinite(seconds) || seconds < 0) throw new Error('Invalid life conversation');
  if (seconds === 0) return;
  const previous = life.relationships[partnerId];
  life.relationships[partnerId] = { ...previous, seconds: (previous?.seconds ?? 0) + seconds, lastAt: life.elapsedSeconds,
    ...(activity ? { activities: { ...previous?.activities, [activity]: (previous?.activities?.[activity] ?? 0) + seconds } } : {}) };
}

export function closestLifeFriend(relationships: LifeRelationships): string | null {
  return Object.keys(relationships).filter(id => (relationships[id].affinity ?? 0) >= 0 && (relationships[id].seconds > 0 || (relationships[id].affinity ?? 0) > 0)).sort((a, b) => (relationships[b].affinity ?? 0) - (relationships[a].affinity ?? 0) || relationships[b].seconds - relationships[a].seconds || a.localeCompare(b))[0] ?? null;
}

/** Familiar company grows attractive again after time apart; new encounters remain possible. */
export function socialPartnerScore(relationships: LifeRelationships, partnerId: string, elapsedSeconds: number, activity?: LifeActivity) {
  const relationship = relationships[partnerId];
  if (!relationship?.seconds) return 1 + (relationship?.affinity ?? 0);
  const since = elapsedSeconds - relationship.lastAt;
  return (relationship.affinity ?? 0) + relationship.seconds / (relationship.seconds + LIFE_SETTINGS.activitySeconds)
    + since / (since + LIFE_SETTINGS.activitySeconds)
      * (1 + (activity ? relationship.activities?.[activity] ?? 0 : 0) / (relationship.seconds + LIFE_SETTINGS.activitySeconds));
}

/** Only real need relief builds a taste; even an interrupted activity remains a recent experience. */
export function rememberLifeActivity(life: { memory: LifeMemory; elapsedSeconds: number }, activity: LifeActivity | null, before: LifeNeeds, after: LifeNeeds, place?: string) {
  if (!activity || activity === 'pause') return;
  const need = lifeNeed(activity, before);
  const previous = life.memory[activity], relief = Math.max(0, before[need] - after[need]);
  const period = lifeClock(life.elapsedSeconds).period;
  life.memory[activity] = { ...previous, satisfaction: (previous?.satisfaction ?? 0) + relief, lastAt: life.elapsedSeconds,
    ...(relief > 0 ? { periods: { ...previous?.periods, [period]: (previous?.periods?.[period] ?? 0) + relief },
      ...(place ? { places: { ...previous?.places, [place]: { satisfaction: (previous?.places?.[place]?.satisfaction ?? 0) + relief, lastAt: life.elapsedSeconds } } } : {}) } : {}) };
}

/** Learned context is a preference, never a source of need relief. */
export function lifeHabitScore(candidate: Pick<LifeCandidate, 'activity' | 'id' | 'slotId'>, memory: LifeMemory, hour: number, elapsedSeconds: number) {
  const experience = memory[candidate.activity];
  if (!experience?.satisfaction) return 1;
  const place = experience.places?.[`${candidate.id}:${candidate.slotId}`];
  const since = place ? elapsedSeconds - place.lastAt : 0;
  const total = experience.satisfaction + LIFE_SETTINGS.priority;
  return 1 + (experience.periods?.[lifePeriod(hour)] ?? 0) / total
    + (place ? place.satisfaction / total * since / (since + LIFE_SETTINGS.activitySeconds) : 0);
}

export function lifeFollowUp(last: LifeActivity | null, candidate: LifeCandidate, needs: LifeNeeds): string | null {
  if (last === 'yoga' && candidate.activity === 'shower' && needs.hygiene >= LIFE_SETTINGS.priority) return 'Après le yoga, se laver.';
  if (last === 'meal' && candidate.activity === 'clean' && candidate.id === 'cuisine-group' && candidate.slotId === 'wash-dishes'
    && (candidate.urgency ?? 0) >= LIFE_SETTINGS.priority) return 'Après le repas, faire la vaisselle qui gêne.';
  if (last && ['work', 'read', 'walk', 'yoga', 'clean'].includes(last) && candidate.activity === 'rest'
    && needs.rest >= LIFE_SETTINGS.priority) return 'Après une activité fatigante, se reposer assise.';
  return null;
}

export function favoriteLifeActivity(memory: LifeMemory): LifeActivity | null {
  return LEISURE_ACTIVITIES.filter(activity => (memory[activity]?.satisfaction ?? 0) > 0)
    .sort((a, b) => memory[b]!.satisfaction - memory[a]!.satisfaction)[0] ?? null;
}

export function lifePreferenceScore(activity: LifeActivity, memory: LifeMemory, elapsedSeconds: number) {
  const experience = memory[activity];
  if (!experience) return 1; // An untried activity is a chance to discover a taste.
  const since = elapsedSeconds - experience.lastAt;
  const total = Object.values(memory).reduce((sum, entry) => sum + entry.satisfaction, 0);
  return since / (since + LIFE_SETTINGS.activitySeconds) + (total > 0 ? experience.satisfaction / total : 0);
}

// One simulation second represents one clock minute; a day lasts 24 minutes at ×1.
export function lifeClock(elapsedSeconds: number) {
  const minutes = Math.floor(8 * 60 + elapsedSeconds);
  const hour = Math.floor(minutes / 60) % 24;
  return { day: Math.floor(minutes / (24 * 60)) + 1, hour,
    time: `${String(hour).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`,
    period: lifePeriod(hour) };
}

export function routineActivities(hour: number): LifeActivity[] {
  if (hour < 6 || hour >= 22) return ['sleep'];
  if (hour < 9) return ['shower', 'meal'];
  if (hour === 12 || hour === 13 || hour === 19 || hour === 20) return ['meal'];
  return hour < 18 ? ['work', 'yoga', 'walk'] : ['read', 'watch-tv', 'social', 'affection', 'bath', 'yoga'];
}

/** Need relief requires real interactions, walking or played physical exercise. */
export function evolveLife(needs: LifeNeeds, seconds: number, activity: LifeActivity | null, moving: boolean, social = false): LifeNeeds {
  if (!Number.isFinite(seconds) || seconds < 0) throw new Error('Invalid life simulation duration');
  const rate = rates[activity ?? 'pause'];
  return Object.fromEntries(Object.entries(rate).map(([key, change]) => {
    const value = needs[key as keyof LifeNeeds];
    if (!Number.isFinite(value) || value < 0 || value > 100) throw new Error(`Invalid life need ${key}`);
    const delta = key === 'walk' && moving ? WALKING_MOVEMENT_RATE : key === 'company' && social ? rates.social.company : change;
    return [key, Math.max(0, Math.min(100, value + delta * seconds))];
  })) as LifeNeeds;
}

export function chooseLifeActivity(needs: LifeNeeds, candidates: LifeCandidate[], position: { x: number; z: number }, last: LifeActivity | null, hour: number, memory: LifeMemory, elapsedSeconds: number): LifeCandidate | null {
  const distance = (candidate: LifeCandidate) => Math.hypot(candidate.x - position.x, candidate.z - position.z);
  const need = (candidate: LifeCandidate) => candidate.urgency ?? needs[lifeNeed(candidate.activity, needs)];
  const routine = routineActivities(hour);
  const wantsSleep = needs.rest >= (routine.includes('sleep') ? LIFE_SETTINGS.priority : LIFE_SETTINGS.sleepPriority)
    && candidates.some(candidate => candidate.activity === 'sleep');
  const routineScore = (candidate: LifeCandidate) => Number(routine.includes(candidate.activity));
  const preferenceScore = (candidate: LifeCandidate) => need(candidate) * lifePreferenceScore(candidate.activity, memory, elapsedSeconds)
    * lifeHabitScore(candidate, memory, hour, elapsedSeconds);
  return candidates.filter(candidate => candidate.activity === 'wash-hands' || (candidate.activity === 'sleep' ? wantsSleep
    : !(lifeNeed(candidate.activity) === 'rest' && wantsSleep) && need(candidate) >= LIFE_SETTINGS.priority))
    .sort((a, b) => Number(b.activity === 'wash-hands') - Number(a.activity === 'wash-hands')
      || (Math.max(need(a), need(b)) >= LIFE_SETTINGS.sleepPriority
        ? need(b) - need(a) : 0)
      || Number(Boolean(lifeFollowUp(last, b, needs))) - Number(Boolean(lifeFollowUp(last, a, needs)))
      || routineScore(b) - routineScore(a)
      || preferenceScore(b) - preferenceScore(a)
      || Number(a.activity === last) - Number(b.activity === last)
      || (a.visits ?? 0) - (b.visits ?? 0)
      || distance(a) - distance(b) || a.id.localeCompare(b.id) || a.slotId.localeCompare(b.slotId))[0] ?? null;
}

/** A short rest and a night in bed answer the same fatigue, with different recovery rates. */
export const lifeNeed = (activity: LifeCandidate['activity'], needs?: LifeNeeds): keyof LifeNeeds => activity === 'yoga'
  ? needs && needs.walk > needs.work ? 'walk' : 'work'
  : activity === 'sleep' || activity === 'bath' ? 'rest'
  : activity === 'shower' || activity === 'wash-hands' ? 'hygiene'
  : activity === 'clean' ? 'environment' : activity === 'social' || activity === 'affection' ? 'company' : activity === 'read' || activity === 'watch-tv' ? 'work' : activity;

/** An invitation must not cancel a personal command or interrupt essential care. */
export function lifeInvitationResponse(needs: LifeNeeds, activity: LifeActivity | null, handsDirty: boolean, available: boolean) {
  if (!available) return { status: 'declined', reason: 'Commande utilisateur ou visite en cours.' } as const;
  if (handsDirty) return { status: 'later', reason: 'Doit d’abord se laver les mains.' } as const;
  const urgent = (['rest', 'meal', 'hygiene', 'toilet'] as const).find(need => needs[need] >= LIFE_SETTINGS.sleepPriority);
  if (urgent) return { status: 'later', reason: `${LIFE_NEED_LABELS[urgent]} urgent (${Math.round(needs[urgent])} %).` } as const;
  if (activity && ['meal', 'sleep', 'toilet', 'shower', 'wash-hands'].includes(activity)) {
    return { status: 'later', reason: `Termine d’abord : ${LIFE_LABELS[activity]}.` } as const;
  }
  return { status: 'accepted', reason: 'Disponible pour une activité à deux.' } as const;
}

export const lifeEffect = (activity: LifeActivity | null, phase?: LifePhase): LifeActivity | null => phase
  ? LIFE_PHASE_EFFECTS[phase] : ['rest', 'work', 'walk', 'pause'].includes(activity ?? '') ? activity : null;

export function isLifeSeat(category: string, slot: { slotId: string; entryAnimation?: string; exitAnimation?: string }) {
  return (category === 'seating' || category === 'bed') && (slot.slotId.startsWith('seat') || slot.slotId.startsWith('sit')
    || Boolean(slot.entryAnimation && slot.exitAnimation));
}
