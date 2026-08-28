import { SmartObjectDef, SmartObjectCategory, AgentInstruction } from './aiTypes';
import { OccupancyManager } from './occupancyManager';

/**
 * SMART_OBJECTS — Registre des objets intelligents avec affordances (Sims-like).
 * Chaque meuble déclare ses slots d'interaction, ses animations, ses positions et ses orientations.
 */
export const SMART_OBJECTS: Record<string, SmartObjectDef> = {
  // ── LITS ───────────────────────────────────────────────────────────────────
  'bed-west': {
    id: 'bed-west',
    name: 'Lit Utåker Ouest (Principal)',
    category: 'bed',
    position: [74, 0, 151.5],
    slots: [
      {
        slotId: 'seat-north',
        name: 'S\'asseoir (Nord)',
        offset: [90, 0, 80],
        rotY: Math.PI / 2,
        // animations_random: 'seated_front',
        animation: 'animations/poses_idles/anim_sitting_thumbs_up.glb',
        duration: 15.0,
      },
      {
        slotId: 'seat-middle',
        name: 'S\'asseoir (Milieu)',
        offset: [90, 0, 150],
        rotY: Math.PI / 2,
        animations_random: 'seated_front',
        duration: 15.0,
      },
      {
        slotId: 'seat-south',
        name: 'S\'asseoir (Sud)',
        offset: [90, 0, 220],
        rotY: Math.PI / 2,
        animations_random: 'seated_front',
        duration: 15.0,
      },
      {
        slotId: 'lie-down',
        name: 'Dormir couché',
        offset: [74, 45, 150],
        rotY: Math.PI / 2,
        animation: 'animations/poses_idles/anim_sleeping_idle.glb',
        duration: 45.0,
      }
    ]
  },
  'bed-east': {
    id: 'bed-east',
    name: 'Lit Utåker Est (Secondaire)',
    category: 'bed',
    position: [270, 0, 190],
    slots: [
      {
        slotId: 'seat-north',
        name: 'S\'asseoir (Nord)',
        offset: [245, 0, 120],
        rotY: Math.PI,
        animations_random: 'seated_front',
        animation: 'animations/poses_idles/anim_female_sitting_pose_1.glb',
        duration: 15.0,
      },
      {
        slotId: 'seat-middle',
        name: 'S\'asseoir (Milieu)',
        offset: [245, 0, 190],
        rotY: Math.PI,
        animations_random: 'seated_front',
        animation: 'animations/poses_idles/anim_female_sitting_pose_1.glb',
        duration: 15.0,
      },
      {
        slotId: 'seat-south',
        name: 'S\'asseoir (Sud)',
        offset: [245, 0, 260],
        rotY: Math.PI,
        animations_random: 'seated_front',
        animation: 'animations/poses_idles/anim_female_sitting_pose_3.glb',
        duration: 15.0,
      },
      {
        slotId: 'lie-down',
        name: 'Dormir couché',
        offset: [270, 45, 190],
        rotY: Math.PI / 2,
        animation: 'animations/poses_idles/anim_sleeping_idle.glb',
        duration: 45.0,
      }
    ]
  },

  // ── BUREAUX & ASSISES TRAVAIL ──────────────────────────────────────────────
  'desk-bollsidan-1': {
    id: 'desk-bollsidan-1',
    name: 'Bureau Bollsidan 1',
    category: 'surface',
    position: [75, 0, 60],
    slots: [
      {
        slotId: 'work-sitting',
        name: 'Travailler assis',
        offset: [75, 0, 60],
        rotY: Math.PI,
        animations_random: 'seated_front',
        duration: 10.0,
      }
    ]
  },
  'chair-office': {
    id: 'chair-office',
    name: 'Chaise de Bureau',
    category: 'seating',
    position: [85, 0, 272],
    slots: [
      {
        slotId: 'sit',
        name: 'S\'asseoir',
        offset: [85, 0, 272],
        rotY: Math.PI / 2,
        animations_random: 'seated_front',
        duration: 40.0,
      }
    ]
  },
  'desk-bollsidan-2': {
    id: 'desk-bollsidan-2',
    name: 'Bureau Bollsidan 2',
    category: 'surface',
    position: [200, 0, 215],
    slots: [
      {
        slotId: 'work-standing',
        name: 'Travailler debout',
        offset: [200, 0, 215],
        rotY: Math.PI,
        animation: 'animations/poses_idles/anim_texting_while_standing.glb',
        duration: 10.0,
      }
    ]
  },

  // ── HYGIÈNE & SDB ─────────────────────────────────────────────────────────
  'toilet': {
    id: 'toilet',
    name: 'Toilettes WC',
    category: 'hygiene',
    position: [50, 0, 500],
    slots: [
      {
        slotId: 'use',
        name: 'Faire ses besoins',
        offset: [50, 0, 500],
        rotY: 0,
        animation: 'animations/poses_idles/anim_sitting_idle.glb',
        duration: 10.0,
      },
      {
        slotId: 'flush',
        name: 'Tirer la chasse',
        offset: [50, 0, 530],
        rotY: Math.PI,
        animation: 'animations/emotes_gestures/anim_shaking_hands_2.glb',
        duration: 2.0,
        triggerEventKey: 'wc-flush'
      }
    ]
  },
  'vasque-sdb': {
    id: 'vasque-sdb',
    name: 'Vasque Salle de bain',
    category: 'hygiene',
    position: [116, 0, 545],
    slots: [
      {
        slotId: 'wash-hands',
        name: 'Se laver les mains',
        offset: [116, 0, 545],
        rotY: Math.PI,
        animation: 'animations/poses_idles/anim_texting_while_standing.glb',
        duration: 5.0,
      },
      {
        slotId: 'brush-teeth',
        name: 'Se laver les dents',
        offset: [116, 0, 545],
        rotY: Math.PI,
        animation: 'animations/poses_idles/anim_texting_while_standing.glb',
        duration: 5.0,
      },
      {
        slotId: 'shave-makeup',
        name: 'Se Raser / Maquiller',
        offset: [116, 0, 545],
        rotY: Math.PI,
        animation: 'animations/poses_idles/anim_texting_while_standing.glb',
        duration: 5.0,
      }
    ]
  },

  'shower': {
    id: 'shower',
    name: 'Douche',
    category: 'hygiene',
    position: [25, 0, 645],
    slots: [
      {
        slotId: 'take-shower-1',
        name: 'Prendre une douche (Centre)',
        offset: [25, 0, 645],
        rotY: 0,
        animation: 'animations/poses_idles/miley_armature_posing_f.glb',
        duration: 25.0,
      },
      {
        slotId: 'take-shower-2',
        name: 'Prendre une douche (Gauche)',
        offset: [8, 0, 645],
        rotY: Math.PI / 2,
        animation: 'animations/poses_idles/miley_armature_posing_f.glb',
        duration: 25.0,
      },
      {
        slotId: 'take-shower-3',
        name: 'Prendre une douche (Droite)',
        offset: [42, 0, 645],
        rotY: -Math.PI / 2,
        animation: 'animations/poses_idles/miley_armature_posing_f.glb',
        duration: 25.0,
      }
    ]
  },
  'sdb-closet': {
    id: 'sdb-closet',
    name: 'Placard Salle de bain',
    category: 'storage',
    position: [130, 0, 600],
    slots: [
      {
        slotId: 'pick-laundry',
        name: 'Prendre le sac de Linge sale',
        offset: [130, 0, 565],
        rotY: 0,
        animation: 'animations/poses_idles/anim_texting_while_standing.glb',
        duration: 3.5,
      }
    ]
  },

  'drona-west': {
    id: 'drona-west',
    name: 'Meuble bas / Dröna Ouest',
    category: 'storage',
    position: [30, 0, 487],
    slots: [
      {
        slotId: 'pick-item',
        name: 'Prendre un objet',
        offset: [30, 0, 535],
        rotY: Math.PI,
        animation: 'animations/poses_idles/anim_texting_while_standing.glb',
        duration: 3.5,
      }
    ]
  },
  'drona-east': {
    id: 'drona-east',
    name: 'Meuble bas / Dröna Est',
    category: 'storage',
    position: [169, 0, 487],
    slots: [
      {
        slotId: 'pick-item',
        name: 'Prendre un objet',
        offset: [169, 0, 535],
        rotY: Math.PI,
        animation: 'animations/poses_idles/anim_texting_while_standing.glb',
        duration: 3.5,
      }
    ]
  },


  'bathtub-garden': {
    id: 'bathtub-garden',
    name: 'Baignoire Jardin',
    category: 'hygiene',
    position: [120, 0, -300],
    slots: [
      {
        slotId: 'center',
        name: 'Se relaxer au centre',
        offset: [120, 0, -300],
        rotY: Math.PI / 4,
        animations_random: 'seated_front',
        duration: 30.0,
      },
      {
        slotId: 'west',
        name: 'Bain Côté Ouest',
        offset: [80, 0, -330],
        rotY: Math.PI / 4,
        animations_random: 'seated_front',
        duration: 30.0,
      },
      {
        slotId: 'east',
        name: 'Bain Côté Est',
        offset: [160, 0, -270],
        rotY: Math.PI + Math.PI / 4,
        animations_random: 'seated_front',
        duration: 30.0,
      }
    ]
  },

  // ── CANAPÉS JARDIN ────────────────────────────────────────────────────────
  'sofa-garden-east': {
    id: 'sofa-garden-east',
    name: 'Canapé Jardin Est',
    category: 'seating',
    position: [270, 0, -110],
    slots: [
      {
        slotId: 'seat-1',
        name: 'Place assise 1',
        offset: [270, 0, -80],
        rotY: Math.PI,
        animations_random: 'seated_side',
        duration: 15.0,
      },
      {
        slotId: 'seat-2',
        name: 'Place assise 2',
        offset: [270, 0, -140],
        rotY: Math.PI,
        animations_random: 'seated_side',
        duration: 15.0,
      }
    ]
  },
  'sofa-garden-west': {
    id: 'sofa-garden-west',
    name: 'Canapé Jardin Ouest',
    category: 'seating',
    position: [100, 0, -80],
    slots: [
      {
        slotId: 'seat-1',
        name: 'Place assise 1',
        offset: [100, 0, -60],
        rotY: Math.PI / 2,
        animations_random: 'seated_front',
        duration: 15.0,
      },
      {
        slotId: 'seat-2',
        name: 'Place assise 2',
        offset: [100, 0, -100],
        rotY: Math.PI / 2,
        animations_random: 'seated_front',
        duration: 15.0,
      }
    ]
  },

  // ── CUISINE & APPAREILS ───────────────────────────────────────────────────
  'cuisine-group': {
    id: 'cuisine-group',
    name: 'Meuble Cuisine',
    category: 'surface',
    position: [80, 0, 370],
    slots: [
      {
        slotId: 'cook',
        name: 'Cuisiner',
        offset: [80, 0, 370],
        rotY: -Math.PI / 2,
        animation: 'animations/emotes_gestures/anim_shaking_hands_2.glb',
        duration: 10.0,
      }
    ]
  },
  'freezer': {
    id: 'freezer',
    name: 'Congélateur CHIQ',
    category: 'appliance',
    position: [250, 0, 320],
    slots: [
      {
        slotId: 'open-pick',
        name: 'Prendre un ingrédient',
        offset: [250, 0, 320],
        rotY: Math.PI / 2,
        animation: 'animations/emotes_gestures/anim_hand_raising.glb',
        duration: 2.5,
      }
    ]
  },

  // ── RANGEMENTS, KALLAX & COULOIR ──────────────────────────────────────────
  'kallax-ne': {

    id: 'kallax-ne',
    name: 'Kallax Nord-Est',
    category: 'storage',
    position: [240, 0, 38],
    slots: [
      {
        slotId: 'inspect',
        name: 'Prendre un objet en hauteur',
        offset: [240, 0, 38],
        rotY: Math.PI / 2,
        animation: 'animations/poses_idles/anim_texting_while_standing.glb',
        duration: 5.0,
      }
    ]
  },
  'corridor-closet': {
    id: 'corridor-closet',
    name: 'Placard Couloir',
    category: 'storage',
    position: [220, 0, 435],
    slots: [
      {
        slotId: 'open-tidy',
        name: 'Ranger des affaires',
        offset: [220, 0, 435],
        rotY: -Math.PI / 2,
        animation: 'animations/emotes_gestures/anim_shaking_hands_2.glb',
        duration: 2.5,
      }
    ]
  },
  'mirror-south': {
    id: 'mirror-south',
    name: 'Miroir Sud',
    category: 'decor',
    position: [160, 0, 350],
    slots: [
      {
        slotId: 'admire',
        name: 'S\'admirer dans le miroir',
        offset: [160, 0, 340],
        rotY: 0,
        animation: 'animations/poses_idles/miley_armature_change_pose.glb',
        duration: 45.0,
      }
    ]
  },



  // ── EXTÉRIEUR & ESPACES JARDIN ─────────────────────────────────────────────
  'garden-fresh-air': {
    id: 'garden-fresh-air',
    name: 'Fond du Jardin',
    category: 'outdoor',
    position: [150, 0, -650],
    slots: [
      {
        slotId: 'breathe',
        name: 'Prendre l\'air au fond',
        offset: [150, 0, -600],
        rotY: 0,
        animation: 'animations/poses_idles/anim_female_standing_pose.glb',
        duration: 6.0,
      }
    ]
  },
  'building-b-corridor': {
    id: 'building-b-corridor',
    name: 'Entrée Bâtiment B (Couloir)',
    category: 'outdoor',
    position: [-350, 0, 1002],
    slots: [
      {
        slotId: 'trash',
        name: 'Jeter les poubelles',
        offset: [-350, 0, 1002],
        rotY: Math.PI / 2,
        animation: 'animations/emotes_gestures/anim_hand_raising.glb',
        duration: 5.0,
      },
      {
        slotId: 'visit',
        name: 'Consulter son téléphone',
        offset: [-350, 0, 1002],
        rotY: Math.PI / 2,
        animation: 'animations/poses_idles/anim_texting_while_standing.glb',
        duration: 6.0,
      }
    ]
  },
  'building-b-garden': {
    id: 'building-b-garden',
    name: 'Entrée Cours Bâtiment B (Jardin)',
    category: 'outdoor',
    position: [-350, 0, -200],
    slots: [
      {
        slotId: 'laundromat',
        name: 'Aller au lavomatique',
        offset: [-350, 0, -200],
        rotY: Math.PI / 2,
        animation: 'animations/poses_idles/anim_texting_while_standing.glb',
        duration: 6.0,
      },
      {
        slotId: 'admire',
        name: 'Observer la cour',
        offset: [-350, 0, -200],
        rotY: Math.PI / 2,
        animation: 'animations/poses_idles/anim_female_standing_pose_1.glb',
        duration: 6.0,
      }
    ]
  },
  'rain-dance': {
    id: 'rain-dance',
    name: 'Jardin Nord (Pluie)',
    category: 'outdoor',
    position: [0, 0, -400],
    slots: [
      {
        slotId: 'dance-in-rain',
        name: 'Danser sous la pluie',
        offset: [0, 0, -400],
        rotY: 0,
        animation: 'animations/dances/miley_armature_sensual_dance_01.glb',
        duration: 12.0,
      }
    ]
  },
  'duo-zone': {
    id: 'duo-zone',
    name: '✨ Scène Duo',
    category: 'outdoor',
    position: [-200, 0, -300],
    slots: [
      {
        slotId: 'roleA',
        name: 'Rôle A (Sandra / Meneur)',
        offset: [-150, 0, -300],
        rotY: 0,
        animation: 'animations/poses_idles/anim_female_standing_pose.glb',
        duration: 8.0,
      },
      {
        slotId: 'roleB',
        name: 'Rôle B (Rajaa / Partenaire)',
        offset: [-200, 0, -300],
        rotY: 0,
        animation: 'animations/poses_idles/anim_female_standing_pose_1.glb',
        duration: 8.0,
      }
    ]
  }
};

