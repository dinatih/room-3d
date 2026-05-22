import { create } from 'zustand';
import { cameraState } from '@features/scene/cameraState';
import type { FurnitureState, LayerState } from '@features/scene/SidePanel';

interface SceneStore {
  furniture: FurnitureState;
  layers: LayerState;
  extraStates: Record<string, boolean>;
  toggleFurniture: (key: keyof FurnitureState) => void;
  toggleLayer: (key: keyof LayerState) => void;
  triggerAction: (key: string) => void;
}

const initialFurniture: FurnitureState = {
  eastGlassDoor: false,
  entryDoor: false,
  livingDoor: false,
  bathroomDoor: false,
  corrDoors: false,
  sdbCloset: false,
  cbnWest: false,
  cbnEast: false,
  cabinet: false,
  bedStacked: true,
  bedSofa: false,
  bedPosition: false,
  smorkullPos: false,
  lampOn: false,
  dronaRougeGlb: false,
  lampSdb: false,
  lampCouloir: false,
  freezerOpen: false,
  fridge: false,
  tvOn: false,
};

const initialLayers: LayerState = {
  structure: true,
  equipment: true,
  furniture: true,
  doors: true,
  neighbors: false,
  xray: false,
  mirrorsHD: false,
  plan: false,
  grid: false,
  gridDepth: false,
  skeleton: false,
  ceiling: false,
  redWalls: false,
  wallEdges: false,
  lidar: false,
  lights: false,
  shadows: true,
  pillarsOnly: false,
  wallsOnly: false,
  realWorld: false,
  realSun: false,
  physics: false,
  collisions: false,
};

const initialExtraStates: Record<string, boolean> = {
  ninja: false,
  'bin-toggle': false,
  wcLid: false,
};

function resolveStoreKey(key: string): { type: 'furniture' | 'extra' | 'transient'; name: string } {
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

  toggleFurniture: (key) => {
    set((state) => {
      const nextFurniture = { ...state.furniture, [key]: !state.furniture[key] };

      // Dispatch event for backward compatibility with components listening to custom events
      document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key } }));

      // Map special keys for legacy components
      if (key === 'freezerOpen') {
        document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'freezer' } }));
      } else if (key === 'tvOn') {
        document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'tv' } }));
      } else if (key === 'lampOn') {
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
      if (key === 'mirrorsHD') {
        cameraState.mirrorsHD = nextLayers.mirrorsHD;
      }
      if (key === 'physics') {
        document.dispatchEvent(new CustomEvent('physics-toggle', { detail: { enabled: nextLayers.physics } }));
      }
      if (key === 'collisions') {
        document.dispatchEvent(new CustomEvent('collisions-toggle', { detail: { enabled: nextLayers.collisions } }));
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
        const nextFurniture = { ...state.furniture, [fKey]: !state.furniture[fKey] };
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
}));
