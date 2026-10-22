import type { AnimationDefinition } from './animationRegistry';
import motion from './dronaCarryMotion.json';

export const DRONA_CARRY_APPROACH = 62;
export const DRONA_CARRY_PHASES = ['pull', 'search', 'push'] as const;
export type DronaCarryAnimation = keyof typeof motion;

const labels = { pull: 'Sortir et porter', search: 'Prendre avec la main libre', push: 'Remettre dans la Kallax' };
export const DRONA_CARRY_ANIMATIONS: AnimationDefinition[] = (['pyjama', 'upper'] as const).flatMap(variant =>
  DRONA_CARRY_PHASES.map(phase => ({
    id: `drona-${variant}-${phase}`, path: `animations/custom/${variant}_${phase}.glb`,
    category: 'interactions', label: `Dröna ${variant === 'pyjama' ? 'pyjama' : 'supérieur NW'} : ${labels[phase]}`,
    tags: ['interaction'], duration: motion[`drona-${variant}-${phase}`].duration,
    loop: 'once', equipment: 'holstered',
  })),
);
