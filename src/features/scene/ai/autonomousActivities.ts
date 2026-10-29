import { AgentInstruction } from './aiTypes';
import { buildSmartObjectInstructionSequence, getAllSmartObjects } from './smartObjectRegistry';
import { OccupancyManager } from './occupancyManager';
import { LIFE_SETTINGS, type LifeCandidate } from './laraLife';

export const MEAL_PREPARATION = { id: 'cuisine-group', slotId: 'cook-stove' };

// Répartition initiale des Smart Objects par personnage (pour un spawn direct sur leur 1ère action)
const randomSpawn = typeof window !== 'undefined' && new URLSearchParams(
  window.location.search || window.location.hash.split('?')[1]
).get('randomSpawn') === '1';

export const INITIAL_SMART_OBJECT_BY_CHAR: Record<string, string> = randomSpawn ? {} : {
  native:   'desk-bollsidan-2',
  rosanna:  'bed-east',
  marissa:  'bed-west',
  delphina: 'shower',
  sara:     'inyeong-cha-hugs-point',
  cha:      'inyeong-cha-hugs-point',
  vivida:   'hugs-point',
  sabira:   'bed-west',
  // safa:     'west-neighbor-flat',
  // romana:   'west-neighbor-flat',
  // angelina: 'west-neighbor-flat',
  // lgbta:    'hugs-point',
  // sandra:   'duo-zone',
  // rajaa:    'duo-zone',
  // valby:    'bathtub-garden',
  // alex:     'est-neighbor-flat',
  // mannequin:'est-neighbor-flat',
  // david:    'est-neighbor-flat',
  // james:    'est-neighbor-flat',
  // lewis:    'est-neighbor-flat',
  // skeleton: 'combat-point',
  curious_skeleton: 'combat-point',
};


/** Each available slot is one candidate, including coordinated duo activities. */
export function getAvailableAutonomousActivities(characterId: string) {
  return getAllSmartObjects().filter(obj => OccupancyManager.canUseObject(obj.id, characterId))
    .flatMap(obj => obj.slots.filter(slot => !OccupancyManager.isSlotOccupied(obj.id, slot.slotId, characterId))
      .map(slot => ({ id: obj.id, slotId: slot.slotId })));
}

/** Free activities remain independent from the two scripted tours. */
export function buildAutonomousActivities(characterId: string): AgentInstruction[] {
  if (characterId === 'native') return buildLaraLifeInstructions({ activity: 'work', id: 'desk-bollsidan-2', slotId: 'work-standing' });
  const activities = getAvailableAutonomousActivities(characterId);
  for (let i = activities.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [activities[i], activities[j]] = [activities[j], activities[i]];
  }
  const preferred = activities.findIndex(activity => activity.id === INITIAL_SMART_OBJECT_BY_CHAR[characterId]);
  if (preferred > 0) [activities[0], activities[preferred]] = [activities[preferred], activities[0]];
  return activities.flatMap(({ id, slotId }) => buildSmartObjectInstructionSequence(id, slotId, characterId));
}

export function getLaraLifeCandidates(): LifeCandidate[] {
  const objects = getAllSmartObjects().filter(object => OccupancyManager.canUseObject(object.id, 'native'));
  const canPrepare = objects.some(object => object.id === MEAL_PREPARATION.id && object.slots.some(slot => slot.slotId === MEAL_PREPARATION.slotId
    && !OccupancyManager.isSlotOccupied(object.id, slot.slotId, 'native')));
  return objects.flatMap(object =>
    object.slots.filter(slot => !slot.isDuo && !OccupancyManager.isSlotOccupied(object.id, slot.slotId, 'native'))
      .flatMap(slot => {
        const activity = object.id === 'desk-bollsidan-2' ? 'work'
          : object.id === 'garden-fresh-air' ? 'walk'
          : object.category === 'seating' && slot.entryAnimation && slot.exitAnimation ? 'rest' : null;
        const position = slot.offset ?? object.position;
        const candidate = { id: object.id, slotId: slot.slotId, x: position[0], z: position[2] };
        return activity ? [{ ...candidate, activity }, ...(activity === 'rest' && canPrepare ? [{ ...candidate, activity: 'meal' }] : [])] as LifeCandidate[] : [];
      }));
}

export function buildLaraLifeInstructions(candidate: Pick<LifeCandidate, 'activity' | 'id' | 'slotId'>): AgentInstruction[] {
  if (candidate.activity === 'meal') return [
    { type: 'USE_OBJECT', smartObjectId: MEAL_PREPARATION.id, slotId: MEAL_PREPARATION.slotId, animation: 'cooking-stir-pan',
      duration: LIFE_SETTINGS.mealPreparationSeconds, repeatCount: 1, lifePhase: 'prepare-meal' },
    { type: 'USE_OBJECT', smartObjectId: candidate.id, slotId: candidate.slotId, animation: 'fab-daily-life-eat-with-fork',
      duration: LIFE_SETTINGS.activitySeconds, repeatCount: 1, lifePhase: 'eat-meal' },
  ];
  const instructions = buildSmartObjectInstructionSequence(candidate.id, candidate.slotId, 'native').map(instruction => instruction.type === 'USE_OBJECT'
    ? { ...instruction, duration: LIFE_SETTINGS.activitySeconds, repeatCount: 1, repeatVariation: false,
      animation: candidate.activity === 'rest' ? 'sitting-idle' : candidate.activity === 'walk' ? 'looking' : 'standing-using-touchscreen-tablet' }
    : instruction);
  // A stroll has a real itinerary even when Lara is already at the far end.
  return candidate.activity === 'walk' ? [{ type: 'MOVE_TO', targetZoneId: 'garden' }, ...instructions] : instructions;
}
