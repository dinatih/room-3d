export type LifeActivity = 'storage' | 'tech' | 'receive-massage' | 'dance' | 'combat' | 'massage' | 'affection' | 'yoga' | 'clean' | 'bath' | 'rest' | 'work' | 'read' | 'watch-tv' | 'social' | 'walk' | 'meal' | 'sleep' | 'toilet' | 'shower' | 'wash-hands' | 'pause';
export const LIFE_SPEEDS = [1, 3, 10] as const;
export const LIFE_MINUTES_PER_SECOND = 2;
export const LIFE_CHARACTER_IDS = ['native', 'cha', 'vivida', 'delphina', 'marissa', 'rosanna', 'sabira', 'sara', 'helena', 'rajaa', 'sandra'] as const;
export type LifeCharacterId = typeof LIFE_CHARACTER_IDS[number];
export const LIFE_CHARACTER_LABELS = { native: 'Lara', cha: 'Cha', vivida: 'Vivida', delphina: 'Delphina', marissa: 'Marissa', rosanna: 'Rosanna', sabira: 'Sabira', sara: 'Sara', rajaa: 'Rajaa', sandra: 'Sandra', helena: 'Helena' };
export const LIFE_INITIAL_ACTIVITIES = { native: 'work', cha: 'walk', vivida: 'bath', delphina: 'shower', marissa: 'yoga', rosanna: 'rest', sabira: 'rest', sara: 'combat', rajaa: 'combat', sandra: 'combat', helena: 'tech' } as const;
export const LIFE_INITIAL_PREFERENCES = {
  native: ['work', 'read'], cha: ['combat', 'massage', 'walk', 'social'], vivida: ['bath', 'massage', 'affection'], delphina: ['dance', 'read'],
  marissa: ['dance', 'watch-tv'], rosanna: ['dance', 'walk'], sabira: ['dance', 'social'],
  sara: ['combat', 'walk'], rajaa: ['combat', 'work'], sandra: ['combat', 'yoga'], helena: ['work', 'tech', 'read'],
} as const satisfies Record<LifeCharacterId, readonly LifeActivity[]>;
export const isLifeCharacter = (id: string | undefined): id is LifeCharacterId => LIFE_CHARACTER_IDS.some(characterId => characterId === id);
export type LifeNeeds = { rest: number; work: number; walk: number; meal: number; hygiene: number; toilet: number; company: number; environment: number };
type LifePeriod = 'Nuit' | 'Matin' | 'Journée' | 'Soirée';
const lifePeriod = (hour: number): LifePeriod => hour < 6 ? 'Nuit' : hour < 10 ? 'Matin' : hour < 18 ? 'Journée' : 'Soirée';
const LEISURE_ACTIVITIES: LifeActivity[] = ['storage', 'dance', 'combat', 'massage', 'receive-massage', 'tech', 'read', 'watch-tv', 'walk', 'social', 'affection', 'bath', 'yoga'];
export const lifeSocialActivity = (objectId?: string, slotId?: string): 'social' | 'affection' | 'massage' | null => slotId?.split(':')[0] === 'massage' && ['interx-affection-point', 'interx-affection-garden-point'].includes(objectId ?? '') ? 'massage' : objectId === 'garden-conversation' ? 'social'
  : ['hugs-point', 'inyeong-cha-hugs-point', 'interx-affection-point', 'interx-affection-garden-point'].includes(objectId ?? '') ? 'affection' : null;
export const LIFE_SPECIALTIES = {
  dance: ['delphina', 'marissa', 'rosanna', 'sabira'], combat: ['cha', 'sara', 'rajaa', 'sandra'], massage: ['cha', 'vivida'],
} as const;
export const canStartLifeActivity = (id: string, activity: LifeActivity) => !(activity in LIFE_SPECIALTIES)
  || LIFE_SPECIALTIES[activity as keyof typeof LIFE_SPECIALTIES].some(characterId => characterId === id);
export const lifeSpecialtyActivity = (objectId?: string, slotId?: string): 'dance' | 'combat' | 'massage' | null => objectId === 'combat-point' ? 'combat'
  : objectId === 'rain-dance' ? 'dance' : objectId === 'est-neighbor-flat'
    ? slotId?.startsWith('combat') ? 'combat' : slotId?.startsWith('locomotion') ? null : 'dance'
    : lifeSocialActivity(objectId, slotId) === 'massage' ? 'massage' : null;
