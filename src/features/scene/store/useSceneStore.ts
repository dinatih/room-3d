import { create } from 'zustand';
import { cameraState } from '@features/scene/cameraState';
import {
  parseUrlCameraMode,
  parseUrlCameraProjection,
  parseUrlActiveCameraView,
  updateUrlCameraProjection,
  updateUrlActiveCameraView,
} from '@features/scene/camera/cameraUrlParams';
import { parseUrlLayerOverrides, updateUrlLayer, parseUrlGroundType, updateUrlGroundType, LAYER_DEFAULTS } from './layerUrlParams';
import type { FurnitureState, LayerState, GroundType } from '@features/scene/SidePanel';
import {
  type LaraCountMode,
  isExtraCharacter,
  EXTRA_CHARACTERS,
  NON_EXTRA_CHARACTERS,
  getDefaultNonExtraIds,
  parseUrlActiveCharacter,
  updateUrlActiveCharacter,
} from '@features/scene/characterConfig';

function parseUrlNpcCount(): LaraCountMode {
  if (typeof window === 'undefined') return 4;
  try {
    let search = window.location.search;
    if (!search && window.location.hash.includes('?')) {
      search = window.location.hash.substring(window.location.hash.indexOf('?'));
    }
    const params = new URLSearchParams(search);
    const raw = params.get('npcNb') ?? params.get('npcs') ?? params.get('laraCount') ?? params.get('characters') ?? params.get('count') ?? params.get('npcCount');
    if (raw !== null) {
      const lower = raw.trim().toLowerCase();
      if (lower === '15' || lower === 'all' || lower === 'toutes' || lower === 'tout' || lower === 'max') return 15;
      if (lower === '10' || lower === 'eco') return 10;
      if (lower === '4' || lower === 'quad') return 4;
      if (lower === '2' || lower === 'duo' || lower === 'min') return 2;
      if (lower === '1' || lower === 'solo') return 1;
      const num = parseInt(lower, 10);
      if (!isNaN(num)) {
        if (num >= 15) return 15;
        if (num >= 10) return 10;
        if (num >= 4) return 4;
        if (num >= 2) return 2;
        if (num >= 1) return 1;
      }
    }
  } catch {}
  return 4;
}

export function updateUrlNpcCount(count: LaraCountMode | 0) {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    const countParams = ['npcNb', 'npcs', 'laraCount', 'characters', 'count', 'npcCount'];
    const hadParam = countParams.some(p => url.searchParams.has(p)) || url.searchParams.has('npc');

    for (const p of [...countParams, 'npc', 'character', 'personnage', 'pnj']) {
      url.searchParams.delete(p);
    }

    if (count !== 4) {
      url.searchParams.set('npcNb', count.toString());
    } else if (!hadParam) {
      return; // Valeur par défaut, rien à nettoyer
    }

    window.history.replaceState(null, '', url.toString());
  } catch {}
}

import { DEFAULT_HDRI_ID } from '@features/scene/hdriConfig';

export const GRASS_TYPES: GroundType[] = ['bermuda', 'medium_01', 'medium_02', 'celandine', 'mud_leaves'];

export function getRandomGrassType(): GroundType {
  const urlGround = parseUrlGroundType();
  if (urlGround.groundType && urlGround.groundType !== 'none') {
    return urlGround.groundType;
  }
  return GRASS_TYPES[Math.floor(Math.random() * GRASS_TYPES.length)];
}

