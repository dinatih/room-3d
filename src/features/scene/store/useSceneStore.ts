import { create } from 'zustand';
import { cameraState } from '@features/scene/cameraState';
import type { FurnitureState, LayerState } from '@features/scene/SidePanel';

interface SceneStore {
  furniture: FurnitureState;
  layers: LayerState;
  extraStates: Record<string, boolean>;
  activeWalkerId: string;
  measurementActive: boolean;
  cameraMode: 'orbit' | 'walk' | 'fpv' | 'top' | 'plane';
  setMeasurementActive: (active: boolean) => void;
  setCameraMode: (mode: 'orbit' | 'walk' | 'fpv' | 'top' | 'plane') => void;
  toggleFurniture: (key: keyof FurnitureState) => void;
  toggleLayer: (key: keyof LayerState) => void;
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
  bedStacked: true,
  bedSofa: true,
  bedPosition: false,
  smorkullPos: false,
  lampOn: false,
  lampSdb: false,
  lampCouloir: false,
  freezerOpen: false,
  fridge: false,
  tvOn: false,
  glassDoorV2LeftOpen: false,
  glassDoorV2ShutterPos: 0,
  sofaArmLeft: true,
  sofaArmRight: false,
  mackaparDoors: true,
  bimDoubleDoor: true,
  bimDoorLeftOpen: false,
  bimDoorRightOpen: false,
};

const initialLayers: LayerState = {
  structure: true,
  equipment: true,
  furniture: true,
  doors: true,
  neighbors: false,
  xray: false,
  mirrors: true,
  mirrorsHD: false,
  plan: false,
  grid: false,
  gridDepth: false,
  laraGrid: false,
  showAllLaraStyles: true,
  wallhack: false,
  skeleton: false,
  ceiling: false,
  wallEdges: false,
  lidar: false,
  lights: false,
  shadows: true,
  pillarsOnly: false,
  realSun: false,
  grass: false,
  walker: true,
  accessories: true,
  laraPistols: true,
  breastPhysics: true,
  breastIntensity: 1.0,
  breastMass: 1.0,
  breastFirmness: 1.5,
  braElasticity: 1.0,
  braElasticityXZ: 1.0,
  breastLagDelay: 1.0,
  maxBreastAngle: 25,
  maxBreastAngleXZ: 35,
  hairPhysics: true,
  characterShadows: true,
  aiZones: false,
};

const initialExtraStates: Record<string, boolean> = {
  ninja: false,
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
  aiFullTour: true,
};

export function resolveStoreKey(key: string): { type: 'furniture' | 'extra' | 'transient'; name: string } {
  const furnitureKeys = Object.keys(initialFurniture);

  if (furnitureKeys.includes(key)) {
    return { type: 'furniture', name: key };
  }

  const map: Record<string, string> = {
    freezer: 'freezerOpen',
    tv: 'tvOn',
    'lamp-toggle': 'lampOn',
    'bed-toggle': 'bedStacked',
    'bed-sofa': 'bedSofa',
    'bed-position': 'bedPosition',
    'smorkull-position': 'smorkullPos',
    bin: 'bin-toggle',
    'bin-toggle': 'bin-toggle',
    ninja: 'ninja',
    'ninja-toggle': 'ninja',
    'sofa-arm-left': 'sofaArmLeft',
    'sofa-arm-right': 'sofaArmRight',
    'bim-door-left-open': 'bimDoorLeftOpen',
    'bim-door-right-open': 'bimDoorRightOpen',
    'corr-doors-toggle': 'corrDoors',
    'sdb-closet-toggle': 'sdbClosetL',
    'sdb-closet-l-toggle': 'sdbClosetL',
    'sdb-closet-r-toggle': 'sdbClosetR',
    'shower-door-toggle': 'showerDoor',
  };


  if (key in map) {
    const mapped = map[key];
    if (furnitureKeys.includes(mapped)) {
      return { type: 'furniture', name: mapped };
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
  activeWalkerId: 'native',
  measurementActive: false,
  cameraMode: 'orbit',
  setMeasurementActive: (active: boolean) => {
    set({ measurementActive: active });
    cameraState.invalidate?.();
  },
  setCameraMode: (mode) => {
    set({ cameraMode: mode });
  },

  toggleFurniture: (key) => {
    set((state) => {
      let nextFurniture: FurnitureState;
      if (key === 'glassDoorV2ShutterPos') {
        const cur = state.furniture.glassDoorV2ShutterPos;
        const next = cur === 0 ? 70 : cur === 70 ? 90 : cur === 90 ? 100 : 0;
        nextFurniture = { ...state.furniture, glassDoorV2ShutterPos: next };
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
      } else if (key === 'bedStacked') {
        document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'bed-toggle' } }));
      } else if (key === 'bedSofa') {
        document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'bed-sofa' } }));
      } else if (key === 'bedPosition') {
        document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'bed-position' } }));
      } else if (key === 'smorkullPos') {
        document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'smorkull-position' } }));
      }

      cameraState.invalidate?.();
      return { furniture: nextFurniture };
    });
  },

  toggleLayer: (key) => {
    set((state) => {
      const nextLayers = { ...state.layers, [key]: !state.layers[key] };
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
      return { layers: nextLayers };
    });
  },

  triggerAction: (key) => {
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
    set({ activeWalkerId: id });
    cameraState.invalidate?.();
  },
}));

if (typeof window !== 'undefined') {
  (window as any).useSceneStore = useSceneStore;
}