/**
 * Utilitaires d'accès et de requêtage pour les Smart Objects
 */
export function getSmartObject(id: string): SmartObjectDef | undefined {
  return SMART_OBJECTS[id];
}

export function getAllSmartObjects(): SmartObjectDef[] {
  return Object.values(SMART_OBJECTS);
}

export function getSmartObjectsByCategory(category: SmartObjectCategory): SmartObjectDef[] {
  return Object.values(SMART_OBJECTS).filter(obj => obj.category === category);
}

const MILEY_DANCE_ANIMS = [
  'animations/dances/miley_armature_10_dance_like_sidestep.glb',
  'animations/dances/miley_armature_aerobic_dance.glb',
  'animations/dances/miley_armature_air_dance.glb',
  'animations/dances/miley_armature_couple_pop_dance_f.glb',
  'animations/dances/miley_armature_couple_pop_dance_m.glb',
  'animations/dances/miley_armature_dance_graceful.glb',
  'animations/dances/miley_armature_dancetomusic_f.glb',
  'animations/dances/miley_armature_energetic_dance_f.glb',
  'animations/dances/miley_armature_energetic_dance_m.glb',
  'animations/dances/miley_armature_sensual_dance_01.glb',
  'animations/dances/miley_armature_sensual_dance_02.glb',
  'animations/dances/miley_armature_sensual_dance_03.glb',
  'animations/dances/miley_armature_slow_dance_f.glb',
  'animations/dances/miley_armature_slow_dance_m.glb'
];

