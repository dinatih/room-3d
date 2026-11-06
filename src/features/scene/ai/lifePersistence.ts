import { CHARACTERS } from '../characterConfig';
import { createLife, createLifeHousehold, lifeClock, LIFE_EVENT_LABELS, LIFE_CHARACTER_IDS, LIFE_LABELS, LIFE_NEED_LABELS, LIFE_SPEEDS, type LifeCharacterId } from './laraLife';
import { createHomeDirt, type HomeDirt } from './lifeHousekeeping';

export const LIFE_SAVE_KEY = 'room-3d-life';
export type LifeSave = { version: 1; savedAt: number; characters: Record<LifeCharacterId, ReturnType<typeof createLife>>;
  home: HomeDirt; selectedCharacterId?: LifeCharacterId; speed: typeof LIFE_SPEEDS[number]; household?: ReturnType<typeof createLifeHousehold> };
const activities = Object.keys(LIFE_LABELS);
const characterIds = CHARACTERS.map(character => character.id);
const number = (value: unknown, min = 0, max = Infinity) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) throw new Error('Nombre invalide dans la sauvegarde de vie');
};
const record = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Objet invalide dans la sauvegarde de vie');
  return value as Record<string, unknown>;
};
const keys = (value: unknown, required: string[], optional: string[] = []) => {
  const object = record(value);
  if (required.some(key => !Object.prototype.hasOwnProperty.call(object, key)) || Object.keys(object).some(key => ![...required, ...optional].includes(key))) {
    throw new Error('Champs invalides dans la sauvegarde de vie');
  }
  return object;
};
const numericRecord = (value: unknown, allowed?: string[], max = Infinity) => {
  for (const [key, amount] of Object.entries(record(value))) {
    if (allowed && !allowed.includes(key)) throw new Error(`Clé de sauvegarde invalide : ${key}`);
    number(amount, 0, max);
  }
};

/** Validate the whole snapshot before applying any of it. Invalid saves remain untouched. */
export function parseLifeSave(text: string): LifeSave {
  const data = keys(JSON.parse(text), ['version', 'savedAt', 'characters', 'home', 'speed'], ['household', 'selectedCharacterId']);
  if (data.version !== 1 || (data.selectedCharacterId !== undefined && !LIFE_CHARACTER_IDS.some(id => id === data.selectedCharacterId)) || !LIFE_SPEEDS.some(speed => speed === data.speed)) {
    throw new Error('Format ou réglages de sauvegarde de vie invalides');
  }
  number(data.savedAt);
  const characters = keys(data.characters, [...LIFE_CHARACTER_IDS]);
  keys(data.home, Object.keys(createHomeDirt()));
  numericRecord(data.home, undefined, 100);
  for (const id of LIFE_CHARACTER_IDS) {
    const life = keys(characters[id], Object.keys(createLife(id)));
    if (life.characterId !== id || typeof life.handsDirty !== 'boolean' || (life.lastActivity !== null && !activities.includes(life.lastActivity as string))) {
      throw new Error(`État de vie invalide : ${id}`);
    }
    number(life.elapsedSeconds);
    keys(life.needs, Object.keys(LIFE_NEED_LABELS));
    numericRecord(life.needs, undefined, 100);
    numericRecord(life.places);
    for (const [activity, value] of Object.entries(record(life.memory))) {
      if (!activities.includes(activity)) throw new Error(`Souvenir de vie invalide : ${activity}`);
      const experience = keys(value, ['satisfaction', 'lastAt'], ['places', 'periods']);
      number(experience.satisfaction); number(experience.lastAt, 0, life.elapsedSeconds as number);
      if (experience.periods !== undefined) numericRecord(experience.periods, ['Nuit', 'Matin', 'Journée', 'Soirée']);
      if (experience.places !== undefined) for (const value of Object.values(record(experience.places))) {
        const place = keys(value, ['satisfaction', 'lastAt']);
        number(place.satisfaction); number(place.lastAt, 0, life.elapsedSeconds as number);
      }
    }
    for (const [partner, value] of Object.entries(record(life.relationships))) {
      if (partner === id || !characterIds.includes(partner)) throw new Error(`Partenaire de vie invalide : ${partner}`);
      const relationship = keys(value, ['seconds', 'lastAt'], ['affinity', 'activities']);
      number(relationship.seconds); number(relationship.lastAt, 0, life.elapsedSeconds as number);
      if (relationship.affinity !== undefined) number(relationship.affinity, -Infinity);
      if (relationship.activities !== undefined) numericRecord(relationship.activities, activities);
    }
  }
  if (data.household !== undefined) {
    const household = keys(data.household, ['meals', 'journal']), meals = keys(household.meals, ['portions', 'held', 'preparedBy']);
    number(meals.portions);
    if (!Number.isInteger(meals.portions) || (meals.preparedBy !== null && !LIFE_CHARACTER_IDS.includes(meals.preparedBy as LifeCharacterId))) throw new Error('Repas partagé invalide');
    for (const [id, held] of Object.entries(record(meals.held))) if (!LIFE_CHARACTER_IDS.includes(id as LifeCharacterId) || held !== true) throw new Error('Portion réservée invalide');
    for (const [id, days] of Object.entries(record(household.journal))) {
      if (!LIFE_CHARACTER_IDS.includes(id as LifeCharacterId)) throw new Error('Personnage du journal invalide');
      for (const [day, value] of Object.entries(record(days))) {
        number(Number(day), 1, lifeClock(record(characters[id]).elapsedSeconds as number).day);
        if (!/^[1-9]\d*$/.test(day)) throw new Error('Jour du journal invalide');
        const summary = keys(value, ['activities', 'partners', 'unmet', 'events']);
        // Summed frame durations can exceed a day's length through floating-point rounding.
        numericRecord(summary.activities, activities);
        numericRecord(summary.partners, characterIds.filter(partner => partner !== id));
        numericRecord(summary.unmet, Object.keys(LIFE_NEED_LABELS));
        numericRecord(summary.events, Object.keys(LIFE_EVENT_LABELS));
      }
    }
  }
  return data as LifeSave;
}
