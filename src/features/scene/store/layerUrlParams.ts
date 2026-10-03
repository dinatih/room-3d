import type { LayerState, GroundType } from '../sidepanel/types';

export interface LayerUrlMapping {
  layerKey: keyof LayerState;
  canonicalParam: string;
  urlParams: string[];
  defaultValue: boolean;
}

export const MONITORED_LAYERS: LayerUrlMapping[] = [
  {
    layerKey: 'wallStructure',
    canonicalParam: 'wallStructure',
    urlParams: ['wallstructure', 'structuremural', 'structure-mural', 'structure-murale', 'structuremurale', 'murs', 'mur'],
    defaultValue: true,
  },
  {
    layerKey: 'structure',
    canonicalParam: 'structure',
    urlParams: ['structure', 'dalle', 'plafond', 'dalle-plafond', 'dalleplafond'],
    defaultValue: true,
  },
  {
    layerKey: 'doors',
    canonicalParam: 'doors',
    urlParams: ['doors', 'door', 'portes', 'porte'],
    defaultValue: true,
  },
  {
    layerKey: 'equipment',
    canonicalParam: 'equipment',
    urlParams: ['equipment', 'equipement', 'equipements'],
    defaultValue: true,
  },
  {
    layerKey: 'furniture',
    canonicalParam: 'furniture',
    urlParams: ['furniture', 'mobilier', 'meubles', 'meuble'],
    defaultValue: true,
  },
  {
    layerKey: 'furnishings',
    canonicalParam: 'furnishings',
    urlParams: ['furnishings', 'furnishing', 'habillage', 'habillages'],
    defaultValue: true,
  },
  {
    layerKey: 'decor',
    canonicalParam: 'decor',
    urlParams: ['decor', 'decoration', 'decorations', 'deco'],
    defaultValue: true,
  },
  {
    layerKey: 'mirrors',
    canonicalParam: 'mirrors',
    urlParams: ['mirrors', 'mirror', 'miroir', 'miroirs'],
    defaultValue: true,
  },
  {
    layerKey: 'mirrorsHD',
    canonicalParam: 'mirrorsHD',
    urlParams: ['mirrorshd', 'mirrorhd', 'mirror-hd', 'miroirhd', 'miroir-hd', 'miroirs-hd', 'miroirshd'],
    defaultValue: false,
  },
  {
    layerKey: 'neighbors',
    canonicalParam: 'neighbors',
    urlParams: ['neighbors', 'neighbor', 'voisins', 'voisin'],
    defaultValue: false,
  },
  {
    layerKey: 'lidar',
    canonicalParam: 'lidar',
    urlParams: ['lidar', 'lidarscan', 'lidar-scan'],
    defaultValue: false,
  },
  {
    layerKey: 'wireframe',
    canonicalParam: 'wireframe',
    urlParams: ['wireframe', 'filaire', 'grille-filaire', 'fildefer', 'fil-de-fer'],
    defaultValue: false,
  },
  {
    layerKey: 'animals',
    canonicalParam: 'animals',
    urlParams: ['animals', 'animal', 'animaux', 'animeaux', 'pets'],
    defaultValue: true,
  },
  {
    layerKey: 'pillarsOnly',
    canonicalParam: 'pillarsOnly',
    urlParams: ['pillarsonly', 'pillar-only', 'pillars', 'piliers', 'piliersseuls', 'piliers-seuls'],
    defaultValue: false,
  },
  {
    layerKey: 'shadows',
    canonicalParam: 'shadows',
    urlParams: ['shadows', 'shadow', 'ombres', 'ombre'],
    defaultValue: true,
  },
  {
    layerKey: 'extraCharacters',
    canonicalParam: 'extraCharacters',
    urlParams: ['extracharacters', 'extra', 'extras', 'personnagesextras', 'personnages-extras', 'extra-characters'],
    defaultValue: false,
  },
  {
    layerKey: 'bermudaGrass',
    canonicalParam: 'bermudaGrass',
    urlParams: ['bermudagrass', 'herbe', 'grass', 'terrain-ext', 'terrain'],
    defaultValue: true,
  },
];

function parseBooleanParam(val: string | null): boolean | undefined {
  if (val === null || val === '') return true; // drapeau présent sans valeur, ex: ?lidar ou ?voisin
  const lower = val.trim().toLowerCase();
  if (lower === '1' || lower === 'true' || lower === 'on' || lower === 'yes' || lower === 'show' || lower === 'visible') {
    return true;
  }
  if (lower === '0' || lower === 'false' || lower === 'off' || lower === 'no' || lower === 'hide' || lower === 'none') {
    return false;
  }
  return undefined;
}

/**
 * Analyse l'URL pour détecter le type d'herbe et terrain demandé.
 * Supporte : ?ground=..., ?grass=..., ?herbe=..., ?terrain=..., ?sol=...
 * Valeurs : bermuda, medium_01, medium_02, celandine, mud_leaves, none
 */