/**
 * Convertit une interaction de Smart Object en instruction d'agent prête pour le contrôleur.
 */
export function buildSmartObjectInstructionSequence(
  objectId: string,
  slotId?: string,
  characterId?: string
): AgentInstruction[] {
  const obj = SMART_OBJECTS[objectId];
  if (!obj || !obj.slots.length) return [];

  // Trouver un slot disponible si un characterId est fourni, ou utiliser le slot demandé
  let chosenSlotId = slotId;
  if (!chosenSlotId && characterId) {
    chosenSlotId = OccupancyManager.getAvailableSlot(objectId, characterId) ?? undefined;
  }

  const slot = chosenSlotId
    ? obj.slots.find(s => s.slotId === chosenSlotId) ?? obj.slots[0]
    : obj.slots[Math.floor(Math.random() * obj.slots.length)];

  const chosenAnim = objectId === 'rain-dance'
    ? MILEY_DANCE_ANIMS[Math.floor(Math.random() * MILEY_DANCE_ANIMS.length)]
    : slot.animation;

  const baseInstruction: AgentInstruction = {
    type: 'USE_OBJECT',
    smartObjectId: obj.id,
    slotId: slot.slotId,
    animation: chosenAnim,
    duration: slot.duration,
    rotY: slot.rotY,
    triggerEventKey: slot.triggerEventKey,
    triggerTargetState: slot.triggerTargetState
  };

  // Traitement spécifique des meubles avec portes et routines composées
  if (objectId === 'shower') {
    return [
      { type: 'MOVE_TO', targetNodeId: 'bathroom-shower-entry', rotY: 0 },
      { type: 'INTERACT', smartObjectId: 'shower', slotId: slot.slotId, triggerEventKey: 'shower-door-toggle', triggerTargetState: true, animation: 'animations/interactions/anim_open_door_outwards.glb', duration: 0.8, rotY: 0 },
      { type: 'MOVE_TO', smartObjectId: 'shower', slotId: slot.slotId },
      { type: 'INTERACT', smartObjectId: 'shower', slotId: slot.slotId, triggerEventKey: 'shower-door-toggle', triggerTargetState: false, duration: 0.5 },
      baseInstruction,
      { type: 'INTERACT', smartObjectId: 'shower', slotId: slot.slotId, triggerEventKey: 'shower-door-toggle', triggerTargetState: true, duration: 0.8 },
      { type: 'MOVE_TO', targetNodeId: 'bathroom-shower-entry', rotY: Math.PI },
      { type: 'INTERACT', smartObjectId: 'shower', slotId: slot.slotId, triggerEventKey: 'shower-door-toggle', triggerTargetState: false, duration: 0.5, rotY: Math.PI }
    ];
  }


  if (objectId === 'toilet') {
    return [
      { type: 'USE_OBJECT', smartObjectId: 'toilet', slotId: 'use' },
      { type: 'INTERACT', smartObjectId: 'toilet', slotId: 'flush' },
      { type: 'USE_OBJECT', smartObjectId: 'vasque-sdb', slotId: 'wash-hands' }
    ];
  }

  if (objectId === 'kallax-ne') {
    return [
      { type: 'MOVE_TO', smartObjectId: obj.id, slotId: slot.slotId },
      { type: 'INTERACT', smartObjectId: obj.id, slotId: slot.slotId, triggerEventKey: 'eastGlassDoor', triggerTargetState: false, duration: 0.5, rotY: Math.PI },
      baseInstruction
    ];
  }

  if (objectId === 'sdb-closet') {
    return [
      { type: 'MOVE_TO', smartObjectId: obj.id, slotId: slot.slotId },
      { type: 'INTERACT', triggerEventKey: 'sdb-closet-r-toggle', triggerTargetState: true, duration: 0.5 },
      baseInstruction,
      { type: 'INTERACT', triggerEventKey: 'sdb-closet-r-toggle', triggerTargetState: false, duration: 0.4 }
    ];
  }

  if (objectId === 'corridor-closet') {
    return [
      { type: 'MOVE_TO', smartObjectId: obj.id, slotId: slot.slotId },
      { type: 'INTERACT', triggerEventKey: 'corr-doors-toggle', triggerTargetState: true, duration: 0.5 },
      baseInstruction,
      { type: 'INTERACT', triggerEventKey: 'corr-doors-toggle', triggerTargetState: false, duration: 0.4 }
    ];
  }

  return [baseInstruction];
}