interface SceneStore {
  furniture: FurnitureState;
  layers: LayerState;
  extraStates: Record<string, boolean>;
  activeCharacterId: string;
  activeExtraIds: string[];
  activeMainIds: string[];
  currentHdri: string;
  bnfAzimuth: number;
  bnfElevation: number;
  bnfRadius: number;
  measurementActive: boolean;
  cameraMode: 'orbit' | 'follow' | 'fpv' | 'top' | 'plane' | 'ortho';
  cameraProjection: 'persp' | 'ortho';
  orbitMouseMode: 'rotate' | 'pan';
  setOrbitMouseMode: (mode: 'rotate' | 'pan') => void;
  activeCameraView: string | null;
  setActiveCameraView: (view: string | null) => void;
  isCvModalOpen: boolean;
  isPhotoModeOpen: boolean;
  setCvModalOpen: (open: boolean) => void;
  setPhotoModeOpen: (open: boolean) => void;
  setMeasurementActive: (active: boolean) => void;
  setBnfCoords: (coords: { azimuth?: number; elevation?: number; radius?: number }) => void;
  setCameraMode: (mode: 'orbit' | 'follow' | 'fpv' | 'top' | 'plane' | 'ortho') => void;
  setCameraProjection: (proj: 'persp' | 'ortho') => void;
  toggleCameraProjection: () => void;
  setLaraCount: (count: LaraCountMode | 0) => void;
  setHdri: (id: string) => void;
  toggleFurniture: (key: keyof FurnitureState) => void;
  toggleLayer: (key: keyof LayerState) => void;
  setActiveExtraIds: (ids: string[]) => void;
  toggleExtraCharacter: (id: string) => void;
  selectAllExtraCharacters: () => void;
  clearExtraCharacters: () => void;
  toggleExtraGroup: (groupIds: readonly string[] | string[]) => void;
  setActiveMainIds: (ids: string[]) => void;
  toggleMainCharacter: (id: string) => void;
  selectAllMainCharacters: () => void;
  clearMainCharacters: () => void;
  setGroundType: (type: GroundType) => void;
  triggerAction: (key: string, targetState?: boolean) => void;
  setActiveCharacterId: (id: string) => void;
  desk2ScreenActive: boolean;
  setDesk2SmartActionActive: (active: boolean) => void;
}

const initialFurniture: FurnitureState = {
  corrDoors: false,
  sdbClosetL: false,
  sdbClosetR: false,
  cbnWest: false,
  cbnEast: false,
  cabinet: false,
  bedDouble: false,
  lampOn: false,
  lampBath: false,
  lampCorridor: false,
  freezerOpen: false,
  fridge: false,
  tvOn: false,
  glassDoorV2ShutterPos: 0,
  sofaArmLeft: true,
  sofaArmRight: false,
  mackaparDoors: true,
  showerDoor: false,
  dronaMode: 'high',
};

const initialLayers: LayerState = {
  // Booléens depuis LAYER_DEFAULTS (source unique de vérité)
  ...(LAYER_DEFAULTS as unknown as LayerState),
  // Valeurs non-booléennes (pas dans LAYER_DEFAULTS)
  laraCount: parseUrlNpcCount(),
  groundType: getRandomGrassType(),
  // Physique poitrine
  breastIntensity: 1.0,
  breastMass: 1,
  breastFirmness: 0.5,
  braElasticity: 3.0,
  braElasticityXZ: 0.5,
  breastLagDelay: 1.0,
  maxBreastAngle: 25,
  maxBreastAngleXZ: 5,
  breastTranslation: 0.15,
  breastMaxTravel: 0.5,
  breastSquash: 0.25,
  breastGravity: 1.0,
  // Physique perruque
  wigStiffness: 1.0,
  wigDamping: 0.80,
  wigGravity: 1.0,
  wigInertia: 1.0,
  wigWind: 0.0,
  wigTipWeight: 1.2,
  wigMaxAngle: 15,
  wigHeadCollisionRadius: 13.0,
  // FPV
  fpvStabilizationFactor: 0.7,
};

const initialExtraStates: Record<string, boolean> = {
  ninja: false,
  utdrag: false,
  'bin-toggle': false,
  wcLid: false,
  'character-meshes': false,
  aiGoToilet: false,
  aiSitDesk1: false,
  aiSitOfficeChair: false,
  aiSitDesk2: false,
  aiBedWest: false,
  aiBedEast: false,
  aiBathtub: false,
  aiShower: false,
  aiGardenSofaEast: false,
  aiGardenSofaWest: false,
  aiCooking: false,
  aiKallaxNE: false,
  aiFreshAir: false,
  aiFullTour: false,
  desk2Screen: false,
};

