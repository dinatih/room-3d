import { SmartObjectDef, SmartObjectCategory, AgentInstruction, ResolvedSmartObject } from './aiTypes';
import { OccupancyManager } from './occupancyManager';
import { getObjectTransform } from '../objectTransforms';

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
    itemId: 'bed-double',
    slots: [
      {
        slotId: 'seat-left',
        name: 'S\'asseoir (Gauche)',
        relative: true,
        offset: [0, 0, -50],
        animationsRandom: 'seated-front',
      },
      {
        slotId: 'seat-right',
        name: 'S\'asseoir (Droite)',
        relative: true,
        offset: [0, 0, 50],
        animationsRandom: 'seated-front',
      },
      {
        slotId: 'lie-down-left',
        name: 'Dormir couché (Gauche)',
        relative: true,
        offset: [-35, 45, 0],
        animationsRandom: 'laying-pack',
      },
      {
        slotId: 'lie-down-right',
        name: 'Dormir couché (Droite)',
        relative: true,
        offset: [35, 45, 0],
        animationsRandom: 'laying-pack',
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
        animationsRandom: 'seated-front',
      },
      {
        slotId: 'seat-middle',
        name: 'S\'asseoir (Milieu)',
        offset: [90, 0, 150],
        animationsRandom: 'seated-front',
      },
      {
        slotId: 'seat-south',
        name: 'S\'asseoir (Sud)',
        offset: [90, 0, 220],
        animationsRandom: 'seated-front',
      },
      {
        slotId: 'lie-down',
        name: 'Dormir couché',
        offset: [74, 45, 150],
        animationsRandom: 'laying-front',
        rotY: -Math.PI,
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
        animationsRandom: 'seated-front',
      },
      {
        slotId: 'seat-middle',
        name: 'S\'asseoir (Milieu)',
        offset: [245, 0, 190],
        animationsRandom: 'seated-front',
      },
      {
        slotId: 'seat-south',
        name: 'S\'asseoir (Sud)',
        offset: [245, 0, 260],
        animationsRandom: 'seated-front',
      },
      {
        slotId: 'lie-down',
        name: 'Dormir couché',
        offset: [270, 45, 190],
        animationsRandom: 'laying-front',
        rotY: Math.PI,
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
        animationsRandom: 'seated-front',
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
      },
      {
        slotId: 'sit-cuddle',
        name: 'Câlin à deux (Sit Cuddle)',
        isDuo: true,
        duoAnimId: 'sit-cuddle',
        relative: true,
        offset: [0, 0, 0],
        rotY: 0,
        duration: 12.0, // TODO:
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
        animation: 'sit-idle',
        duration: 10.0,
      },
      {
        slotId: 'flush',
        name: 'Tirer la chasse',
        offset: [50, 0, 550],
        rotY: Math.PI,
        animation: 'anim-button-pushing',
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
        animation: 'inspect-mid-height',
      },
      {
        slotId: 'brush-teeth',
        name: 'Se laver les dents',
        offset: [116, 0, 530],
        rotY: Math.PI,
        animation: 'take-object-mid',
      },
      {
        slotId: 'shave-makeup',
        name: 'Se Raser / Maquiller',
        offset: [116, 0, 530],
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
        offset: [0, 0, -35], // 35 cm devant le placard dans la SDB
        rotY: 0,
        animation: 'take-object-mid',
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
        offset: [120, 0, -300],
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
        slotId: 'cook',
        name: 'Cuisiner Four',
        rotY: -Math.PI / 2,
        animation: 'anim-entering-code',
      },
      {
        slotId: 'cook',
        name: 'Cuisiner Plaques',
        offset: [80, 0, 370],
        rotY: 0,
        animation: 'anim-bartending',
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
        animation: 'anim-entering-code',
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
        animation: 'anim-texting-while-standing',
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
        animation: 'anim-entering-code',
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
        animationsRandom: 'all-dances',
        repeatCount: 4,
        repeatVariation: false,
      }
    ]
  },
  'building-b-corridor-end': {
    id: 'building-b-corridor-end',
    name: 'Gardien Fond Bâtiment B (Couloir)',
    category: 'outdoor',
    position: [650, 0, 400],
    slots: [
      {
        slotId: 'watchdog',
        name: 'Gardien',
        rotY: Math.PI / 2,
        animationsRandom: 'all-dances',
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
        animationsRandom: 'all-dances',
      },
      {
        slotId: 'visit',
        name: 'Consulter son téléphone',
        offset: [-350, 0, 1000],
        rotY: Math.PI / 2,
        animation: 'anim-texting-while-standing',
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
        animationsRandom: 'all-dances',
      },
      {
        slotId: 'admire',
        name: 'Observer la cour',
        offset: [-300, 0, -200],
        rotY: Math.PI / 2,
        animationsRandom: 'all-dances',
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
        offset: [500, 0, 100],
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
        slotId: 'hip-hop-breakdance',
        name: 'Hip-hop Breakdance',
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
    position: [0, 0, -400],
    slots: [
      {
        slotId: 'dance-in-rain',
        name: 'Danser sous la pluie',
        offset: [0, 0, -400],
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
        rotY: 0,
        duoCount: 3,
      }
    ]
  },
  'hugs-point': {
    id: 'hugs-point',
    name: '💖 Point Câlins',
    category: 'decor',
    position: [160, 0, 200],
    slots: [
      {
        slotId: 'hugs-trio',
        name: 'Enchaîner 3 Câlins & Baisers',
        isDuo: true,
        offset: [160, 0, 200],
        rotY: 0,
        duoPool: ['slow_dance', 'cuddle_kiss', 'eye_to_eye', 'farewell_kiss'],
        duoCount: 3,
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
        offset: [500, 0, 700],
        rotY: 0,
        duoPool: [
          'b1', 'd1', 'd4', 'f2', 'h1', 'h2', 'h4', 'ko1', 'ko2', 'ko3',
          'p1', 'p2', 's1', 's2', 's3', 's4', 's5', 't1', 't3', 't4', 't5',
          'double_leg_takedown', 'double_leg_takedown_pair', 'release_hostage',
          'fist_fight', 'taken_hostage', 'shoulder_throw', 'brutal_assassination'
        ],
        duoCount: 3,
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
        animationsRandom: 'dance-tight',
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
        animationsRandom: 'dance-tight',
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
        animationsRandom: 'dance-tight',
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
        animationsRandom: 'dance-tight',
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
        animationsRandom: 'dance-tight',
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
        animationsRandom: 'dance-tight',
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
        rotY: Math.PI / 2,
        animationsRandom: 'dance-tight',
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

export function getSmartObjectsByCategory(category: SmartObjectCategory): ResolvedSmartObject[] {
  return getAllSmartObjects().filter(obj => obj.category === category);
}

export function isDuoSlot(objectId?: string, slotId?: string): boolean {
  if (!objectId) return false;
  if (objectId === 'duo-zone') return true;
  const obj = SMART_OBJECTS[objectId];
  if (!obj) return false;
  if (!slotId) return obj.slots.some(s => s.isDuo);
  // Accepter les slotIds avec suffixe ':roleA' / ':roleB' (ex: 'sit-cuddle:roleB')
  const baseSlotId = slotId.replace(/:role[AB]$/, '');
  const slot = obj.slots.find(s => s.slotId === baseSlotId || s.slotId === slotId);
  return Boolean(slot?.isDuo);
}

const MILEY_DANCE_ANIMS = [
  'miley-armature-10-dance-like-sidestep',
  'miley-armature-aerobic-dance',
  'miley-armature-air-dance',
  'miley-armature-couple-pop-dance-f',
  'miley-armature-couple-pop-dance-m',
  'miley-armature-dance-graceful',
  'miley-armature-dancetomusic-f',
  'miley-armature-energetic-dance-f',
  'miley-armature-energetic-dance-m',
  'miley-armature-sensual-dance-01',
  'miley-armature-sensual-dance-02',
  'miley-armature-sensual-dance-03',
  'miley-armature-slow-dance-f',
  'miley-armature-slow-dance-m'
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
      { type: 'MOVE_TO', targetWaypointId: 'bathroom-shower-entry', rotY: 0 },
      { type: 'INTERACT', smartObjectId: 'shower', slotId: slot.slotId, triggerEventKey: 'shower-door-toggle', triggerTargetState: true, animation: 'anim-open-door-outwards', duration: 0.8, rotY: 0 },
      { type: 'MOVE_TO', smartObjectId: 'shower', slotId: slot.slotId },
      { type: 'INTERACT', smartObjectId: 'shower', slotId: slot.slotId, triggerEventKey: 'shower-door-toggle', triggerTargetState: false, duration: 0.5 },
      baseInstruction,
      { type: 'INTERACT', smartObjectId: 'shower', slotId: slot.slotId, triggerEventKey: 'shower-door-toggle', triggerTargetState: true, duration: 0.8 },
      { type: 'MOVE_TO', targetWaypointId: 'bathroom-shower-entry', rotY: Math.PI },
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
