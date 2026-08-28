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
  'duo-zone',
  'garden-fresh-air',
  'building-b-corridor',
  'building-b-garden'
];

/**
 * Visite guidée complète de l'appartement (Full Tour)
 * Départ : Porte d'entrée (extérieur couloir sud)
 * Parcours : En zig-zag de l'Est à l'Ouest et du Sud au Nord
 */
export const ACTION_FULL_TOUR: AgentInstruction[] = [
  // ── DÉPART : Porte d'entrée (côté couloir extérieur sud) ──
  { type: 'MOVE_TO', targetNodeId: 'outdoor-entry-door' },
  { type: 'INTERACT', triggerEventKey: 'entryDoor', triggerTargetState: true, animation: 'animations/interactions/anim_open_door_outwards.glb', duration: 0.8 },
  { type: 'MOVE_TO', targetNodeId: 'corridor-entry-door' },
  { type: 'INTERACT', triggerEventKey: 'entryDoor', triggerTargetState: false, duration: 0.5 },

  // ── ÉTAPE 1 : Couloir Sud-Est ──
  ...buildSmartObjectInstructionSequence('corridor-closet'),

  // ── ÉTAPE 2 : Salle de bain (Sud-Ouest) ──
  ...buildSmartObjectInstructionSequence('toilet'),
  ...buildSmartObjectInstructionSequence('drona-west'),
  ...buildSmartObjectInstructionSequence('vasque-sdb'),
  ...buildSmartObjectInstructionSequence('drona-east'),
  ...buildSmartObjectInstructionSequence('sdb-closet'),
  ...buildSmartObjectInstructionSequence('shower'),

  // ── ÉTAPE 3 : Séjour Sud (Zig-zag Est -> Centre -> Ouest) ──
  ...buildSmartObjectInstructionSequence('freezer'),
  ...buildSmartObjectInstructionSequence('mirror-south'),
  ...buildSmartObjectInstructionSequence('cuisine-group'),

  // ── ÉTAPE 4 : Séjour Milieu (Zig-zag Ouest -> Est -> Centre-Est -> Ouest) ──
  ...buildSmartObjectInstructionSequence('chair-office'),
  ...buildSmartObjectInstructionSequence('bed-east'),
  ...buildSmartObjectInstructionSequence('desk-bollsidan-2'),
  ...buildSmartObjectInstructionSequence('bed-west'),

  // ── ÉTAPE 5 : Séjour Nord (Zig-zag Ouest -> Est -> Baie vitrée) ──
  ...buildSmartObjectInstructionSequence('desk-bollsidan-1'),
  ...buildSmartObjectInstructionSequence('kallax-ne'),

  // ── ÉTAPE 6 : Jardin & Extérieurs Nord (Zig-zag Ouest -> Est -> Nord) ──
  ...buildSmartObjectInstructionSequence('sofa-garden-west'),
  ...buildSmartObjectInstructionSequence('sofa-garden-east'),
  ...buildSmartObjectInstructionSequence('bathtub-garden'),
  ...buildSmartObjectInstructionSequence('rain-dance'),
  ...buildSmartObjectInstructionSequence('garden-fresh-air'),
  ...buildSmartObjectInstructionSequence('building-b-garden'),
  ...buildSmartObjectInstructionSequence('building-b-corridor'),

  // ── ÉTAPE 7 : Fin de la visite & retour au point de départ ──
  { type: 'MOVE_TO', targetNodeId: 'outdoor-entry-door' },
  { type: 'RETURN_TO_START' }
];

/**
 * Scénario Concierge pour Xbot :
 * Ronde d'état des lieux (Entrée -> SDB 360° -> Salon 360° -> Couloir 360° -> Sortie vers appartement voisin)
 */
export const XBOT_CONCIERGE_TOUR: AgentInstruction[] = [
  // ── 1. Arrivée et entrée ──
  { type: 'MOVE_TO', targetNodeId: 'outdoor-entry-door' },
  { type: 'INTERACT', triggerEventKey: 'entryDoor', triggerTargetState: true, animation: 'animations/interactions/anim_open_door_outwards.glb', duration: 0.8 },
  { type: 'MOVE_TO', targetNodeId: 'corridor-entry-door' },
  { type: 'INTERACT', triggerEventKey: 'entryDoor', triggerTargetState: false, duration: 0.5 },

  // ── 2. Inspection Salle de bain ──
  { type: 'MOVE_TO', targetNodeId: 'bathroom-center' },
  { type: 'ROTATE_360', duration: 5.0, animation: 'animations/poses_idles/anim_texting_while_standing.glb' },

  // ── 3. Inspection Salon / Séjour ──
  { type: 'MOVE_TO', targetNodeId: 'living-center' },
  { type: 'ROTATE_360', duration: 6.0, animation: 'animations/poses_idles/anim_texting_while_standing.glb' },

  // ── 4. Inspection Couloir ──
  { type: 'MOVE_TO', targetNodeId: 'corridor-center' },
  { type: 'ROTATE_360', duration: 4.0, animation: 'animations/poses_idles/anim_texting_while_standing.glb' },

  // ── 5. Sortie et direction porte du voisin ──
  { type: 'INTERACT', triggerEventKey: 'entryDoor', triggerTargetState: true, animation: 'animations/interactions/anim_open_door_outwards.glb', duration: 0.8 },
  { type: 'MOVE_TO', targetNodeId: 'outdoor-entry-door' },
  { type: 'INTERACT', triggerEventKey: 'entryDoor', triggerTargetState: false, duration: 0.5 },
  { type: 'MOVE_TO', targetNodeId: 'outdoor-neighbor-door' },
  { type: 'WAIT', duration: 4.0, animation: 'animations/poses_idles/anim_texting_while_standing.glb' }
];

// Répartition initiale des Smart Objects par personnage (pour un spawn direct sur leur 1ère action)
export const INITIAL_SMART_OBJECT_BY_CHAR: Record<string, string> = {
  native:   'desk-bollsidan-1',
  rosanna:  'bed-east',
  marissa:  'sofa-garden-east',
  delphina: 'shower',
  sara:     'building-b-garden',
  cha:      'cuisine-group',
  vivida:   'desk-bollsidan-2',
  sabira:   'rain-dance',
  safa:     'garden-fresh-air',
  romana:   'bed-west',
  angelina: 'bathtub-garden',
  lgbta:    'sofa-garden-west',
  sandra:   'duo-zone',
  rajaa:    'duo-zone',
};

/**
 * Construit un scénario autonome complet de vie quotidienne
 */
export function buildAutonomousScenario(characterId?: string): AgentInstruction[] {
  if (characterId === 'xbot') {
    return XBOT_CONCIERGE_TOUR;
  }

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

