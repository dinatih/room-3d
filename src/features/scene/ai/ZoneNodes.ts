import { AgentInstruction, ZoneNode } from './aiTypes';

/**
 * WAYPOINTS — Nœuds de navigation et de passage purs (portes, couloirs, transitions).
 * Les meubles et interactions spécifiques sont gérés via SMART_OBJECTS (smartObjectRegistry.ts).
 */
export const WAYPOINTS: Record<string, ZoneNode> = {
  Couloir_Central: { id: 'Couloir_Central', x: 230, z: 350 },
  Couloir_Entree: { id: 'Couloir_Entree', x: 248, z: 535 }, // Devant porte d'entrée
  Sortie: { id: 'Sortie', x: 288, z: 603 }, // Dehors, devant la porte
  Couloir_SDB: { id: 'Couloir_SDB', x: 248, z: 535 }, // Devant porte SDB dans le couloir
  Entree_SDB: { id: 'Entree_SDB', x: 150, z: 560 }, // Juste à l'intérieur de la SDB
  Devant_Baie_Vitree: { id: 'Devant_Baie_Vitree', x: 200, z: 20 },
  Dans_Jardin: { id: 'Dans_Jardin', x: 200, z: -50 },
  Devant_Jardin_Voisin_Ouest: { id: 'Devant_Jardin_Voisin_Ouest', x: -200, z: -100 },
  Devant_Jardin_Voisin_Est: { id: 'Devant_Jardin_Voisin_Est', x: 400, z: -500 },
};

/** Alias de rétro-compatibilité */
export const ZONES = WAYPOINTS;

export const ACTION_GO_TO_TOILET: AgentInstruction[] = [
  { type: 'MOVE_TO', targetNodeId: 'Couloir_Central' },
  { type: 'INTERACT', triggerEventKey: 'livingDoor', triggerTargetState: true, animation: 'media/sandbox/anims/anim_open_door_outwards.glb', duration: 0.4 },
  { type: 'MOVE_TO', targetNodeId: 'Couloir_SDB' },
  { type: 'INTERACT', triggerEventKey: 'bathroomDoor', triggerTargetState: true, duration: 0.4 },
  { type: 'MOVE_TO', targetNodeId: 'Entree_SDB' },
  { type: 'MOVE_TO', smartObjectId: 'toilet', slotId: 'use' },
  { type: 'INTERACT', smartObjectId: 'toilet', slotId: 'use' },
  { type: 'INTERACT', smartObjectId: 'toilet', slotId: 'flush' },
  { type: 'MOVE_TO', smartObjectId: 'vasque-sdb', slotId: 'wash-hands' },
  { type: 'INTERACT', smartObjectId: 'vasque-sdb', slotId: 'wash-hands' },
];

export const ACTION_SIT_DESK_1: AgentInstruction[] = [
  { type: 'MOVE_TO', smartObjectId: 'desk-bollsidan-1', slotId: 'work-sitting' },
  { type: 'INTERACT', smartObjectId: 'desk-bollsidan-1', slotId: 'work-sitting' },
];

export const ACTION_SIT_OFFICE_CHAIR: AgentInstruction[] = [
  { type: 'MOVE_TO', smartObjectId: 'chair-office', slotId: 'sit' },
  { type: 'INTERACT', smartObjectId: 'chair-office', slotId: 'sit' },
];

export const ACTION_SIT_DESK_2: AgentInstruction[] = [
  { type: 'MOVE_TO', smartObjectId: 'desk-bollsidan-2', slotId: 'work-standing' },
  { type: 'INTERACT', smartObjectId: 'desk-bollsidan-2', slotId: 'work-standing' },
];

export const ACTIONS_BED_WEST: AgentInstruction[][] = [
  [
    { type: 'MOVE_TO', smartObjectId: 'bed-west', slotId: 'seat-north' },
    { type: 'INTERACT', smartObjectId: 'bed-west', slotId: 'seat-north' }
  ],
  [
    { type: 'MOVE_TO', smartObjectId: 'bed-west', slotId: 'seat-middle' },
    { type: 'INTERACT', smartObjectId: 'bed-west', slotId: 'seat-middle' }
  ],
  [
    { type: 'MOVE_TO', smartObjectId: 'bed-west', slotId: 'seat-south' },
    { type: 'INTERACT', smartObjectId: 'bed-west', slotId: 'seat-south' }
  ],
  [
    { type: 'MOVE_TO', smartObjectId: 'bed-west', slotId: 'lie-down' },
    { type: 'INTERACT', smartObjectId: 'bed-west', slotId: 'lie-down' }
  ]
];

