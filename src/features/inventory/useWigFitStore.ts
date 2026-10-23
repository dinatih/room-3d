import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const DEFAULT_WIG_FIT = { scale: 1, x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0 };
export type WigFit = typeof DEFAULT_WIG_FIT;

export const useWigFitStore = create(persist<{
  fits: Record<string, WigFit>;
  update: (id: string, patch: Partial<WigFit>) => void;
  reset: (id: string) => void;
}>((set) => ({
  fits: {},
  update: (id, patch) => set(state => ({ fits: { ...state.fits, [id]: { ...DEFAULT_WIG_FIT, ...state.fits[id], ...patch } } })),
  reset: (id) => set(state => {
    const fits = { ...state.fits };
    delete fits[id];
    return { fits };
  }),
}), {
  name: 'room-3d-wig-fitting',
  version: 1,
  migrate: (state: any) => ({
    ...state,
    fits: Object.fromEntries(Object.entries(state.fits as Record<string, WigFit>).map(([id, fit]) => [id, { ...fit, scale: 1 }])),
  }),
}));
