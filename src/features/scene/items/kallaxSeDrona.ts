import { getAnimationDef } from '../animations/animationResolver';

export const KALLAX_SE_DRONA_POSITIONS: [number, number, number][] = [
  [3, 50 + 75.5 / 2 - 17.5, 0],
  [3, 50 + 75.5 / 2 + 17.5, 0],
  [3, 50 + 75.5 + 75.5 / 2 - 17.5, 0],
  [3, 50 + 75.5 + 75.5 / 2 + 17.5, 0],
];

export const DRONA_SE_ITEMS: Record<string, { index: number; label: string; action: string; animation: string; pullAnimation: string; duration: number }> = {
  'drona-se-pyjama': {
    index: 2, label: 'Dröna pyjama', action: 'drona-se-pyjama-slide',
    animation: 'pick-fruit', pullAnimation: 'pick-fruit', duration: getAnimationDef('pick-fruit')!.duration! / 2,
  },
  'drona-se-linen': {
    index: 1, label: 'Dröna linge de maison', action: 'drona-se-linen-slide',
    animation: 'searching-files-high', pullAnimation: 'opening', duration: getAnimationDef('opening')!.duration! / 2,
  },
};