export function parseUrlGroundType(): { groundType?: GroundType; active?: boolean } {
  if (typeof window === 'undefined') return {};
  try {
    let search = window.location.search;
    if (!search && window.location.hash.includes('?')) {
      search = window.location.hash.substring(window.location.hash.indexOf('?'));
    }
    const params = new URLSearchParams(search);

    const raw = params.get('ground') ??
                params.get('grass') ??
                params.get('herbe') ??
                params.get('terrain') ??
                params.get('sol') ??
                params.get('groundtype') ??
                params.get('groundType');

    if (raw !== null) {
      const lower = raw.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
      if (lower === 'none' || lower === '0' || lower === 'false' || lower === 'aucun' || lower === 'sans') {
        return { groundType: 'none', active: false };
      }
      if (lower.includes('bermuda') || lower === 'gazon') {
        return { groundType: 'bermuda', active: true };
      }
      if (lower.includes('medium_01') || lower === 'medium01' || lower === 'medium1' || lower === 'moyen1' || lower === 'moyen_01') {
        return { groundType: 'medium_01', active: true };
      }
      if (lower.includes('medium_02') || lower === 'medium02' || lower === 'medium2' || lower === 'moyen2' || lower === 'moyen_02') {
        return { groundType: 'medium_02', active: true };
      }
      if (lower.includes('celandine') || lower.includes('chelidoine') || lower.includes('prairie') || lower.includes('fleur')) {
        return { groundType: 'celandine', active: true };
      }
      if (lower.includes('mud') || lower.includes('leaves') || lower.includes('terre') || lower.includes('feuille')) {
        return { groundType: 'mud_leaves', active: true };
      }
    }
  } catch {}
  return {};
}

/**
 * Met à jour le paramètre d'URL pour le type d'herbe / sol
 */
export function updateUrlGroundType(type: GroundType) {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    url.searchParams.set('ground', type);
    window.history.replaceState(null, '', url.toString());
  } catch {}
}

export function parseUrlLayerOverrides(): Partial<Record<keyof LayerState, boolean>> {
  if (typeof window === 'undefined') return {};
  try {
    let search = window.location.search;
    if (!search && window.location.hash.includes('?')) {
      search = window.location.hash.substring(window.location.hash.indexOf('?'));
    }
    const params = new URLSearchParams(search);
    const overrides: Partial<Record<keyof LayerState, boolean>> = {};

    // Normalisation en minuscules de toutes les clés d'URL présentes
    const lowerParams = new Map<string, string>();
    for (const [key, val] of params.entries()) {
      lowerParams.set(key.toLowerCase(), val);
    }

    for (const mapping of MONITORED_LAYERS) {
      // 1. Drapeaux négatifs (ex: no-portes, no-doors, etc.)
      let foundNegative = false;
      for (const p of mapping.urlParams) {
        const lowerP = p.toLowerCase();
        if (lowerParams.has(`no-${lowerP}`) || lowerParams.has(`no_${lowerP}`)) {
          overrides[mapping.layerKey] = false;
          foundNegative = true;
          break;
        }
      }
      if (foundNegative) continue;

      // 2. Paramètre canonique en minuscules
      const canonLower = mapping.canonicalParam.toLowerCase();
      if (lowerParams.has(canonLower)) {
        const val = lowerParams.get(canonLower) ?? null;
        const parsed = parseBooleanParam(val);
        if (parsed !== undefined) {
          overrides[mapping.layerKey] = parsed;
          continue;
        }
      }

      // 3. Alias en minuscules
      for (const p of mapping.urlParams) {
        const lowerP = p.toLowerCase();
        if (lowerParams.has(lowerP)) {
          const val = lowerParams.get(lowerP) ?? null;
          const parsed = parseBooleanParam(val);
          if (parsed !== undefined) {
            overrides[mapping.layerKey] = parsed;
            break;
          }
        }
      }
    }

    return overrides;
  } catch {
    return {};
  }
}

/**
 * Met à jour le paramètre d'URL pour le calque spécifié
 */
export function updateUrlLayer(key: keyof LayerState, value: boolean) {
  if (typeof window === 'undefined') return;
  try {
    const mapping = MONITORED_LAYERS.find(m => m.layerKey === key);
    if (!mapping) return;

    const url = new URL(window.location.href);

    // Supprimer les alias précédents en ignorant la casse
    const allKeysToDelete: string[] = [];
    const lowerTargets = new Set([
      mapping.canonicalParam.toLowerCase(),
      ...mapping.urlParams.map(p => p.toLowerCase()),
      ...mapping.urlParams.map(p => `no-${p.toLowerCase()}`),
      ...mapping.urlParams.map(p => `no_${p.toLowerCase()}`),
    ]);

    for (const k of url.searchParams.keys()) {
      if (lowerTargets.has(k.toLowerCase())) {
        allKeysToDelete.push(k);
      }
    }
    for (const k of allKeysToDelete) {
      url.searchParams.delete(k);
    }

    // Écrire le paramètre canonique
    url.searchParams.set(mapping.canonicalParam, value ? '1' : '0');
    window.history.replaceState(null, '', url.toString());
  } catch {}
}
