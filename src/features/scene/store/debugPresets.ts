import type { LayerState } from '../sidepanel/types';

const DEBUG_PRESETS: Record<string, { layers: Partial<Record<keyof LayerState, boolean>>; perfGraph: boolean }> = {
  'studio-only': {
    layers: { character: false, animals: false, robots: false },
    perfGraph: true,
  },
  'characters-only': {
    layers: {
      wallStructure: false,
      doors: false,
      equipment: false,
      furniture: false,
      furnishings: false,
      decor: false,
      mirrorSurfaces: false,
      mirrors: false,
      animals: false,
    },
    perfGraph: true,
  },
};

export function getDebugPreset(params: URLSearchParams) {
  return DEBUG_PRESETS[params.get('debug') ?? ''];
}
