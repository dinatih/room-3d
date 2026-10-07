import { create } from 'zustand';
import type { DuoAnimationDef } from '../animations/duoAnimations';

/** Shared grid selection, also read by the camera framing helpers. */
export const useLaraGridStore = create<{
  animation: string;
  duo?: DuoAnimationDef;
  partnerId: string;
}>(() => ({ animation: 'idle', partnerId: 'native' }));
