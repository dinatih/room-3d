import { create } from 'zustand';
import type { HeatmapParticipantSpec } from '../animations/animationHeatmap';

export interface PinnedHeatmapAnchor {
  pos: [number, number, number];
  rotY: number;
  participants: HeatmapParticipantSpec[];
  label: string;
}

export interface HeatmapSummary {
  width: number;
  depth: number;
  height: number;
  radius: number;
  sampleCount: number;
  duration: number;
  voxelCount: number;
  clashCells: number;
  clashVoxels: number;
  collidingObstacles: string[];
  activeLabel: string;
}

interface AnimationHeatmapState {
  mode: 'live' | 'custom';
  liveNpcId: string;
  pinnedAnchor: PinnedHeatmapAnchor | null;
  customKind: 'solo' | 'duo';
  customCharA: string;
  customCharB: string;
  customAnimId: string;
  customDuoId: string;
  customPos: [number, number, number];
  customRotDeg: number;
  showGround: boolean;
  show3D: boolean;
  clashOnly3D: boolean;
  isOpen: boolean;
  loading: boolean;
  error: string | null;
  summary: HeatmapSummary | null;

  setMode: (mode: 'live' | 'custom') => void;
  setLiveNpcId: (id: string) => void;
  setPinnedAnchor: (anchor: PinnedHeatmapAnchor | null) => void;
  setCustomKind: (kind: 'solo' | 'duo') => void;
  setCustomCharA: (id: string) => void;
  setCustomCharB: (id: string) => void;
  setCustomAnimId: (id: string) => void;
  setCustomDuoId: (id: string) => void;
  setCustomPos: (pos: [number, number, number]) => void;
  setCustomRotDeg: (deg: number) => void;
  setShowGround: (v: boolean) => void;
  setShow3D: (v: boolean) => void;
  setClashOnly3D: (v: boolean) => void;
  toggleOpen: () => void;
  setStatus: (patch: { loading?: boolean; error?: string | null; summary?: HeatmapSummary | null }) => void;
}

export const useAnimationHeatmapStore = create<AnimationHeatmapState>((set) => ({
  mode: 'live',
  liveNpcId: 'active',
  pinnedAnchor: null,
  customKind: 'duo',
  customCharA: 'native',
  customCharB: 'rosanna',
  customAnimId: 'idle',
  customDuoId: 'greek_folk_duo',
  customPos: [140, 0, 30],
  customRotDeg: 0,
  showGround: true,
  show3D: true,
  clashOnly3D: false,
  isOpen: true,
  loading: false,
  error: null,
  summary: null,

  setMode: (mode) => set({ mode }),
  setLiveNpcId: (liveNpcId) => set({ liveNpcId, pinnedAnchor: null }),
  setPinnedAnchor: (pinnedAnchor) => set({ pinnedAnchor }),
  setCustomKind: (customKind) => set({ customKind }),
  setCustomCharA: (customCharA) => set({ customCharA }),
  setCustomCharB: (customCharB) => set({ customCharB }),
  setCustomAnimId: (customAnimId) => set({ customAnimId }),
  setCustomDuoId: (customDuoId) => set({ customDuoId }),
  setCustomPos: (customPos) => set({ customPos }),
  setCustomRotDeg: (customRotDeg) => set({ customRotDeg }),
  setShowGround: (showGround) => set({ showGround }),
  setShow3D: (show3D) => set({ show3D }),
  setClashOnly3D: (clashOnly3D) => set({ clashOnly3D }),
  toggleOpen: () => set((s) => ({ isOpen: !s.isOpen })),
  setStatus: (patch) => set(patch),
}));
