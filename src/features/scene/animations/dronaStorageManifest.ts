import type { AnimationDefinition } from './animationRegistry';

// Baked two-handed gestures at each box's handle height, with a crouched pose
// for the floor-level box. Movement occupies the middle half of pull/push.
export const DRONA_STORAGE_ANIMATIONS: AnimationDefinition[] = ['care', 'trousers', 'catchall2', 'bath-box', 'bath-cabinet-west', 'bath-cabinet-east', 'kitchen-upper'].flatMap(item =>
  ['pull', 'search', 'push'].map(phase => ({
    id: `drona-${item}-${phase}`, path: `animations/drona/${item}_${phase}.glb`,
    category: 'interactions', label: `Dröna ${item} : ${phase}`, tags: ['interaction'],
    duration: phase === 'search' ? 9.766666412353516 / 2 : 4.833333492279053 / 2,
    loop: 'once',
  })),
);
