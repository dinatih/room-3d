export type LaraClothing = 'native' | 'bikini' | 'none';

import type { PlaneModelKey } from '../PaperPlane';
import type { LaraCountMode } from '../characterConfig';
import { resolveCameraView } from '../camera/cameraViews';
export { VIEWS, resolveCameraView } from '../camera/cameraViews';
export type { CameraViewPreset } from '../camera/cameraViews';

// Les dix raccourcis communs à la barre de vues et aux repères 3D.
export const CARDINAL_VIEWS = [
  { key: 'north', label: 'Nord', shortcut: 'Alt+1', icon: 'bi-arrow-up' },
  { key: 'north-east', label: 'Nord-Est', shortcut: 'Alt+2', icon: 'bi-arrow-up-right' },
  { key: 'east', label: 'Est', shortcut: 'Alt+3', icon: 'bi-arrow-right' },
  { key: 'south-east', label: 'Sud-Est', shortcut: 'Alt+4', icon: 'bi-arrow-down-right' },
  { key: 'south', label: 'Sud', shortcut: 'Alt+5', icon: 'bi-arrow-down' },
  { key: 'south-west', label: 'Sud-Ouest', shortcut: 'Alt+6', icon: 'bi-arrow-down-left' },
  { key: 'west', label: 'Ouest', shortcut: 'Alt+7', icon: 'bi-arrow-left' },
  { key: 'north-west', label: 'Nord-Ouest', shortcut: 'Alt+8', icon: 'bi-arrow-up-left' },
] as const;

export const ELEVATION_VIEWS = [
  { angle: 90, label: '90° Haut', icon: 'bi-chevron-compact-up' },
  { angle: 60, label: '60° Plongée', icon: 'bi-box' },
  { angle: 45, label: '45° Plongée', icon: 'bi-box' },
  { angle: 0, label: '0° Face', icon: 'bi-dash-lg' },
  { angle: -90, label: '-90° Bas', icon: 'bi-chevron-compact-down' },
] as const;

export const CAMERA_SHORTCUT_VIEWS = CARDINAL_VIEWS;

import { useSceneStore } from '../store/useSceneStore';
import { getInventoryGridCameraTarget } from '../inventoryGridCamera';

export function dispatchView(key: string, targetOverride?: [number, number, number], preserveFollow = false, elevationOverride?: number) {
  const store = useSceneStore.getState();
  const elev = elevationOverride ?? store.cameraElevation;
  const v = resolveCameraView(key, store.cameraProjection, undefined, elev);
  store.setActiveCameraPos(key);
  store.setCameraElevation?.(elev);
  const inventoryGridTarget = (store.layers.inventoryGrid || store.layers.wigGrid)
    ? getInventoryGridCameraTarget()
    : null;
  const target = targetOverride ?? inventoryGridTarget ?? undefined;
  if (!target) {
    document.dispatchEvent(new CustomEvent('camera-view', { detail: { ...v, key, preserveFollow } }));
    return;
  }
  const offset = target.map((value, index) => value - v.target[index]);
  const pos = v.pos.map((value, index) => value + offset[index]) as [number, number, number];
  document.dispatchEvent(new CustomEvent('camera-view', {
    detail: { ...v, pos, target, key, preserveFollow },
  }));
}

export function dispatchKey(key: string) {
  window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
}

// ── Types d'état ─────────────────────────────────────────────────────────────

export interface FurnitureState {
  corrDoors:    boolean;
  sdbClosetL:   boolean;
  sdbClosetR:   boolean;
  cbnWest:      boolean;
  cbnEast:      boolean;
  cabinet:      boolean;
  bedDouble:    boolean;
  lampOn:       boolean;
  lampBath:     boolean;
  lampCorridor: boolean;
  freezerOpen:    boolean;
  fridge:         boolean;
  tvOn:           boolean;
  sofaArmLeft:    boolean;
  sofaArmRight:   boolean;
  glassDoorV2ShutterPos: number;
  mackaparDoors: boolean;
  dronaMode: 'high' | 'low' | 'procedural' | 'hidden';
}

export type GroundType = 'bermuda' | 'medium_01' | 'medium_02' | 'celandine';

