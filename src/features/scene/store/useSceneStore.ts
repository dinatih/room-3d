import { create } from 'zustand';
import { cameraState } from '@features/scene/cameraState';
import type { FurnitureState, LayerState, GroundType } from '@features/scene/SidePanel';
import { type LaraCountMode, pickRandomExtraCharacterIds, isExtraCharacter, EXTRA_CHARACTERS } from '@features/scene/walkerConfig';

function parseUrlNpcCount(): LaraCountMode {
  if (typeof window === 'undefined') return 4;
  try {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('npc') ?? params.get('npcs') ?? params.get('pnj') ?? params.get('laraCount') ?? params.get('characters');
    if (raw !== null) {
      const lower = raw.trim().toLowerCase();
      if (lower === '15' || lower === 'all' || lower === 'toutes' || lower === 'tout' || lower === 'max') return 15;
      if (lower === '10' || lower === 'eco') return 10;
      if (lower === '4' || lower === 'quad') return 4;
      if (lower === '2' || lower === 'duo' || lower === 'min') return 2;
      if (lower === '1' || lower === 'solo' || lower === 'xbot') return 1;
      const num = parseInt(lower, 10);
      if (num >= 15) return 15;
      if (num >= 10) return 10;
      if (num >= 4) return 4;
      if (num >= 2) return 2;
      if (num >= 1) return 1;
    }
  } catch {}
  return 4;
}

export function updateUrlNpcCount(count: LaraCountMode) {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    url.searchParams.set('npc', count.toString());
    window.history.replaceState(null, '', url.toString());
  } catch {}
}

import { getRandomHdriId } from '@features/scene/hdriConfig';

export const GRASS_TYPES: GroundType[] = ['bermuda', 'medium_01', 'medium_02', 'celandine', 'mud_leaves'];

export function getRandomGrassType(): GroundType {
  if (typeof window !== 'undefined') {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlGrass = params.get('grass') ?? params.get('ground') ?? params.get('herbe');
      if (urlGrass && GRASS_TYPES.includes(urlGrass as GroundType)) {
        return urlGrass as GroundType;
      }
    } catch {}
  }
  return GRASS_TYPES[Math.floor(Math.random() * GRASS_TYPES.length)];
}

interface SceneStore {
  furniture: FurnitureState;
  layers: LayerState;
  extraStates: Record<string, boolean>;
  activeWalkerId: string;
  activeExtraIds: string[];
  currentHdri: string;
  measurementActive: boolean;
  cameraMode: 'orbit' | 'walk' | 'fpv' | 'top' | 'plane';
  isCvModalOpen: boolean;
  isPhotoModeOpen: boolean;
  setCvModalOpen: (open: boolean) => void;
  setPhotoModeOpen: (open: boolean) => void;
  setMeasurementActive: (active: boolean) => void;
  setCameraMode: (mode: 'orbit' | 'walk' | 'fpv' | 'top' | 'plane') => void;
  setLaraCount: (count: LaraCountMode) => void;
  setHdri: (id: string) => void;
  toggleFurniture: (key: keyof FurnitureState) => void;
  toggleLayer: (key: keyof LayerState) => void;
  randomizeExtraCharacters: (count?: number) => void;
  setActiveExtraIds: (ids: string[]) => void;
  toggleExtraCharacter: (id: string) => void;
  selectAllExtraCharacters: () => void;
  clearExtraCharacters: () => void;
  setGroundType: (type: GroundType) => void;
  triggerAction: (key: string) => void;
  setActiveWalkerId: (id: string) => void;
}

const initialFurniture: FurnitureState = {
  eastGlassDoor: false,
  entryDoor: false,
  livingDoor: false,
  bathroomDoor: false,
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
  glassDoorV2LeftOpen: false,
  glassDoorV2ShutterPos: 0,
  sofaArmLeft: true,
  sofaArmRight: false,
  mackaparDoors: true,
  showerDoor: false,
  dronaMode: 'high',
};

