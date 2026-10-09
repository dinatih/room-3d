import { SmartObjectDef, SmartObjectCategory, AgentInstruction, ResolvedSmartObject } from './aiTypes';
import { OccupancyManager } from './occupancyManager';
import { getObjectTransform } from '../objectTransforms';
import { DUO_ANIMATIONS, getAllDuoAnimationIds } from '../animations/duoAnimations';
import { DOOR_CONFIGS, HUMAN_BODY_RADIUS } from '../doorObstacles';
import { BATH_WEST_WALL, ROOM_D } from '../wallData';
import { TOILET_HINGE_DURATION } from '../items/toiletAnimation';
import { NINJA_DOOR_DURATION } from '../items/NinjaSP101';

export const CLOSET_DOOR_DURATION = 0.8;

/**
 * SMART_OBJECTS — Registre des objets intelligents avec affordances (Sims-like).
 * Chaque meuble déclare ses slots d'interaction, ses animations, ses positions et ses orientations.
 */
export const SMART_OBJECTS: Record<string, SmartObjectDef> = {
  // ── LITS ───────────────────────────────────────────────────────────────────
  // 'bed-double': {
  //   id: 'bed-double',
  //   name: 'Lit Utåker Double',
  //   category: 'bed',
  //   itemId: 'bed-double',
  //   slots: [
  //     {
  //       slotId: 'seat-left',
  //       name: 'S\'asseoir (Gauche)',
  //       relative: true,
  //       offset: [0, 0, -50],
  //       animationsRandom: 'seated-front',
  //     },
  //     {
  //       slotId: 'seat-right',
  //       name: 'S\'asseoir (Droite)',
  //       relative: true,
  //       offset: [0, 0, 50],
  //       animationsRandom: 'seated-front',
  //     },
  //     {
  //       slotId: 'lie-down-left',
  //       name: 'Dormir couché (Gauche)',
  //       relative: true,
  //       offset: [-35, 45, 0],
  //       animationsRandom: 'laying',
  //     },
  //     {
  //       slotId: 'lie-down-right',
  //       name: 'Dormir couché (Droite)',
  //       relative: true,
  //       offset: [35, 45, 0],
  //       animationsRandom: 'laying',
  //     }
  //   ]
  // },
  'bed-west': {
    id: 'bed-west',
    name: 'Lit Utåker Ouest (Principal)',
    category: 'bed',
    itemId: 'bed-west',
    position: [74, 0, 151.5],
    rotationY: Math.PI / 2,
    slots: [
      {
        slotId: 'seat-north',
        name: 'S\'asseoir (Nord)',
        offset: [71.5, 0, 16],
        animationsRandom: 'seated-front',
      },
      {
        slotId: 'seat-middle',
        name: 'S\'asseoir (Milieu)',
        offset: [1.5, 0, 16],
        animationsRandom: 'seated-front',
      },
      {
        slotId: 'seat-south',
        name: 'S\'asseoir (Sud)',
        offset: [-68.5, 0, 16],
        animationsRandom: 'seated-front',
      },
      {
        slotId: 'lie-down',
        name: 'Dormir couché',
        offset: [1.5, 45, 0],
        animationsRandom: 'laying-front',
        rotY: Math.PI / 2,
      }
    ]
  },
  'bed-east': {
    id: 'bed-east',
    name: 'Lit Utåker Est (Secondaire)',
    category: 'bed',
    itemId: 'bed-east',
    position: [270, 0, 190],
    rotationY: Math.PI / 2,
    slots: [
      {
        slotId: 'seat-north',
        name: 'S\'asseoir (Nord)',
        offset: [70, 0, -15],
        rotY: Math.PI,
        animationsRandom: 'seated-front',
      },
      {
        slotId: 'seat-middle',
        name: 'S\'asseoir (Milieu)',
        offset: [0, 0, -15],
        rotY: Math.PI,
        animationsRandom: 'seated-front',
      },
      // {
      //   slotId: 'seat-south',
      //   name: 'S\'asseoir (Sud)',
      //   offset: [-70, 0, -15],
      //   rotY: Math.PI,
      //   animationsRandom: 'seated-front',
      // },
      {
        slotId: 'lie-down',
        name: 'Dormir couché',
        offset: [0, 45, 0],
        animationsRandom: 'laying-front',
        rotY: Math.PI / 2,
      }
    ]
  },

  // ── BUREAUX & ASSISES TRAVAIL ──────────────────────────────────────────────
  'desk-bollsidan-1': {
    id: 'desk-bollsidan-1',
    name: 'Bureau Bollsidan 1',
    category: 'surface',
    itemId: 'desk-bollsidan-1',
    slots: [
      {
        slotId: 'work-sitting',
        name: 'Travailler assis',
        relative: true,
        offset: [0, 0, 30],
        rotY: Math.PI,
        animationsRandom: ['having-a-meeting-female', 'having-a-meeting-male'],
      }
    ]
  },
  'chair-office': {
    id: 'chair-office',
    name: 'Chaise de Bureau',
    category: 'seating',
    itemId: 'chair-office',
    slots: [
      {
        slotId: 'sit',
        name: 'S\'asseoir',
        relative: true,
        offset: [0, 0, 0],
        rotY: 0,
        animationsRandom: 'seated-front',
      }
    ]
  },
  'desk-bollsidan-2': {
    id: 'desk-bollsidan-2',
    name: 'Bureau Bollsidan 2',
    category: 'surface',
    itemId: 'desk-bollsidan-2',
    slots: [
      {
        slotId: 'work-standing',
        name: 'Travailler debout',
        relative: true,
        offset: [0, 0, -36],
        animationsRandom: 'standing-using-touchscreen-tablet',
        duration: 33.2,
        triggerEventKey: 'desk2-smart-action',
      }
    ]
  },

  // ── HYGIÈNE & SDB ─────────────────────────────────────────────────────────
  'toilet': {
    id: 'toilet',
    name: 'Toilettes WC',
    category: 'hygiene',
    exclusive: true,
    position: [50, 0, 500],
    slots: [
      {
        slotId: 'use',
        name: 'Faire ses besoins',
        rotY: 0,
        animation: 'sit-idle',
        duration: 10.0,
      },
      {
        slotId: 'flush',
        name: 'Tirer la chasse',
        offset: [50, 0, 550],
        rotY: Math.PI,
        animation: 'button-pushing',
        duration: 2.0,
        triggerEventKey: 'wc-flush'
      }
    ]
  },
  'vasque-sdb': {
    id: 'vasque-sdb',
    name: 'Vasque Salle de bain',
    category: 'hygiene',
    exclusive: true,
    position: [116, 0, 530],
    slots: [
      {
        slotId: 'wash-hands',
        name: 'Se laver les mains',
        rotY: Math.PI,
        animation: 'inspect-mid-height',
      },
      {
        slotId: 'brush-teeth',
        name: 'Se laver les dents',
        rotY: Math.PI,
        animation: 'take-object-mid',
      },
      {
        slotId: 'shave-makeup',
        name: 'Se Raser / Maquiller',
        rotY: Math.PI,
        animation: 'inspect-mid-height',
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
        offset: [30, 15, 645],
        rotY: 0,
        animation: 'miley-armature-posing-f',
        duration: 25.0,
      },
      {
        slotId: 'take-shower-2',
        name: 'Prendre une douche (Droite)',
        offset: [8, 15, 635],
        rotY: Math.PI / 2,
        animation: 'miley-armature-posing-f',
      },
      {
        slotId: 'take-shower-3',
        name: 'Prendre une douche (Gauche)',
        offset: [42, 15, 660],
        rotY: -Math.PI / 2,
        animation: 'miley-armature-posing-f',
      }
    ]
  },
  'sdb-closet': {
    id: 'sdb-closet',
    name: 'Placard Salle de bain',
    category: 'storage',
    itemId: 'sdb-closet',
    slots: [
      {
        slotId: 'pick-laundry',
        name: 'Prendre le sac de Linge sale',
        relative: true,
        offset: [-20, 0, -35], // 35 cm devant la porte droite dans la SDB
        rotY: 0,
        animation: 'take-object-mid',
        duration: 8,
        triggerEventKey: 'sdbClosetR',
      },
      {
        slotId: 'tidy-shelf',
        name: 'Ranger sur l\'étagère',
        relative: true,
        offset: [20, 0, -35], // 35 cm devant la porte gauche dans la SDB
        rotY: 0,
        animation: 'inspect-mid-height',
        duration: 8,
        triggerEventKey: 'sdbClosetL',
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
        animation: 'take-object-mid',
        duration: 8
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
        animation: 'inspect-mid-height',
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
        rotY: Math.PI / 4,
        animationsRandom: 'seated-front',
        duration: 30.0,
      },
      {
        slotId: 'west',
        name: 'Bain Côté Ouest',
        offset: [80, 0, -330],
        rotY: Math.PI / 4,
        animationsRandom: 'seated-front',
        duration: 30.0,
      },
      {
        slotId: 'east',
        name: 'Bain Côté Est',
        offset: [160, 0, -270],
        rotY: Math.PI + Math.PI / 4,
        animationsRandom: 'seated-front',
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
        rotY: - Math.PI / 2,
        animationsRandom: 'seated-front',
      },
      {
        slotId: 'seat-2',
        name: 'Place assise 2',
        offset: [270, 0, -140],
        rotY: - Math.PI / 2,
        animationsRandom: 'seated-front',
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
        animationsRandom: 'seated-front',
      },
      {
        slotId: 'seat-2',
        name: 'Place assise 2',
        offset: [100, 0, -100],
        rotY: Math.PI / 2,
        animationsRandom: 'seated-front',
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
        slotId: 'cook-oven',
        name: 'Cuisiner Four',
        // Ninja : Kallax de profondeur 39 cm, four de profondeur 37 cm,
        // décalage local X = -8, rotation monde Y = PI/2 (façade vers +X).
        offset: [BATH_WEST_WALL + 39 / 2 + 37 / 2 + HUMAN_BODY_RADIUS, 0, ROOM_D - 75.5 / 2 - 8],
        rotY: -Math.PI / 2,
        animation: 'entering-code',
        triggerEventKey: 'ninja',
        triggerEventValue: true,
      },
      {
        slotId: 'cook-stove',
        name: 'Cuisiner Plaques',
        animation: 'bartending',
        offset: [80, 0, 400],
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
        rotY: Math.PI / 2,
        animation: 'entering-code',
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
        rotY: Math.PI / 2,
        animation: 'texting-while-standing',
      }
    ]
  },
  'corridor-closet': {
    id: 'corridor-closet',
    name: 'Placard Couloir',
    category: 'storage',
    itemId: 'corridor-closet',
    slots: [
      {
        slotId: 'open-tidy',
        name: 'Ranger des affaires',
        relative: true,
        offset: [58, 0, 15], // Dans le couloir face aux étagères
        rotY: -Math.PI / 2,
        animation: 'entering-code',
        triggerEventKey: 'corrDoors',
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
        animation: 'miley-armature-change-pose',
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
        animationsRandom: 'dance',
        repeatCount: 4,
        repeatVariation: false,
      }
    ]
  },
  'building-b-corridor-end': {
    id: 'building-b-corridor-end',
    name: 'Gardien Fond Bâtiment B (Couloir)',
    category: 'outdoor',
    exclusive: true,
    position: [650, 0, 400],
    slots: [
      {
        slotId: 'watchdog',
        name: 'Gardien',
        rotY: Math.PI / 2,
        animationsRandom: 'dance',
      },
      {
        slotId: 'visit',
        name: 'Attente couloir',
        rotY: Math.PI / 2,
        animation: 'texting-while-standing',
      },
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
        animationsRandom: 'dance',
      },
      {
        slotId: 'visit',
        name: 'Consulter son téléphone',
        offset: [-350, 0, 1000],
        rotY: Math.PI / 2,
        animation: 'texting-while-standing',
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
        offset: [-300, 0, -200],
        rotY: Math.PI / 2,
        animationsRandom: 'dance',
      },
      {
        slotId: 'admire',
        name: 'Observer la cour',
        offset: [-300, 0, -200],
        rotY: Math.PI / 2,
        animationsRandom: 'dance',
      }
    ]
  },
  'west-neighbor-flat': {
    id: 'west-neighbor-flat',
    name: 'Studio voisin Ouest (Églantine)',
    category: 'outdoor',
    position: [-200, 0, 500],
    slots: [
      {
        slotId: 'yoga',
        name: 'Yoga',
        offset: [-160, 0, 500],
        animationsRandom: 'yoga',
        repeatCount: 6,
        repeatVariation: true,
      },
      {
        slotId: 'yoga-3',
        name: 'Yoga Terasse (Églantine)',
        offset: [-160, 0, 100],
        animationsRandom: 'yoga',
        repeatCount: 6,
        repeatVariation: true,
      },
      {
        slotId: 'yoga-2',
        name: 'Yoga 2',
        offset: [-160, 0, 300],
        animationsRandom: 'yoga',
        repeatCount: 6,
        repeatVariation: true,
      },
      {
        slotId: 'yoga-4',
        name: 'Yoga Ouest',
        offset: [-300, 0, 500],
        animationsRandom: 'yoga',
        repeatCount: 6,
        repeatVariation: true,
      },
      {
        slotId: 'yoga-5',
        name: 'Yoga Terasse (Églantine)',
        offset: [-300, 0, 100],
        animationsRandom: 'yoga',
        repeatCount: 6,
        repeatVariation: true,
      },
      {
        slotId: 'yoga-6',
        name: 'Yoga 2',
        offset: [-300, 0, 300],
        animationsRandom: 'yoga',
        repeatCount: 6,
        repeatVariation: true,
      },
      {
        slotId: 'yoga-7',
        name: 'Yoga 7',
        offset: [-200, 0, 700],
        animationsRandom: 'yoga',
        repeatCount: 6,
        repeatVariation: true,
      },
      {
        slotId: 'yoga-8',
        name: 'Yoga 8',
        offset: [-300, 0, 700],
        animationsRandom: 'yoga',
        repeatCount: 6,
        repeatVariation: true,
      },
    ]
  },
  'est-neighbor-flat': {
    id: 'est-neighbor-flat',
    name: 'Studio voisin Est (Damien)',
    category: 'outdoor',
    position: [500, 0, 100],
    slots: [
      {
        slotId: 'salsa-samba',
        name: 'Salsa Samba',
        animationsRandom: ['salsa', 'samba'],
        repeatCount: 6,
        repeatVariation: true,
      },
      {
        slotId: 'bachata-2',
        name: 'Bachata 2',
        offset: [500, 0, -300],
        animationsRandom: ['bachata'],
        repeatCount: 6,
        repeatVariation: true,
      },
      {
        slotId: 'combat-3',
        name: 'Combat 3',
        offset: [500, 0, -100],
        animationsRandom: 'combat',
        repeatCount: 6,
        repeatVariation: true,
      },
      {
        slotId: 'locomotion-4',
        name: 'Locomotion 4',
        offset: [400, 0, 100],
        animationsRandom: 'locomotion',
        repeatCount: 6,
        repeatVariation: true,
      },
      {
        slotId: 'interactions-5',
        name: 'Interactions 5',
        offset: [400, 0, -300],
        animationsRandom: 'interactions',
        repeatCount: 6,
        repeatVariation: true,
      },
      {
        slotId: 'poses-6',
        name: 'Poses 6',
        offset: [400, 0, -100],
        animationsRandom: 'poses-idles',
        repeatCount: 6,
        repeatVariation: true,
      },
      {
        slotId: 'hip-hop-breakdance',
        name: 'Hip-hop Breakdance',
        offset: [500, 0, 300],
        animationsRandom: ['hiphop', 'breakdance'],
        repeatCount: 6,
        repeatVariation: true,
      },
      {
        slotId: 'pnz',
        name: 'PNZ',
        offset: [400, 0, 300],
        animationsRandom: ['reggaeton', 'musical-theater', 'zumba', 'oriental', 'rnb'],
        repeatCount: 6,
        repeatVariation: true,
      },
    ]
  },
  'rain-dance': {
    id: 'rain-dance',
    name: 'Jardin Nord (Pluie)',
    category: 'dance',
    position: [0, 0, -430],
    rotationY: Math.PI / 2,
    slots: [
      {
        slotId: 'dance-in-rain',
        name: 'Danser sous la pluie',
        rotY: 0,
        animationsRandom: 'dance-from-npz',
        repeatCount: 4,
        repeatVariation: true,
      }
    ]
  },
  'duo-zone': {
    id: 'duo-zone',
    name: '✨ Scène Duo',
    category: 'outdoor',
    position: [-100, 0, -200],
    slots: [
      {
        slotId: 'duo-random',
        name: 'Session Duo Aléatoire',
        isDuo: true,
        offset: [-100, 0, -200],
        rotY: 0,
        get duoPool() {
          return getAllDuoAnimationIds();
        },
        duoCount: 3,
      }
    ]
  },
  'hugs-point': {
    id: 'hugs-point',
    name: '💖 Point Câlins',
    category: 'decor',
    position: [180, 0, 200],
    slots: [
      {
        slotId: 'hugs-trio',
        name: 'Enchaîner 3 Câlins & Baisers',
        isDuo: true,
        rotY: 0,
        duoPool: ['pop_dance', 'eye_to_eye', 'kiss_man_woman', 'kiss'],
        duoCount: 3,
      }
    ]
  },
  'inyeong-cha-hugs-point': {
    id: 'inyeong-cha-hugs-point',
    name: '💖 Point Câlins Inyeong-Cha',
    category: 'decor',
    position: [0, 0, -400],
    slots: [
      {
        slotId: 'hugs-6',
        name: 'Enchaîner 3 Câlins & Baisers',
        isDuo: true,
        duoPool: ['slow_dance', 'eye_to_eye', 'farewell_kiss', 'kiss_man_woman', 'kiss', 'propose', 'date_bearhug', 'p2',
          'pop_dance', 'energetic_dance'],
        duoCount: 6,
      }
    ]
  },
  'combat-point': {
    id: 'combat-point',
    name: '🥋 Zone de Combat',
    category: 'outdoor',
    position: [500, 0, 700],
    slots: [
      {
        slotId: 'combat-session',
        name: 'Duo Combat Aléatoire',
        isDuo: true,
        rotY: 0,
        duoPool: DUO_ANIMATIONS.filter(def => def.isCombat).map(def => def.id),
        duoCount: 3,
      }
    ]
  },

  // ── POINTS DE DANSE (SALON & SDB) ──────────────────────────────────────────
  // 'dance-bed-west-north': {
  //   id: 'dance-bed-west-north',
  //   name: 'Danse (Lit Ouest Nord)',
  //   category: 'dance',
  //   position: [150, 0, 80],
  //   slots: [
  //     {
  //       slotId: 'dance',
  //       name: 'Danse devant Lit Ouest (Nord)',
  //       rotY: Math.PI / 2,
  //       animationsRandom: 'dance-tight',
  //     }
  //   ]
  // },
  // 'dance-bed-west-mid': {
  //   id: 'dance-bed-west-mid',
  //   name: 'Danse (Lit Ouest Milieu)',
  //   category: 'dance',
  //   position: [150, 0, 150],
  //   slots: [
  //     {
  //       slotId: 'dance',
  //       name: 'Danse devant Lit Ouest (Milieu)',
  //       rotY: Math.PI / 2,
  //       animationsRandom: 'dance-tight',
  //     }
  //   ]
  // },
  // 'dance-bed-west-south': {
  //   id: 'dance-bed-west-south',
  //   name: 'Danse (Lit Ouest Sud)',
  //   category: 'dance',
  //   position: [140, 0, 220],
  //   slots: [
  //     {
  //       slotId: 'dance',
  //       name: 'Danse devant Lit Ouest (Sud)',
  //       rotY: Math.PI / 2,
  //       animationsRandom: 'dance-tight',
  //     }
  //   ]
  // },
  'dance-bed-east-north': {
    id: 'dance-bed-east-north',
    name: 'Danse (Lit Est Nord)',
    category: 'dance',
    position: [175, 0, 120],
    slots: [
      {
        slotId: 'dance',
        name: 'Danse devant Lit Est (Nord)',
        rotY: -Math.PI / 2,
        animationsRandom: 'dance-tight',
      }
    ]
  },
  // 'dance-bed-east-mid': {
  //   id: 'dance-bed-east-mid',
  //   name: 'Danse (Lit Est Milieu)',
  //   category: 'dance',
  //   position: [195, 0, 190],
  //   slots: [
  //     {
  //       slotId: 'dance',
  //       name: 'Danse devant Lit Est (Milieu)',
  //       rotY: -Math.PI / 2,
  //       animationsRandom: 'dance-tight',
  //     }
  //   ]
  // },
  // 'dance-bed-east-south': {
  //   id: 'dance-bed-east-south',
  //   name: 'Danse (Lit Est Sud)',
  //   category: 'dance',
  //   position: [195, 0, 260],
  //   slots: [
  //     {
  //       slotId: 'dance',
  //       name: 'Danse devant Lit Est (Sud)',
  //       rotY: -Math.PI / 2,
  //       animationsRandom: 'dance-tight',
  //       repeatCount: 4,
  //       repeatVariation: false,
  //     }
  //   ]
  // },
  // 'dance-chair-office': {
  //   id: 'dance-chair-office',
  //   name: 'Danse (Devant Chaise Bureau)',
  //   category: 'dance',
  //   position: [135, 0, 280],
  //   slots: [
  //     {
  //       slotId: 'dance',
  //       name: 'Danse devant Chaise Bureau',
  //       rotY: Math.PI / 2,
  //       animationsRandom: 'dance-tight',
  //       repeatCount: 4,
  //       repeatVariation: true,
  //     }
  //   ]
  // },
  'dance-mirror-south': {
    id: 'dance-mirror-south',
    name: 'Danse (Devant Miroir Sud)',
    category: 'dance',
    position: [160, 0, 290],
    slots: [
      {
        slotId: 'dance',
        name: 'Danse devant Miroir Sud',
        rotY: 0,
        animationsRandom: 'dance-tight',
      }
    ]
  },
  // 'dance-glass-door-right': {
  //   id: 'dance-glass-door-right',
  //   name: 'Danse (Devant Porte-fenêtre Droite)',
  //   category: 'dance',
  //   position: [215, 0, 50],
  //   slots: [
  //     {
  //       slotId: 'dance',
  //       name: 'Danse devant Porte-fenêtre Droite',
  //       offset: [215, 0, 50],
  //       rotY: Math.PI,
  //       animationsRandom: 'dance-tight',
  //       duration: 15.0,
  //     }
  //   ]
  // },
  // 'dance-bathroom': {
  //   id: 'dance-bathroom',
  //   name: 'Danse (Salle de Bain)',
  //   category: 'dance',
  //   position: [100, 0, 530],
  //   slots: [
  //     {
  //       slotId: 'dance',
  //       name: 'Danse dans la Salle de Bain',
  //       offset: [100, 0, 530],
  //       rotY: Math.PI,
  //       animationsRandom: 'dance-tight',
  //       duration: 15.0,
  //     }
  //   ]
  // }
};