export function resolveStoreKey(key: string): { type: 'furniture' | 'layer' | 'extra' | 'transient'; name: string } {
  const furnitureKeys = Object.keys(initialFurniture);

  if (furnitureKeys.includes(key)) {
    return { type: 'furniture', name: key };
  }

  const map: Record<string, string> = {
    freezer: 'freezerOpen',
    tv: 'tvOn',
    'tv-toggle': 'tvOn',
    'desk2-screen-toggle': 'desk2Screen',
    'desk2-screen': 'desk2Screen',
    'desk-video': 'desk2Screen',
    'desk-video-toggle': 'desk2Screen',
    'lamp-toggle': 'lampOn',
    'lamp-bath-toggle': 'lampBath',
    'lamp-corridor-toggle': 'lampCorridor',
    'lamp-sdb-toggle': 'lampBath',
    'lamp-couloir-toggle': 'lampCorridor',
    'bed-double': 'bedDouble',
    bin: 'bin-toggle',
    'bin-toggle': 'bin-toggle',
    ninja: 'ninja',
    'ninja-toggle': 'ninja',
    utdrag: 'utdrag',
    'utdrag-toggle': 'utdrag',
    'sofa-arm-left': 'sofaArmLeft',
    'sofa-arm-right': 'sofaArmRight',
    'corr-doors-toggle': 'corrDoors',
    'sdb-closet-toggle': 'sdbClosetL',
    'sdb-closet-l-toggle': 'sdbClosetL',
    'sdb-closet-r-toggle': 'sdbClosetR',
    'shower-door-toggle': 'showerDoor',
    'cbn-west-toggle': 'cbnWest',
    'cbn-east-toggle': 'cbnEast',
    'glass-door-v2-shutter-pos': 'glassDoorV2ShutterPos',
    'bermuda-grass': 'bermudaGrass',
    'bermuda-grass-toggle': 'bermudaGrass',
    'environment-toggle': 'environment',
    'sky-grass-toggle': 'environment',
  };

  const layerKeys = Object.keys(initialLayers);
  if (layerKeys.includes(key)) {
    return { type: 'layer', name: key };
  }

  if (key in map) {
    const mapped = map[key];
    if (furnitureKeys.includes(mapped)) {
      return { type: 'furniture', name: mapped };
    }
    if (layerKeys.includes(mapped)) {
      return { type: 'layer', name: mapped };
    }
    return { type: 'extra', name: mapped };
  }

  const extraKeys = Object.keys(initialExtraStates);
  if (extraKeys.includes(key)) {
    return { type: 'extra', name: key };
  }

  return { type: 'transient', name: key };
}

const initialActiveChar = parseUrlActiveCharacter();
const initialActiveCharacterId = initialActiveChar ? initialActiveChar.id : (initialLayers.laraCount === 1 ? 'xbot' : 'native');

let initialActiveExtraIds: string[] = [];
if (initialActiveChar && isExtraCharacter(initialActiveChar.id)) {
  initialActiveExtraIds = [initialActiveChar.id];
  initialLayers.extraCharacters = true;
  if (initialActiveChar.id in initialExtraStates) {
    initialExtraStates[initialActiveChar.id] = true;
  }
}

let initialActiveMainIds = getDefaultNonExtraIds(initialLayers.laraCount, initialActiveCharacterId);
if (initialActiveChar && !isExtraCharacter(initialActiveChar.id)) {
  if (!initialActiveMainIds.includes(initialActiveChar.id)) {
    initialActiveMainIds = [initialActiveChar.id, ...initialActiveMainIds];
  }
}

const layerOverrides = parseUrlLayerOverrides();
Object.assign(initialLayers, layerOverrides);

const urlGround = parseUrlGroundType();
if (urlGround.groundType) {
  initialLayers.groundType = urlGround.groundType;
  if (urlGround.active !== undefined) {
    initialLayers.bermudaGrass = urlGround.active;
  } else {
    initialLayers.bermudaGrass = urlGround.groundType !== 'none';
  }
}

if (layerOverrides.extraCharacters) {
  initialLayers.extraCharacters = true;
  initialActiveExtraIds = EXTRA_CHARACTERS.map(c => c.id);
}

if (initialLayers.mirrorsHD) {
  cameraState.mirrorsHD = true;
}

if (!initialLayers.character) {
  cameraState.characterHidden = true;
}

