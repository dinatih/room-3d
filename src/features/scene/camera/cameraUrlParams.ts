import type { CameraMode, CameraTarget, OrbitMouseMode } from './types';
import { findCharacterByIdOrName } from '@features/scene/characterConfig';

export type CameraProjection = 'persp' | 'ortho';

export const CAMERA_POS_ALIASES: Record<string, string> = {
  'n-o': 'iso-nw',
  'no': 'iso-nw',
  'nw': 'iso-nw',
  'iso-nw': 'iso-nw',
  'n-e': 'iso-ne',
  'ne': 'iso-ne',
  'iso-ne': 'iso-ne',
  's-e': 'iso-se',
  'se': 'iso-se',
  'iso-se': 'iso-se',
  's-o': 'iso-sw',
  'so': 'iso-sw',
  'sw': 'iso-sw',
  'iso-sw': 'iso-sw',
  'face': 'front',
  'front': 'front',
  'dos': 'back',
  'arriere': 'back',
  'arrière': 'back',
  'back': 'back',
  'gauche': 'left',
  'left': 'left',
  'droite': 'right',
  'right': 'right',
  'haut': 'top',
  'dessus': 'top',
  'top': 'top',
  'bas': 'bottom',
  'dessous': 'bottom',
  'bottom': 'bottom',
  'persp': 'perspective',
  'perspective': 'perspective',
  'top3d': 'top3d',
};

function getUrlParams(): URLSearchParams {
  let search = window.location.search;
  if (!search && window.location.hash.includes('?')) {
    search = window.location.hash.substring(window.location.hash.indexOf('?'));
  }
  return new URLSearchParams(search);
}

function writeUrl(update: (params: URLSearchParams) => void) {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  update(url.searchParams);
  window.history.replaceState(null, '', url.toString());
}

export function parseUrlCameraProjection(): CameraProjection {
  if (typeof window === 'undefined') return 'persp';
  const params = getUrlParams();
  return params.get('projection')?.toLowerCase() === 'ortho' ? 'ortho' : 'persp';
}

/**
 * Analyse l'URL pour la position de caméra demandée :
 *  - Soit un point de vue subjectif FPV sur une entité (ex: cameraPos=rosanna ou cameraPos=shiba)
 *  - Soit un angle orbital relatif au pivot (ex: cameraPos=n-o, cameraPos=front, etc.)
 */
export function parseUrlCameraPos(): { type: 'fpv'; entity: string } | { type: 'angle'; posKey: string } | null {
  if (typeof window === 'undefined') return null;
  const params = getUrlParams();
  const raw = params.get('cameraPos') ??
              params.get('cameraPosition') ??
              params.get('camPos') ??
              params.get('pos') ??
              params.get('cameraView');
  if (!raw) return null;
  const val = raw.trim().toLowerCase();

  // 1. Détection FPV entité (personnage humain ou animal)
  const char = findCharacterByIdOrName(val);
  if (char) return { type: 'fpv', entity: char.id };

  if (val === 'shiba' || val === 'chien' || val === 'dog') return { type: 'fpv', entity: 'shiba' };
  if (val === 'robin' || val === 'oiseau' || val === 'bird') return { type: 'fpv', entity: 'robin' };
  if (val === 'cat' || val === 'chat') return { type: 'fpv', entity: 'cat' };

  // 2. Détection angle relatif
  if (CAMERA_POS_ALIASES[val]) {
    return { type: 'angle', posKey: CAMERA_POS_ALIASES[val] };
  }
  return null;
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

/**
 * Analyse l'URL pour la cible de la caméra (point de focus / pivot 3D).
 * Supporte : studio, character, charactersGrid, inventoryObjectGrid, dog, cat, plane, bird.
 * Si un nom de personnage direct est passé, résout vers 'character'.
 */
export function parseUrlCameraTarget(): CameraTarget | null {
  if (typeof window === 'undefined') return null;
  const params = getUrlParams();
  const raw = params.get('cameraTarget') ?? params.get('target');
  if (!raw) return null;
  const val = raw.trim().toLowerCase();

  if (val === 'studio' || val === 'room' || val === 'sejour' || val === 'centre') return 'studio';
  if (val === 'character' || val === 'perso' || val === 'pnj') return 'character';
  if (val === 'charactersgrid' || val === 'characters-grid' || val === 'charactergrid' || val === 'npcgrid') return 'charactersGrid';
  if (val === 'inventoryobjectgrid' || val === 'inventorygrid' || val === 'inventory' || val === 'inventaire') return 'inventoryObjectGrid';
  if (val === 'dog' || val === 'chien' || val === 'shiba') return 'dog';
  if (val === 'cat' || val === 'chat') return 'cat';
  if (val === 'plane' || val === 'avion') return 'plane';
  if (val === 'bird' || val === 'oiseau' || val === 'robin') return 'bird';

  if (findCharacterByIdOrName(val)) return 'character';

  return null;
}

export function updateUrlCameraTarget(target: CameraTarget | null) {
  writeUrl(params => {
    if (target && target !== 'studio') params.set('cameraTarget', target);
    else {
      params.delete('cameraTarget');
      params.delete('target');
    }
  });
}

/**
 * Analyse l'URL pour le mode souris (rotate vs translate).
 */
export function parseUrlMouseMode(): OrbitMouseMode | null {
  if (typeof window === 'undefined') return null;
  const params = getUrlParams();
  const raw = params.get('mouseMode') ?? params.get('mouse');
  if (!raw) return null;
  const val = raw.trim().toLowerCase();
  if (val === 'rotate' || val === 'rot') return 'rotate';
  if (val === 'translate' || val === 'trans' || val === 'pan') return 'translate';
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
 *  - FPV explicite si cameraPos est une entité
 *  - Orbit si une cible ou un angle de position est spécifié
 */
export function parseUrlCameraMode(): CameraMode {
  if (typeof window === 'undefined') return 'fpv';
  try {
    const posParsed = parseUrlCameraPos();
    if (posParsed?.type === 'fpv') return 'fpv';

    const params = getUrlParams();

    if (params.has('fpv')) {
      const val = params.get('fpv')?.trim().toLowerCase();
      if (val === null || val === '' || val === '1' || val === 'true' || val === 'yes' || val === 'on') {
        return 'fpv';
      }
    }

    if (params.has('follow')) {
      const val = params.get('follow')?.trim().toLowerCase();
      if (val === null || val === '' || val === '1' || val === 'true' || val === 'yes' || val === 'on') {
        return 'follow';
      }
    }

    const raw = params.get('mode') ?? params.get('camera') ?? params.get('cam');
    if (raw) {
      const m = raw.trim().toLowerCase();
      if (m === 'fpv' || m === 'firstperson' || m === '1p' || m === 'fps') return 'fpv';
      if (m === 'follow' || m === '3p' || m === 'thirdperson') return 'follow';
      if (m === 'top' || m === 'topdown' || m === '2d' || m === 'plan') return 'top';
      if (m === 'ortho') return 'ortho';
    }

    const target = parseUrlCameraTarget();
    if (target || posParsed?.type === 'angle') return 'orbit';
  } catch {}
  return 'fpv';
}

/**
 * Met à jour l'URL avec le mode caméra actif sans recharger la page
 */
export function updateUrlCameraMode(mode: CameraMode) {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    const cameraParams = ['mode', 'camera', 'cam', 'orbit', 'fpv', 'follow'];
    for (const p of cameraParams) {
      url.searchParams.delete(p);
    }
    if (mode !== 'orbit' && mode !== 'fpv') {
      url.searchParams.set('mode', mode);
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
