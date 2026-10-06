/**
 * cameraState.ts — état partagé entre CameraController et Minimap (sans React state).
 * Mis à jour chaque frame par CameraController, lu par MinimapOverlay via RAF.
 */

import { CHARACTERS, parseUrlActiveCharacter } from './characterConfig';
import { parseUrlCameraMode } from './camera/cameraUrlParams';

type CameraMode = 'orbit' | 'follow' | 'fpv' | 'top' | 'plane' | 'ortho';

const initialChar = parseUrlActiveCharacter() || CHARACTERS[0];

export const cameraState = {
  mode: parseUrlCameraMode() as CameraMode,
  /** Vue placée dans les yeux : tête masquée en caméra principale, visible dans les miroirs. */
  isFirstPersonView(): boolean {
    return this.mode === 'fpv' || this.isXR || (this.mode === 'plane' && this.planeViewMode === 'character');
  },
  /** Position caméra (pour l'icône follow sur la minimap) */
  camX: 150 as number,
  camZ: 200 as number,
  camRY: 0 as number,
  /** Follow mode : état partagé avec CharacterGroup.tsx */
  isFollowing: false as boolean,
  isMoving:  false as boolean,
  isDragging: false as boolean,
  isAIControlled: false as boolean,
  /** Timestamp de la dernière action manuelle utilisateur (flèches clavier, clic VR) */
  lastUserControlTime: 0 as number,
  /** Vérifie si l'utilisateur a pris la main manuellement récemment (< 12s) */
  isUserControlling(): boolean {
    if (this.lastUserControlTime === 0) return false;
    return (performance.now() - this.lastUserControlTime) < 12000;
  },
  followYaw:   (initialChar?.rot ?? 1.9) as number,
  followPitch: 0     as number,
  /** Position et orientation du character unique (synchro dynamique depuis CHARACTERS) */
  characterX: (initialChar?.pos[0] ?? 140) as number, 
  characterZ: (initialChar?.pos[2] ?? 30) as number, 
  characterYaw: (initialChar?.rot ?? 1.9) as number,
  /** Positions enregistrées de tous les characters */
  positions: {} as Record<string, {x: number, y: number, z: number, yaw: number, anim?: string}>,
  /** Projection XZ de l'os de tête (monde) de chaque personnage visible — lue par la minimap (positions[] reste sur la racine, pour l'IA) */
  headPositions: {} as Record<string, { x: number; z: number }>,
  /** Position monde réelle de la tête du character actif (calculée dynamiquement par Character d'après le squelette 3D) */
  activeHeadPos: null as { x: number; y: number; z: number } | null,
  /** Position monde réelle des hanches / centre de masse du character actif */
  activeHipsPos: null as { x: number; y: number; z: number } | null,
  /** Position monde réelle du centre des deux yeux du character actif (pour FPV réaliste) */
  activeEyesPos: null as { x: number; y: number; z: number } | null,
  /** Vecteur unitaire avant (gaze/forward) de la tête du character actif */
  activeHeadForward: null as { x: number; y: number; z: number } | null,
  /** Vecteur unitaire haut (up) de la tête du character actif */
  activeHeadUp: null as { x: number; y: number; z: number } | null,
  /** Hauteur (cm) du character — écrit par Character.tsx, lue par les caméras follow */
  characterHeight: (initialChar?.height ?? 173.4) as number,
  /** Déclenché par CameraController chaque frame — la minimap s'y abonne */
  onUpdate:   null as (() => void) | null,
  /** Enregistré par CameraController ; appeler pour forcer un frame R3F. */
  invalidate: null as (() => void) | null,
  /** Vrai pendant une session WebXR — désactive les contrôles clavier/orb */
  isXR: false as boolean,
  /** HD mirrors : reflector camera hérite du mask complet de la caméra principale */
  mirrorsHD: false as boolean,
  /** Masque le mesh du Character actif (utilisé en vue première personne pendant la visite guidée) */
  characterHidden: false as boolean,
  /** Vrai des que la scene 3D est lancee (apres prechargement et warm-up GPU) */
  isSceneLaunched: false as boolean,
  /** Vrai pendant la transition d'introduction de la caméra */
  isIntroRunning: false as boolean,
  /** Callback pour forcer l'interruption immédiate du vol d'introduction */
  skipIntro: null as (() => void) | null,
  /** Position et yaw de l'avion en papier (lus par la Minimap quand mode='plane') */
  planeX: 0 as number,
  planeZ: 0 as number,
  planeYaw: 0 as number,
  /** Vitesse réelle en cm/s (échelle du studio). */
  planeSpeed: 0 as number,
  /** Contact de l’avion avec la limite du dôme : révèle sa grille intérieure. */
  planeSkyContact: false as boolean,
  /** Vue courante dans le mode avion */
  planeViewMode: 'prelaunch' as 'prelaunch' | 'follow' | 'cockpit' | 'character' | 'landing' | 'landed',
  /** Vrai après le décollage (prelaunch terminé) */
  planeLaunched: false as boolean,
  planeLaunching: false as boolean,
  /** Pistes d'atterrissage visibles (minimap + 3D) */
  landingStripsVisible: false as boolean,
  /** Avion autopilote (position minimap) */
  autopilotActive: false as boolean,
  autopilotX: 150 as number,
  autopilotZ: 200 as number,
  autopilotYaw: 0 as number,
};
