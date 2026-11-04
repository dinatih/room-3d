import { AgentInstruction } from './aiTypes';
import { buildSmartObjectInstructionSequence, getAllSmartObjects } from './smartObjectRegistry';
import { OccupancyManager } from './occupancyManager';
import { isLifeCharacter, type LifeCharacterId, type LifeCandidate } from './laraLife';

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
  cha:      'garden-fresh-air',
  vivida:   'bathtub-garden',
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
  if (isLifeCharacter(characterId)) return buildLaraLifeInstructions(characterId, characterId === 'native'
    ? { activity: 'work', id: 'desk-bollsidan-2', slotId: 'work-standing' }
    : characterId === 'cha' ? { activity: 'walk', id: 'garden-fresh-air', slotId: 'breathe' }
    : { activity: 'bath', id: 'bathtub-garden', slotId: 'center' });
  const activities = getAvailableAutonomousActivities(characterId);
  for (let i = activities.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [activities[i], activities[j]] = [activities[j], activities[i]];
  }
  const preferred = activities.findIndex(activity => activity.id === INITIAL_SMART_OBJECT_BY_CHAR[characterId]);
  if (preferred > 0) [activities[0], activities[preferred]] = [activities[preferred], activities[0]];
  return activities.flatMap(({ id, slotId }) => buildSmartObjectInstructionSequence(id, slotId, characterId));
}

export function getLaraLifeCandidates(characterId: LifeCharacterId, handsDirty: boolean): LifeCandidate[] {
  const objects = getAllSmartObjects().filter(object => OccupancyManager.canUseObject(object.id, characterId));
  const canPrepare = objects.some(object => object.id === MEAL_PREPARATION.id && object.slots.some(slot => slot.slotId === MEAL_PREPARATION.slotId
    && !OccupancyManager.isSlotOccupied(object.id, slot.slotId, characterId)));
  return objects.flatMap(object =>
    object.slots.filter(slot => (!slot.isDuo || object.id === 'garden-conversation') && !OccupancyManager.isSlotOccupied(object.id, slot.slotId, characterId))
      .flatMap(slot => {
        const activity = object.id === 'desk-bollsidan-2' ? 'work'
          : object.id === 'tv-view' ? 'watch-tv'
          : object.id === 'garden-conversation' ? 'social'
          : object.id === 'garden-fresh-air' ? 'walk'
          : object.id === 'bathtub-garden' ? 'bath'
          : object.id === 'toilet' && slot.slotId === 'use' ? 'toilet'
          : object.id === 'shower' ? 'shower'
          : object.id === 'vasque-sdb' && slot.slotId === 'wash-hands' && handsDirty ? 'wash-hands'
          : object.category === 'bed' && slot.slotId.startsWith('lie-down') ? 'sleep'
          : object.category === 'seating' && slot.entryAnimation && slot.exitAnimation ? 'rest' : null;
        const position = slot.offset ?? object.position;
        const candidate = { id: object.id, slotId: slot.slotId, x: position[0], z: position[2] };
        return activity ? [{ ...candidate, activity }, ...(activity === 'work' ? [{ ...candidate, activity: 'read' }] : []),
          ...(activity === 'rest' && canPrepare && !handsDirty ? [{ ...candidate, activity: 'meal' }] : [])] as LifeCandidate[] : [];
      }));
}

export function buildLaraLifeInstructions(characterId: LifeCharacterId, candidate: Pick<LifeCandidate, 'activity' | 'id' | 'slotId'>): AgentInstruction[] {
  if (candidate.activity === 'meal') return [
    ...buildSmartObjectInstructionSequence(MEAL_PREPARATION.id, MEAL_PREPARATION.slotId, characterId)
      .map(instruction => ({ ...instruction, lifePhase: 'prepare-meal' as const })),
    { type: 'USE_OBJECT', smartObjectId: candidate.id, slotId: candidate.slotId, animation: 'fab-daily-life-eat-with-fork',
      repeatCount: 1, repeatVariation: false, lifePhase: 'eat-meal' },
  ];
  const sequence = buildSmartObjectInstructionSequence(candidate.id, candidate.slotId, characterId);
  const sleepStep = sequence.findIndex(instruction => instruction.type === 'USE_OBJECT');
  const instructions = sequence.map((instruction, index): AgentInstruction => {
    const lifePhase = candidate.activity === 'sleep' && index > sleepStep ? 'wake-up'
      : instruction.type !== 'USE_OBJECT' ? undefined
      : instruction.smartObjectId === 'toilet' && instruction.slotId === 'use' ? 'use-toilet'
      : instruction.triggerEventKey === 'wc-flush' ? 'flush'
      : instruction.smartObjectId === 'vasque-sdb' && instruction.slotId === 'wash-hands' ? 'wash-hands'
      : candidate.activity === 'sleep' || candidate.activity === 'shower' || candidate.activity === 'read'
        || candidate.activity === 'watch-tv' || candidate.activity === 'social' || candidate.activity === 'bath' ? candidate.activity : undefined;
    return lifePhase ? { ...instruction, lifePhase } : instruction;
  });
  // A stroll has a real itinerary even when Lara is already at the far end.
  return candidate.activity === 'walk' ? [{ type: 'MOVE_TO', targetZoneId: 'garden' }, ...instructions] : instructions;
}
