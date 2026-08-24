import { type LaraVariant } from './LaraVariants';

export interface CharacterConfig {
  id: string;
  name: string;
  /** Emoji identifiant visuel du NPC, utilisable à la place du nom dans les UI */
  emoji: string;
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
  { id: 'native',   name: 'Native',   emoji: '🥇', path: 'characters/lara/lara_native.glb', pos: [0, 0, 0], rot: 0, variant: 'native',   height: 173.4 },
  { id: 'rosanna',  name: 'Rosanna',  emoji: '🏀', path: 'characters/lara/lara_native.glb', pos: [0, 0, 0], rot: 0, variant: 'rosanna',  height: 173.4 },
  { id: 'marissa',  name: 'Marissa',  emoji: '💇‍♀️', path: 'characters/lara/lara_native.glb', pos: [0, 0, 0], rot: 0, variant: 'marissa',  height: 173.4 },
  { id: 'delphina', name: 'Delphina', emoji: '🐕️', path: 'characters/lara/lara_native.glb', pos: [0, 0, 0], rot: 0, variant: 'delphina', height: 173.4 },
  { id: 'sara',     name: 'Sara',     emoji: '🧗‍♀️', path: 'characters/lara/lara_native.glb', pos: [0, 0, 0], rot: 0, variant: 'sara',     height: 173.4 },
  { id: 'cha',      name: 'Cha',      emoji: '🐈️', path: 'characters/lara/lara_native.glb', pos: [0, 0, 0], rot: 0, variant: 'cha',      height: 173.4 },
  { id: 'vivida',   name: 'ViviDa',   emoji: '🫀', path: 'characters/lara/lara_native.glb', pos: [0, 0, 0], rot: 0, variant: 'vivida',   height: 173.4 },
  { id: 'sabira',   name: 'Sabira',   emoji: '🌸', path: 'characters/lara/lara_native.glb', pos: [0, 0, 0], rot: 0, variant: 'sabira',   height: 173.4 },
  { id: 'safa',     name: 'Safa',     emoji: '⚽️', path: 'characters/lara/lara_native.glb', pos: [0, 0, 0], rot: 0, variant: 'safa',     height: 173.4 },
  { id: 'romana',   name: 'Romana',   emoji: '👶', path: 'characters/lara/lara_native.glb', pos: [0, 0, 0], rot: 0, variant: 'romana',   height: 173.4 },
  { id: 'angelina', name: 'Angelina', emoji: '🧑‍🏫', path: 'characters/lara/lara_native.glb', pos: [0, 0, 0], rot: 0, variant: 'angelina', height: 173.4 },
  { id: 'lgbta',    name: 'Lgbta',    emoji: '🌈', path: 'characters/lara/lara_native.glb', pos: [0, 0, 0], rot: 0, variant: 'lgbta',    height: 173.4 },

  // Exceptions : Xbot, Sandra et Rajaa (gardent leur position et comportement actuels)
  { id: 'xbot',     name: 'Xbot',     emoji: '🤖', path: 'characters/xbot/Xbot_official.glb', pos: [288, 0, 603], rot: 0, variant: 'native', height: 173.4, isLara: false },
  { id: 'sandra',   name: 'Sandra',   emoji: '🥊', path: 'characters/lara/lara_native.glb', pos: [-400, 0, 0], rot: 0, variant: 'sandra', height: 173.4 },
  { id: 'rajaa',    name: 'Rajaa',    emoji: '🚗', path: 'characters/lara/lara_native.glb', pos: [-450, 0, 0], rot: 0, variant: 'rajaa',  height: 173.4 }
];

/** Retourne le label complet d'un NPC : "emoji nom" (utile dans les UI pour éviter les noms en dur) */
export function npcLabel(char: CharacterConfig): string {
  return `${char.emoji} ${char.name}`;
}

/** Retourne un NPC par son id, ou undefined si introuvable */
export function findCharacter(id: string): CharacterConfig | undefined {
  return CHARACTERS.find(c => c.id === id);
}

export const ACCESSORIES_MESH_NAMES = new Set([
  'backpack', 'oxygen',
  'binoculars', 'buckle', 'camera', 'goggles', 'grapple',
  'handgun_left', 'handgun_right', 'mp5', 'mp5_ammo',
  'handgun_left_holster', 'handgun_right_holster', 'mp5_holster', 'holster',
  'headset', 'pda', 'personal_light', 'ribbon', 'purse',
  'grenades', 'accessories', 'handgun_part'
]);

export type LaraCountMode = 2 | 10 | 15;

export const PERF_EXCLUDED_LARA_IDS = new Set([
  'sara', 'safa', 'romana', 'angelina', 'lgbta'
]);

export function isCharacterVisibleInMode(id: string, mode: LaraCountMode = 15, activeWalkerId?: string): boolean {
  if (mode === 2) {
    if (id === 'xbot') return true;
    if (activeWalkerId && activeWalkerId !== 'xbot') {
      return id === activeWalkerId;
    }
    return id === 'native';
  }
  if (mode === 10) {
    if (activeWalkerId && id === activeWalkerId) return true;
    return !PERF_EXCLUDED_LARA_IDS.has(id);
  }
  // mode === 15: all characters
  return true;
}

/** PNJ en mode exploration autonome (scénarios et vie quotidienne) */
export const AUTONOMOUS_NPC_IDS = new Set([
  'native', 'rosanna', 'marissa', 'delphina', 'sara', 'cha', 'vivida', 'sabira', 'safa', 'romana', 'angelina', 'lgbta'
]);
