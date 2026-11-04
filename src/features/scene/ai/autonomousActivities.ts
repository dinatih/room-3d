import { AgentInstruction } from './aiTypes';
import { buildSmartObjectInstructionSequence, getAllSmartObjects } from './smartObjectRegistry';
import { OccupancyManager } from './occupancyManager';
import { LIFE_INITIAL_ACTIVITIES, LIFE_PHASE_LABELS, canStartLifeActivity, lifeSpecialtyActivity, lifeAffinity, getLifeMealPartner, socialPartnerScore, isLifeCharacter, isLifeSeat, lifeSocialActivity, type LifePhase, type LifeRelationships, type LifeCharacterId, type LifeCandidate } from './laraLife';
import { homeDirt, getHomeTask } from './lifeHousekeeping';

function mealPreparations(characterId: string, excluded: ReadonlySet<string>) {
  return getAvailableAutonomousActivities(characterId).filter(({ id, slotId }) =>
    !excluded.has(`${id}:${slotId}`) && (id === 'cuisine-group' && ['cook-stove', 'cook-oven'].includes(slotId)
      || ['fridge', 'freezer'].includes(id) && slotId === 'open-pick'));
}

// Répartition initiale des Smart Objects par personnage (pour un spawn direct sur leur 1ère action)
const randomSpawn = typeof window !== 'undefined' && new URLSearchParams(
  window.location.search || window.location.hash.split('?')[1]
).get('randomSpawn') === '1';

export const INITIAL_SMART_OBJECT_BY_CHAR: Record<string, string> = randomSpawn ? {} : {
  native:   'desk-bollsidan-2',
  rosanna:  'bed-east',
  marissa:  'west-neighbor-flat',
  delphina: 'shower',
  sara:     'combat-point',
  helena:   'building-b-corridor-end',
  rajaa:    'combat-point',
  sandra:   'est-neighbor-flat',
  cha:      'garden-fresh-air',
  vivida:   'bathtub-garden',
  sabira:   'bed-west',
  // safa:     'west-neighbor-flat',
  // romana:   'west-neighbor-flat',
  // angelina: 'west-neighbor-flat',
  // lgbta:    'hugs-point',
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
  if (isLifeCharacter(characterId)) {
    const initial = {
      native: ['desk-bollsidan-2', 'work-standing'], cha: ['garden-fresh-air', 'breathe'], vivida: ['bathtub-garden', 'center'],
      delphina: ['shower', 'take-shower-1'], marissa: ['west-neighbor-flat', 'yoga'], rosanna: ['bed-east', 'seat-middle'], sabira: ['bed-west', 'seat-middle'],
      sara: ['combat-point', 'combat-session'], rajaa: ['combat-point', 'combat-session'], sandra: ['est-neighbor-flat', 'combat-3'], helena: ['building-b-corridor-end', 'visit'],
    }[characterId];
    return buildLaraLifeInstructions(characterId, { activity: LIFE_INITIAL_ACTIVITIES[characterId], id: initial[0], slotId: initial[1] });
  }
  const activities = getAvailableAutonomousActivities(characterId);
  for (let i = activities.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [activities[i], activities[j]] = [activities[j], activities[i]];
  }
  const preferred = activities.findIndex(activity => activity.id === INITIAL_SMART_OBJECT_BY_CHAR[characterId]);
  if (preferred > 0) [activities[0], activities[preferred]] = [activities[preferred], activities[0]];
  return activities.flatMap(({ id, slotId }) => buildSmartObjectInstructionSequence(id, slotId, characterId));
}