export const LIFE_PERSONALITY: Partial<Record<LifeCharacterId, string>> = { helena: 'Timide et geek technologique', marissa: 'Coiffeuse' };

export const LIFE_PHASE_LABELS = {
  storage: 'Prendre un objet dans un rangement',
  tech: 'Consulter son téléphone', 'receive-massage': 'Recevoir un massage', dance: 'Danser', combat: 'S’entraîner au combat', massage: 'Donner un massage', reaction: 'Réagir',
  'prepare-meal': 'Préparer le repas', 'eat-meal': 'Manger', sleep: 'Dormir', 'wake-up': 'Se réveiller',
  'use-toilet': 'Aller aux toilettes', flush: 'Tirer la chasse', 'wash-hands': 'Se laver les mains', shower: 'Prendre une douche',
  read: 'Lire sur sa tablette', 'watch-tv': 'Regarder la télé', social: 'Discuter', affection: 'Partager un moment d’affection', bath: 'Se détendre dans le bain', clean: 'Nettoyer', yoga: 'Faire du yoga chez Églantine',
};
export type LifePhase = keyof typeof LIFE_PHASE_LABELS;
const LIFE_PHASE_EFFECTS: Record<LifePhase, LifeActivity | null> = {
  storage: 'storage',
  tech: 'tech', 'receive-massage': 'receive-massage', dance: 'dance', combat: 'combat', massage: 'massage', reaction: null,
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
  mealPartnerId?: string;
  companyScore?: number;
}

