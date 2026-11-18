import type { LayerState, GroundType, LaraClothing, LaraHoodieZip } from '../sidepanel/types';
import { ALL_LARA_CLOTHING_VALUES, LARA_HOODIE_ZIP_IDS } from '../character/laraOutfits';
import { getDebugPreset } from './debugPresets';
import { getUrlParams } from '../camera/cameraUrlParams';

/**
 * Source unique de vérité pour les valeurs par défaut de tous les calques booléens.
 * Utilisé par MONITORED_LAYERS (URL params) ET par useSceneStore (état initial).
 */
export const LAYER_DEFAULTS: Record<string, boolean> = {
  // Structure & architecture
  structure: false,
  wallStructure: true,
  floorCoverings: true,
  environment: true,
  bnfMarker: true,
  eiffelSparkle: true,
  montparnasseLights: true,
  bnfLights: true,
  arcLights: true,
  bridgeLights: true,
  bankLights: true,
  boisLights: true,
  seineBoats: true,
  seineDebugPath: false,
  doors: true,
  cutWalls: true,
  ceiling: false,
  // Contenu
  equipment: true,
  furniture: true,
  furnishings: true,
  decor: true,
  mirrorSurfaces: true,
  mirrors: true,
  neighbors: false,
  animals: true,
  robots: true,
  // Visualisation / debug
  wireframe: false,
  wireframeWallStructure: false,
  wireframeStructure: false,
  wireframeDoors: false,
  plan: false,
  grid: false,
  gridDepth: false,
  characterGrid: false,
  wallEdges: false,
  measuredDimensions: false,
  lidar: false,
  skeleton: false,
  // Éclairage & ombres
  lights: false,
  lightsHD: false,
  shadows: true,
  // Personnages
  character: true,
  extraCharacters: false,
  showAllLaraStyles: true,
  accessories: true,
  laraGlasses: true,
  laraPistols: true,
  laraShoes: true,
  laraSocks: false,
  laraSneakers: false,
  laraNeckBandana: false,
  laraWristBandana: false,
  laraRealisticTextures: false,
  pillarsOnly: false,
  wallhack: false,
  // Physique
  breastPhysics: true,
  hairPhysics: true,
  wigPhysics: true,
  characterShadows: true,
  characterWireframe: false,
  // FPV
  fpvHeadBobbing: false,
  fpvRealisticEyes: true,
  fpvStabilization: true,
  // IA & collisions
  aiZones: false,
  npcCollisions: true,
  debugNpcCollisions: false,
  debugFurnitureCollisions: false,
  windowStepElevation: true,
  // Terrain
  bermudaGrass: true,
  // Divers
  inventoryGrid: false,
  wigGrid: false,
  smokeTransition: true,
  animOriginLerp: true,
  animCrossfade: true,
};

export interface LayerUrlMapping {
  layerKey: keyof LayerState;
  canonicalParam: string;
  urlParams: string[];
}

