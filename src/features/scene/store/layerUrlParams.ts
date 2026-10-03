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

/**
 * Analyse l'URL pour détecter les surcharges de visibilité des calques demandés.
 */
export function parseUrlLayerOverrides(): Partial<Record<keyof LayerState, boolean>> {
  if (typeof window === 'undefined') return {};
  try {
    let search = window.location.search;
    if (!search && window.location.hash.includes('?')) {
      search = window.location.hash.substring(window.location.hash.indexOf('?'));
    }
    const params = new URLSearchParams(search);
    const overrides: Partial<Record<keyof LayerState, boolean>> = {};

    for (const mapping of MONITORED_LAYERS) {
      // 1. Drapeaux négatifs "no-..."
      let foundNegative = false;
      for (const p of mapping.urlParams) {
        if (params.has(`no-${p}`) || params.has(`no_${p}`)) {
          overrides[mapping.layerKey] = false;
          foundNegative = true;
          break;
        }
      }
      if (foundNegative) continue;

      // 2. Paramètres directs
      for (const p of mapping.urlParams) {
        if (params.has(p)) {
          const val = params.get(p);
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

    // Supprimer les alias précédents pour éviter la redondance
    for (const p of mapping.urlParams) {
      url.searchParams.delete(p);
      url.searchParams.delete(`no-${p}`);
      url.searchParams.delete(`no_${p}`);
    }

    // Si la valeur est différente de la valeur par défaut ou si elle était déjà dans l'URL, on l'écrit
    url.searchParams.set(mapping.canonicalParam, value ? '1' : '0');
    window.history.replaceState(null, '', url.toString());
  } catch {}
}
