/**
 * animationResolver.ts — Fonctions de résolution et requêtes d'animations par alias, id et tags.
 */

import { ANIMATION_DEFINITIONS, AnimationDefinition } from './animationRegistry';
import { getDuoAnimationDef, DuoAnimationDef } from '../ai/duoAnimations';

// Index de recherche rapide par clé (id canonique, alias ou path direct)
const keyToDefMap = new Map<string, AnimationDefinition>();
// Index de recherche par tag
const tagToDefsMap = new Map<string, AnimationDefinition[]>();

function buildIndexes() {
  keyToDefMap.clear();
  tagToDefsMap.clear();

  for (const def of ANIMATION_DEFINITIONS) {
    // Clé ID
    keyToDefMap.set(def.id.toLowerCase(), def);
    // Clé Path
    keyToDefMap.set(def.path.toLowerCase(), def);
    keyToDefMap.set(def.path.replace(/^\//, '').toLowerCase(), def);

    // Clés Alias
    if (def.aliases) {
      for (const alias of def.aliases) {
        keyToDefMap.set(alias.toLowerCase(), def);
      }
    }

    // Indexation par tags
    for (const tag of def.tags) {
      const normalizedTag = tag.toLowerCase();
      let list = tagToDefsMap.get(normalizedTag);
      if (!list) {
        list = [];
        tagToDefsMap.set(normalizedTag, list);
      }
      list.push(def);
    }
  }
}

// Initialisation au chargement du module
buildIndexes();

/**
 * Retrouve une définition d'animation par son id, un de ses alias ou son chemin direct.
 */
export function getAnimationDef(key: string): AnimationDefinition | undefined {
  if (!key) return undefined;
  if (keyToDefMap.size === 0) {
    buildIndexes();
  }
  return keyToDefMap.get(key.trim().toLowerCase());
}

/**
 * Résout une clé (id, alias ou chemin direct) vers le chemin GLB réel.
 * Si la clé n'est pas trouvée dans le registre mais est déjà un chemin, elle est renvoyée directement.
 */
export function resolveAnimationPath(keyOrPath: string): string {
  if (!keyOrPath) return '';
  const def = getAnimationDef(keyOrPath);
  if (def) {
    return def.path;
  }
  return keyOrPath;
}

/**
 * Résout une clé (alias, nom de slot ou chemin) vers l'ID canonique de l'animation dans le registre.
 * Si l'animation n'est pas trouvée, renvoie la clé nettoyée.
 */
export function resolveAnimationId(keyOrPath: string): string {
  if (!keyOrPath) return '';
  const def = getAnimationDef(keyOrPath);
  if (def) {
    return def.id;
  }
  return keyOrPath;
}

/**
 * Retourne toutes les définitions d'animations correspondant à un ou plusieurs tags.
 * @param tags Tag unique ou tableau de tags
 * @param matchMode 'all' = doit posséder tous les tags, 'any' = doit posséder au moins un tag
 */
export function getAnimationsByTags(
  tags: string | string[],
  matchMode: 'all' | 'any' = 'all'
): AnimationDefinition[] {
  const tagList = (Array.isArray(tags) ? tags : [tags]).map((t) => t.trim().toLowerCase()).filter(Boolean);
  if (tagList.length === 0) return [];

  if (matchMode === 'any') {
    const resultSet = new Set<AnimationDefinition>();
    for (const tag of tagList) {
      const defs = tagToDefsMap.get(tag) || [];
      for (const d of defs) resultSet.add(d);
    }
    return Array.from(resultSet);
  }

  // matchMode === 'all'
  return ANIMATION_DEFINITIONS.filter((def) => {
    const defTags = new Set(def.tags.map((t) => t.toLowerCase()));
    return tagList.every((tag) => defTags.has(tag));
  });
}

/**
 * Tire aléatoirement une animation correspondant soit :
 * - à une requête de tags préfixée par "tag:" (ex: "tag:dance", "tag:sitting,social")
 * - à un tag direct ou tableau de tags
 * - ou résout un alias/id unique
 */
export function getRandomAnimationByQuery(
  query: string | string[],
  matchMode: 'all' | 'any' = 'all'
): { animation: string; rotYOffset?: number; defaultOffset?: [number, number, number]; id?: string } | null {
  // Cas 1 : tags passés sous forme de tableau
  if (Array.isArray(query)) {
    const matches = getAnimationsByTags(query, matchMode);
    if (matches.length === 0) return null;
    const picked = matches[Math.floor(Math.random() * matches.length)];
    return { animation: picked.path, rotYOffset: picked.defaultRotYOffset, defaultOffset: picked.defaultOffset, id: picked.id };
  }

  // Cas 2 : query sous forme de chaîne préfixée par "tag:" (ex: "tag:sitting" ou "tag:sitting,happy")
  if (query.startsWith('tag:')) {
    const tagString = query.substring(4);
    const tags = tagString.split(',').map((s) => s.trim()).filter(Boolean);
    const matches = getAnimationsByTags(tags, matchMode);
    if (matches.length === 0) return null;
    const picked = matches[Math.floor(Math.random() * matches.length)];
    return { animation: picked.path, rotYOffset: picked.defaultRotYOffset, defaultOffset: picked.defaultOffset, id: picked.id };
  }

  // Cas 3 : si la chaîne correspond exactement à un tag connu
  if (tagToDefsMap.has(query.toLowerCase())) {
    const matches = tagToDefsMap.get(query.toLowerCase())!;
    if (matches.length > 0) {
      const picked = matches[Math.floor(Math.random() * matches.length)];
      return { animation: picked.path, rotYOffset: picked.defaultRotYOffset, defaultOffset: picked.defaultOffset, id: picked.id };
    }
  }

  // Cas 4 : Résolution d'un alias ou ID unique
  const def = getAnimationDef(query);
  if (def) {
    return { animation: def.path, rotYOffset: def.defaultRotYOffset, defaultOffset: def.defaultOffset, id: def.id };
  }

  return null;
}

export interface SlotAnimationMeta {
  canonicalId: string;       // ID canonique unique (ex: 'sitting-idle', 'wash-hands')
  aliasUsed?: string;        // Alias utilisé pour ce slot (ex: 'sit-idle', 'seated-front')
  allAliases?: string[];     // Tous les alias définis
  tags: string[];            // Tags sémantiques (ex: ['sitting', 'seated-front'])
  pack?: string;             // Nom du pack si sélection groupée/aléatoire
  clipName: string;          // Nom du fichier / clip
  duration?: number;
  label?: string;
  defaultRotYOffset?: number;
  defaultOffset?: [number, number, number];
  variants?: Array<{
    canonicalId: string;
    aliasUsed?: string;
    clipName: string;
    duration?: number;
    label?: string;
    defaultRotYOffset?: number;
  }>;
}

const PACK_TAG_MAP: Record<string, string[]> = {
  'laying-pack': ['laying'],
  'all-dances': ['dance'],
  'seated-front-pack': ['seated-front'],
  'sitted-front-pack': ['seated-front'],
  'seated-side-pack': ['seated-side'],
  'side-sitted-pack': ['seated-side'],
  'sitting-front': ['seated-front'],
  'sitting-side': ['seated-side'],
  'laying-front-pack': ['laying-front'],
  'lay-front-pack': ['laying-front'],
  'laying-side-pack': ['laying-side'],
  'lay-side-pack': ['laying-side'],
  'lay-front': ['laying-front'],
  'lay-side': ['laying-side'],
};

/**
 * Analyse un slot de Smart Object pour extraire :
 * - l'ID canonique de l'animation
 * - la durée canonique
 * - l'alias utilisé
 * - les tags et packs sémantiques
 * - les variantes associées avec leurs durées
 */
export function resolveSlotAnimationInfo(slot: {
  animation?: string;
  animationsRandom?: string | string[];
  availableAnims?: string[];
  isDuo?: boolean;
  duoAnimId?: string;
  duoPool?: string[];
  slotId?: string;
  duration?: number;
}): SlotAnimationMeta {
  // Cas 1 : Animation Duo
  if (slot.isDuo) {
    if (slot.duoPool && slot.duoPool.length > 0) {
      const duoDefs = slot.duoPool
        .map((id) => getDuoAnimationDef(id))
        .filter((d): d is DuoAnimationDef => d !== undefined);

      const first = duoDefs[0];
      const variants = duoDefs.map((d) => ({
        canonicalId: d.id,
        duration: d.duration,
        label: d.label,
        clipName: `${d.animA} / ${d.animB}`,
      }));

      return {
        canonicalId: first?.id ?? slot.duoPool[0],
        duration: slot.duration ?? first?.duration,
        label: first?.label ?? first?.id ?? slot.duoPool[0],
        clipName: first ? `${first.animA} / ${first.animB}` : 'duo',
        tags: ['duo'],
        variants: variants.length > 0 ? variants : undefined,
      };
    }

    const duoId = slot.duoAnimId ?? slot.slotId ?? 'duo';
    const duoDef = getDuoAnimationDef(duoId);
    if (duoDef) {
      return {
        canonicalId: duoDef.id,
        duration: slot.duration ?? duoDef.duration,
        label: duoDef.label,
        clipName: `${duoDef.animA} / ${duoDef.animB}`,
        tags: ['duo'],
      };
    }

    const def = getAnimationDef(duoId);
    return {
      canonicalId: def?.id ?? (duoId !== slot.slotId ? duoId : 'duo-action'),
      tags: def?.tags ?? ['duo'],
      clipName: def?.path ? def.path.split('/').pop()?.replace('.glb', '') ?? duoId : duoId,
      duration: slot.duration ?? def?.duration,
      label: def?.label || def?.id || duoId,
      defaultRotYOffset: def?.defaultRotYOffset,
      defaultOffset: def?.defaultOffset,
    };
  }

  // Cas 2 : Animation directe spécifiée
  if (slot.animation) {
    const raw = slot.animation;
    const def = getAnimationDef(raw);
    const clip = raw.split('/').pop()?.replace('.glb', '') ?? raw;

    let aliasUsed: string | undefined;
    if (def?.aliases?.length) {
      const match = def.aliases.find((a) => a.toLowerCase() === raw.toLowerCase());
      aliasUsed = match ?? def.aliases[0];
    } else if (!raw.includes('/') && !raw.endsWith('.glb')) {
      aliasUsed = raw;
    }

    const variants = slot.availableAnims?.map((v) => {
      const vDef = getAnimationDef(v);
      return {
        canonicalId: vDef?.id ?? v.split('/').pop()?.replace('.glb', '') ?? v,
        aliasUsed: vDef?.aliases?.[0] ?? (!v.includes('/') ? v : undefined),
        clipName: v.split('/').pop()?.replace('.glb', '') ?? v,
        duration: vDef?.duration,
        label: vDef?.label || vDef?.id,
        defaultRotYOffset: vDef?.defaultRotYOffset,
        defaultOffset: vDef?.defaultOffset,
      };
    });

    const packStr = slot.animationsRandom
      ? Array.isArray(slot.animationsRandom)
        ? slot.animationsRandom.join(', ')
        : slot.animationsRandom
      : undefined;

    return {
      canonicalId: def?.id ?? clip.replace(/^anim_/, ''),
      aliasUsed,
      allAliases: def?.aliases,
      tags: def?.tags ?? [],
      pack: packStr,
      clipName: def?.path ? def.path.split('/').pop()?.replace('.glb', '') ?? clip : clip,
      duration: slot.duration ?? def?.duration,
      label: def?.label || def?.id,
      defaultRotYOffset: def?.defaultRotYOffset,
      defaultOffset: def?.defaultOffset,
      variants,
    };
  }

  // Cas 3 : Pack d'animations aléatoires (animationsRandom)
  if (slot.animationsRandom) {
    const packStr = Array.isArray(slot.animationsRandom)
      ? slot.animationsRandom.join(', ')
      : slot.animationsRandom;

    let searchTags: string[] = [];
    if (typeof slot.animationsRandom === 'string') {
      searchTags = PACK_TAG_MAP[slot.animationsRandom] ?? [slot.animationsRandom];
    } else if (Array.isArray(slot.animationsRandom)) {
      searchTags = slot.animationsRandom;
    }

    const matchingDefs = getAnimationsByTags(searchTags, 'any');

    const first = matchingDefs[0];
    const canonicalId = first?.id ?? packStr;
    const duration = slot.duration ?? first?.duration;

    const variants = (matchingDefs.length > 0
      ? matchingDefs.slice(0, 16)
      : (slot.availableAnims ?? []).map((a) => getAnimationDef(a)).filter(Boolean) as AnimationDefinition[]
    ).map((d) => ({
      canonicalId: d.id,
      aliasUsed: d.aliases?.[0],
      clipName: d.path.split('/').pop()?.replace('.glb', '') ?? d.id,
      duration: d.duration,
      label: d.label || d.id,
      defaultRotYOffset: d.defaultRotYOffset,
      defaultOffset: d.defaultOffset,
    }));

    return {
      canonicalId,
      aliasUsed: first?.aliases?.[0],
      allAliases: first?.aliases,
      tags: first?.tags ?? searchTags,
      pack: packStr,
      clipName: first?.path ? first.path.split('/').pop()?.replace('.glb', '') ?? packStr : packStr,
      duration,
      label: first?.label || first?.id,
      defaultRotYOffset: first?.defaultRotYOffset,
      defaultOffset: first?.defaultOffset,
      variants: variants.length > 0 ? variants : undefined,
    };
  }

  return {
    canonicalId: 'default',
    tags: [],
    clipName: 'défaut',
  };
}