export interface LayerState {
  cameraViewMarkers: boolean;
  structure: boolean;
  wallStructure: boolean;
  iceCastle?: boolean;
  floorCoverings: boolean;
  environment: boolean;
  bnfMarker?: boolean;
  equipment: boolean;
  furniture: boolean;
  furnishings: boolean;
  decor: boolean;
  neighbors:  boolean;
  wireframe:  boolean;
  wireframeWallStructure?: boolean;
  wireframeStructure?: boolean;
  wireframeDoors?: boolean;
  mirrorSurfaces: boolean;
  mirrors:       boolean;
  mirrorsHD:  boolean;
  plan:         boolean;
  grid:         boolean;
  gridDepth:    boolean;
  characterGrid:     boolean;

  skeleton:     boolean;
  ceiling:      boolean;
  doors:        boolean;
  wallEdges:    boolean;
  measuredDimensions: boolean;
  lidar:        boolean;
  lights:       boolean;
  lightsHD:     boolean;
  shadows:      boolean;
  pillarsOnly:    boolean;
  realSun:      boolean;
  bermudaGrass: boolean;
  groundType?:  GroundType;
  character:    boolean;
  animals:      boolean;
  accessories:  boolean;
  laraPistols:  boolean;
  laraTop: LaraClothing;
  laraBottom: LaraClothing;
  laraShoes?:   boolean;
  laraRealisticTextures?: boolean;
  laraCount?:   LaraCountMode;
  showAllLaraStyles: boolean;
  extraCharacters?: boolean;
  wallhack: boolean;
  aiZones: boolean;
  npcCollisions: boolean;
  debugNpcCollisions: boolean;
  debugFurnitureCollisions: boolean;
  breastPhysics: boolean;
  breastIntensity?: number;
  breastMass?: number;
  breastFirmness?: number;
  braElasticity?: number;
  braElasticityXZ?: number;
  breastLagDelay?: number;
  maxBreastAngle?: number;
  maxBreastAngleXZ?: number;
  breastTranslation?: number;
  breastMaxTravel?: number;
  breastSquash?: number;
  breastGravity?: number;
  hairPhysics: boolean;
  wigPhysics?: boolean;
  wigStiffness?: number;
  wigDamping?: number;
  wigGravity?: number;
  wigInertia?: number;
  wigWind?: number;
  wigMaxAngle?: number;
  wigTipWeight?: number;
  wigHeadCollisionRadius?: number;
  characterShadows: boolean;
  characterWireframe?: boolean;
  fpvHeadBobbing?: boolean;
  fpvRealisticEyes?: boolean;
  fpvStabilization?: boolean;
  fpvStabilizationFactor?: number;
  inventoryGrid?: boolean;
  wigGrid?: boolean;
  smokeTransition?: boolean;
  animOriginLerp?: boolean;
  animCrossfade?: boolean;
}

export type LidarMode = 0 | 1 | 2 | 3;

export interface ToolbarPanelsProps {
  layers:                  LayerState;
  onToggleLayer:           (key: keyof LayerState) => void;
  lidarMode:               LidarMode;
  onCycleLidar:            () => void;
  lidarOpacity:            number;
  onToggleLidarOpacity:    () => void;
  buildAnimMatrix?:        boolean;
  onStartBuildAnimMatrix?: () => void;
  onStopBuildAnim?:        () => void;
  animDurations?:          Record<string, number>;
  planeModel?:             PlaneModelKey;
  onSetPlaneModel?:        (m: PlaneModelKey) => void;
  autopilotVisible?:       boolean;
  onToggleAutopilot?:      () => void;
  showLandingStrips?:      boolean;
  onToggleLandingStrips?:  () => void;
  hideUI?:                 boolean;
  onOpenInventory?:        () => void;
  prefix?:                 React.ReactNode;
}

export type TabKey = 'profile' | 'layers' | 'personnage' | 'perf' | 'plan2d' | 'interactif' | null;

export const TABS: Array<{ key: Exclude<TabKey, null>; icon: string; label: string }> = [
  { key: 'profile',    icon: 'bi-briefcase-fill', label: 'Profil' },
  { key: 'perf',       icon: 'bi-bar-chart-fill', label: 'Perf' },
  { key: 'plan2d',     icon: 'bi-map-fill', label: 'Plan' },
  { key: 'layers',     icon: 'bi-layers-fill', label: 'Calques' },
  { key: 'interactif', icon: 'bi-controller', label: 'Interact' },
  { key: 'personnage', icon: 'bi-person-fill', label: 'PNJ' },
];

export const ALL_HAIR_COLORS: string[] = [
  'naturel', 'noir', 'brun', 'chatain', 'blond', 'roux', 'rouge', 'blanc', 'bleu', 'vert', 'rose', 'violet', 'arc-en-ciel'
];
