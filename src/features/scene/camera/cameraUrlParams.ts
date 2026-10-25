import type { ArrowControl, CameraMode, CameraMovement, CameraTarget, OrbitMouseMode } from './types';
import { CAMERA_SUBJECTS, resolveCameraSubject } from './cameraSubjects';

export type CameraProjection = 'persp' | 'ortho';

export const CAMERA_POS_ALIASES: Record<string, string> = {
  north: 'north',
  'north-east': 'north-east',
  east: 'east',
  'south-east': 'south-east',
  south: 'south',
  'south-west': 'south-west',
  west: 'west',
  'north-west': 'north-west',
  top: 'top',
  bottom: 'bottom',
};

export function getUrlParams(): URLSearchParams {
  let search = typeof window === 'undefined' ? '' : window.location.search;
  if (!search && typeof window !== 'undefined' && window.location.hash.includes('?')) {
    search = window.location.hash.substring(window.location.hash.indexOf('?'));
  }
  const params = new URLSearchParams(search);
  if (params.get('ha') === '1') {
    if (!params.has('mode')) params.set('mode', 'iso');
    if (!params.has('cameraPos')) params.set('cameraPos', 'north-west');
    if (!params.has('skipIntro')) params.set('skipIntro', '1');
    if (!params.has('characters')) params.set('characters', '0');
    if (!params.has('animals')) params.set('animals', '0');
  }
  return params;
}

function writeUrl(update: (params: URLSearchParams) => void) {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  url.search = getUrlParams().toString();
  update(url.searchParams);
  window.history.replaceState(null, '', url.toString());
}

export function parseUrlCameraProjection(): CameraProjection {
  if (typeof window === 'undefined') return 'persp';
  const params = getUrlParams();
  return params.get('projection')?.toLowerCase() === 'ortho' ? 'ortho' : 'persp';
}

export function parseUrlCameraElevation(): number {
  const raw = typeof window === 'undefined' ? null : getUrlParams().get('cameraElevation');
  if (raw === null) return 45;
  const elevation = Number(raw);
  if (!raw.trim() || !Number.isFinite(elevation) || elevation < -90 || elevation > 90) {
    throw new Error(`Élévation de caméra invalide : ${raw}`);
  }
  return elevation;
}

export function updateUrlCameraElevation(elevation: number) {
  writeUrl(params => params.set('cameraElevation', String(elevation)));
}

/** ?skipIntro=1 skips the launch countdown and camera flight after loading. */
export function parseUrlSkipIntro(): boolean {
  if (typeof window === 'undefined') return false;
  const value = getUrlParams().get('skipIntro')?.trim().toLowerCase();
  return value === '' || value === '1' || value === 'true' || value === 'on';
}

/** cameraPos describes the viewing angle; target identifies the observed subject. */
export function parseUrlCameraPos(): { type: 'angle'; posKey: string } | null {
  if (typeof window === 'undefined') return null;
  const value = getUrlParams().get('cameraPos')?.trim().toLowerCase();
  return value && CAMERA_POS_ALIASES[value] ? { type: 'angle', posKey: CAMERA_POS_ALIASES[value] } : null;
}

export function parseUrlActiveCameraPosKey(): string | null {
  const parsed = parseUrlCameraPos();
  return parsed?.type === 'angle' ? parsed.posKey : null;
}

export function updateUrlCameraPos(posKey: string | null) {
  writeUrl(params => {
    params.delete('cameraView');
    if (posKey) {
      params.set('cameraPos', posKey);
    } else {
      params.delete('cameraPos');
      params.delete('cameraPosition');
      params.delete('camPos');
      params.delete('pos');
    }
  });
}

/** target is independent of mode and of the active human's character parameter. */
export function parseUrlCameraTarget(): CameraTarget | null {
  if (typeof window === 'undefined') return null;
  const params = getUrlParams();
  const shorthand = ['fpv', 'follow'].map(key => params.get(key)?.trim().toLowerCase())
    .find(value => value && !['0', '1', 'true', 'false', 'yes', 'no', 'on', 'off'].includes(value));
  const raw = (params.get('target') ?? params.get('cameraTarget') ?? shorthand)?.trim().toLowerCase();
  if (!raw) return null;
  const subject = resolveCameraSubject(raw);
  if (subject) return subject;
  if (raw === 'studio' || raw === 'plane') return raw;
  if (raw === 'charactersgrid') return 'charactersGrid';
  if (raw === 'inventoryobjectgrid') return 'inventoryObjectGrid';
  throw new Error(`Cible caméra inconnue : ${raw}`);
}

export function parseUrlCameraSubject() {
  const target = parseUrlCameraTarget();
  return target ? resolveCameraSubject(target) ?? null : null;
}

export function updateUrlCameraTarget(target: CameraTarget | null) {
  writeUrl(params => {
    params.delete('cameraTarget');
    const subject = target && resolveCameraSubject(target);
    const value = CAMERA_SUBJECTS.find(choice => choice.id === subject)?.target ?? target;
    if (value) params.set('target', value);
    else params.delete('target');
  });
}