export function getLaraLifeCandidates(characterId: LifeCharacterId, handsDirty: boolean, places: Record<string, number> = {}, relationships: LifeRelationships = {}, elapsedSeconds = 0, excluded: ReadonlySet<string> = new Set()): LifeCandidate[] {
  const objects = getAllSmartObjects().filter(object => OccupancyManager.canUseObject(object.id, characterId));
  const reservations = OccupancyManager.getReservations();
  const canPrepare = mealPreparations(characterId, excluded).length > 0;
  return objects.flatMap(object =>
    object.slots.filter(slot => (!slot.isDuo || lifeSocialActivity(object.id, slot.slotId) || lifeSpecialtyActivity(object.id, slot.slotId) || isLifeSeat(object.category, slot)) && !OccupancyManager.isSlotOccupied(object.id, slot.slotId, characterId))
      .flatMap(slot => {
        const task = getHomeTask(object.id, slot.slotId);
        const seat = isLifeSeat(object.category, slot);
        const activity = lifeSpecialtyActivity(object.id, slot.slotId) ?? (task ? 'clean' : object.id === 'desk-bollsidan-2' ? 'work'
          : object.id === 'west-neighbor-flat' ? 'yoga'
          : ['building-b-corridor-end', 'building-b-corridor'].includes(object.id) && slot.slotId === 'visit' ? 'tech'
          : object.id === 'tv-view' ? 'watch-tv'
          : lifeSocialActivity(object.id, slot.slotId) ? lifeSocialActivity(object.id, slot.slotId)
          : object.id === 'garden-fresh-air' ? canStartLifeActivity(characterId, 'dance') ? 'dance' : 'walk'
          : object.id === 'bathtub-garden' ? 'bath'
          : object.id === 'toilet' && slot.slotId === 'use' ? 'toilet'
          : object.id === 'shower' ? 'shower'
          : object.id === 'vasque-sdb' && slot.slotId === 'wash-hands' && handsDirty ? 'wash-hands'
          : object.category === 'bed' && slot.slotId.startsWith('lie-down') ? 'sleep'
          : seat ? 'rest' : null);
        if (activity && activity !== 'massage' && !canStartLifeActivity(characterId, activity)) return [];
        const position = slot.offset ?? object.position;
        const avoidedNeighbors = seat || object.category === 'bed' || object.id === 'bathtub-garden' ? [...new Set(reservations
          .filter(reservation => reservation.slot.slice(0, reservation.slot.indexOf(':')) === object.id && lifeAffinity(characterId, reservation.characterId) < 0)
          .map(reservation => reservation.characterId))] : [];
        const candidate = { ...(avoidedNeighbors.length ? { avoidedNeighbors } : {}), id: object.id, slotId: slot.slotId, x: position[0], z: position[2],
          visits: places[`${object.id}:${slot.slotId}`] ?? 0, ...(task ? { urgency: homeDirt[task] } : {}) };
        if (activity === 'massage') return [{ ...candidate, activity: 'receive-massage' }, ...(canStartLifeActivity(characterId, 'massage') ? [{ ...candidate, activity: 'massage' }] : [])] as LifeCandidate[];
        const mealPartnerId = seat && !slot.isDuo ? getLifeMealPartner(characterId, object.id, slot.slotId, relationships, elapsedSeconds) : undefined;
        return activity ? [{ ...candidate, activity }, ...(activity === 'work' ? [{ ...candidate, activity: 'read' }] : []),
          ...(activity === 'rest' && slot.isDuo ? [{ ...candidate, activity: 'social' }] : []),
          ...(activity === 'rest' && !slot.isDuo && canPrepare && !handsDirty ? [{ ...candidate, activity: 'meal', ...(mealPartnerId ? { mealPartnerId, companyScore: socialPartnerScore(relationships, mealPartnerId, elapsedSeconds, 'meal') } : {}) }] : [])] as LifeCandidate[] : [];
      }));
}

export function buildLaraLifeInstructions(characterId: LifeCharacterId, candidate: Pick<LifeCandidate, 'activity' | 'id' | 'slotId'>, excluded: ReadonlySet<string> = new Set()): AgentInstruction[] {
  if (candidate.activity === 'meal') {
    const preparations = mealPreparations(characterId, excluded);
    const preparation = preparations[Math.floor(Math.random() * preparations.length)];
    if (!preparation) throw new Error(`Aucune préparation de repas disponible pour ${characterId}`);
    return [
      ...buildSmartObjectInstructionSequence(preparation.id, preparation.slotId, characterId)
        .map(instruction => ({ ...instruction, lifePhase: 'prepare-meal' as const })),
      { type: 'USE_OBJECT', smartObjectId: candidate.id, slotId: candidate.slotId, animation: 'fab-daily-life-eat-with-fork',
        repeatCount: 1, repeatVariation: false, lifePhase: 'eat-meal' },
    ];
  }
  const sequence = buildSmartObjectInstructionSequence(candidate.id, candidate.slotId, characterId);
  const activityPhase = candidate.activity in LIFE_PHASE_LABELS ? candidate.activity as LifePhase : undefined;
  const sleepStep = sequence.findIndex(instruction => instruction.type === 'USE_OBJECT');
  const instructions = sequence.map((instruction, index): AgentInstruction => {
    const lifePhase = candidate.activity === 'sleep' && index > sleepStep ? 'wake-up'
      : instruction.type !== 'USE_OBJECT' ? undefined
      : instruction.smartObjectId === 'toilet' && instruction.slotId === 'use' ? 'use-toilet'
      : instruction.triggerEventKey === 'wc-flush' ? 'flush'
      : instruction.smartObjectId === 'vasque-sdb' && instruction.slotId === 'wash-hands' ? 'wash-hands'
      : activityPhase;
    return lifePhase ? { ...instruction, lifePhase } : instruction;
  });
  // A stroll has a real itinerary even when Lara is already at the far end.
  return candidate.activity === 'walk' ? [{ type: 'MOVE_TO', targetZoneId: 'garden' }, ...instructions] : instructions;
}
