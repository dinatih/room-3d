import { AgentInstruction } from './aiTypes';
import { buildSmartObjectInstructionSequence } from './smartObjectRegistry';

/**
 * SCENARIOS — Visite guidée et génération de séquences autonomes basées sur les Smart Objects.
 */

// Liste exhaustive de tous les Smart Objects disponibles pour la vie quotidienne autonome
export const AUTONOMOUS_SMART_OBJECTS: string[] = [
  'bed-west',
  'bed-east',
  'desk-bollsidan-1',
  'chair-office',
  'desk-bollsidan-2',
  'mirror-south',
  'sofa-garden-east',
  'sofa-garden-west',
  'bathtub-garden',
  'shower',
  'toilet',
  'sdb-closet',
  'corridor-closet',
  'drona-west',
  'drona-east',
  'kallax-ne',
  'cuisine-group',
  'freezer',
  'rain-dance',
  'garden-fresh-air',
  'building-b-corridor',
  'building-b-garden'
];

/**
 * Visite guidée complète de l'appartement (Full Tour)
 */
export const ACTION_FULL_TOUR: AgentInstruction[] = [
  ...buildSmartObjectInstructionSequence('toilet'),
  ...buildSmartObjectInstructionSequence('desk-bollsidan-1'),
  ...buildSmartObjectInstructionSequence('desk-bollsidan-2'),
  ...buildSmartObjectInstructionSequence('bed-west'),
  ...buildSmartObjectInstructionSequence('bed-east'),
  ...buildSmartObjectInstructionSequence('bathtub-garden'),
  ...buildSmartObjectInstructionSequence('shower'),
  ...buildSmartObjectInstructionSequence('sofa-garden-east'),
  ...buildSmartObjectInstructionSequence('sofa-garden-west'),
  ...buildSmartObjectInstructionSequence('cuisine-group'),
  ...buildSmartObjectInstructionSequence('freezer'),
  ...buildSmartObjectInstructionSequence('kallax-ne'),
  ...buildSmartObjectInstructionSequence('corridor-closet'),
  ...buildSmartObjectInstructionSequence('mirror-south'),
  ...buildSmartObjectInstructionSequence('garden-fresh-air'),
  ...buildSmartObjectInstructionSequence('building-b-corridor'),
  ...buildSmartObjectInstructionSequence('building-b-garden'),
  { type: 'RETURN_TO_START' }
];

// Répartition initiale des Smart Objects par personnage (pour un spawn direct sur leur 1ère action)
export const INITIAL_SMART_OBJECT_BY_CHAR: Record<string, string> = {
  native:   'desk-bollsidan-1',
  rosanna:  'sofa-garden-east',
  marissa:  'bed-east',
  delphina: 'shower',
  sara:     'building-b-garden',
  cha:      'cuisine-group',
  vivida:   'desk-bollsidan-2',
  sabira:   'rain-dance',
  safa:     'garden-fresh-air',
  romana:   'bed-west',
  angelina: 'bathtub-garden',
  lgbta:    'sofa-garden-west',
};

/**
 * Construit un scénario autonome complet de vie quotidienne
 */
export function buildAutonomousScenario(characterId?: string): AgentInstruction[] {
  const preferredFirst = characterId ? INITIAL_SMART_OBJECT_BY_CHAR[characterId] : undefined;

  const otherObjects = preferredFirst
    ? AUTONOMOUS_SMART_OBJECTS.filter(id => id !== preferredFirst)
    : AUTONOMOUS_SMART_OBJECTS;

  const shuffled = [...otherObjects].sort(() => Math.random() - 0.5);
  const orderedIds = preferredFirst ? [preferredFirst, ...shuffled] : shuffled;

  const smartActions = orderedIds
    .map(id => buildSmartObjectInstructionSequence(id, undefined, characterId))
    .filter(seq => seq.length > 0);

  return smartActions.flat();
}

