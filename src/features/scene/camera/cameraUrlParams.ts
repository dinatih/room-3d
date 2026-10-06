import type { CameraMode } from './types';

export type CameraProjection = 'persp' | 'ortho';

export interface OrbitCameraUrlState {
  position: [number, number, number];
  target: [number, number, number];
  zoom?: number;
}

const ORBIT_VIEW_KEYS = new Set([
  'perspective', 'top3d', 'top', 'front', 'back', 'left', 'right', 'bottom',
  'iso-se', 'iso-nw', 'iso-ne', 'iso-sw',
]);
const ORBIT_POSE_PARAMS = ['cameraPos', 'cameraTarget', 'cameraZoom'] as const;

function getUrlParams(): URLSearchParams {
  let search = window.location.search;
  if (!search && window.location.hash.includes('?')) {
    search = window.location.hash.substring(window.location.hash.indexOf('?'));
  }
  return new URLSearchParams(search);
}

function parseVectorParam(value: string | null): [number, number, number] | null {
  if (!value) return null;
  const values = value.split(',').map(Number);
  if (values.length !== 3 || values.some(value => !Number.isFinite(value))) return null;
  return values as [number, number, number];
}

function writeUrl(update: (params: URLSearchParams) => void) {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  update(url.searchParams);
  window.history.replaceState(null, '', url.toString());
}

function formatVector(value: [number, number, number]): string {
  return value.map(component => String(Number(component.toFixed(3)))).join(',');
}

export function parseUrlCameraProjection(): CameraProjection {
  if (typeof window === 'undefined') return 'persp';
  return getUrlParams().get('projection')?.toLowerCase() === 'ortho' ? 'ortho' : 'persp';
}

export function parseUrlActiveCameraView(): string | null {
  if (typeof window === 'undefined') return null;
  const view = getUrlParams().get('cameraView')?.toLowerCase();
  return view && ORBIT_VIEW_KEYS.has(view) ? view : null;
}

export function parseUrlOrbitCameraState(): OrbitCameraUrlState | null {
  if (typeof window === 'undefined') return null;
  const params = getUrlParams();
  const position = parseVectorParam(params.get('cameraPos'));
  const target = parseVectorParam(params.get('cameraTarget'));
  if (!position || !target) return null;

  const rawZoom = params.get('cameraZoom');
  const zoom = rawZoom === null ? undefined : Number(rawZoom);
  if (zoom !== undefined && (!Number.isFinite(zoom) || zoom <= 0)) return null;
  return { position, target, zoom };
}

export function updateUrlCameraProjection(projection: CameraProjection) {
  writeUrl(params => {
    if (projection === 'ortho') params.set('projection', projection);
    else params.delete('projection');
  });
}

export function updateUrlActiveCameraView(view: string | null) {
  writeUrl(params => {
    if (view && ORBIT_VIEW_KEYS.has(view)) params.set('cameraView', view);
    else params.delete('cameraView');
  });
}

export function updateUrlOrbitCameraState(state: OrbitCameraUrlState | null) {
  writeUrl(params => {
    if (!state) {
      ORBIT_POSE_PARAMS.forEach(param => params.delete(param));
      return;
    }
    params.set('cameraPos', formatVector(state.position));
    params.set('cameraTarget', formatVector(state.target));
    if (state.zoom !== undefined && Number.isFinite(state.zoom) && state.zoom > 0) {
      params.set('cameraZoom', String(Number(state.zoom.toFixed(4))));
    } else {
      params.delete('cameraZoom');
    }
  });
}

/**
 * Analyse l'URL pour détecter si un mode caméra initial est demandé.
 * Le mode FPV (1ère personne) est désormais le mode par défaut.
 * Supporte :
 *  - Mode par défaut : 'fpv'
 *  - Flag Orbit : ?orbit, ?orbit=1, ?orbit=true, ?orbit=yes, ?orbit=on
 *  - Flag FPV explicite : ?fpv, ?fpv=1, ?fpv=true, ?fpv=yes, ?fpv=on (ou ?fpv=0 pour désactiver -> orbit)
 *  - Paramètre de mode : ?mode=..., ?camera=..., ?view=..., ?cam=..., ?vue=...
 *  - Modes alternatifs : fpv, orbit / 3d / free, follow / 3p / thirdperson, top / 2d / plan, ortho
 */