/**
 * Utilitaires d'accès et de requêtage pour les Smart Objects
 */
export function getAllSmartObjects(): ResolvedSmartObject[] {
  return Object.keys(SMART_OBJECTS)
    .map(id => getSmartObject(id))
    .filter((obj): obj is ResolvedSmartObject => Boolean(obj));
}

export function getAllSmartObjectIds(): string[] {
  return Object.keys(SMART_OBJECTS);
}

export function getSmartObjectsByCategory(category: SmartObjectCategory): ResolvedSmartObject[] {
  return getAllSmartObjects().filter(obj => obj.category === category);
}

export function isDuoSlot(objectId?: string, slotId?: string): boolean {
  if (!objectId) return false;
  const obj = SMART_OBJECTS[objectId];
  if (!obj) return false;
  if (!slotId) return obj.slots.some(s => s.isDuo);
  // Accepter les slotIds avec suffixe ':roleA' / ':roleB' (ex: 'sit-cuddle:roleB')
  const baseSlotId = slotId.replace(/:role[AB]$/, '');
  const slot = obj.slots.find(s => s.slotId === baseSlotId || s.slotId === slotId);
  return Boolean(slot?.isDuo);
}

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

  const baseInstruction: AgentInstruction = {
    type: 'USE_OBJECT',
    smartObjectId: obj.id,
    slotId: slot.slotId,
    animation: slot.animation,
    duration: slot.duration,
    repeatCount: slot.repeatCount,
    repeatVariation: slot.repeatVariation,
    rotY: slot.rotY,
    triggerEventKey: slot.triggerEventKey,
    triggerEventValue: slot.triggerEventValue,
  };

  if (objectId === 'freezer' || objectId === 'kallax-ne') {
    const doorKey = objectId === 'freezer' ? 'living' : 'glassRight';
    const door = DOOR_CONFIGS[doorKey];
    const [x, , z] = obj.position!;
    const swingClearance = door.length + HUMAN_BODY_RADIUS + door.thickness / 2 + door.margin;
    const safePos: [number, number, number] = objectId === 'freezer'
      ? [door.pivot.x - Math.sqrt(swingClearance ** 2 - (z - door.pivot.z) ** 2) - door.margin, 0, z]
      : [x, 0, door.pivot.z + Math.sqrt(swingClearance ** 2 - (x - door.pivot.x) ** 2) + door.margin];
    return [
      { type: 'MOVE_TO', targetPos: safePos, doorKey },
      { type: 'WAIT', doorKey },
      ...(objectId === 'kallax-ne' ? [{ type: 'MOVE_TO' as const, smartObjectId: obj.id, slotId: slot.slotId }] : []),
      baseInstruction,
    ];
  }

  // Routines composées
  if (objectId === 'cuisine-group' && slot.slotId === 'cook-oven') {
    return [
      { type: 'MOVE_TO', smartObjectId: 'cuisine-group', slotId: 'cook-oven' },
      {
        type: 'WAIT',
        smartObjectId: 'cuisine-group',
        slotId: 'cook-oven',
        animation: 'idle',
        duration: NINJA_DOOR_DURATION,
        rotY: slot.rotY ?? -Math.PI / 2,
        triggerEventKey: 'ninja',
        triggerEventValue: true,
      },
      baseInstruction,
      {
        type: 'WAIT',
        smartObjectId: 'cuisine-group',
        slotId: 'cook-oven',
        animation: 'idle',
        duration: NINJA_DOOR_DURATION,
        rotY: slot.rotY ?? -Math.PI / 2,
        triggerEventKey: 'ninja',
        triggerEventValue: false,
      },
    ];
  }

  if (objectId === 'shower') {
    return [
      { type: 'MOVE_TO', targetWaypointId: 'bathroom-shower-entry', rotY: 0 },
      { type: 'MOVE_TO', smartObjectId: 'shower', slotId: slot.slotId },
      baseInstruction,
      { type: 'MOVE_TO', targetWaypointId: 'bathroom-shower-entry', rotY: Math.PI },
    ];
  }


  if (objectId === 'toilet') {
    return [
      { type: 'MOVE_TO', smartObjectId: 'toilet', slotId: 'use' },
      {
        type: 'WAIT', smartObjectId: 'toilet', slotId: 'use',
        animation: 'idle', duration: TOILET_HINGE_DURATION, rotY: Math.PI,
        triggerEventKey: 'wc-lid-toggle', triggerEventValue: true,
      },
      { type: 'USE_OBJECT', smartObjectId: 'toilet', slotId: 'use' },
      {
        type: 'WAIT', smartObjectId: 'toilet', slotId: 'use',
        animation: 'idle', duration: TOILET_HINGE_DURATION, rotY: Math.PI,
        triggerEventKey: 'wc-lid-toggle', triggerEventValue: false,
      },
      { type: 'USE_OBJECT', smartObjectId: 'toilet', slotId: 'flush', animation: 'button-pushing', duration: 2.0, rotY: Math.PI, triggerEventKey: 'wc-flush', triggerEventValue: true },
      { type: 'USE_OBJECT', smartObjectId: 'vasque-sdb', slotId: 'wash-hands', animation: 'inspect-mid-height', rotY: Math.PI }
    ];
  }

  if (objectId === 'sdb-closet') {
    const doorKey = slot.triggerEventKey ?? (slot.slotId === 'tidy-shelf' ? 'sdbClosetL' : 'sdbClosetR');
    return [
      { type: 'MOVE_TO', smartObjectId: obj.id, slotId: slot.slotId },
      {
        type: 'WAIT',
        smartObjectId: obj.id,
        slotId: slot.slotId,
        animation: 'idle',
        duration: CLOSET_DOOR_DURATION,
        rotY: slot.rotY,
        triggerEventKey: doorKey,
        triggerEventValue: true,
      },
      { ...baseInstruction, triggerEventKey: undefined, triggerEventValue: undefined },
      {
        type: 'WAIT',
        smartObjectId: obj.id,
        slotId: slot.slotId,
        animation: 'idle',
        duration: CLOSET_DOOR_DURATION,
        rotY: slot.rotY,
        triggerEventKey: doorKey,
        triggerEventValue: false,
      },
    ];
  }

  if (objectId === 'corridor-closet') {
    const doorKey = slot.triggerEventKey ?? 'corrDoors';
    return [
      { type: 'MOVE_TO', smartObjectId: obj.id, slotId: slot.slotId },
      {
        type: 'WAIT',
        smartObjectId: obj.id,
        slotId: slot.slotId,
        animation: 'idle',
        duration: CLOSET_DOOR_DURATION,
        rotY: slot.rotY,
        triggerEventKey: doorKey,
        triggerEventValue: true,
      },
      { ...baseInstruction, triggerEventKey: undefined, triggerEventValue: undefined },
      {
        type: 'WAIT',
        smartObjectId: obj.id,
        slotId: slot.slotId,
        animation: 'idle',
        duration: CLOSET_DOOR_DURATION,
        rotY: slot.rotY,
        triggerEventKey: doorKey,
        triggerEventValue: false,
      },
    ];
  }

  return [baseInstruction];
}

