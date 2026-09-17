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
  { id: 'rajaa',    name: 'Rajaa',    emoji: '🚗', color: '#aacc44',  path: 'characters/lara/lara_native.glb', pos: [0, 0, 0], rot: 0, variant: 'rajaa',  height: 173.4 },
  { id: 'inyeong',  name: 'Inyeong (Nitro)', emoji: '🪖', color: '#ff4444', path: 'characters/inyeong/nitro_anim_inyeong.glb', pos: [0, 0, 0], rot: 0, variant: 'native', height: 165, isLara: false },
  { id: 'hayley',   name: 'Hayley (Inyeong)', emoji: '👒', color: '#ff66aa', path: 'characters/hayley/hayley.glb', pos: [0, 0, 0], rot: 0, variant: 'native', height: 168, isLara: false },
  { id: 'gloria',   name: 'Gloria (Red Hair)', emoji: '👩‍🦰', color: '#e04040', path: 'characters/gloria/gloria.glb', pos: [0, 0, 0], rot: 0, variant: 'native', height: 168, isLara: false },
  { id: 'zoe',       name: 'Zoe (Red)',             emoji: '👠', color: '#c02040', path: 'characters/zoe/zoe.glb',             pos: [0, 0, 0], rot: 0, variant: 'native', height: 168, isLara: false },
  { id: 'sophia',    name: 'Sophia (Doll)',         emoji: '🎀', color: '#ff77aa', path: 'characters/sophia/sophia.glb',       pos: [0, 0, 0], rot: 0, variant: 'native', height: 168, isLara: false },
  { id: 'alex',      name: 'Alex',                  emoji: '🧢', color: '#4a90e2', path: 'characters/alex/alex.glb',           pos: [0, 0, 0], rot: 0, variant: 'native', height: 177.7, isLara: false },
  { id: 'david',     name: 'David',                 emoji: '👔', color: '#357abd', path: 'characters/david/david.glb',         pos: [0, 0, 0], rot: 0, variant: 'native', height: 176.7, isLara: false },
  { id: 'mannequin', name: 'Mannequin',             emoji: '🧍', color: '#888888', path: 'characters/mannequin/mannequin.glb', pos: [0, 0, 0], rot: 0, variant: 'native', height: 176.9, isLara: false },
  { id: 'michelle',  name: 'Michelle',              emoji: '💃', color: '#e056fd', path: 'characters/michelle/michelle.glb',   pos: [0, 0, 0], rot: 0, variant: 'native', height: 166.5, isLara: false },
  { id: 'lola',      name: 'Lola (Styperek)',       emoji: '👠', color: '#eb4d4b', path: 'characters/lola/lola.glb',           pos: [0, 0, 0], rot: 0, variant: 'native', height: 199.4, isLara: false },
  { id: 'jennifer',  name: 'Jennifer',              emoji: '👩', color: '#f0932b', path: 'characters/jennifer/jennifer.glb',   pos: [0, 0, 0], rot: 0, variant: 'native', height: 178.4, isLara: false },
  { id: 'arissa',    name: 'Arissa',                emoji: '🧕', color: '#6ab04c', path: 'characters/arissa/arissa.glb',       pos: [0, 0, 0], rot: 0, variant: 'native', height: 179.6, isLara: false },
  { id: 'astra',     name: 'Astra',                 emoji: '🚀', color: '#22a6b3', path: 'characters/astra/astra.glb',         pos: [0, 0, 0], rot: 0, variant: 'native', height: 172.6, isLara: false },
  { id: 'dummy',     name: 'Dummy',                 emoji: '🪵', color: '#95afc0', path: 'characters/dummy/dummy.glb',         pos: [0, 0, 0], rot: 0, variant: 'native', height: 176.6, isLara: false },
  { id: 'jody',      name: 'Jody',                  emoji: '👱‍♀️', color: '#ffbe76', path: 'characters/jody/jody.glb',           pos: [0, 0, 0], rot: 0, variant: 'native', height: 174.4, isLara: false },
  { id: 'kachujin',  name: 'Kachujin (Rosales)',    emoji: '🥷', color: '#30336b', path: 'characters/kachujin/kachujin.glb',   pos: [0, 0, 0], rot: 0, variant: 'native', height: 207.7, isLara: false },
  { id: 'medea',     name: 'Medea (Arrebola)',      emoji: '🧙‍♀️', color: '#be2edd', path: 'characters/medea/medea.glb',         pos: [0, 0, 0], rot: 0, variant: 'native', height: 165.1, isLara: false },
  { id: 'megan',     name: 'Megan',                 emoji: '👩‍🦰', color: '#badc58', path: 'characters/megan/megan.glb',         pos: [0, 0, 0], rot: 0, variant: 'native', height: 175.5, isLara: false },
  { id: 'olivia',    name: 'Olivia',                emoji: '🕶️', color: '#686de0', path: 'characters/olivia/olivia.glb',       pos: [0, 0, 0], rot: 0, variant: 'native', height: 174.6, isLara: false },
  { id: 'sophie',    name: 'Sophie',                emoji: '💁‍♀️', color: '#c7ecee', path: 'characters/sophie/sophie.glb',       pos: [0, 0, 0], rot: 0, variant: 'native', height: 176.9, isLara: false },
  { id: 'skeleton',          name: 'Skeleton',              emoji: '💀', color: '#e0e0e0', path: 'characters/skeleton/skeleton.glb',                   pos: [0, 0, 0], rot: 0, variant: 'native', height: 175.0, isLara: false },
  { id: 'curious_skeleton',  name: 'Curious Skeleton',      emoji: '🦴', color: '#dcdde1', path: 'characters/curious_skeleton/curious_skeleton.glb',   pos: [0, 0, 0], rot: 0, variant: 'native', height: 175.0, isLara: false }
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