export const ACTIONS_BED_EAST: AgentInstruction[][] = [
  [
    { type: 'MOVE_TO', smartObjectId: 'bed-east', slotId: 'seat-north' },
    { type: 'INTERACT', smartObjectId: 'bed-east', slotId: 'seat-north' }
  ],
  [
    { type: 'MOVE_TO', smartObjectId: 'bed-east', slotId: 'seat-middle' },
    { type: 'INTERACT', smartObjectId: 'bed-east', slotId: 'seat-middle' }
  ],
  [
    { type: 'MOVE_TO', smartObjectId: 'bed-east', slotId: 'seat-south' },
    { type: 'INTERACT', smartObjectId: 'bed-east', slotId: 'seat-south' }
  ],
  [
    { type: 'MOVE_TO', smartObjectId: 'bed-east', slotId: 'lie-down' },
    { type: 'INTERACT', smartObjectId: 'bed-east', slotId: 'lie-down' }
  ]
];

export const ACTIONS_BATHTUB: AgentInstruction[][] = [
  [
    { type: 'MOVE_TO', targetNodeId: 'Devant_Baie_Vitree' },
    { type: 'INTERACT', triggerEventKey: 'eastGlassDoor', triggerTargetState: true, animation: 'media/sandbox/anims/anim_open_door_outwards.glb', duration: 0.4 },
    { type: 'MOVE_TO', targetNodeId: 'Dans_Jardin' },
    { type: 'MOVE_TO', smartObjectId: 'bathtub-garden', slotId: 'center' },
    { type: 'INTERACT', smartObjectId: 'bathtub-garden', slotId: 'center' },
    { type: 'MOVE_TO', targetNodeId: 'Dans_Jardin' },
    { type: 'MOVE_TO', targetNodeId: 'Devant_Baie_Vitree' },
    { type: 'INTERACT', triggerEventKey: 'eastGlassDoor', triggerTargetState: false, duration: 0.3 }
  ],
  [
    { type: 'MOVE_TO', targetNodeId: 'Devant_Baie_Vitree' },
    { type: 'INTERACT', triggerEventKey: 'eastGlassDoor', triggerTargetState: true, animation: 'media/sandbox/anims/anim_open_door_outwards.glb', duration: 0.4 },
    { type: 'MOVE_TO', targetNodeId: 'Dans_Jardin' },
    { type: 'MOVE_TO', smartObjectId: 'bathtub-garden', slotId: 'west' },
    { type: 'INTERACT', smartObjectId: 'bathtub-garden', slotId: 'west' },
    { type: 'MOVE_TO', targetNodeId: 'Dans_Jardin' },
    { type: 'MOVE_TO', targetNodeId: 'Devant_Baie_Vitree' },
    { type: 'INTERACT', triggerEventKey: 'eastGlassDoor', triggerTargetState: false, duration: 0.3 }
  ],
  [
    { type: 'MOVE_TO', targetNodeId: 'Devant_Baie_Vitree' },
    { type: 'INTERACT', triggerEventKey: 'eastGlassDoor', triggerTargetState: true, animation: 'media/sandbox/anims/anim_open_door_outwards.glb', duration: 0.4 },
    { type: 'MOVE_TO', targetNodeId: 'Dans_Jardin' },
    { type: 'MOVE_TO', smartObjectId: 'bathtub-garden', slotId: 'east' },
    { type: 'INTERACT', smartObjectId: 'bathtub-garden', slotId: 'east' },
    { type: 'MOVE_TO', targetNodeId: 'Dans_Jardin' },
    { type: 'MOVE_TO', targetNodeId: 'Devant_Baie_Vitree' },
    { type: 'INTERACT', triggerEventKey: 'eastGlassDoor', triggerTargetState: false, duration: 0.3 }
  ]
];

