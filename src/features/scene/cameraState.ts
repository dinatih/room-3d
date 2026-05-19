/**
 * cameraState.ts — état partagé entre CameraController et Minimap (sans React state).
 * Mis à jour chaque frame par CameraController, lu par MinimapOverlay via RAF.
 */

type CameraMode = 'orbit' | 'walk' | 'top' | 'plane';

export const cameraState = {
  mode: 'orbit' as CameraMode,
  /** Position caméra (pour l'icône walk sur la minimap) */
  camX: 150 as number,
  camZ: 200 as number,
  camRY: 0 as number,
  /** Walk mode : état partagé avec Walker.tsx */
  isWalking: false as boolean,
  isMoving:  false as boolean,
  walkYaw:   0     as number,
  walkPitch: 0     as number,
  /** Index du walker actif (0 = défaut, 1 = rouge) — touche L pour switcher */
  activeWalkerIdx: 0 as number,
  /** Positions des deux walkers (mis à jour par Walker.tsx) */
  walker0X: 150 as number, walker0Z: 200 as number,
  walker1X: 230 as number, walker1Z: 140 as number,  // ROOM_W/2+80, ROOM_D/2-60
  /** Hauteurs (cm) des deux walkers — écrites par Walker.tsx, lues par les caméras walk */
  walkerHeight0: 181 as number,
  walkerHeight1: 170 as number,
  /** Alias actif — lu par Minimap */
  walkerX: 150 as number,
  walkerZ: 200 as number,
  /** Déclenché par CameraController chaque frame — la minimap s'y abonne */
  onUpdate:   null as (() => void) | null,
  /** Enregistré par CameraController ; appeler pour forcer un frame R3F. */
  invalidate: null as (() => void) | null,
  /** Vrai pendant une session WebXR — désactive les contrôles clavier/orb */
  isXR: false as boolean,
  /** HD mirrors : reflector camera hérite du mask complet de la caméra principale */
  mirrorsHD: false as boolean,
  /** Masque le mesh du Walker actif (utilisé en vue première personne pendant la visite guidée) */
  walkerHidden: false as boolean,
  /** Position et yaw de l'avion en papier (lus par la Minimap quand mode='plane') */
  planeX: 0 as number,
  planeZ: 0 as number,
  planeYaw: 0 as number,
};