export type LaraCountMode = 1 | 2 | 4 | 10 | 15;

/** Nombres de Laras autorisés dans le sélecteur d'options (1, 2, 4, 10, 15) */
export const LARA_COUNT_MODES: LaraCountMode[] = [1, 2, 4, 10, 15];

/** Liste des 4 Laras activées pour le mode 4 joueuses */
export const FOUR_PLAYERS_LARA_IDS = new Set(['xbot', 'native', 'rosanna', 'marissa']);

/** Laras secondaires désactivées en mode 10 joueuses */
export const PERF_EXCLUDED_LARA_IDS = new Set(['angelina', 'lgbta']);

/** Détermine si un personnage fait partie des extras (tous ceux qui ne sont ni Lara ni Xbot) */
export function isExtraCharacter(c: CharacterConfig | string): boolean {
  const char = typeof c === 'string' ? findCharacter(c) : c;
  if (!char) return false;
  return char.id !== 'xbot' && char.isLara === false;
}

/** Liste des personnages extras (ni Lara ni Xbot) */
export const EXTRA_CHARACTERS = CHARACTERS.filter(isExtraCharacter);

/** Nombre de personnages extra spawnés aléatoirement dans la scène 3D */
export const DEFAULT_EXTRA_SPAWN_COUNT = 5;

/** Tire au sort N personnages extra distincts (par défaut 5), en garantissant l'inclusion d'un ID requis si fourni */
export function pickRandomExtraCharacterIds(count: number = DEFAULT_EXTRA_SPAWN_COUNT, requiredId?: string): string[] {
  const allExtraIds = EXTRA_CHARACTERS.map(c => c.id);
  const shuffled = [...allExtraIds].sort(() => 0.5 - Math.random());
  const selected = new Set<string>();
  if (requiredId && allExtraIds.includes(requiredId)) {
    selected.add(requiredId);
  }
  for (const id of shuffled) {
    if (selected.size >= count) break;
    selected.add(id);
  }
  return Array.from(selected);
}

export function isCharacterVisibleInMode(
  id: string,
  mode: LaraCountMode = 15,
  activeWalkerId?: string,
  extraCharacters: boolean = false,
  activeExtraIds?: string[] | Set<string>
): boolean {
  if (isExtraCharacter(id)) {
    if (activeWalkerId === id) return true;
    if (!extraCharacters) return false;
    if (activeExtraIds) {
      return activeExtraIds instanceof Set ? activeExtraIds.has(id) : activeExtraIds.includes(id);
    }
    return true;
  }
  if (mode === 1) {
    // Mode 1 (Xbot seul) : Strictement Xbot uniquement (aucun modèle Lara n'est instancié/chargé)
    return id === 'xbot';
  }
  if (mode === 2) {
    if (id === 'xbot') return true;
    if (activeWalkerId && activeWalkerId !== 'xbot') {
      return id === activeWalkerId;
    }
    return id === 'native';
  }
  if (mode === 4) {
    if (activeWalkerId && id === activeWalkerId) return true;
    return FOUR_PLAYERS_LARA_IDS.has(id);
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
  'xbot', 'native', 'rosanna', 'marissa', 'delphina', 'sara', 'cha', 'vivida', 'sabira', 'safa', 'romana', 'angelina', 'lgbta', 'sandra', 'rajaa', 'inyeong', 'hayley', 'gloria', 'zoe', 'sophia',
  'alex', 'david', 'mannequin', 'michelle', 'lola', 'jennifer', 'arissa', 'astra', 'dummy', 'jody', 'kachujin', 'medea', 'megan', 'olivia', 'sophie', 'skeleton', 'curious_skeleton'
]);