export const ACTION_SHOWER: AgentInstruction[] = [
  { type: 'MOVE_TO', targetNodeId: 'Couloir_Central' },
  { type: 'INTERACT', triggerEventKey: 'livingDoor', triggerTargetState: true, duration: 0.3 },
  { type: 'MOVE_TO', targetNodeId: 'Couloir_SDB' },
  { type: 'INTERACT', triggerEventKey: 'bathroomDoor', triggerTargetState: true, duration: 0.3 },
  { type: 'MOVE_TO', targetNodeId: 'Entree_SDB' },
  { type: 'MOVE_TO', smartObjectId: 'shower', slotId: 'take-shower' },
  { type: 'INTERACT', smartObjectId: 'shower', slotId: 'take-shower' },
  { type: 'MOVE_TO', targetNodeId: 'Entree_SDB' },
  { type: 'MOVE_TO', targetNodeId: 'Couloir_SDB' },
  { type: 'INTERACT', triggerEventKey: 'bathroomDoor', triggerTargetState: false, duration: 0.3 },
  { type: 'MOVE_TO', targetNodeId: 'Couloir_Central' },
  { type: 'INTERACT', triggerEventKey: 'livingDoor', triggerTargetState: false, duration: 0.3 },
];

export const ACTIONS_GARDEN_SOFA_EAST: AgentInstruction[][] = [
  [
    { type: 'MOVE_TO', targetNodeId: 'Devant_Baie_Vitree' },
    { type: 'INTERACT', triggerEventKey: 'eastGlassDoor', triggerTargetState: true, animation: 'media/sandbox/anims/anim_open_door_outwards.glb', duration: 0.4 },
    { type: 'MOVE_TO', targetNodeId: 'Dans_Jardin' },
    { type: 'MOVE_TO', smartObjectId: 'sofa-garden-east', slotId: 'seat-1' },
    { type: 'INTERACT', smartObjectId: 'sofa-garden-east', slotId: 'seat-1' },
    { type: 'MOVE_TO', targetNodeId: 'Dans_Jardin' },
    { type: 'MOVE_TO', targetNodeId: 'Devant_Baie_Vitree' },
    { type: 'INTERACT', triggerEventKey: 'eastGlassDoor', triggerTargetState: false, duration: 0.3 }
  ],
  [
    { type: 'MOVE_TO', targetNodeId: 'Devant_Baie_Vitree' },
    { type: 'INTERACT', triggerEventKey: 'eastGlassDoor', triggerTargetState: true, animation: 'media/sandbox/anims/anim_open_door_outwards.glb', duration: 0.4 },
    { type: 'MOVE_TO', targetNodeId: 'Dans_Jardin' },
    { type: 'MOVE_TO', smartObjectId: 'sofa-garden-east', slotId: 'seat-2' },
    { type: 'INTERACT', smartObjectId: 'sofa-garden-east', slotId: 'seat-2' },
    { type: 'MOVE_TO', targetNodeId: 'Dans_Jardin' },
    { type: 'MOVE_TO', targetNodeId: 'Devant_Baie_Vitree' },
    { type: 'INTERACT', triggerEventKey: 'eastGlassDoor', triggerTargetState: false, duration: 0.3 }
  ]
];

export const ACTIONS_GARDEN_SOFA_WEST: AgentInstruction[][] = [
  [
    { type: 'MOVE_TO', targetNodeId: 'Devant_Baie_Vitree' },
    { type: 'INTERACT', triggerEventKey: 'eastGlassDoor', triggerTargetState: true, animation: 'media/sandbox/anims/anim_open_door_outwards.glb', duration: 0.4 },
    { type: 'MOVE_TO', targetNodeId: 'Dans_Jardin' },
    { type: 'MOVE_TO', smartObjectId: 'sofa-garden-west', slotId: 'seat-1' },
    { type: 'INTERACT', smartObjectId: 'sofa-garden-west', slotId: 'seat-1' },
    { type: 'MOVE_TO', targetNodeId: 'Dans_Jardin' },
    { type: 'MOVE_TO', targetNodeId: 'Devant_Baie_Vitree' },
    { type: 'INTERACT', triggerEventKey: 'eastGlassDoor', triggerTargetState: false, duration: 0.3 }
  ],
  [
    { type: 'MOVE_TO', targetNodeId: 'Devant_Baie_Vitree' },
    { type: 'INTERACT', triggerEventKey: 'eastGlassDoor', triggerTargetState: true, animation: 'media/sandbox/anims/anim_open_door_outwards.glb', duration: 0.4 },
    { type: 'MOVE_TO', targetNodeId: 'Dans_Jardin' },
    { type: 'MOVE_TO', smartObjectId: 'sofa-garden-west', slotId: 'seat-2' },
    { type: 'INTERACT', smartObjectId: 'sofa-garden-west', slotId: 'seat-2' },
    { type: 'MOVE_TO', targetNodeId: 'Dans_Jardin' },
    { type: 'MOVE_TO', targetNodeId: 'Devant_Baie_Vitree' },
    { type: 'INTERACT', triggerEventKey: 'eastGlassDoor', triggerTargetState: false, duration: 0.3 }
  ]
];

