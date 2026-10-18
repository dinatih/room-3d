import { AgentInstruction } from './aiTypes';
import { buildSmartObjectInstructionSequence, getAllSmartObjectIds } from './smartObjectRegistry';
import { OccupancyManager } from './occupancyManager';

// Répartition initiale des Smart Objects par personnage (pour un spawn direct sur leur 1ère action)
export const INITIAL_SMART_OBJECT_BY_CHAR: Record<string, string> = {
  native:   'desk-bollsidan-2',
  rosanna:  'bed-east',
  marissa:  'sofa-garden-east',
  delphina: 'shower',
  sara:     'inyeong-cha-hugs-point',
  cha:      'inyeong-cha-hugs-point',
  vivida:   'hugs-point',
  sabira:   'bed-west',
  safa:     'west-neighbor-flat',
  romana:   'west-neighbor-flat',
  angelina: 'west-neighbor-flat',
  lgbta:    'hugs-point',
  sandra:   'duo-zone',
  rajaa:    'duo-zone',
  hayley:   'inyeong-cha-hugs-point',
  gloria:   'sofa-garden-east',
  valby:    'bathtub-garden',
  alex:     'est-neighbor-flat',
  mannequin:'est-neighbor-flat',
  david:    'est-neighbor-flat',
  james:    'est-neighbor-flat',
  lewis:    'est-neighbor-flat',
  jennifer: 'dance-bed-west-mid',
  skeleton: 'combat-point',
  curious_skeleton: 'combat-point',
};


/** Free activities remain independent from the two scripted tours. */
export function buildAutonomousActivities(characterId: string): AgentInstruction[] {
  const ids = getAllSmartObjectIds().filter(id => OccupancyManager.canUseObject(id, characterId));
  const preferred = INITIAL_SMART_OBJECT_BY_CHAR[characterId];
  const others = ids.filter(id => id !== preferred);
  for (let i = others.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [others[i], others[j]] = [others[j], others[i]];
  }
  const ordered = ids.includes(preferred) ? [preferred, ...others] : others;
  return ordered.flatMap(id => buildSmartObjectInstructionSequence(id, undefined, characterId));
}
