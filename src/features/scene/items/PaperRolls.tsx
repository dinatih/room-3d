import { createStaticGlbItem } from './createStaticGlbItem';

/** Estimated standard roll dimensions in scene centimetres; hollow cores. */
export const TOILET_PAPER_DIAMETER = 11;
export const PAPER_TOWEL_DIAMETER = 11.5;
export const ToiletPaperRoll = createStaticGlbItem('/items/toilet-paper-roll/toilet-paper-roll.glb');
export const PaperTowelRoll = createStaticGlbItem('/items/paper-towel-roll/paper-towel-roll.glb');