// Positive needs grow four times more slowly; real interactions retain their relief rates.
export const LIFE_SETTINGS = { needGrowthScale: 0.25, activitySeconds: 60, sleepPriority: 75, pauseSeconds: 20, socialRetrySeconds: 20, priority: 35 };
const WALKING_MOVEMENT_RATE = -8; // A short walk satisfies roughly a minute of restlessness.
export const LIFE_LABELS: Record<LifeActivity, string> = {
  storage: 'Prendre un objet dans un rangement',
  tech: 'Consulter son téléphone', 'receive-massage': 'Recevoir un massage', dance: 'Danser', combat: 'S’entraîner au combat', massage: 'Donner un massage', yoga: 'Faire du yoga chez Églantine', clean: 'Entretenir la maison', bath: 'Se détendre dans le bain', rest: 'Se reposer', work: 'S’occuper au bureau', walk: 'Prendre l’air au jardin', meal: 'Préparer et prendre un repas', sleep: 'Aller dormir', pause: 'Faire une pause',
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
const exerciseRates: LifeNeeds = { rest: 0.4, work: -1.2, walk: -0.8, meal: 0.2, hygiene: 0.18, toilet: 0.18, company: 0.2, environment: 0 };
const readingRates: LifeNeeds = { rest: 0.2, work: -1.2, walk: 0.4, meal: 0.2, hygiene: 0.12, toilet: 0.18, company: 0.2, environment: 0 };
const rates: Record<LifeActivity, LifeNeeds> = {
  dance: { ...exerciseRates, rest: 0.8 }, combat: { ...exerciseRates, rest: 1 }, massage: { ...socialRates, rest: 0.5 }, 'receive-massage': { ...socialRates, rest: -0.35 },
  storage: readingRates, tech: readingRates, read: readingRates,
  pause: { rest: 0.35, work: 0.5, walk: 0.5, meal: 0.2, hygiene: 0.12, toilet: 0.18, company: 0.2, environment: 0 },
  yoga: exerciseRates,
  clean: { rest: 0.5, work: -0.3, walk: 0.3, meal: 0.2, hygiene: 0.18, toilet: 0.18, company: 0.2, environment: 0 },
  bath: { rest: -0.35, work: -0.3, walk: 0.3, meal: 0.2, hygiene: -0.1, toilet: 0.18, company: 0.2, environment: 0 },
  rest: { rest: -0.35, work: 0.5, walk: 0.5, meal: 0.2, hygiene: 0.12, toilet: 0.18, company: 0.2, environment: 0 },
  work: { rest: 0.5, work: -1.5, walk: 0.6, meal: 0.2, hygiene: 0.12, toilet: 0.18, company: 0.2, environment: 0 },
  walk: { rest: 0.4, work: -0.8, walk: 0, meal: 0.2, hygiene: 0.18, toilet: 0.18, company: 0.2, environment: 0 },
  meal: { rest: -0.35, work: -0.4, walk: 0.3, meal: -1.5, hygiene: 0.12, toilet: 0.18, company: 0.2, environment: 0 },
  sleep: { rest: -0.8, work: 0.2, walk: 0.2, meal: 0.1, hygiene: 0.06, toilet: 0.09, company: 0.05, environment: 0 },
  toilet: { rest: 0.15, work: 0.2, walk: 0.3, meal: 0.2, hygiene: 0.12, toilet: -15, company: 0.2, environment: 0 },
  shower: { rest: -0.1, work: -0.3, walk: 0.3, meal: 0.2, hygiene: -1.5, toilet: 0.18, company: 0.2, environment: 0 },
  'wash-hands': { rest: 0.15, work: 0.2, walk: 0.3, meal: 0.2, hygiene: -0.1, toilet: 0.18, company: 0.2, environment: 0 },
  'watch-tv': { rest: 0.1, work: -1, walk: 0.5, meal: 0.2, hygiene: 0.12, toilet: 0.18, company: 0.2, environment: 0 },
  social: socialRates, affection: socialRates,
};

export type LifeDay = { activities: Partial<Record<LifeActivity, number>>; partners: Record<string, number>; unmet: Partial<Record<keyof LifeNeeds, number>>; events: Record<string, number> };
export const createLifeHousehold = () => ({
  meals: { portions: 0, preparedBy: null as LifeCharacterId | null, held: {} as Partial<Record<LifeCharacterId, true>> },
  journal: {} as Partial<Record<LifeCharacterId, Record<number, LifeDay>>>,
});
export const lifeHousehold = createLifeHousehold();
export const LIFE_EVENT_LABELS: Record<string, string> = {
  life_reaction: 'Réactions spontanées', life_invitation_accepted: 'Invitations acceptées', life_invitation_declined: 'Invitations refusées',
  life_invitation_later: 'Invitations reportées', life_invitation_resumed: 'Invitations reprises', life_invitation_cancelled: 'Invitations annulées', life_invitation_proposed: 'Activités proposées', life_meal_shared: 'Repas préparés à partager',
};

// Runtime rendezvous: only guests who actually claim a portion join the meal.
const lifeMealGuests = new Map<LifeCharacterId, { seated: boolean; started: boolean }>();
export function waitForLifeMeal(id: LifeCharacterId, seated: boolean) {
  if (!lifeHousehold.meals.held[id]) return false;
  let guest = lifeMealGuests.get(id);
  if (!guest) {
    guest = { seated: false, started: false };
    lifeMealGuests.set(id, guest);
  }
  guest.seated = seated;
  if (guest.started) return false;
  const guests = Object.keys(lifeHousehold.meals.held) as LifeCharacterId[];
  if (guests.every(id => lifeMealGuests.get(id)?.seated)) {
    for (const id of guests) lifeMealGuests.get(id)!.started = true;
    return false;
  }
  return true;
}

/** Reserve a real portion before setting off; a held meal survives a reload. */
export function claimLifeMeal(id: LifeCharacterId) {
  const meals = lifeHousehold.meals;
  if (meals.held[id]) return true;
  if (meals.portions === 0) return false;
  meals.portions--;
  meals.held[id] = true;
  lifeMealGuests.set(id, { seated: false, started: false });
  return true;
}
export function releaseLifeMeal(id: LifeCharacterId, eaten = false) {
  lifeMealGuests.delete(id);
  if (!lifeHousehold.meals.held[id]) return;
  delete lifeHousehold.meals.held[id];
  if (!eaten) lifeHousehold.meals.portions++;
}
export function prepareLifeMeals(id: LifeCharacterId, guests: LifeCharacterId[], reserveForCook = true) {
  const meals = lifeHousehold.meals;
  if (!meals.portions && !meals.held[id]) {
    meals.portions = new Set([id, ...guests].filter(guest => !meals.held[guest])).size;
    meals.preparedBy = id;
  }
  if (reserveForCook) claimLifeMeal(id);
}
const lifeDay = (id: LifeCharacterId, at: number) => {
  const days = lifeHousehold.journal[id] ??= {};
  return days[lifeClock(at).day] ??= { activities: {}, partners: {}, unmet: {}, events: {} };
};
/** Split midnight exactly; durations are simulated minutes, like the life clock. */
export function recordLifeDay(id: LifeCharacterId, at: number, seconds: number, activity: LifeActivity | null, needs: LifeNeeds, partnerId?: string) {
  if (!Number.isFinite(at) || at < 0 || !Number.isFinite(seconds) || seconds < 0) throw new Error('Invalid life journal duration');
  while (seconds > 0) {
    const duration = Math.min(seconds, 24 * 60 - (8 * 60 + at) % (24 * 60)), day = lifeDay(id, at);
    if (activity) day.activities[activity] = (day.activities[activity] ?? 0) + duration;
    if (partnerId) day.partners[partnerId] = (day.partners[partnerId] ?? 0) + duration;
    for (const key of Object.keys(needs) as (keyof LifeNeeds)[]) if (needs[key] >= LIFE_SETTINGS.priority) day.unmet[key] = (day.unmet[key] ?? 0) + duration;
    at += duration;
    seconds -= duration;
  }
}
export function recordLifeEvent(id: LifeCharacterId, at: number, event: string) {
  const day = lifeDay(id, at);
  day.events[event] = (day.events[event] ?? 0) + 1;
}

export function createLife(characterId: LifeCharacterId) {
  return { characterId, needs: { rest: 0, work: 65, walk: 15, meal: 0, hygiene: 10, toilet: 0, company: 10, environment: 0 } as LifeNeeds,
    elapsedSeconds: 0, handsDirty: false, lastActivity: null as LifeActivity | null };
}

/** Only controllers playing their eating animation appear here; no seats are reserved by this registry. */
export const activeLifeMeals = new Map<string, { objectId: string; slotId: string }>();
export const activeLifeDances = new Map<string, string>();
export const getLifeDancePartner = (id: string, objectId: string) =>
  [...activeLifeDances].find(([other, place]) => other !== id && place === objectId)?.[0];
export const getLifeMealPartner = (id: string, objectId: string, slotId: string) =>
  [...activeLifeMeals].find(([other, meal]) => other !== id && meal.objectId === objectId && meal.slotId !== slotId)?.[0];

export function lifeFollowUp(last: LifeActivity | null, candidate: LifeCandidate, needs: LifeNeeds): string | null {
  if (last && ['yoga', 'dance', 'combat'].includes(last) && candidate.activity === 'shower' && needs.hygiene >= LIFE_SETTINGS.priority) return 'Après l’activité physique, se laver.';
  if (last === 'meal' && candidate.activity === 'clean' && candidate.id === 'cuisine-group' && candidate.slotId === 'wash-dishes'
    && (candidate.urgency ?? 0) >= LIFE_SETTINGS.priority) return 'Après le repas, faire la vaisselle qui gêne.';
  if (last && ['work', 'read', 'walk', 'yoga', 'dance', 'combat', 'clean'].includes(last) && candidate.activity === 'rest'
    && needs.rest >= LIFE_SETTINGS.priority) return 'Après une activité fatigante, se reposer assise.';
  return null;
}

// The clock stores simulated minutes; a day lasts 12 real minutes at ×1.
export function lifeClock(elapsedSeconds: number) {
  const minutes = Math.floor(8 * 60 + elapsedSeconds);
  const hour = Math.floor(minutes / 60) % 24;
  return { day: Math.floor(minutes / (24 * 60)) + 1, hour,
    time: `${String(hour).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`,
    period: lifePeriod(hour) };
}

export function routineActivities(hour: number): LifeActivity[] {
  if (hour >= 22 || hour < 6) return ['sleep'];
  if (hour < 9) return ['shower', 'meal'];
  if (hour === 12 || hour === 13 || hour === 19 || hour === 20) return ['meal'];
  return hour < 18 ? ['work', ...LEISURE_ACTIVITIES] : LEISURE_ACTIVITIES;
}

/** Need relief requires real interactions, walking or played physical exercise. */
export function evolveLife(needs: LifeNeeds, seconds: number, activity: LifeActivity | null, moving: boolean, social = false): LifeNeeds {
  if (!Number.isFinite(seconds) || seconds < 0) throw new Error('Invalid life simulation duration');
  const rate = rates[activity ?? 'pause'];
  return Object.fromEntries(Object.entries(rate).map(([key, change]) => {
    const value = needs[key as keyof LifeNeeds];
    if (!Number.isFinite(value) || value < 0 || value > 100) throw new Error(`Invalid life need ${key}`);
    const delta = key === 'walk' && moving ? WALKING_MOVEMENT_RATE : key === 'company' && social ? rates.social.company : change;
    return [key, Math.max(0, Math.min(100, value + delta * seconds * (delta > 0 ? LIFE_SETTINGS.needGrowthScale : 1)))];
  })) as LifeNeeds;
}

/** Prefer another place for the same activity, without making the only available place unusable. */

/** Free time is spent on available leisure, never unnecessary meals, sleep or cleaning. */
export function chooseLifeLeisure(candidates: LifeCandidate[], last: LifeActivity | null): LifeCandidate | null {
  const leisure = candidates.filter(candidate => LEISURE_ACTIVITIES.includes(candidate.activity));
  const pool = leisure.some(candidate => candidate.activity !== last) ? leisure.filter(candidate => candidate.activity !== last) : leisure;
  const activities = [...new Set(pool.map(candidate => candidate.activity))];
  const activity = activities[Math.floor(Math.random() * activities.length)];
  const places = pool.filter(candidate => candidate.activity === activity);
  return places[Math.floor(Math.random() * places.length)] ?? null;
}

export function chooseLifeActivity(needs: LifeNeeds, candidates: LifeCandidate[], position: { x: number; z: number }, last: LifeActivity | null, hour: number, preferences: readonly LifeActivity[] = []): LifeCandidate | null {
  const distance = (candidate: LifeCandidate) => Math.hypot(candidate.x - position.x, candidate.z - position.z);
  const need = (candidate: LifeCandidate) => candidate.urgency ?? needs[lifeNeed(candidate.activity, needs)];
  const routine = routineActivities(hour);
  const wantsSleep = needs.rest >= (routine.includes('sleep') ? LIFE_SETTINGS.priority : LIFE_SETTINGS.sleepPriority)
    && candidates.some(candidate => candidate.activity === 'sleep');
  const routineScore = (candidate: LifeCandidate) => Number(routine.includes(candidate.activity));
  const preferenceScore = (candidate: LifeCandidate) => need(candidate) * (1 + (preferences.includes(candidate.activity) ? 1 / preferences.length : 0)) * (1 + (candidate.companyScore ?? 0) * needs.company / 100);
  return candidates.filter(candidate => candidate.activity === 'wash-hands' || (candidate.activity === 'sleep' ? wantsSleep
    : !(lifeNeed(candidate.activity) === 'rest' && wantsSleep) && need(candidate) >= LIFE_SETTINGS.priority))
    .sort((a, b) => Number(b.activity === 'wash-hands') - Number(a.activity === 'wash-hands')
      || (Math.max(need(a), need(b)) >= LIFE_SETTINGS.sleepPriority
        ? need(b) - need(a) : 0)
      || Number(Boolean(lifeFollowUp(last, b, needs))) - Number(Boolean(lifeFollowUp(last, a, needs)))
      || routineScore(b) - routineScore(a)
      || preferenceScore(b) - preferenceScore(a)
      || Number(a.activity === last) - Number(b.activity === last)
      || distance(a) - distance(b) || a.id.localeCompare(b.id) || a.slotId.localeCompare(b.slotId))[0] ?? null;
}

/** A short rest and a night in bed answer the same fatigue, with different recovery rates. */
export const lifeNeed = (activity: LifeCandidate['activity'], needs?: LifeNeeds): keyof LifeNeeds => (activity === 'yoga' || activity === 'dance' || activity === 'combat')
  ? needs && needs.walk > needs.work ? 'walk' : 'work'
  : activity === 'sleep' || activity === 'bath' || activity === 'receive-massage' ? 'rest'
  : activity === 'shower' || activity === 'wash-hands' ? 'hygiene'
  : activity === 'clean' ? 'environment' : activity === 'social' || activity === 'affection' || activity === 'massage' ? 'company' : activity === 'storage' || activity === 'read' || activity === 'tech' || activity === 'watch-tv' ? 'work' : activity;

/** An invitation must not cancel a personal command or interrupt essential care. */
export function lifeInvitationResponse(needs: LifeNeeds, activity: LifeActivity | null, handsDirty: boolean, available: boolean, invitedActivity?: LifeActivity) {
  if (!available) return { status: 'declined', reason: 'Commande utilisateur ou visite en cours.' } as const;
  if (handsDirty) return { status: 'later', reason: 'Doit d’abord se laver les mains.' } as const;
  const urgent = (['rest', 'meal', 'hygiene', 'toilet'] as const).find(need => needs[need] >= LIFE_SETTINGS.sleepPriority && !(need === 'meal' && invitedActivity === 'meal'));
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
