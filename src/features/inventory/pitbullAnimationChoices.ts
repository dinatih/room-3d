import dogAnimationOptions from './dogAnimationOptions.json';

export const PITBULL_COMPARISON_CLIPS = [
  { value: 'idle 50', label: 'idle 50 — Attente (Pitbull)' },
  { value: 'walk_fwd 29', label: 'walk_fwd 29 — Marche (Pitbull)' },
  { value: 'run_fwd 13', label: 'run_fwd 13 — Course (Pitbull)' },
];
export function prioritizePitbullAnimations(options: { value: string; label: string }[]) {
  return [
    ...PITBULL_COMPARISON_CLIPS,
    ...options.filter(option => !PITBULL_COMPARISON_CLIPS.some(clip => clip.value === option.value)),
  ];
}
export const pitbullAnimationChoices = prioritizePitbullAnimations(dogAnimationOptions['animated-pitbull-dog']);
