import dogAnimationOptions from './dogAnimationOptions.json';

export const PITBULL_COMPARISON_CLIPS = [
  { value: 'idle 50', label: 'idle 50 — Attente (Pitbull)' },
  { value: 'walk_fwd 29', label: 'walk_fwd 29 — Marche (Pitbull)' },
  { value: 'run_fwd 13', label: 'run_fwd 13 — Course (Pitbull)' },
  { value: 'idle_shake_1. 137', label: 'idle_shake_1. 137 — Shake — référence prioritaire' },
  { value: 'idle_shake_2. 81', label: 'idle_shake_2. 81 — Shake 2' },
  { value: 'interact_bed_lay_exist 270', label: 'interact_bed_lay_exist 270 — Couché sur le lit' },
  { value: 'interact_bed_sleep_exist 221', label: 'interact_bed_sleep_exist 221 — Sommeil sur le lit' },
  { value: 'poop 75', label: 'poop 75 — Position accroupie' },
  { value: 'track_bark_harvest 75', label: 'track_bark_harvest 75 — Aboiement et saut' },
  { value: 'canter_fwd 53', label: 'canter_fwd 53 — Galop' },
  { value: 'idle_bark_04_warning 47', label: 'idle_bark_04_warning 47 — Aboiement d’alerte' },
];
export function prioritizePitbullAnimations(options: { value: string; label: string }[]) {
  return [
    ...PITBULL_COMPARISON_CLIPS,
    ...options.filter(option => !PITBULL_COMPARISON_CLIPS.some(clip => clip.value === option.value)),
  ];
}
export const pitbullAnimationChoices = prioritizePitbullAnimations(dogAnimationOptions['animated-pitbull-dog']);
