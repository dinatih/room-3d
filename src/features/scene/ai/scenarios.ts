import { AgentInstruction } from './aiTypes';
import { buildSmartObjectInstructionSequence } from './smartObjectRegistry';

/**
 * SCENARIOS — Routines d'actions composées et scénarios de visite de l'appartement.
 */

export const ACTION_GO_TO_TOILET: AgentInstruction[] = [
  { type: 'USE_OBJECT', smartObjectId: 'toilet', slotId: 'use' },
  { type: 'INTERACT', smartObjectId: 'toilet', slotId: 'flush' },
  { type: 'USE_OBJECT', smartObjectId: 'vasque-sdb', slotId: 'wash-hands' },
];

export const ACTION_SIT_DESK_1: AgentInstruction[] = [
  { type: 'USE_OBJECT', smartObjectId: 'desk-bollsidan-1', slotId: 'work-sitting' },
];

export const ACTION_SIT_OFFICE_CHAIR: AgentInstruction[] = [
  { type: 'USE_OBJECT', smartObjectId: 'chair-office', slotId: 'sit' },
];

export const ACTION_SIT_DESK_2: AgentInstruction[] = [
  { type: 'USE_OBJECT', smartObjectId: 'desk-bollsidan-2', slotId: 'work-standing' },
];

export const ACTIONS_BED_WEST: AgentInstruction[][] = [
  [{ type: 'USE_OBJECT', smartObjectId: 'bed-west', slotId: 'seat-north' }],
  [{ type: 'USE_OBJECT', smartObjectId: 'bed-west', slotId: 'seat-middle' }],
  [{ type: 'USE_OBJECT', smartObjectId: 'bed-west', slotId: 'seat-south' }],
  [{ type: 'USE_OBJECT', smartObjectId: 'bed-west', slotId: 'lie-down' }]
];

export const ACTIONS_BED_EAST: AgentInstruction[][] = [
  [{ type: 'USE_OBJECT', smartObjectId: 'bed-east', slotId: 'seat-north' }],
  [{ type: 'USE_OBJECT', smartObjectId: 'bed-east', slotId: 'seat-middle' }],
  [{ type: 'USE_OBJECT', smartObjectId: 'bed-east', slotId: 'seat-south' }],
  [{ type: 'USE_OBJECT', smartObjectId: 'bed-east', slotId: 'lie-down' }]
];

export const ACTIONS_BATHTUB: AgentInstruction[][] = [
  [{ type: 'USE_OBJECT', smartObjectId: 'bathtub-garden', slotId: 'center' }],
  [{ type: 'USE_OBJECT', smartObjectId: 'bathtub-garden', slotId: 'west' }],
  [{ type: 'USE_OBJECT', smartObjectId: 'bathtub-garden', slotId: 'east' }]
];

export const ACTION_SHOWER: AgentInstruction[] = [
  // 1. Va devant la douche
  { type: 'MOVE_TO', targetNodeId: 'Devant_Douche' },
  // 2. Ouvre la porte de douche depuis l'extérieur
  { type: 'INTERACT', triggerEventKey: 'shower-door-toggle', triggerTargetState: true, animation: 'media/sandbox/anims/anim_open_door_outwards.glb', duration: 0.5 },
  // 3. Entre dans le bac de douche
  { type: 'MOVE_TO', smartObjectId: 'shower', slotId: 'take-shower' },
  // 4. Ferme la porte de douche depuis l'intérieur
  { type: 'INTERACT', triggerEventKey: 'shower-door-toggle', triggerTargetState: false, duration: 0.4 },
  // 5. Exécute l'animation complète de douche
  { type: 'USE_OBJECT', smartObjectId: 'shower', slotId: 'take-shower' },
  // 6. Ouvre la porte depuis l'intérieur
  { type: 'INTERACT', triggerEventKey: 'shower-door-toggle', triggerTargetState: true, duration: 0.5 },
  // 7. Sort devant la douche
  { type: 'MOVE_TO', targetNodeId: 'Devant_Douche' },
  // 8. Referme la porte depuis l'extérieur
  { type: 'INTERACT', triggerEventKey: 'shower-door-toggle', triggerTargetState: false, duration: 0.4 }
];

export const ACTION_LAUNDRY: AgentInstruction[] = [
  // 1. Se place devant le placard SDB
  { type: 'MOVE_TO', smartObjectId: 'sdb-closet', slotId: 'pick-laundry' },
  // 2. Ouvre la porte droite du placard
  { type: 'INTERACT', triggerEventKey: 'sdb-closet-r-toggle', triggerTargetState: true, duration: 0.5 },
  // 3. Prend le sac de linge sale
  { type: 'USE_OBJECT', smartObjectId: 'sdb-closet', slotId: 'pick-laundry' },
  // 4. Referme la porte droite du placard
  { type: 'INTERACT', triggerEventKey: 'sdb-closet-r-toggle', triggerTargetState: false, duration: 0.4 }
];

