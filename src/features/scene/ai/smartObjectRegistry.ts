import { SmartObjectDef, SmartObjectCategory, AgentInstruction } from './aiTypes';
import { OccupancyManager } from './occupancyManager';
import { positionState } from '../positionState';
import { DYNAMIC_FURNITURE_ANCHORS } from '../furniturePositions';

/**
 * SMART_OBJECTS — Registre des objets intelligents avec affordances (Sims-like).
 * Chaque meuble déclare ses slots d'interaction, ses animations, ses positions et ses orientations.
 */
export const SMART_OBJECTS: Record<string, SmartObjectDef> = {
  // ── LITS ───────────────────────────────────────────────────────────────────
  'bed-double': {
    id: 'bed-double',
    name: 'Lit Utåker Double',
    category: 'bed',
    anchorKey: 'bed-position',
    position: [150, 0, 190],
    rotationY: Math.PI / 2,
    slots: [
      {
        slotId: 'seat-left',
        name: 'S\'asseoir (Gauche)',
        relative: true,
        offset: [0, 0, -50],
        animations_random: 'seated_front',
        duration: 15.0,
      },
      {
        slotId: 'seat-right',
        name: 'S\'asseoir (Droite)',
        relative: true,
        offset: [0, 0, 50],
        animations_random: 'seated_front',
        duration: 15.0,
      },
      {
        slotId: 'lie-down-left',
        name: 'Dormir couché (Gauche)',
        relative: true,
        offset: [-35, 45, 0],
        animations_random: 'laying_pack',
        duration: 45.0,
      },
      {
        slotId: 'lie-down-right',
        name: 'Dormir couché (Droite)',
        relative: true,
        offset: [35, 45, 0],
        animations_random: 'laying_pack',
        duration: 45.0,
      }
    ]
  },
  'bed-west': {
    id: 'bed-west',
    name: 'Lit Utåker Ouest (Principal)',
    category: 'bed',
    position: [74, 0, 151.5],
    rotationY: Math.PI / 2,
    slots: [
      {
        slotId: 'seat-north',
        name: 'S\'asseoir (Nord)',
        offset: [90, 0, 80],
        animations_random: 'seated_front',
        duration: 15.0,
      },
      {
        slotId: 'seat-middle',
        name: 'S\'asseoir (Milieu)',
        offset: [90, 0, 150],
        animations_random: 'seated_front',
        duration: 15.0,
      },
      {
        slotId: 'seat-south',
        name: 'S\'asseoir (Sud)',
        offset: [90, 0, 220],
        animations_random: 'seated_front',
        duration: 15.0,
      },
      {
        slotId: 'lie-down',
        name: 'Dormir couché',
        offset: [74, 45, 150],
        animations_random: 'laying_front',
        rotY: -Math.PI,
        duration: 45.0,
      }
    ]
  },
  'bed-east': {
    id: 'bed-east',
    name: 'Lit Utåker Est (Secondaire)',
    category: 'bed',
    position: [270, 0, 190],
    rotationY: -Math.PI / 2,
    slots: [
      {
        slotId: 'seat-north',
        name: 'S\'asseoir (Nord)',
        offset: [245, 0, 120],
        animations_random: 'seated_front',
      },
      {
        slotId: 'seat-middle',
        name: 'S\'asseoir (Milieu)',
        offset: [245, 0, 190],
        animations_random: 'seated_front',
      },
      {
        slotId: 'seat-south',
        name: 'S\'asseoir (Sud)',
        offset: [245, 0, 260],
        animations_random: 'seated_front',
      },
      {
        slotId: 'lie-down',
        name: 'Dormir couché',
        offset: [270, 45, 190],
        animations_random: 'laying_front',
        rotY: -Math.PI,
        duration: 45.0,
      }
    ]
  },

  // ── BUREAUX & ASSISES TRAVAIL ──────────────────────────────────────────────
  'desk-bollsidan-1': {
    id: 'desk-bollsidan-1',
    name: 'Bureau Bollsidan 1',
    category: 'surface',
    anchorKey: 'desk1-position',
    position: [73.5, 0, 18],
    slots: [
      {
        slotId: 'work-sitting',
        name: 'Travailler assis',
        relative: true,
        offset: [0, 0, 30],
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
    anchorKey: 'smorkull-position',
    position: [85, 0, 272],
    slots: [
      {
        slotId: 'sit',
        name: 'S\'asseoir',
        relative: true,
        offset: [0, 0, 0],
        rotY: 0,
        animations_random: 'seated_front',
        duration: 40.0,
      }
    ]
  },
  'desk-bollsidan-2': {
    id: 'desk-bollsidan-2',
    name: 'Bureau Bollsidan 2',
    category: 'surface',
    anchorKey: 'desk2-position',
    position: [200, 0, 170],
    slots: [
      {
        slotId: 'work-standing',
        name: 'Travailler debout',
        relative: true,
        offset: [0, 0, -36],
        animation: 'texting',
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
        animation: 'sit_idle',
        duration: 10.0,
      },
      {
        slotId: 'flush',
        name: 'Tirer la chasse',
        offset: [50, 0, 550],
        rotY: Math.PI,
        animation: 'animations/interactions/anim_button_pushing.glb',
        duration: 2.0,
        triggerEventKey: 'wc-flush'
      }
    ]
  },
  'vasque-sdb': {
    id: 'vasque-sdb',
    name: 'Vasque Salle de bain',
    category: 'hygiene',
    position: [116, 0, 530],
    slots: [
      {
        slotId: 'wash-hands',
        name: 'Se laver les mains',
        offset: [116, 0, 530],
        rotY: Math.PI,
        animation: 'inspect_mid_height',
        duration: 5.0,
      },
      {
        slotId: 'brush-teeth',
        name: 'Se laver les dents',
        offset: [116, 0, 530],
        rotY: Math.PI,
        animation: 'take_object_mid',
        duration: 5.0,
      },
      {
        slotId: 'shave-makeup',
        name: 'Se Raser / Maquiller',
        offset: [116, 0, 530],
        rotY: Math.PI,
        animation: 'inspect_mid_height',
        duration: 5.0,
      }
    ]
  },

  'shower': {
    id: 'shower',
    name: 'Douche',
    category: 'hygiene',
    position: [25, 15, 645],
    slots: [
      {
        slotId: 'take-shower-1',
        name: 'Prendre une douche (Centre)',
        offset: [25, 15, 645],
        rotY: 0,
        animation: 'animations/poses_idles/miley_armature_posing_f.glb',
        duration: 25.0,
      },
      {
        slotId: 'take-shower-2',
        name: 'Prendre une douche (Gauche)',
        offset: [8, 15, 665],
        rotY: Math.PI / 2,
        animation: 'animations/poses_idles/miley_armature_posing_f.glb',
        duration: 25.0,
      },
      {
        slotId: 'take-shower-3',
        name: 'Prendre une douche (Droite)',
        offset: [42, 15, 665],
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
        animation: 'take_object_mid',
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
        rotY: Math.PI + Math.PI / 8,
        animation: 'take_object_mid',
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
        animation: 'inspect_mid_height',
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
        name: 'Cuisiner Four',
        rotY: -Math.PI / 2,
        animation: 'animations/locomotion/anim_entering_code.glb',
      },
      {
        slotId: 'cook',
        name: 'Cuisiner Plaques',
        offset: [80, 0, 370],
        rotY: 0,
        animation: 'animations/interactions/anim_bartending.glb',
        // interactions/anim_cards.glb, interactions/anim_drinking_fountain.glb,
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
        animation: 'animations/locomotion/anim_entering_code.glb',
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
        animation: 'animations/locomotion/anim_entering_code.glb',
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
        animations_random: 'all_dances',
        repeatCount: 4,
        repeatVariation: false,
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
        offset: [-350, 0, 1010],
        rotY: Math.PI / 2,
        animations_random: 'all_dances',
        duration: 5.0,
      },
      {
        slotId: 'visit',
        name: 'Consulter son téléphone',
        offset: [-350, 0, 1000],
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
        animations_random: 'all_dances',
        duration: 6.0,
      },
      {
        slotId: 'admire',
        name: 'Observer la cour',
        offset: [-300, 0, -200],
        rotY: Math.PI / 2,
        animations_random: 'all_dances',
        duration: 6.0,
      }
    ]
  },
  'rain-dance': {
    id: 'rain-dance',
    name: 'Jardin Nord (Pluie)',
    category: 'dance',
    position: [0, 0, -400],
    slots: [
      {
        slotId: 'dance-in-rain',
        name: 'Danser sous la pluie',
        offset: [0, 0, -400],
        rotY: 0,
        animations_random: 'all_dances',
        repeatCount: 4,
        repeatVariation: true,
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
        name: 'Rôle A (Meneur)',
        offset: [-150, 0, -300],
        rotY: 0,
        animation: 'animations/poses_idles/anim_female_standing_pose.glb',
        duration: 8.0,
      },
      {
        slotId: 'roleB',
        name: 'Rôle B (Partenaire)',
        offset: [-200, 0, -300],
        rotY: 0,
        animation: 'animations/poses_idles/anim_female_standing_pose_1.glb',
        duration: 8.0,
      }
    ]
  },

  // ── POINTS DE DANSE (SALON & SDB) ──────────────────────────────────────────
  'dance-bed-west-north': {
    id: 'dance-bed-west-north',
    name: 'Danse (Lit Ouest Nord)',
    category: 'dance',
    position: [140, 0, 80],
    slots: [
      {
        slotId: 'dance',
        name: 'Danse devant Lit Ouest (Nord)',
        offset: [140, 0, 80],
        rotY: Math.PI / 2,
        animations_random: 'all_dances',
        duration: 15.0,
      }
    ]
  },
  'dance-bed-west-mid': {
    id: 'dance-bed-west-mid',
    name: 'Danse (Lit Ouest Milieu)',
    category: 'dance',
    position: [140, 0, 150],
    slots: [
      {
        slotId: 'dance',
        name: 'Danse devant Lit Ouest (Milieu)',
        offset: [140, 0, 150],
        rotY: Math.PI / 2,
        animations_random: 'all_dances',
        duration: 15.0,
      }
    ]
  },
  'dance-bed-west-south': {
    id: 'dance-bed-west-south',
    name: 'Danse (Lit Ouest Sud)',
    category: 'dance',
    position: [140, 0, 220],
    slots: [
      {
        slotId: 'dance',
        name: 'Danse devant Lit Ouest (Sud)',
        offset: [140, 0, 220],
        rotY: Math.PI / 2,
        animations_random: 'all_dances',
        duration: 15.0,
      }
    ]
  },
  'dance-bed-east-north': {
    id: 'dance-bed-east-north',
    name: 'Danse (Lit Est Nord)',
    category: 'dance',
    position: [195, 0, 120],
    slots: [
      {
        slotId: 'dance',
        name: 'Danse devant Lit Est (Nord)',
        offset: [195, 0, 120],
        rotY: -Math.PI / 2,
        animations_random: 'all_dances',
        duration: 15.0,
      }
    ]
  },
  'dance-bed-east-mid': {
    id: 'dance-bed-east-mid',
    name: 'Danse (Lit Est Milieu)',
    category: 'dance',
    position: [195, 0, 190],
    slots: [
      {
        slotId: 'dance',
        name: 'Danse devant Lit Est (Milieu)',
        offset: [195, 0, 190],
        rotY: -Math.PI / 2,
        animations_random: 'all_dances',
        duration: 15.0,
      }
    ]
  },
  'dance-bed-east-south': {
    id: 'dance-bed-east-south',
    name: 'Danse (Lit Est Sud)',
    category: 'dance',
    position: [195, 0, 260],
    slots: [
      {
        slotId: 'dance',
        name: 'Danse devant Lit Est (Sud)',
        offset: [195, 0, 260],
        rotY: -Math.PI / 2,
        animations_random: 'all_dances',
        repeatCount: 4,
        repeatVariation: false,
      }
    ]
  },
  'dance-chair-office': {
    id: 'dance-chair-office',
    name: 'Danse (Devant Chaise Bureau)',
    category: 'dance',
    position: [135, 0, 280],
    slots: [
      {
        slotId: 'dance',
        name: 'Danse devant Chaise Bureau',
        offset: [135, 0, 280],
        rotY: Math.PI / 2,
        animations_random: 'all_dances',
        repeatCount: 4,
        repeatVariation: true,
      }
    ]
  },
  'dance-mirror-south': {
    id: 'dance-mirror-south',
    name: 'Danse (Devant Miroir Sud)',
    category: 'dance',
    position: [160, 0, 310],
    slots: [
      {
        slotId: 'dance',
        name: 'Danse devant Miroir Sud',
        offset: [160, 0, 310],
        rotY: 0,
        animations_random: 'all_dances',
        duration: 15.0,
      }
    ]
  },
  'dance-glass-door-right': {
    id: 'dance-glass-door-right',
    name: 'Danse (Devant Porte-fenêtre Droite)',
    category: 'dance',
    position: [215, 0, 50],
    slots: [
      {
        slotId: 'dance',
        name: 'Danse devant Porte-fenêtre Droite',
        offset: [215, 0, 50],
        rotY: Math.PI,
        animations_random: 'all_dances',
        duration: 15.0,
      }
    ]
  },
  'dance-bathroom': {
    id: 'dance-bathroom',
    name: 'Danse (Salle de Bain)',
    category: 'dance',
    position: [100, 0, 530],
    slots: [
      {
        slotId: 'dance',
        name: 'Danse dans la Salle de Bain',
        offset: [100, 0, 530],
        rotY: Math.PI,
        animations_random: 'all_dances',
        duration: 15.0,
      }
    ]
  }
};

/**
 * Utilitaires d'accès et de requêtage pour les Smart Objects
 */
export function getAllSmartObjects(): SmartObjectDef[] {
  return Object.keys(SMART_OBJECTS).map(id => getSmartObject(id) || SMART_OBJECTS[id]);
}

export function getSmartObjectsByCategory(category: SmartObjectCategory): SmartObjectDef[] {
  return getAllSmartObjects().filter(obj => obj.category === category);
}

const MILEY_DANCE_ANIMS = [
  'animations/combat/miley_armature_10_dance_like_sidestep.glb',
  'animations/dances/miley_armature_aerobic_dance.glb',
  'animations/sports_fitness/miley_armature_air_dance.glb',
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
  const obj = getSmartObject(objectId) || SMART_OBJECTS[objectId];
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
    repeatCount: slot.repeatCount,
    repeatVariation: slot.repeatVariation,
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
      { type: 'USE_OBJECT', smartObjectId: 'toilet', slotId: 'flush' },
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

/**
 * Résout un SmartObject en coordonnées monde dynamiques.
 * Si l'objet est lié à un meuble multiposition (anchorKey), sa position,
 * la position de ses slots relatifs et leur orientation sont transformées
 * selon l'état actuel de positionState.
 */
export function getSmartObject(objectId: string): SmartObjectDef | undefined {
  const base = SMART_OBJECTS[objectId];
  if (!base) return undefined;

  if (!base.anchorKey) {
    const defaultRot = base.rotationY ?? 0;
    const hasSlotsWithoutRotY = base.slots.some(s => s.rotY === undefined);
    if (!hasSlotsWithoutRotY) {
      return base;
    }
    return {
      ...base,
      slots: base.slots.map(s => ({
        ...s,
        rotY: s.rotY ?? defaultRot,
      }))
    };
  }

  const anchorList = DYNAMIC_FURNITURE_ANCHORS[base.anchorKey];
  if (!anchorList || anchorList.length === 0) {
    return base;
  }

  const state = positionState[base.anchorKey];
  const idx = state ? (state.idx % anchorList.length) : 0;
  const anchor = anchorList[idx] || anchorList[0];

  const anchorX = anchor.x;
  const anchorZ = anchor.z;
  const anchorRy = anchor.ry;

  const cos = Math.cos(anchorRy);
  const sin = Math.sin(anchorRy);

  // Transformation locale -> monde avec rotation Ry
  const resolvedSlots = base.slots.map(slot => {
    if (!slot.relative) {
      return slot;
    }

    const localOffset = slot.offset || [0, 0, 0];
    const localApproach = slot.approachOffset;

    const ox = localOffset[0];
    const oy = localOffset[1];
    const oz = localOffset[2];

    const worldOffset: [number, number, number] = [
      anchorX + ox * cos + oz * sin,
      oy,
      anchorZ - ox * sin + oz * cos,
    ];

    let worldApproach: [number, number, number] | undefined = undefined;
    if (localApproach) {
      const ax = localApproach[0];
      const ay = localApproach[1];
      const az = localApproach[2];
      worldApproach = [
        anchorX + ax * cos + az * sin,
        ay,
        anchorZ - ax * sin + az * cos,
      ];
    }

    // Orientation finale : slot.rotY relatif à l'objet, ou rotation propre de l'objet si rotY absent
    const slotRot = slot.rotY !== undefined ? slot.rotY : 0;
    const worldRotY = (anchorRy + slotRot) % (Math.PI * 2);

    return {
      ...slot,
      offset: worldOffset,
      approachOffset: worldApproach,
      rotY: worldRotY,
    };
  });

  return {
    ...base,
    position: [anchorX, base.position[1], anchorZ],
    rotationY: anchorRy,
    slots: resolvedSlots,
  };
}
