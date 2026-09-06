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
 * Rétrocompatible : si la clé n'est pas dans le registre mais semble être un chemin (ex: finit par .glb),
 * elle est renvoyée telle quelle.
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
