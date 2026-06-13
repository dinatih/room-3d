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
  /** Position et orientation du walker unique (mis à jour par CameraController) */
  walkerX: 150 as number, 
  walkerZ: 200 as number, 
  walkerYaw: 0 as number,
  /** Position du second modèle immobile */
  otherX: 251 as number,
  otherZ: 178 as number,
  otherYaw: 1.325 as number,
  /** Hauteur (cm) du walker — écrit par Walker.tsx, lue par les caméras walk */
  walkerHeight: 181 as number,
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
  /** Vue courante dans le mode avion */
  planeViewMode: 'prelaunch' as 'prelaunch' | 'follow' | 'cockpit' | 'walker' | 'landing' | 'landed',
  /** Vrai après le décollage (prelaunch terminé) */
  planeLaunched: false as boolean,
  /** Pistes d'atterrissage visibles (minimap + 3D) */
  landingStripsVisible: false as boolean,
  /** Avion autopilote (position minimap) */
  autopilotActive: false as boolean,
  autopilotX: 150 as number,
  autopilotZ: 200 as number,
  autopilotYaw: 0 as number,
};
