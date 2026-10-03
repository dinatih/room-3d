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
  { id: 'hayley',   name: 'Hayley (Inyeong)', emoji: '👒', color: '#ff66aa', path: 'characters/hayley/hayley.glb', pos: [0, 0, 0], rot: 0, variant: 'native', height: 168, isLara: false },
  { id: 'gloria',   name: 'Gloria (Red Hair)', emoji: '👩‍🦰', color: '#e04040', path: 'characters/gloria/gloria.glb', pos: [0, 0, 0], rot: 0, variant: 'native', height: 168, isLara: false },
  { id: 'zoe',       name: 'Zoe (Red)',             emoji: '👠', color: '#c02040', path: 'characters/zoe/zoe.glb',             pos: [0, 0, 0], rot: 0, variant: 'native', height: 168, isLara: false },
  { id: 'sophia',    name: 'Sophia (Doll)',         emoji: '🎀', color: '#ff77aa', path: 'characters/sophia/sophia.glb',       pos: [0, 0, 0], rot: 0, variant: 'native', height: 168, isLara: false },
  { id: 'alex',      name: 'Alex',                  emoji: '🧢', color: '#4a90e2', path: 'characters/alex/alex.glb',           pos: [0, 0, 0], rot: 0, variant: 'native', height: 177.7, isLara: false },
  { id: 'david',     name: 'David',                 emoji: '👔', color: '#357abd', path: 'characters/david/david.glb',         pos: [0, 0, 0], rot: 0, variant: 'native', height: 176.7, isLara: false },
  { id: 'mannequin', name: 'Mannequin',             emoji: '🧍', color: '#888888', path: 'characters/mannequin/mannequin.glb', pos: [0, 0, 0], rot: 0, variant: 'native', height: 176.9, isLara: false },
  { id: 'jennifer',  name: 'Jennifer',              emoji: '👩', color: '#f0932b', path: 'characters/jennifer/jennifer.glb',   pos: [0, 0, 0], rot: 0, variant: 'native', height: 178.4, isLara: false },
  { id: 'skeleton',          name: 'Skeleton',              emoji: '💀', color: '#e0e0e0', path: 'characters/skeleton/skeleton.glb',                   pos: [0, 0, 0], rot: 0, variant: 'native', height: 175.0, isLara: false },
  { id: 'curious_skeleton',  name: 'Curious Skeleton',      emoji: '🦴', color: '#dcdde1', path: 'characters/curious_skeleton/curious_skeleton.glb',   pos: [0, 0, 0], rot: 0, variant: 'native', height: 175.0, isLara: false },
  { id: 'valby',             name: 'Valby (Nano Suit)',     emoji: '🫧', color: '#00d2ff', path: 'characters/valby/valby.glb',                         pos: [0, 0, 0], rot: 0, variant: 'native', height: 168.0, isLara: false },
  { id: 'james',             name: 'James',                 emoji: '🧑', color: '#e74c3c', path: 'characters/james/james.glb',                         pos: [0, 0, 0], rot: 0, variant: 'native', height: 182.0, isLara: false },
  { id: 'ivy',               name: 'Ivy',                   emoji: '🌿', color: '#2ecc71', path: 'characters/ivy/ivy.glb',                             pos: [0, 0, 0], rot: 0, variant: 'native', height: 170.5, isLara: false },
  { id: 'lewis',             name: 'Lewis',                 emoji: '🧑🏾‍🦲', color: '#d63031', path: 'characters/lewis/lewis.glb',                         pos: [0, 0, 0], rot: 0, variant: 'native', height: 175.6, isLara: false },
  { id: 'maynard',           name: 'Maynard',               emoji: '👽', color: '#636e72', path: 'characters/maynard/maynard.glb',                     pos: [0, 0, 0], rot: 0, variant: 'native', height: 177.2, isLara: false },
  { id: 'nurse',             name: 'Nurse (Elf)',           emoji: '🩺', color: '#fd79a8', path: 'characters/nurse/nurse.glb',                         pos: [0, 0, 0], rot: 0, variant: 'native', height: 172.0, isLara: false },
];

/** Retourne le label complet d'un NPC : "emoji nom" (utile dans les UI pour éviter les noms en dur) */
export function npcLabel(char: CharacterConfig): string {
  return `${char.emoji} ${char.name}`;
}

/** Retourne un NPC par son id, ou undefined si introuvable */
export function findCharacter(id: string): CharacterConfig | undefined {
  return CHARACTERS.find(c => c.id === id);
}

/**
 * Recherche souple d'un personnage par son ID ou son Nom (insensible à la casse, tolérant aux espaces/tirets)
 */
