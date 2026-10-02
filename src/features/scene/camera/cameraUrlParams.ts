import type { CameraMode } from './types';

/**
 * Analyse l'URL pour détecter si un mode caméra initial est demandé.
 * Supporte :
 *  - Flag FPV : ?fpv, ?fpv=1, ?fpv=true, ?fpv=yes, ?fpv=on
 *  - Paramètre de mode : ?mode=fpv, ?camera=fpv, ?view=fpv, ?cam=fpv, ?vue=fpv
 *  - Modes alternatifs : walk / follow / 3p, top / 2d / plan, orbit / 3d
 */
export function parseUrlCameraMode(): CameraMode {
  if (typeof window === 'undefined') return 'orbit';
  try {
    let search = window.location.search;
    if (!search && window.location.hash.includes('?')) {
      search = window.location.hash.substring(window.location.hash.indexOf('?'));
    }
    const params = new URLSearchParams(search);

    // Support explicite du drapeau ?fpv ou ?fpv=true / ?fpv=1
    if (params.has('fpv')) {
      const val = params.get('fpv')?.trim().toLowerCase();
      if (val === null || val === '' || val === '1' || val === 'true' || val === 'yes' || val === 'on') {
        return 'fpv';
      }
    }

    const raw = params.get('mode') ??
                params.get('camera') ??
                params.get('view') ??
                params.get('cam') ??
                params.get('vue');

    if (raw) {
      const m = raw.trim().toLowerCase();
      if (m === 'fpv' || m === 'firstperson' || m === '1p' || m === 'fps') {
        return 'fpv';
      }
      if (m === 'walk' || m === 'follow' || m === '3p' || m === 'thirdperson') {
        return 'walk';
      }
      if (m === 'top' || m === 'topdown' || m === '2d' || m === 'plan') {
        return 'top';
      }
      if (m === 'orbit' || m === 'free' || m === '3d') {
        return 'orbit';
      }
    }
  } catch {}
  return 'orbit';
}
