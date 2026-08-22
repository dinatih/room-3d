import { type LaraVariant } from './LaraVariants';

export interface CharacterConfig {
  id: string;
  name: string;
  path: string;
  pos: [number, number, number];
  rot: number;
  variant?: LaraVariant;
  height: number;
  sittingScenePath?: string;
  customIdleAnimPath?: string;
  isLara?: boolean;
}

export const CHARACTERS: CharacterConfig[] = [
  // 12 stylized Laras (positions et animations gérées par l'IA sur leur zone d'action)
  { id: 'native',   name: 'Lara (Native)', path: 'characters/lara/lara_native.glb', pos: [0, 0, 0], rot: 0, variant: 'native',   height: 173.4 },
  { id: 'rosanna',  name: 'Rosanna',       path: 'characters/lara/lara_native.glb', pos: [0, 0, 0], rot: 0, variant: 'rosanna',  height: 173.4 },
  { id: 'marissa',  name: 'Marissa',       path: 'characters/lara/lara_native.glb', pos: [0, 0, 0], rot: 0, variant: 'marissa',  height: 173.4 },
  { id: 'delphina', name: 'Delphina',      path: 'characters/lara/lara_native.glb', pos: [0, 0, 0], rot: 0, variant: 'delphina', height: 173.4 },
  { id: 'sara',     name: 'Sara',          path: 'characters/lara/lara_native.glb', pos: [0, 0, 0], rot: 0, variant: 'sara',     height: 173.4 },
  { id: 'cha',      name: 'Cha',           path: 'characters/lara/lara_native.glb', pos: [0, 0, 0], rot: 0, variant: 'cha',      height: 173.4 },
  { id: 'vivida',   name: 'ViviDa',        path: 'characters/lara/lara_native.glb', pos: [0, 0, 0], rot: 0, variant: 'vivida',   height: 173.4 },
  { id: 'sabira',   name: 'Sabira',        path: 'characters/lara/lara_native.glb', pos: [0, 0, 0], rot: 0, variant: 'sabira',   height: 173.4 },
  { id: 'safa',     name: 'Safa',          path: 'characters/lara/lara_native.glb', pos: [0, 0, 0], rot: 0, variant: 'safa',     height: 173.4 },
  { id: 'romana',   name: 'Romana',        path: 'characters/lara/lara_native.glb', pos: [0, 0, 0], rot: 0, variant: 'romana',   height: 173.4 },
  { id: 'angelina', name: 'Angelina',      path: 'characters/lara/lara_native.glb', pos: [0, 0, 0], rot: 0, variant: 'angelina', height: 173.4 },
  { id: 'lgbta',    name: 'Lgbta',         path: 'characters/lara/lara_native.glb', pos: [0, 0, 0], rot: 0, variant: 'lgbta',    height: 173.4 },

  // Exceptions : Xbot, Sandra et Rajaa (gardent leur position et comportement actuels)
  { id: 'xbot',     name: 'Xbot',          path: 'characters/xbot/Xbot_official.glb', pos: [288, 0, 603], rot: 0, variant: 'native', height: 173.4, isLara: false },
  { id: 'sandra',   name: 'Sandra',        path: 'characters/lara/lara_native.glb', pos: [-400, 0, 0], rot: 0, variant: 'sandra', height: 173.4 },
  { id: 'rajaa',    name: 'Rajaa',         path: 'characters/lara/lara_native.glb', pos: [-450, 0, 0], rot: 0, variant: 'rajaa',  height: 173.4 }
];

export const ACCESSORIES_MESH_NAMES = new Set([
  'backpack', 'oxygen',
  'binoculars', 'buckle', 'camera', 'goggles', 'grapple',
  'handgun_left', 'handgun_right', 'mp5', 'mp5_ammo',
  'handgun_left_holster', 'handgun_right_holster', 'mp5_holster', 'holster',
  'headset', 'pda', 'personal_light', 'ribbon', 'purse',
  'grenades', 'accessories', 'handgun_part'
]);

/** PNJ en mode exploration autonome (scénarios et vie quotidienne) */
export const AUTONOMOUS_NPC_IDS = new Set([
  'native', 'rosanna', 'marissa', 'delphina', 'sara', 'cha', 'vivida', 'sabira', 'safa', 'romana', 'angelina', 'lgbta'
]);


