import { AgentInstruction } from './aiTypes';
import { buildSmartObjectInstructionSequence, getAllSmartObjects } from './smartObjectRegistry';
import { OccupancyManager } from './occupancyManager';

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
  const activities = getAvailableAutonomousActivities(characterId);
  for (let i = activities.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [activities[i], activities[j]] = [activities[j], activities[i]];
  }
  const preferred = activities.findIndex(activity => activity.id === INITIAL_SMART_OBJECT_BY_CHAR[characterId]);
  if (preferred > 0) [activities[0], activities[preferred]] = [activities[preferred], activities[0]];
  return activities.flatMap(({ id, slotId }) => buildSmartObjectInstructionSequence(id, slotId, characterId));
}