export function findCharacterByIdOrName(query: string): CharacterConfig | undefined {
  if (!query) return undefined;
  const q = query.trim().toLowerCase();
  if (!q) return undefined;

  // 1. Match direct sur ID exact (insensible à la casse)
  const byId = CHARACTERS.find(c => c.id.toLowerCase() === q);
  if (byId) return byId;

  // 2. Match direct sur Nom exact (insensible à la casse)
  const byName = CHARACTERS.find(c => c.name.toLowerCase() === q);
  if (byName) return byName;

  // 3. Normalisation (suppression des tirets, underscores, espaces, parenthèses)
  const simplify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const simpleQ = simplify(q);
  if (simpleQ) {
    const bySimpleId = CHARACTERS.find(c => simplify(c.id) === simpleQ);
    if (bySimpleId) return bySimpleId;

    const bySimpleName = CHARACTERS.find(c => simplify(c.name) === simpleQ);
    if (bySimpleName) return bySimpleName;

    // Début du nom (ex: "gloria" correspond à "Gloria (Red Hair)", "hayley" à "Hayley (Inyeong)")
    const byPrefix = CHARACTERS.find(c => simplify(c.name).startsWith(simpleQ) || simplify(c.id).startsWith(simpleQ));
    if (byPrefix) return byPrefix;

    // Inclusion dans le nom (ex: "skeleton" correspond à "Skeleton")
    const byIncludes = CHARACTERS.find(c => simplify(c.name).includes(simpleQ) || simplify(c.id).includes(simpleQ));
    if (byIncludes) return byIncludes;
  }

  return undefined;
}

/**
 * Analyse l'URL pour détecter si un PNJ actif spécifique est demandé par son id ou son nom.
 * Supporte : ?pnj=..., ?npc=..., ?char=..., ?character=..., ?perso=..., ?walker=..., ?player=...
 */
export function parseUrlActiveCharacter(): CharacterConfig | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    let search = window.location.search;
    if (!search && window.location.hash.includes('?')) {
      search = window.location.hash.substring(window.location.hash.indexOf('?'));
    }
    const params = new URLSearchParams(search);
    const raw = params.get('pnj') ??
                params.get('npc') ??
                params.get('char') ??
                params.get('character') ??
                params.get('perso') ??
                params.get('walker') ??
                params.get('player') ??
                params.get('joueur');

    if (raw) {
      return findCharacterByIdOrName(raw);
    }
  } catch {}
  return undefined;
}

/**
 * Met à jour le paramètre d'URL pour le PNJ actif
 */
export function updateUrlActiveCharacter(charIdOrName: string) {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    url.searchParams.set('pnj', charIdOrName);
    window.history.replaceState(null, '', url.toString());
  } catch {}
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

/** Liste des personnages principaux / non-extras (Laras et Xbot, 15 au total) */
export const NON_EXTRA_CHARACTERS = CHARACTERS.filter(c => !isExtraCharacter(c));

/** Calcule les identifiants actifs par défaut pour les non-extras selon le mode numérique */
export function getDefaultNonExtraIds(
  mode: LaraCountMode = 15,
  activeWalkerId?: string
): string[] {
  if (mode === 1) return ['xbot'];
  if (mode === 2) {
    const list = ['xbot'];
    if (activeWalkerId && !isExtraCharacter(activeWalkerId) && activeWalkerId !== 'xbot') {
      list.push(activeWalkerId);
    } else {
      list.push('native');
    }
    return list;
  }
  if (mode === 4) {
    const set = new Set(FOUR_PLAYERS_LARA_IDS);
    if (activeWalkerId && !isExtraCharacter(activeWalkerId)) {
      set.add(activeWalkerId);
    }
    return Array.from(set);
  }
  if (mode === 10) {
    const list = NON_EXTRA_CHARACTERS.filter(c => !PERF_EXCLUDED_LARA_IDS.has(c.id)).map(c => c.id);
    if (activeWalkerId && !isExtraCharacter(activeWalkerId) && !list.includes(activeWalkerId)) {
      list.push(activeWalkerId);
    }
    return list;
  }
  return NON_EXTRA_CHARACTERS.map(c => c.id);
}

/** Groupe des 4 personnages Redmans */
export const REDMAN_EXTRA_IDS = ['alex', 'david', 'james', 'lewis'] as const;

/** Groupe des personnages Anatomiques (modèles anatomiques, mannequins et squelettes) */
export const ANATOMICAL_EXTRA_IDS = [
  'zoe',
  'sophia',
  'mannequin',
  'maynard',
  'skeleton',
  'curious_skeleton'
] as const;

export function isCharacterVisibleInMode(
  id: string,
  mode: LaraCountMode = 15,
  activeWalkerId?: string,
  extraCharacters: boolean = false,
  activeExtraIds?: string[] | Set<string>,
  activeMainIds?: string[] | Set<string>
): boolean {
  if (isExtraCharacter(id)) {
    if (activeWalkerId === id) return true;
    if (!extraCharacters) return false;
    if (activeExtraIds) {
      return activeExtraIds instanceof Set ? activeExtraIds.has(id) : activeExtraIds.includes(id);
    }
    return true;
  }

  // Personnages réguliers (Laras et Xbot)
  if (activeWalkerId === id) return true;

  if (activeMainIds) {
    return activeMainIds instanceof Set ? activeMainIds.has(id) : activeMainIds.includes(id);
  }

  // Fallback si activeMainIds n'est pas fourni (comportement par défaut)
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
  'xbot', 'native', 'rosanna', 'marissa', 'delphina', 'sara', 'cha', 'vivida', 'sabira', 'safa', 'romana', 'angelina', 'lgbta', 'sandra', 'rajaa', 'hayley', 'gloria', 'zoe', 'sophia', 'valby',
  'alex', 'david', 'mannequin', 'jennifer', 'skeleton', 'curious_skeleton', 'james', 'ivy', 'lewis', 'maynard', 'nurse'
]);