export const ACTION_COOKING: AgentInstruction[] = [
  { type: 'MOVE_TO', smartObjectId: 'cuisine-group', slotId: 'cook' },
  { type: 'INTERACT', smartObjectId: 'cuisine-group', slotId: 'cook' },
  { type: 'MOVE_TO', smartObjectId: 'freezer', slotId: 'open-pick' },
  { type: 'INTERACT', smartObjectId: 'freezer', slotId: 'open-pick' },
];

export const ACTION_KALLAX_NE: AgentInstruction[] = [
  { type: 'MOVE_TO', smartObjectId: 'kallax-ne', slotId: 'inspect' },
  { type: 'INTERACT', smartObjectId: 'kallax-ne', slotId: 'inspect' },
  { type: 'MOVE_TO', smartObjectId: 'corridor-closet', slotId: 'open-tidy' },
  { type: 'INTERACT', smartObjectId: 'corridor-closet', slotId: 'open-tidy' },
  { type: 'MOVE_TO', smartObjectId: 'mirror-south', slotId: 'admire' },
  { type: 'INTERACT', smartObjectId: 'mirror-south', slotId: 'admire' },
];

export const ACTION_FRESH_AIR: AgentInstruction[] = [
  { type: 'MOVE_TO', targetNodeId: 'Devant_Baie_Vitree' },
  { type: 'INTERACT', triggerEventKey: 'eastGlassDoor', triggerTargetState: true, animation: 'media/sandbox/anims/anim_open_door_outwards.glb', duration: 0.4 },
  { type: 'MOVE_TO', targetNodeId: 'Dans_Jardin' },
  { type: 'MOVE_TO', smartObjectId: 'garden-fresh-air', slotId: 'breathe' },
  { type: 'INTERACT', smartObjectId: 'garden-fresh-air', slotId: 'breathe' },
  { type: 'MOVE_TO', targetNodeId: 'Dans_Jardin' },
  { type: 'MOVE_TO', targetNodeId: 'Devant_Baie_Vitree' },
  { type: 'INTERACT', triggerEventKey: 'eastGlassDoor', triggerTargetState: false, duration: 0.3 },
];

export const ACTION_ENTREE_BAT_B: AgentInstruction[] = [
  { type: 'MOVE_TO', targetNodeId: 'Couloir_Central' },
  { type: 'INTERACT', triggerEventKey: 'livingDoor', triggerTargetState: true, duration: 0.3 },
  { type: 'MOVE_TO', smartObjectId: 'building-b-corridor', slotId: 'visit' },
  { type: 'INTERACT', smartObjectId: 'building-b-corridor', slotId: 'visit' },
  { type: 'MOVE_TO', targetNodeId: 'Couloir_Central' },
  { type: 'INTERACT', triggerEventKey: 'livingDoor', triggerTargetState: false, duration: 0.3 },
];

export const ACTION_ENTREE_COURS_BAT_B: AgentInstruction[] = [
  { type: 'MOVE_TO', targetNodeId: 'Devant_Baie_Vitree' },
  { type: 'INTERACT', triggerEventKey: 'eastGlassDoor', triggerTargetState: true, animation: 'media/sandbox/anims/anim_open_door_outwards.glb', duration: 0.4 },
  { type: 'MOVE_TO', targetNodeId: 'Dans_Jardin' },
  { type: 'MOVE_TO', smartObjectId: 'building-b-garden', slotId: 'admire' },
  { type: 'INTERACT', smartObjectId: 'building-b-garden', slotId: 'admire' },
  { type: 'MOVE_TO', targetNodeId: 'Dans_Jardin' },
  { type: 'MOVE_TO', targetNodeId: 'Devant_Baie_Vitree' },
  { type: 'INTERACT', triggerEventKey: 'eastGlassDoor', triggerTargetState: false, duration: 0.3 },
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