const initialLayers: LayerState = {
  structure: true,
  equipment: true,
  furniture: true,
  furnishings: true,
  decor: true,
  doors: true,
  neighbors: false,
  xray: false,
  wireframe: false,
  mirrors: true,
  mirrorsHD: false,
  plan: false,
  grid: false,
  gridDepth: false,
  laraGrid: false,
  // NPC count initialized from URL param (ex: ?npc=15 or ?npc=10 or ?npc=2) or fallback to 2
  laraCount: parseUrlNpcCount(),
  showAllLaraStyles: true,
  extraCharacters: false,
  wallhack: false,
  skeleton: false,
  ceiling: false,
  wallEdges: false,
  measuredDimensions: false,
  lidar: false,
  lights: false,
  lightsHD: false,
  shadows: true,
  pillarsOnly: false,
  realSun: false,
  bermudaGrass: true,
  groundType: getRandomGrassType(),
  gardenWallScan: true,
  walker: true,
  animals: true,
  accessories: true,
  laraPistols: true,
  laraNude: false,
  laraTopOff: false,
  laraBottomOff: false,
  laraShoes: true,
  breastPhysics: true,
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
  hairPhysics: true,
  wigPhysics: true,
  wigStiffness: 1.0,
  wigDamping: 0.80,
  wigGravity: 1.0,
  wigInertia: 1.0,
  wigWind: 0.0,
  wigTipWeight: 1.2,
  wigMaxAngle: 15,
  wigHeadCollisionRadius: 13.0,
  characterShadows: true,
  characterWireframe: false,
  aiZones: false,
  npcCollisions: true,
  debugNpcCollisions: false,
  furnitureCollisions: true,
  debugFurnitureCollisions: false,
  thoughtBubble: true,
  fpvHeadBobbing: false,
  inventoryGrid: false,
};

