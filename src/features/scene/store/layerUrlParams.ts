import type { LayerState } from '../sidepanel/types';

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
    urlParams: ['wallstructure', 'wallstructure', 'structuremural', 'structure-mural', 'structure-murale', 'structuremurale', 'murs', 'mur'],
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
    urlParams: ['mirrorshd', 'mirrorshd', 'mirrorhd', 'mirror-hd', 'miroirhd', 'miroir-hd', 'miroirs-hd', 'miroirshd'],
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
