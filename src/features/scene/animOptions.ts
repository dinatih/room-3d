/**
 * animOptions.ts — Options d'animations dérivées dynamiquement de ANIMATION_DEFINITIONS.
 * Élimine la duplication de données et synchronise automatiquement les options UI
 * avec le registre centralisé des animations.
 */
import { ANIMATION_DEFINITIONS } from './animations/animationRegistry';
import { getAnimationDef } from './animations/animationResolver';

export interface AnimOption {
  value: string;
  label: string;
}

export const WALKER_ANIM_OPTIONS: AnimOption[] = [
  { value: 'idle', label: 'Idle / Return to Default' },
  { value: 'tpose', label: '📐 T-Pose (Rest)' },
  ...ANIMATION_DEFINITIONS
    .filter(d => d.id !== 'idle' && d.id !== 'tpose' && d.id !== 'miley-idle-01')
    .map(d => ({
      value: d.id,
      label: d.label || d.id,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, 'fr', { sensitivity: 'base' }))
];

/**
 * Retourne la durée estimée en secondes d'un clip GLB ou d'un ID d'animation (avec fallback).
 */
export function getEstimatedClipDuration(animKeyOrPath?: string, fallback: number = 3.5): number {
  if (!animKeyOrPath) return fallback;
  const def = getAnimationDef(animKeyOrPath);
  return def?.duration ?? fallback;
}