export const ACTIONS_GARDEN_SOFA_EAST: AgentInstruction[][] = [
  [{ type: 'USE_OBJECT', smartObjectId: 'sofa-garden-east', slotId: 'seat-1' }],
  [{ type: 'USE_OBJECT', smartObjectId: 'sofa-garden-east', slotId: 'seat-2' }]
];

export const ACTIONS_GARDEN_SOFA_WEST: AgentInstruction[][] = [
  [{ type: 'USE_OBJECT', smartObjectId: 'sofa-garden-west', slotId: 'seat-1' }],
  [{ type: 'USE_OBJECT', smartObjectId: 'sofa-garden-west', slotId: 'seat-2' }]
];

export const ACTION_COOKING: AgentInstruction[] = [
  { type: 'USE_OBJECT', smartObjectId: 'cuisine-group', slotId: 'cook' },
  { type: 'USE_OBJECT', smartObjectId: 'freezer', slotId: 'open-pick' },
];

export const ACTION_KALLAX_NE: AgentInstruction[] = [
  { type: 'USE_OBJECT', smartObjectId: 'kallax-ne', slotId: 'inspect' },
  { type: 'USE_OBJECT', smartObjectId: 'corridor-closet', slotId: 'open-tidy' },
  { type: 'USE_OBJECT', smartObjectId: 'mirror-south', slotId: 'admire' },
];

export const ACTION_FRESH_AIR: AgentInstruction[] = [
  { type: 'USE_OBJECT', smartObjectId: 'garden-fresh-air', slotId: 'breathe' }
];

export const ACTION_ENTREE_BAT_B: AgentInstruction[] = [
  { type: 'USE_OBJECT', smartObjectId: 'building-b-corridor', slotId: 'visit' }
];

export const ACTION_ENTREE_COURS_BAT_B: AgentInstruction[] = [
  { type: 'USE_OBJECT', smartObjectId: 'building-b-garden', slotId: 'admire' }
];

export const ACTION_FULL_TOUR: AgentInstruction[] = [
  ...ACTION_GO_TO_TOILET,
  ...ACTION_SIT_DESK_1,
  ...ACTION_SIT_DESK_2,
  ...ACTIONS_BED_WEST[0],
  ...ACTIONS_BED_EAST[0],
  ...ACTIONS_BATHTUB[0],
  ...ACTION_SHOWER,
  ...ACTIONS_GARDEN_SOFA_EAST[0],
  ...ACTIONS_GARDEN_SOFA_WEST[0],
  ...ACTION_COOKING,
  ...ACTION_KALLAX_NE,
  ...ACTION_FRESH_AIR,
  ...ACTION_ENTREE_BAT_B,
  ...ACTION_ENTREE_COURS_BAT_B,
  { type: 'RETURN_TO_START' }
];

/**
 * Construit un scénario autonome complet de vie quotidienne
 */
export function buildAutonomousScenario(): AgentInstruction[] {
  const smartActions: AgentInstruction[][] = [
    buildSmartObjectInstructionSequence('bed-west'),
    buildSmartObjectInstructionSequence('bed-east'),
    buildSmartObjectInstructionSequence('desk-bollsidan-1'),
    buildSmartObjectInstructionSequence('chair-office'),
    buildSmartObjectInstructionSequence('desk-bollsidan-2'),
    buildSmartObjectInstructionSequence('mirror-south'),
    buildSmartObjectInstructionSequence('sofa-garden-east'),
    buildSmartObjectInstructionSequence('sofa-garden-west'),
    buildSmartObjectInstructionSequence('bathtub-garden'),
    buildSmartObjectInstructionSequence('corridor-closet'),
    buildSmartObjectInstructionSequence('drona-west'),
    buildSmartObjectInstructionSequence('drona-east'),
    buildSmartObjectInstructionSequence('kallax-ne'),
    buildSmartObjectInstructionSequence('cuisine-group'),
    buildSmartObjectInstructionSequence('freezer'),
    buildSmartObjectInstructionSequence('rain-dance'),
    ACTION_GO_TO_TOILET,
    ACTION_SHOWER,
    ACTION_LAUNDRY,
    ACTION_FRESH_AIR,
    ACTION_ENTREE_BAT_B,
    ACTION_ENTREE_COURS_BAT_B
  ].filter(seq => seq.length > 0);

  // Mélanger les actions de vie quotidienne de façon fluide et réaliste
  const shuffled = [...smartActions].sort(() => Math.random() - 0.5);
  return shuffled.flat();
}
