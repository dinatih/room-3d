import type { AnimationDefinition } from './animationRegistry';

// Source opening: hand reaches the handle at 1.2 s, finishes pulling at 3.6 s.
// Reversing that full clip gives the corresponding push and release gesture.
export const LINEN_PULL_RANGE: [number, number] = [1.2 / 4.833333492279053, 3.6 / 4.833333492279053];
export const LINEN_PUSH_RANGE: [number, number] = [(4.833333492279053 - 3.6) / 4.833333492279053, (4.833333492279053 - 1.2) / 4.833333492279053];

export const DRONA_LINEN_ANIMATIONS: AnimationDefinition[] = [
  { id: 'drona-linen-pull', path: 'animations/custom/linen_pull.glb', category: 'interactions', label: 'Dröna linge : tirer', tags: ['interaction'], duration: 4.833333492279053, loop: 'once' },
  { id: 'drona-linen-search', path: 'animations/custom/linen_search.glb', category: 'interactions', label: 'Dröna linge : fouiller', tags: ['interaction'], duration: 9.766666412353516, loop: 'once' },
  { id: 'drona-linen-push', path: 'animations/custom/linen_push.glb', category: 'interactions', label: 'Dröna linge : pousser', tags: ['interaction'], duration: 4.833333492279053, loop: 'once' },
];