const initialExtraStates: Record<string, boolean> = {
  ninja: false,
  utdrag: false,
  'bin-toggle': false,
  wcLid: false,
  'walker-meshes': false,
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
    'east-glass-door-toggle': 'eastGlassDoor',
    'entry-door-toggle': 'entryDoor',
    'living-door-toggle': 'livingDoor',
    'bathroom-door-toggle': 'bathroomDoor',
    'glass-door-v2-left-open': 'glassDoorV2LeftOpen',
    'glass-door-v2-shutter-pos': 'glassDoorV2ShutterPos',
    'garden-wall-scan': 'gardenWallScan',
    'garden-wall-toggle': 'gardenWallScan',
    'bermuda-grass': 'bermudaGrass',
    'bermuda-grass-toggle': 'bermudaGrass',
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

export const useSceneStore = create<SceneStore>((set) => ({
  furniture: initialFurniture,
  layers: initialLayers,
  extraStates: initialExtraStates,
  activeWalkerId: initialLayers.laraCount === 1 ? 'xbot' : 'native',
  activeExtraIds: pickRandomExtraCharacterIds(5),
  currentHdri: getRandomHdriId(),
  measurementActive: false,
  cameraMode: 'orbit',
  isCvModalOpen: false,
  isPhotoModeOpen: false,
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
  setLaraCount: (count) => {
    updateUrlNpcCount(count);
    set((state) => ({
      activeWalkerId: count === 1 ? 'xbot' : state.activeWalkerId,
      layers: { ...state.layers, laraCount: count, showAllLaraStyles: true }
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
      } else if (key === 'glassDoorV2LeftOpen') {
        const nextLeft = !state.furniture.glassDoorV2LeftOpen;
        const nextRight = nextLeft ? true : state.furniture.eastGlassDoor;
        nextFurniture = {
          ...state.furniture,
          glassDoorV2LeftOpen: nextLeft,
          eastGlassDoor: nextRight,
        };
        document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key, value: nextLeft } }));
        document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'eastGlassDoor', value: nextRight } }));
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
      const isActivating = !state.layers[key];
      const nextLayers = { ...state.layers, [key]: isActivating };
      let nextActiveExtraIds = state.activeExtraIds;

      if (key === 'extraCharacters' && isActivating) {
        // Conserve la sélection utilisateur ou tire 5 personnages aléatoires si aucun n'est sélectionné
        if (!state.activeExtraIds || state.activeExtraIds.length === 0) {
          nextActiveExtraIds = pickRandomExtraCharacterIds(5, state.activeWalkerId);
        }
      }
      if (key === 'mirrors') {
        // Force l'invalidation pour que SceneLayerController mette à jour le mask camera
        cameraState.invalidate?.();
      }
      if (key === 'mirrorsHD') {
        cameraState.mirrorsHD = nextLayers.mirrorsHD;
      }
      if (key === 'walker') {
        cameraState.walkerHidden = !nextLayers.walker;
      }
      cameraState.invalidate?.();
      return { layers: nextLayers, activeExtraIds: nextActiveExtraIds };
    });
  },

  randomizeExtraCharacters: (count = 5) => {
    set((state) => ({
      activeExtraIds: pickRandomExtraCharacterIds(count, state.activeWalkerId),
      layers: { ...state.layers, extraCharacters: true }
    }));
    cameraState.invalidate?.();
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
      const nextLayers = (!exists && !state.layers.extraCharacters)
        ? { ...state.layers, extraCharacters: true }
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
    set(() => ({
      activeExtraIds: []
    }));
    cameraState.invalidate?.();
  },

  setGroundType: (type) => {
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

  triggerAction: (key) => {
    if (key === 'bermuda-grass-toggle' || key === 'ground-type-cycle') {
      const order: GroundType[] = ['bermuda', 'medium_01', 'medium_02', 'celandine', 'mud_leaves', 'none'];
      set((state) => {
        const cur = state.layers.groundType ?? 'bermuda';
        const nextIdx = (order.indexOf(cur) + 1) % order.length;
        const next = order[nextIdx];
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
        } else if (fKey === 'glassDoorV2LeftOpen') {
          const nextLeft = !state.furniture.glassDoorV2LeftOpen;
          const nextRight = nextLeft ? true : state.furniture.eastGlassDoor;
          nextFurniture = {
            ...state.furniture,
            glassDoorV2LeftOpen: nextLeft,
            eastGlassDoor: nextRight
          };
          if (nextRight !== state.furniture.eastGlassDoor) {
            setTimeout(() => {
              document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'eastGlassDoor', value: nextRight } }));
            }, 0);
          }
        } else {
          nextFurniture = { ...state.furniture, [fKey]: !state.furniture[fKey] as any };
        }
        cameraState.invalidate?.();
        return { furniture: nextFurniture };
      });
    } else if (resolved.type === 'layer') {
      const lKey = resolved.name as keyof LayerState;
      set((state) => {
        const nextLayers = { ...state.layers, [lKey]: !state.layers[lKey] };
        cameraState.invalidate?.();
        return { layers: nextLayers };
      });
    } else if (resolved.type === 'extra') {
      set((state) => {
        const nextExtra = { ...state.extraStates, [resolved.name]: !state.extraStates[resolved.name] };
        cameraState.invalidate?.();
        return { extraStates: nextExtra };
      });
    }

    // Always dispatch custom events for compatibility
    document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key } }));
    if (resolved.type === 'furniture' && resolved.name !== key) {
      document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: resolved.name } }));
    }
  },

  setActiveWalkerId: (id) => {
    set((state) => {
      let nextActiveExtraIds = state.activeExtraIds;
      if (isExtraCharacter(id) && !state.activeExtraIds.includes(id)) {
        nextActiveExtraIds = [id, ...state.activeExtraIds.filter(x => x !== id)];
      }
      cameraState.invalidate?.();
      return { activeWalkerId: id, activeExtraIds: nextActiveExtraIds };
    });
  },
}));

if (typeof window !== 'undefined') {
  (window as any).useSceneStore = useSceneStore;
}