/** Shared links distinguish camera orbit from PNJ movement in the same Follow view. */
export function parseUrlArrowControl(): ArrowControl {
  const raw = typeof window === 'undefined' ? null : getUrlParams().get('arrowControl');
  if (raw !== null && raw !== 'camera' && raw !== 'character') throw new Error(`Contrôle des flèches inconnu : ${raw}`);
  return parseUrlCameraMode() === 'fpv' ? 'character' : raw ?? 'camera';
}

export function updateUrlArrowControl(control: ArrowControl) {
  const defaultControl = parseUrlCameraMode() === 'fpv' ? 'character' : 'camera';
  writeUrl(params => {
    if (control === defaultControl) params.delete('arrowControl');
    else params.set('arrowControl', control);
  });
}

/**
 * Analyse l'URL pour le mouvement de la caméra : 'fix' | 'orbit' | 'follow'.
 */
export function parseUrlCameraMovement(): CameraMovement {
  if (typeof window === 'undefined') return 'fix';
  const raw = getUrlParams().get('cameraMovement')?.trim().toLowerCase();
  if (raw === 'orbit' || raw === 'follow') return raw;
  return 'fix';
}

export function updateUrlCameraMovement(movement: CameraMovement) {
  writeUrl(params => {
    if (movement !== 'fix') params.set('cameraMovement', movement);
    else params.delete('cameraMovement');
  });
}

/**
 * Analyse l'URL pour le mode souris (rotate vs translate).
 */
export function parseUrlMouseMode(): OrbitMouseMode | null {
  if (typeof window === 'undefined') return null;
  const raw = getUrlParams().get('mouseMode')?.trim().toLowerCase();
  if (raw === 'rotate' || raw === 'rot') return 'rotate';
  if (raw === 'translate' || raw === 'trans') return 'translate';
  return null;
}

export function updateUrlCameraProjection(projection: CameraProjection) {
  writeUrl(params => {
    if (projection === 'ortho') params.set('projection', projection);
    else params.delete('projection');
  });
}

/**
 * Analyse l'URL pour détecter le mode caméra initial :
 *  - FPV par défaut
 *  - fpv=subject et follow=subject sélectionnent aussi la cible
 *  - Orbit pour une cible statique ou un angle de position
 */
export function parseUrlCameraMode(): CameraMode {
  if (typeof window === 'undefined') return 'fpv';
  const posParsed = parseUrlCameraPos();

  const params = getUrlParams();

  if (params.has('fpv')) {
    const val = params.get('fpv')?.trim().toLowerCase();
    if (!['0', 'false', 'no', 'off'].includes(val ?? '')) return 'fpv';
  }

  if (params.has('follow')) {
    const val = params.get('follow')?.trim().toLowerCase();
    if (!['0', 'false', 'no', 'off'].includes(val ?? '')) return 'follow';
  }

  const raw = params.get('mode') ?? params.get('camera') ?? params.get('cam');
  if (raw) {
    const m = raw.trim().toLowerCase();
    if (m === 'orbit' || m === 'iso') return m;
    if (m === 'fpv' || m === 'firstperson' || m === '1p' || m === 'fps') return 'fpv';
    if (m === 'follow' || m === '3p' || m === 'thirdperson') return 'follow';
    if (m === 'top' || m === 'topdown' || m === '2d' || m === 'plan') return 'top';
  }

  const movement = parseUrlCameraMovement();
  if (movement === 'follow') return 'follow';
  if (movement === 'orbit') return 'orbit';

  const target = parseUrlCameraTarget();
  if (target && !resolveCameraSubject(target) || posParsed?.type === 'angle') return 'orbit';
  return 'fpv';
}

/**
 * Met à jour l'URL avec le mode caméra actif sans recharger la page
 */
export function updateUrlCameraMode(mode: CameraMode) {
  const target = parseUrlCameraTarget();
  updateUrlCameraTarget(target);
  writeUrl(params => {
    for (const key of ['camera', 'cam', 'orbit', 'fpv', 'follow']) params.delete(key);
    params.set('mode', mode);
  });
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

/** ?flight, ?flight=1 ou ?flight=true ouvre le mode avion au chargement. */
export function parseUrlFlightMode(): boolean {
  if (typeof window === 'undefined') return false;
  const params = getUrlParams();
  if (!params.has('flight')) return false;
  const value = params.get('flight')?.trim().toLowerCase();
  return value === '' || value === '1' || value === 'true' || value === 'yes' || value === 'on';
}

export function updateUrlFlightMode(active: boolean) {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  if (active) url.searchParams.set('flight', '1');
  else url.searchParams.delete('flight');
  // Nettoyer aussi le flag historique dans une route hash, sans perdre ses autres paramètres.
  const separator = url.hash.indexOf('?');
  if (separator >= 0) {
    const params = new URLSearchParams(url.hash.slice(separator + 1));
    params.delete('flight');
    const query = params.toString();
    url.hash = url.hash.slice(0, separator) + (query ? `?${query}` : '');
  }
  window.history.replaceState(null, '', url.toString());
}
