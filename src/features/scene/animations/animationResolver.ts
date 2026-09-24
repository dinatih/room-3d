/**
 * animationResolver.ts — Fonctions de résolution et requêtes d'animations par alias, id et tags.
 */

import { ANIMATION_DEFINITIONS, AnimationDefinition } from './animationRegistry';

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
): { animation: string; rotYOffset?: number; id?: string } | null {
  // Cas 1 : tags passés sous forme de tableau
  if (Array.isArray(query)) {
    const matches = getAnimationsByTags(query, matchMode);
    if (matches.length === 0) return null;
    const picked = matches[Math.floor(Math.random() * matches.length)];
    return { animation: picked.path, rotYOffset: picked.defaultRotYOffset, id: picked.id };
  }

  // Cas 2 : query sous forme de chaîne préfixée par "tag:" (ex: "tag:sitting" ou "tag:sitting,happy")
  if (query.startsWith('tag:')) {
    const tagString = query.substring(4);
    const tags = tagString.split(',').map((s) => s.trim()).filter(Boolean);
    const matches = getAnimationsByTags(tags, matchMode);
    if (matches.length === 0) return null;
    const picked = matches[Math.floor(Math.random() * matches.length)];
    return { animation: picked.path, rotYOffset: picked.defaultRotYOffset, id: picked.id };
  }

  // Cas 3 : si la chaîne correspond exactement à un tag connu
  if (tagToDefsMap.has(query.toLowerCase())) {
    const matches = tagToDefsMap.get(query.toLowerCase())!;
    if (matches.length > 0) {
      const picked = matches[Math.floor(Math.random() * matches.length)];
      return { animation: picked.path, rotYOffset: picked.defaultRotYOffset, id: picked.id };
    }
  }

  // Cas 4 : Résolution d'un alias ou ID unique
  const def = getAnimationDef(query);
  if (def) {
    return { animation: def.path, rotYOffset: def.defaultRotYOffset, id: def.id };
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
  variants?: Array<{
    canonicalId: string;
    aliasUsed?: string;
    clipName: string;
  }>;
}

/**
 * Analyse un slot de Smart Object pour extraire :
 * - l'ID canonique de l'animation
 * - l'alias utilisé
 * - les tags et packs sémantiques
 * - les variantes associées
 */
export function resolveSlotAnimationInfo(slot: {
  animation?: string;
  animationsRandom?: string | string[];
  availableAnims?: string[];
  isDuo?: boolean;
  duoAnimId?: string;
  slotId?: string;
}): SlotAnimationMeta {
  // Cas 1 : Animation Duo
  if (slot.isDuo) {
    const duoId = slot.duoAnimId ?? slot.slotId ?? 'duo';
    const def = getAnimationDef(duoId);
    return {
      canonicalId: def?.id ?? duoId,
      aliasUsed: slot.duoAnimId ?? slot.slotId,
      allAliases: def?.aliases ?? (slot.duoAnimId ? [slot.duoAnimId] : undefined),
      tags: def?.tags ?? ['duo'],
      clipName: def?.path ? def.path.split('/').pop()?.replace('.glb', '') ?? duoId : duoId,
      duration: def?.duration,
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
      duration: def?.duration,
      variants,
    };
  }

  // Cas 3 : Pack d'animations aléatoires (animationsRandom)
  if (slot.animationsRandom) {
    const packStr = Array.isArray(slot.animationsRandom)
      ? slot.animationsRandom.join(', ')
      : slot.animationsRandom;

    const matchingDefs = typeof slot.animationsRandom === 'string'
      ? getAnimationsByTags(slot.animationsRandom)
      : [];

    const first = matchingDefs[0];
    const canonicalId = first
      ? `${first.id}${matchingDefs.length > 1 ? ` (+${matchingDefs.length - 1} anims)` : ''}`
      : packStr;

    const aliasUsed = first?.aliases?.[0] ?? packStr;

    const variants = (matchingDefs.length > 0
      ? matchingDefs.slice(0, 6)
      : (slot.availableAnims ?? []).map((a) => getAnimationDef(a)).filter(Boolean) as AnimationDefinition[]
    ).map((d) => ({
      canonicalId: d.id,
      aliasUsed: d.aliases?.[0],
      clipName: d.path.split('/').pop()?.replace('.glb', '') ?? d.id,
    }));

    return {
      canonicalId,
      aliasUsed,
      allAliases: first?.aliases,
      tags: first?.tags ?? (typeof slot.animationsRandom === 'string' ? [slot.animationsRandom] : []),
      pack: packStr,
      clipName: first?.path ? first.path.split('/').pop()?.replace('.glb', '') ?? packStr : packStr,
      duration: first?.duration,
      variants: variants.length > 0 ? variants : undefined,
    };
  }

  return {
    canonicalId: 'default',
    tags: [],
    clipName: 'défaut',
  };
}