export const useSceneStore = create<SceneStore>((set) => ({
  furniture: initialFurniture,
  layers: initialLayers,
  extraStates: initialExtraStates,
  activeCharacterId: initialActiveCharacterId,
  activeExtraIds: initialActiveExtraIds,
  activeMainIds: initialActiveMainIds,
  currentHdri: DEFAULT_HDRI_ID,
  bnfAzimuth: 154.3,
  bnfElevation: -2.2,
  bnfRadius: 45,
  measurementActive: false,
  cameraMode: parseUrlCameraMode(),
  cameraProjection: parseUrlCameraProjection(),
  orbitMouseMode: parseUrlCameraProjection() === 'ortho' ? 'pan' : 'rotate',
  setOrbitMouseMode: (mode) => set({ orbitMouseMode: mode }),
  activeCameraView: parseUrlActiveCameraView(),
  setActiveCameraView: (view) => {
    set({ activeCameraView: view });
    updateUrlActiveCameraView(view);
  },
  isCvModalOpen: false,
  isPhotoModeOpen: false,
  desk2ScreenActive: false,
  setDesk2SmartActionActive: (active: boolean) => {
    set(state => {
      if (state.desk2ScreenActive === active) return state;
      cameraState.invalidate?.();
      return { desk2ScreenActive: active };
    });
  },
  setBnfCoords: (coords) => {
    set((state) => ({
      bnfAzimuth: coords.azimuth !== undefined ? coords.azimuth : state.bnfAzimuth,
      bnfElevation: coords.elevation !== undefined ? coords.elevation : state.bnfElevation,
      bnfRadius: coords.radius !== undefined ? coords.radius : state.bnfRadius,
    }));
    cameraState.invalidate?.();
  },
  setCvModalOpen: (open: boolean) => {
    set({ isCvModalOpen: open });
  },
  setPhotoModeOpen: (open: boolean) => {
    set({ isPhotoModeOpen: open });
    cameraState.invalidate?.();
  },
  setMeasurementActive: (active: boolean) => {
    set({ measurementActive: active });
    cameraState.invalidate?.();
  },
  setCameraMode: (mode) => {
    set({ cameraMode: mode });
  },
  setCameraProjection: (proj) => {
    set({ cameraProjection: proj, orbitMouseMode: proj === 'ortho' ? 'pan' : 'rotate' });
    updateUrlCameraProjection(proj);
    cameraState.invalidate?.();
  },
  toggleCameraProjection: () => {
    const projection = useSceneStore.getState().cameraProjection === 'ortho' ? 'persp' : 'ortho';
    set({ cameraProjection: projection, orbitMouseMode: projection === 'ortho' ? 'pan' : 'rotate' });
    updateUrlCameraProjection(projection);
    cameraState.invalidate?.();
  },
  setLaraCount: (count) => {
    updateUrlNpcCount(count);
    if (count === 0) {
      cameraState.characterHidden = true;
      set((state) => ({
        layers: { ...state.layers, character: false }
      }));
      cameraState.invalidate?.();
      return;
    }
    cameraState.characterHidden = false;
    set((state) => ({
      activeCharacterId: count === 1 ? 'xbot' : state.activeCharacterId,
      activeMainIds: getDefaultNonExtraIds(count, count === 1 ? 'xbot' : state.activeCharacterId),
      layers: { ...state.layers, character: true, laraCount: count, showAllLaraStyles: true }
    }));
    cameraState.invalidate?.();
  },
  setHdri: (id: string) => {
    set({ currentHdri: id });
    document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'hdri-change', value: id } }));
    cameraState.invalidate?.();
  },

  toggleFurniture: (key) => {
    set((state) => {
      let nextFurniture: FurnitureState;
      if (key === 'glassDoorV2ShutterPos') {
        const cur = state.furniture.glassDoorV2ShutterPos;
        const next = cur === 0 ? 70 : cur === 70 ? 90 : cur === 90 ? 100 : 0;
        nextFurniture = { ...state.furniture, glassDoorV2ShutterPos: next };
        document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key, value: next } }));
      } else if (key === 'dronaMode') {
        const cur = state.furniture.dronaMode;
        const next = cur === 'high' ? 'low' : cur === 'low' ? 'procedural' : cur === 'procedural' ? 'hidden' : 'high';
        nextFurniture = { ...state.furniture, dronaMode: next };
        document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key, value: next } }));
      } else {
        const val = !state.furniture[key];
        nextFurniture = { ...state.furniture, [key]: val };
        document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key, value: val } }));
      }

      if (key === 'lampOn') {
        document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'lamp-toggle' } }));
      } else if (key === 'lampBath') {
        document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'lamp-bath-toggle' } }));
      } else if (key === 'lampCorridor') {
        document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'lamp-corridor-toggle' } }));
      } else if (key === 'bedDouble') {
        document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'bed-double', value: nextFurniture.bedDouble } }));
      }

      cameraState.invalidate?.();
      return { furniture: nextFurniture };
    });
  },

  toggleLayer: (key) => {
    set((state) => {
      let isActivating = !state.layers[key];
      let nextActiveExtraIds = state.activeExtraIds;

      if (key === 'extraCharacters') {
        const currentlyVisible = !!state.layers.extraCharacters && state.activeExtraIds.length > 0;
        isActivating = !currentlyVisible;
        if (isActivating) {
          nextActiveExtraIds = EXTRA_CHARACTERS.map(c => c.id);
        }
      }
      const nextLayers = { ...state.layers, [key]: isActivating };
      updateUrlLayer(key, isActivating);
      if (key === 'mirrors') {
        // Force l'invalidation pour que SceneLayerController mette à jour le mask camera
        cameraState.invalidate?.();
      }
      if (key === 'mirrorsHD') {
        cameraState.mirrorsHD = nextLayers.mirrorsHD;
      }
      if (key === 'character') {
        cameraState.characterHidden = !nextLayers.character;
        if (!nextLayers.character) {
          updateUrlNpcCount(0);
        } else {
          updateUrlNpcCount(state.layers.laraCount ?? 4);
        }
      }
      cameraState.invalidate?.();
      return { layers: nextLayers, activeExtraIds: nextActiveExtraIds };
    });
  },

  setActiveExtraIds: (ids: string[]) => {
    set((state) => ({
      activeExtraIds: ids,
      layers: ids.length > 0 && !state.layers.extraCharacters
        ? { ...state.layers, extraCharacters: true }
        : state.layers
    }));
    cameraState.invalidate?.();
  },

  toggleExtraCharacter: (id: string) => {
    set((state) => {
      const exists = state.activeExtraIds.includes(id);
      const nextActiveExtraIds = exists
        ? state.activeExtraIds.filter(x => x !== id)
        : [...state.activeExtraIds, id];
      const hasExtras = nextActiveExtraIds.length > 0;
      const nextLayers = state.layers.extraCharacters !== hasExtras
        ? { ...state.layers, extraCharacters: hasExtras }
        : state.layers;
      cameraState.invalidate?.();
      return { activeExtraIds: nextActiveExtraIds, layers: nextLayers };
    });
  },

  selectAllExtraCharacters: () => {
    set((state) => ({
      activeExtraIds: EXTRA_CHARACTERS.map(c => c.id),
      layers: { ...state.layers, extraCharacters: true }
    }));
    cameraState.invalidate?.();
  },

  clearExtraCharacters: () => {
    set((state) => ({
      activeExtraIds: [],
      layers: { ...state.layers, extraCharacters: false }
    }));
    cameraState.invalidate?.();
  },

  toggleExtraGroup: (groupIds: readonly string[] | string[]) => {
    set((state) => {
      const allSelected = groupIds.every(id => state.activeExtraIds.includes(id));
      const nextActiveExtraIds = allSelected
        ? state.activeExtraIds.filter(id => !groupIds.includes(id))
        : Array.from(new Set([...state.activeExtraIds, ...groupIds]));
      const hasExtras = nextActiveExtraIds.length > 0;
      const nextLayers = state.layers.extraCharacters !== hasExtras
        ? { ...state.layers, extraCharacters: hasExtras }
        : state.layers;
      cameraState.invalidate?.();
      return { activeExtraIds: nextActiveExtraIds, layers: nextLayers };
    });
  },

  setActiveMainIds: (ids: string[]) => {
    set(() => ({
      activeMainIds: ids,
    }));
    cameraState.invalidate?.();
  },

  toggleMainCharacter: (id: string) => {
    set((state) => {
      const exists = state.activeMainIds.includes(id);
      const nextActiveMainIds = exists
        ? state.activeMainIds.filter(x => x !== id)
        : [...state.activeMainIds, id];
      cameraState.invalidate?.();
      return { activeMainIds: nextActiveMainIds };
    });
  },

  selectAllMainCharacters: () => {
    set((state) => ({
      activeMainIds: NON_EXTRA_CHARACTERS.map(c => c.id),
      layers: { ...state.layers, laraCount: 15 }
    }));
    cameraState.invalidate?.();
  },

  clearMainCharacters: () => {
    set(() => ({
      activeMainIds: []
    }));
    cameraState.invalidate?.();
  },

  setGroundType: (type) => {
    updateUrlGroundType(type);
    set((state) => {
      cameraState.invalidate?.();
      return {
        layers: {
          ...state.layers,
          groundType: type,
          bermudaGrass: type !== 'none',
        },
      };
    });
  },

  triggerAction: (key, targetState) => {
    const doorPushKeys: Record<string, string> = {
      eastGlassDoor: 'east-glass-door-toggle',
      glassDoorV2LeftOpen: 'glass-door-v2-left-open',
      entryDoor: 'entry-door-toggle',
      livingDoor: 'living-door-toggle',
      bathroomDoor: 'bathroom-door-toggle',
    };
    const doorPushKey = doorPushKeys[key];
    if (doorPushKey) {
      if (targetState === false) return;
      document.dispatchEvent(new CustomEvent('door-push', { detail: { key: doorPushKey } }));
      cameraState.invalidate?.();
      return;
    }
    if (key === 'bermuda-grass-toggle' || key === 'ground-type-cycle') {
      const order: GroundType[] = ['bermuda', 'medium_01', 'medium_02', 'celandine', 'mud_leaves', 'none'];
      set((state) => {
        const cur = state.layers.groundType ?? 'bermuda';
        const nextIdx = (order.indexOf(cur) + 1) % order.length;
        const next = order[nextIdx];
        updateUrlGroundType(next);
        cameraState.invalidate?.();
        return {
          layers: {
            ...state.layers,
            groundType: next,
            bermudaGrass: next !== 'none',
          },
        };
      });
      document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key } }));
      return;
    }

    const resolved = resolveStoreKey(key);
    if (resolved.type === 'furniture') {
      const fKey = resolved.name as keyof FurnitureState;
      set((state) => {
        let nextFurniture: FurnitureState;
        if (fKey === 'glassDoorV2ShutterPos') {
          const cur = state.furniture.glassDoorV2ShutterPos;
          const next = cur === 0 ? 70 : cur === 70 ? 90 : cur === 90 ? 100 : 0;
          nextFurniture = { ...state.furniture, glassDoorV2ShutterPos: next };
        } else {
          const nextVal = targetState !== undefined ? targetState : !state.furniture[fKey];
          nextFurniture = { ...state.furniture, [fKey]: nextVal as any };
        }
        cameraState.invalidate?.();
        return { furniture: nextFurniture };
      });
    } else if (resolved.type === 'layer') {
      const lKey = resolved.name as keyof LayerState;
      set((state) => {
        const nextVal = targetState !== undefined ? targetState : !state.layers[lKey];
        updateUrlLayer(lKey, nextVal);
        const nextLayers = { ...state.layers, [lKey]: nextVal };
        cameraState.invalidate?.();
        return { layers: nextLayers };
      });
    } else if (resolved.type === 'extra') {
      set((state) => {
        const nextVal = targetState !== undefined ? targetState : !state.extraStates[resolved.name];
        const nextExtra = { ...state.extraStates, [resolved.name]: nextVal };
        cameraState.invalidate?.();
        return { extraStates: nextExtra };
      });
    }

    // Always dispatch custom events for compatibility
    document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key, value: targetState } }));
    if (resolved.type === 'furniture' && resolved.name !== key) {
      document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: resolved.name, value: targetState } }));
    }
  },

  setActiveCharacterId: (id) => {
    updateUrlActiveCharacter(id);
    set((state) => {
      let nextActiveExtraIds = state.activeExtraIds;
      let nextLayers = state.layers;
      if (isExtraCharacter(id)) {
        if (!state.activeExtraIds.includes(id)) {
          nextActiveExtraIds = [id, ...state.activeExtraIds.filter(x => x !== id)];
        }
        if (!state.layers.extraCharacters) {
          nextLayers = { ...state.layers, extraCharacters: true };
        }
      }
      let nextActiveMainIds = state.activeMainIds;
      if (!isExtraCharacter(id) && !state.activeMainIds.includes(id)) {
        nextActiveMainIds = [id, ...state.activeMainIds];
      }
      cameraState.invalidate?.();
      return { activeCharacterId: id, activeExtraIds: nextActiveExtraIds, activeMainIds: nextActiveMainIds, layers: nextLayers };
    });
  },
}));

if (typeof window !== 'undefined') {
  (window as any).useSceneStore = useSceneStore;
}
