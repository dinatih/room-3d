/**
 * cameraState.ts — état partagé entre CameraController et Minimap (sans React state).
 * Mis à jour chaque frame par CameraController, lu par MinimapOverlay via RAF.
 */

export type CameraMode = 'orbit' | 'walk' | 'top';

export const cameraState = {
  mode: 'orbit' as CameraMode,
  /** Position caméra (pour l'icône walk sur la minimap) */
  camX: 150 as number,
  camZ: 200 as number,
  camRY: 0 as number,
  /** Déclenché par CameraController chaque frame — la minimap s'y abonne */
  onUpdate:   null as (() => void) | null,
  /** Enregistré par CameraController ; appeler pour forcer un frame R3F. */
  invalidate: null as (() => void) | null,
};
