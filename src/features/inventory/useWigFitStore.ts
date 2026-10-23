import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const DEFAULT_WIG_FIT = { scale: 1, x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0 };
export type WigFit = typeof DEFAULT_WIG_FIT;

export const INITIAL_WIG_FITS: Record<string, WigFit> = {
  hair_lara_native: { scale: 1, x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0 },
  hair_105: { scale: 1, x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0 },
  hair_106: { scale: 1, x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0 },
  hair_104: { scale: 1, x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0 },
  hair_103: { scale: 1, x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0 },
  hair_102: { scale: 1, x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0 },
  hair_111: { scale: 1, x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0 },
  hair_112: { scale: 1, x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0 },
  hair_zepeto: { scale: 1, x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0 },
  hair_buns: { scale: 1, x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0 },
  hair_side_swept_bob_haircut: { scale: 1, x: 0, y: -2.7, z: 2.8, rx: 0, ry: 0, rz: 0 },
};

export const useWigFitStore = create(persist<{
  fits: Record<string, WigFit>;
  update: (id: string, patch: Partial<WigFit>) => void;
  reset: (id: string) => void;
}>((set) => ({
  fits: INITIAL_WIG_FITS,
  update: (id, patch) => set(state => ({ fits: { ...state.fits, [id]: { ...(INITIAL_WIG_FITS[id] ?? DEFAULT_WIG_FIT), ...state.fits[id], ...patch } } })),
  reset: (id) => set(state => ({
    fits: {
      ...state.fits,
      [id]: INITIAL_WIG_FITS[id] ?? DEFAULT_WIG_FIT,
    },
  })),
}), {
  name: 'room-3d-wig-fitting',
  version: 2,
  migrate: (state: any) => ({
    ...state,
    fits: INITIAL_WIG_FITS,
  }),
}));
