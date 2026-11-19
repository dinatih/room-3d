import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type VectorTuple = [number, number, number];
interface PreviewViewState {
  view: string;
  showGrid: boolean | null;
  pose: {
    direction: VectorTuple;
    up: VectorTuple;
    targetOffset: VectorTuple;
    heightRatio: number;
  } | null;
}

// Framing is relative to object size so a phone and an animal share the same view.
export const usePreviewViewStore = create<PreviewViewState>()(persist<PreviewViewState>(() => ({
  view: 'free',
  showGrid: null,
  pose: null,
}), { name: 'inventory-preview-view' }));