export const MONITORED_LAYERS: LayerUrlMapping[] = [
  { layerKey: 'skeleton', canonicalParam: 'skeleton', urlParams: ['skeleton'] },
  ...(['bnfMarker', 'montparnasseLights', 'bnfLights', 'arcLights', 'bridgeLights', 'bankLights', 'boisLights', 'seineBoats', 'seineDebugPath'] as const).map(key => ({
    layerKey: key, canonicalParam: key, urlParams: [key.toLowerCase()],
  })),
  { layerKey: 'cutWalls', canonicalParam: 'cutWalls', urlParams: ['cutwalls', 'magazine', 'murscoupes'] },
  { layerKey: 'wigGrid', canonicalParam: 'wigGrid', urlParams: ['wiggrid'] },
  {
    layerKey: 'lightsHD',
    canonicalParam: 'lightsHD',
    urlParams: ['lightshd'],
  },
  {
    layerKey: 'wallStructure',
    canonicalParam: 'wallStructure',
    urlParams: ['wallstructure', 'structuremural', 'structure-mural', 'structure-murale', 'structuremurale', 'murs', 'mur'],
  },
  {
    layerKey: 'structure',
    canonicalParam: 'structure',
    urlParams: ['structure', 'dalle', 'plafond', 'dalle-plafond', 'dalleplafond'],
  },
  {
    layerKey: 'doors',
    canonicalParam: 'doors',
    urlParams: ['doors', 'door', 'portes', 'porte'],
  },
  {
    layerKey: 'equipment',
    canonicalParam: 'equipment',
    urlParams: ['equipment', 'equipement', 'equipements'],
  },
  {
    layerKey: 'furniture',
    canonicalParam: 'furniture',
    urlParams: ['furniture', 'mobilier', 'meubles', 'meuble'],
  },
  {
    layerKey: 'furnishings',
    canonicalParam: 'furnishings',
    urlParams: ['furnishings', 'furnishing', 'habillage', 'habillages'],
  },
  {
    layerKey: 'decor',
    canonicalParam: 'decor',
    urlParams: ['decor', 'decoration', 'decorations', 'deco'],
  },
  {
    layerKey: 'mirrorSurfaces',
    canonicalParam: 'mirrorSurfaces',
    urlParams: ['mirrorsurfaces'],
  },
  {
    layerKey: 'mirrors',
    canonicalParam: 'mirrors',
    urlParams: ['mirrors', 'mirror', 'miroir', 'miroirs'],
  },
  {
    layerKey: 'neighbors',
    canonicalParam: 'neighbors',
    urlParams: ['neighbors', 'neighbor', 'voisins', 'voisin'],
  },
  {
    layerKey: 'lidar',
    canonicalParam: 'lidar',
    urlParams: ['lidar', 'lidarscan', 'lidar-scan'],
  },
  {
    layerKey: 'wireframe',
    canonicalParam: 'wireframe',
    urlParams: ['wireframe', 'filaire', 'grille-filaire', 'fildefer', 'fil-de-fer'],
  },
  {
    layerKey: 'wireframeWallStructure',
    canonicalParam: 'wireframeWallStructure',
    urlParams: ['wireframe-wallstructure', 'wireframe-murs', 'wireframe-mur', 'wireframemurs', 'wf-murs', 'wf-walls'],
  },
  {
    layerKey: 'wireframeStructure',
    canonicalParam: 'wireframeStructure',
    urlParams: ['wireframe-structure', 'wireframe-dalle', 'wireframe-plafond', 'wireframestructure', 'wf-structure'],
  },
  {
    layerKey: 'wireframeDoors',
    canonicalParam: 'wireframeDoors',
    urlParams: ['wireframe-doors', 'wireframe-portes', 'wireframe-porte', 'wireframeportes', 'wf-doors', 'wf-portes'],
  },
  {
    layerKey: 'animals',
    canonicalParam: 'animals',
    urlParams: ['animals', 'animal', 'animaux', 'animeaux', 'pets'],
  },
  {
    layerKey: 'robots',
    canonicalParam: 'robots',
    urlParams: ['robots', 'robot'],
  },
  {
    layerKey: 'pillarsOnly',
    canonicalParam: 'pillarsOnly',
    urlParams: ['pillarsonly', 'pillar-only', 'pillars', 'piliers', 'piliersseuls', 'piliers-seuls'],
  },
  {
    layerKey: 'shadows',
    canonicalParam: 'shadows',
    urlParams: ['shadows', 'shadow', 'ombres', 'ombre'],
  },
  {
    layerKey: 'extraCharacters',
    canonicalParam: 'extraCharacters',
    urlParams: ['extracharacters', 'extra', 'extras', 'personnagesextras', 'personnages-extras', 'extra-characters'],
  },
  {
    layerKey: 'bermudaGrass',
    canonicalParam: 'bermudaGrass',
    urlParams: ['bermudagrass', 'herbe', 'grass', 'terrain-ext', 'terrain'],
  },
  {
    layerKey: 'animOriginLerp',
    canonicalParam: 'animOriginLerp',
    urlParams: ['animoriginlerp', 'originlerp', 'antiteleport', 'anti-teleport', 'lerporigin'],
  },
  {
    layerKey: 'animCrossfade',
    canonicalParam: 'animCrossfade',
    urlParams: ['animcrossfade', 'crossfade', 'fonducrossfade', 'animblend'],
  },
  {
    layerKey: 'windowStepElevation',
    canonicalParam: 'windowStepElevation',
    urlParams: ['windowstepelevation', 'windowstep', 'marchefenetre'],
  },
  {
    layerKey: 'laraSocks',
    canonicalParam: 'laraSocks',
    urlParams: ['larasocks', 'socks', 'chaussettes'],
  },
  {
    layerKey: 'laraSneakers',
    canonicalParam: 'laraSneakers',
    urlParams: ['larasneakers', 'sneakers', 'baskets'],
  },
  {
    layerKey: 'laraNeckBandana',
    canonicalParam: 'laraNeckBandana',
    urlParams: ['laraneckbandana', 'neckbandana', 'bandanacou'],
  },
  {
    layerKey: 'laraWristBandana',
    canonicalParam: 'laraWristBandana',
    urlParams: ['larawristbandana', 'wristbandana', 'bandanapoignet'],
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
        return { active: false };
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
    const params = getUrlParams();
    const overrides: Partial<Record<keyof LayerState, boolean>> = { ...getDebugPreset(params)?.layers };

    // Normalisation en minuscules de toutes les clés d'URL présentes
    const lowerParams = new Map<string, string>();
    for (const [key, val] of params.entries()) {
      lowerParams.set(key.toLowerCase(), val);
    }

    // Détection explicite pour le calque personnages : characterCount=0 ou alias désactive le calque
    const countParams = ['charactercount', 'characters', 'count', 'npcnb', 'npcs', 'laracount', 'npccount'];
    for (const cp of countParams) {
      if (lowerParams.has(cp)) {
        const val = lowerParams.get(cp)?.trim().toLowerCase();
        if (val === '0' || val === 'none' || val === 'aucun' || val === 'off') {
          overrides.character = false;
          break;
        }
      }
    }

    const charParams = ['character', 'characters', 'personnage', 'personnages', 'pnj', 'walker'];
    for (const cp of charParams) {
      if (lowerParams.has(cp)) {
        const val = lowerParams.get(cp)?.trim().toLowerCase();
        if (val === '0' || val === 'false' || val === 'off' || val === 'no' || val === 'hide') {
          overrides.character = false;
          break;
        } else if (val === '1' || val === 'true' || val === 'on' || val === 'yes' || val === 'show') {
          overrides.character = true;
          break;
        }
      }
      if (lowerParams.has(`no-${cp}`) || lowerParams.has(`no_${cp}`)) {
        overrides.character = false;
        break;
      }
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
    if (key === 'character') return; // Géré par updateUrlCharacterCount (format characterCount)
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

    // Some shared links keep their parameters in the hash. Remove the old
    // flag there too, otherwise disabling a default-false layer comes back on
    // after reload despite the store having been updated.
    const hashQuery = url.hash.indexOf('?');
    if (hashQuery >= 0) {
      const hashParams = new URLSearchParams(url.hash.slice(hashQuery + 1));
      const keys = [...hashParams.keys()].filter(k => lowerTargets.has(k.toLowerCase()));
      for (const k of keys) { hashParams.delete(k); allKeysToDelete.push(k); }
      if (keys.length) {
        const remaining = hashParams.toString();
        url.hash = url.hash.slice(0, hashQuery) + (remaining ? `?${remaining}` : '');
      }
    }

    // Le preset debug définit les valeurs par défaut, les paramètres explicites les remplacent.
    const query = url.search || url.hash.split('?')[1] || '';
    const isDefault = value === (getDebugPreset(new URLSearchParams(query))?.layers[key] ?? LAYER_DEFAULTS[key as string] ?? true);
    if (!isDefault) {
      url.searchParams.set(mapping.canonicalParam, value ? '1' : '0');
    } else if (allKeysToDelete.length === 0) {
      return; // Aucun changement, skip replaceState
    }

    window.history.replaceState(null, '', url.toString());
  } catch {}
}

const LARA_HOODIE_ZIP_VALUES = new Set<LaraHoodieZip>(LARA_HOODIE_ZIP_IDS);

export function parseUrlLaraClothing(): { laraTop: LaraClothing; laraBottom: LaraClothing; laraHoodieZip: LaraHoodieZip } {
  const params = new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search || window.location.hash.split('?')[1]);
  const read = (key: string): LaraClothing => {
    const value = params.get(key) as LaraClothing | null;
    return value && ALL_LARA_CLOTHING_VALUES.has(value) ? value : 'native';
  };
  const zipVal = params.get('laraHoodieZip') as LaraHoodieZip | null;
  return {
    laraTop: read('laraTop'),
    laraBottom: read('laraBottom'),
    laraHoodieZip: zipVal && LARA_HOODIE_ZIP_VALUES.has(zipVal) ? zipVal : 'closed',
  };
}

export function updateUrlLaraClothing(key: 'laraTop' | 'laraBottom' | 'laraHoodieZip', value: LaraClothing | LaraHoodieZip) {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  const isDefault = key === 'laraHoodieZip' ? value === 'closed' : value === 'native';
  if (isDefault) url.searchParams.delete(key);
  else url.searchParams.set(key, value);
  window.history.replaceState(null, '', url.toString());
}