export function parseUrlCameraMode(): CameraMode {
  if (typeof window === 'undefined') return 'fpv';
  try {
    let search = window.location.search;
    if (!search && window.location.hash.includes('?')) {
      search = window.location.hash.substring(window.location.hash.indexOf('?'));
    }
    const params = new URLSearchParams(search);

    // Support explicite du drapeau ?orbit ou ?orbit=true / ?orbit=1
    if (params.has('orbit')) {
      const val = params.get('orbit')?.trim().toLowerCase();
      if (val === null || val === '' || val === '1' || val === 'true' || val === 'yes' || val === 'on') {
        return 'orbit';
      }
    }

    // Support explicite du drapeau ?fpv ou ?fpv=false / ?fpv=0
    if (params.has('fpv')) {
      const val = params.get('fpv')?.trim().toLowerCase();
      if (val === '0' || val === 'false' || val === 'no' || val === 'off') {
        return 'orbit';
      }
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
      if (m === 'orbit' || m === 'free' || m === '3d') {
        return 'orbit';
      }
      if (m === 'fpv' || m === 'firstperson' || m === '1p' || m === 'fps') {
        return 'fpv';
      }
      if (m === 'follow' || m === '3p' || m === 'thirdperson') {
        return 'follow';
      }
      if (m === 'top' || m === 'topdown' || m === '2d' || m === 'plan') {
        return 'top';
      }
      if (m === 'ortho') {
        return 'ortho';
      }
    }
  } catch {}
  return 'fpv'; // FPV par défaut à la place d'orbit
}

/**
 * Met à jour l'URL avec le mode caméra actif sans recharger la page
 */
export function updateUrlCameraMode(mode: CameraMode) {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    const cameraParams = ['mode', 'camera', 'view', 'cam', 'vue', 'orbit', 'fpv'];
    const hadParam = cameraParams.some(p => url.searchParams.has(p));
    const hadOrbitState = ['cameraView', ...ORBIT_POSE_PARAMS].some(p => url.searchParams.has(p));

    for (const p of cameraParams) {
      url.searchParams.delete(p);
    }

    if (mode !== 'orbit') {
      url.searchParams.delete('cameraView');
      ORBIT_POSE_PARAMS.forEach(param => url.searchParams.delete(param));
    }

    if (mode !== 'fpv') {
      url.searchParams.set('mode', mode);
    } else if (!hadParam && !hadOrbitState) {
      return; // Valeur par défaut, rien à nettoyer
    }

    window.history.replaceState(null, '', url.toString());
  } catch {}
}

/**
 * Analyse l'URL pour déterminer si l'interface (UI) doit être masquée au chargement.
 * Supporte :
 *  - ?ui=0, ?ui=false, ?ui=hide, ?ui=hidden, ?ui=off, ?ui=cacher -> true (masquée)
 *  - ?ui=1, ?ui=true, ?ui=show, ?ui=visible, ?ui=on, ?ui=afficher -> false (affichée)
 *  - Drapeaux sans valeur : ?hideui, ?noui, ?cacherui, ?cacher-ui -> true (masquée)
 *  - Drapeaux sans valeur : ?showui, ?afficherui -> false (affichée)
 */
export function parseUrlHideUI(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    let search = window.location.search;
    if (!search && window.location.hash.includes('?')) {
      search = window.location.hash.substring(window.location.hash.indexOf('?'));
    }
    const params = new URLSearchParams(search);

    // Drapeaux explicites pour masquer l'interface
    const hideFlags = ['hideui', 'noui', 'cacherui', 'cacher-ui', 'hide-ui', 'no-ui'];
    for (const flag of hideFlags) {
      if (params.has(flag)) {
        const val = params.get(flag)?.trim().toLowerCase();
        if (val === null || val === '' || val === '1' || val === 'true' || val === 'yes' || val === 'on') {
          return true;
        }
        if (val === '0' || val === 'false' || val === 'no' || val === 'off') {
          return false;
        }
      }
    }

    // Paramètre ?ui=...
    if (params.has('ui')) {
      const val = params.get('ui')?.trim().toLowerCase();
      if (val === '0' || val === 'false' || val === 'hide' || val === 'hidden' || val === 'off' || val === 'none' || val === 'cacher') {
        return true;
      }
      if (val === '1' || val === 'true' || val === 'show' || val === 'visible' || val === 'on' || val === 'afficher') {
        return false;
      }
    }

    // Paramètre ?showui=... ou ?show-ui=...
    if (params.has('showui') || params.has('show-ui')) {
      const val = (params.get('showui') ?? params.get('show-ui'))?.trim().toLowerCase();
      if (val === '0' || val === 'false' || val === 'no' || val === 'off') {
        return true;
      }
      if (val === null || val === '' || val === '1' || val === 'true' || val === 'yes' || val === 'on') {
        return false;
      }
    }
  } catch {}
  return false;
}

/**
 * Met à jour le paramètre d'URL pour l'état d'affichage de l'interface
 */
export function updateUrlHideUI(hidden: boolean) {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    const uiParams = ['ui', 'hideui', 'showui', 'show-ui', 'noui', 'cacherui', 'cacher-ui', 'hide-ui', 'no-ui'];
    const hadParam = uiParams.some(p => url.searchParams.has(p));

    for (const p of uiParams) {
      url.searchParams.delete(p);
    }

    if (hidden) {
      url.searchParams.set('ui', '0');
    } else if (!hadParam) {
      return; // Valeur par défaut, rien à nettoyer
    }

    window.history.replaceState(null, '', url.toString());
  } catch {}
}