/**
 * Résout un SmartObject en coordonnées monde.
 * Si l'objet est lié à un objet 3D réel (itemId), sa position monde et son orientation Ry
 * sont résolues dynamiquement, et tous les slots déclarés comme `relative` voient leur offset
 * et rotY transformés dans le repère monde de l'objet.
 */
export function getSmartObject(objectId: string): ResolvedSmartObject | undefined {
  const base = SMART_OBJECTS[objectId];
  if (!base) return undefined;

  // 1. Résolution de la transformation monde via getObjectTransform
  const transform = base.itemId ? getObjectTransform(base.itemId) : undefined;

  const objX = transform ? transform.position[0] : (base.position?.[0] ?? 0);
  const objY = transform ? transform.position[1] : (base.position?.[1] ?? 0);
  const objZ = transform ? transform.position[2] : (base.position?.[2] ?? 0);
  const objRy = transform ? transform.rotationY : (base.rotationY ?? 0);

  const cos = Math.cos(objRy);
  const sin = Math.sin(objRy);

  // 2. Transformation locale -> monde avec rotation Ry pour les slots
  const resolvedSlots = base.slots.map(slot => {
    // Si l'objet est lié à un objet 3D réel et que slot.relative n'est pas faux, ou si slot.relative === true
    const isRelative = slot.relative !== undefined ? slot.relative : Boolean(base.itemId);

    if (!isRelative) {
      return {
        ...slot,
        offset: slot.offset ?? [objX, objY, objZ],
        rotY: slot.rotY ?? objRy,
      };
    }

    const localOffset = slot.offset || [0, 0, 0];
    const localApproach = slot.approachOffset;

    const ox = localOffset[0];
    const oy = localOffset[1];
    const oz = localOffset[2];

    const worldOffset: [number, number, number] = [
      objX + ox * cos + oz * sin,
      objY + oy,
      objZ - ox * sin + oz * cos,
    ];

    let worldApproach: [number, number, number] | undefined = undefined;
    if (localApproach) {
      const ax = localApproach[0];
      const ay = localApproach[1];
      const az = localApproach[2];
      worldApproach = [
        objX + ax * cos + az * sin,
        objY + ay,
        objZ - ax * sin + az * cos,
      ];
    }

    // Orientation finale : slot.rotY relatif à l'objet, ou rotation propre de l'objet si rotY absent
    const slotRot = slot.rotY !== undefined ? slot.rotY : 0;
    const worldRotY = (objRy + slotRot) % (Math.PI * 2);

    return {
      ...slot,
      offset: worldOffset,
      approachOffset: worldApproach,
      rotY: worldRotY,
    };
  });

  return {
    ...base,
    position: [objX, objY, objZ],
    rotationY: objRy,
    slots: resolvedSlots,
  };
}
