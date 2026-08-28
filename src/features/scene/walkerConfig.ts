import { type LaraVariant } from './LaraVariants';

export interface CharacterConfig {
  id: string;
  name: string;
  /** Emoji identifiant visuel du NPC, utilisable à la place du nom dans les UI */
  emoji: string;
  /** Couleur CSS du tag dans la console de logs (ex: '#00ff88') */
  color: string;
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
  { id: 'native',   name: 'Native',   emoji: '🥇', color: '#aaaaaa',  path: 'characters/lara/lara_native.glb', pos: [0, 0, 0], rot: 0, variant: 'native',   height: 173.4 },
  { id: 'rosanna',  name: 'Rosanna',  emoji: '🏀', color: '#ff8844',  path: 'characters/lara/lara_native.glb', pos: [0, 0, 0], rot: 0, variant: 'rosanna',  height: 173.4 },
  { id: 'marissa',  name: 'Marissa',  emoji: '💇‍♀️', color: '#ff6b9d',  path: 'characters/lara/lara_native.glb', pos: [0, 0, 0], rot: 0, variant: 'marissa',  height: 173.4 },
  { id: 'delphina', name: 'Delphina', emoji: '🐕️', color: '#00ff88',  path: 'characters/lara/lara_native.glb', pos: [0, 0, 0], rot: 0, variant: 'delphina', height: 173.4 },
  { id: 'sara',     name: 'Sara',     emoji: '🧗‍♀️', color: '#ff4444',  path: 'characters/lara/lara_native.glb', pos: [0, 0, 0], rot: 0, variant: 'sara',     height: 173.4 },
  { id: 'cha',      name: 'Cha',      emoji: '🐈️', color: '#00ccff',  path: 'characters/lara/lara_native.glb', pos: [0, 0, 0], rot: 0, variant: 'cha',      height: 173.4 },
  { id: 'vivida',   name: 'ViviDa',   emoji: '🫀', color: '#ff4444',  path: 'characters/lara/lara_native.glb', pos: [0, 0, 0], rot: 0, variant: 'vivida',   height: 173.4 },
  { id: 'sabira',   name: 'Sabira',   emoji: '🌸', color: '#ffff44',  path: 'characters/lara/lara_native.glb', pos: [0, 0, 0], rot: 0, variant: 'sabira',   height: 173.4 },
  { id: 'safa',     name: 'Safa',     emoji: '⚽️', color: '#88ff44',  path: 'characters/lara/lara_native.glb', pos: [0, 0, 0], rot: 0, variant: 'safa',     height: 173.4 },
  { id: 'romana',   name: 'Romana',   emoji: '👶', color: '#ffaacc',  path: 'characters/lara/lara_native.glb', pos: [0, 0, 0], rot: 0, variant: 'romana',   height: 173.4 },
  { id: 'angelina', name: 'Angelina', emoji: '🧑‍🏫', color: '#00aaff',  path: 'characters/lara/lara_native.glb', pos: [0, 0, 0], rot: 0, variant: 'angelina', height: 173.4 },
  { id: 'lgbta',    name: 'Lgbta',    emoji: '🌈', color: '#cc88ff',  path: 'characters/lara/lara_native.glb', pos: [0, 0, 0], rot: 0, variant: 'lgbta',    height: 173.4 },

  // Exception : Xbot
  { id: 'xbot',     name: 'Xbot',     emoji: '🤖', color: '#aaaaaa',  path: 'characters/xbot/Xbot_official.glb', pos: [288, 0, 603], rot: 0, variant: 'native', height: 173.4, isLara: false },
  { id: 'sandra',   name: 'Sandra',   emoji: '🥊', color: '#ff4444',  path: 'characters/lara/lara_native.glb', pos: [0, 0, 0], rot: 0, variant: 'sandra', height: 173.4 },
  { id: 'rajaa',    name: 'Rajaa',    emoji: '🚗', color: '#aacc44',  path: 'characters/lara/lara_native.glb', pos: [0, 0, 0], rot: 0, variant: 'rajaa',  height: 173.4 }
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
  'native', 'rosanna', 'marissa', 'delphina', 'sara', 'cha', 'vivida', 'sabira', 'safa', 'romana', 'angelina', 'lgbta', 'sandra', 'rajaa'
]);
