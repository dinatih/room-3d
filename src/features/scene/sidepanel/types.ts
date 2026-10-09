import type { PlaneModelKey } from '../PaperPlane';
import type { LaraCountMode } from '../characterConfig';
import {
  ROOM_W, ROOM_D, WALL_H,
} from '../wallData';

// ── Presets caméra ────────────────────────────────────────────────────────────

const CX   = ROOM_W / 2;
const CY   = WALL_H / 2;
const CZ   = ROOM_D / 2;
const DIST = 1500;
const ISO  = 1500;

export interface CameraViewPreset {
  pos: [number, number, number];
  target: [number, number, number];
  projection?: 'persp' | 'ortho';
  zoom?: number;
}

export const VIEWS: Record<string, CameraViewPreset> = {
  perspective: { pos: [CX + 100, 200, CZ + 300],         target: [CX, WALL_H / 3, CZ], projection: 'persp' },
  top3d:       { pos: [CX, DIST + 200, CZ],               target: [CX, 0, CZ],          projection: 'persp' },
  top:         { pos: [CX, DIST, CZ + 0.1],               target: [CX, 0, CZ],          projection: 'ortho', zoom: 1 },
  front:       { pos: [CX, CY, CZ + DIST],                target: [CX, CY, CZ],         projection: 'ortho', zoom: 1 },
  back:        { pos: [CX, CY, CZ - DIST],                target: [CX, CY, CZ],         projection: 'ortho', zoom: 1 },
  left:        { pos: [CX - DIST, CY, CZ],                target: [CX, CY, CZ],         projection: 'ortho', zoom: 1 },
  right:       { pos: [CX + DIST, CY, CZ],                target: [CX, CY, CZ],         projection: 'ortho', zoom: 1 },
  bottom:      { pos: [CX, -DIST, CZ],                    target: [CX, 0, CZ],          projection: 'ortho', zoom: 1 },
  'iso-se':    { pos: [CX + ISO, ISO, CZ + ISO],          target: [CX, 0, CZ],          projection: 'ortho', zoom: 1 },
  'iso-nw':    { pos: [CX - ISO, ISO, CZ - ISO],          target: [CX, 0, CZ],          projection: 'ortho', zoom: 1 },
  'iso-ne':    { pos: [CX + ISO, ISO, CZ - ISO],          target: [CX, 0, CZ],          projection: 'ortho', zoom: 1 },
  'iso-sw':    { pos: [CX - ISO, ISO, CZ + ISO],          target: [CX, 0, CZ],          projection: 'ortho', zoom: 1 },
};

// Les dix raccourcis communs à la barre de vues et aux repères 3D.
export const ORTHO_VIEWS = [
  { key: 'front', label: 'Face', shortcut: 'Alt+1', icon: 'bi-arrow-up' },
  { key: 'back', label: 'Arrière', shortcut: 'Alt+2', icon: 'bi-arrow-down' },
  { key: 'left', label: 'Gauche', shortcut: 'Alt+3', icon: 'bi-arrow-left' },
  { key: 'right', label: 'Droite', shortcut: 'Alt+4', icon: 'bi-arrow-right' },
] as const;

export const EXTRA_VIEWS = [
  { key: 'top', label: 'Dessus', shortcut: 'Alt+5', icon: 'bi-chevron-compact-up' },
  { key: 'bottom', label: 'Dessous', shortcut: 'Alt+6', icon: 'bi-chevron-compact-down' },
] as const;

export const ISO_VIEWS = [
  { key: 'iso-se', label: 'ISO Sud-Est', shortcut: 'Alt+7', icon: 'bi-arrow-down-right' },
  { key: 'iso-sw', label: 'ISO Sud-Ouest', shortcut: 'Alt+8', icon: 'bi-arrow-down-left' },
  { key: 'iso-ne', label: 'ISO Nord-Est', shortcut: 'Alt+9', icon: 'bi-arrow-up-right' },
  { key: 'iso-nw', label: 'ISO Nord-Ouest', shortcut: 'Alt+0', icon: 'bi-arrow-up-left' },
] as const;

export const CAMERA_SHORTCUT_VIEWS = [...ORTHO_VIEWS, ...EXTRA_VIEWS, ...ISO_VIEWS];

import { useSceneStore } from '../store/useSceneStore';
import { getInventoryGridCameraTarget } from '../inventoryGridCamera';

export function dispatchView(key: string, targetOverride?: [number, number, number], preserveFollow = false) {
  useSceneStore.getState().setActiveCameraView(key);
  const v = VIEWS[key];
  if (!v) return;
  const inventoryGridTarget = useSceneStore.getState().layers.inventoryGrid
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
  showerDoor: boolean;
  dronaMode: 'high' | 'low' | 'procedural' | 'hidden';
}

export type GroundType = 'bermuda' | 'medium_01' | 'medium_02' | 'celandine' | 'mud_leaves' | 'none';

export interface LayerState {
  cameraViewMarkers: boolean;
  structure: boolean;
  wallStructure: boolean;
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
  laraNude?:    boolean;
  laraTopOff?:  boolean;
  laraBottomOff?: boolean;
  laraShoes?:   boolean;
  laraRealisticTextures?: boolean;
  laraCount?:   LaraCountMode;
  showAllLaraStyles: boolean;
  extraCharacters?: boolean;
  wallhack: boolean;
  aiZones: boolean;
  npcCollisions: boolean;
  debugNpcCollisions: boolean;
  furnitureCollisions: boolean;
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
  smokeTransition?: boolean;
}

export type LidarMode = 0 | 1 | 2 | 3;

export interface SidePanelProps {
  layers:                  LayerState;
  onToggleLayer:           (key: keyof LayerState) => void;
  onOpenInventory:         () => void;
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
}

export type TabKey = 'profile' | 'layers' | 'personnage' | 'perf' | 'plan2d' | 'interactif' | null;

export const TABS: Array<{ key: Exclude<TabKey, null>; icon: string; label: string }> = [
  { key: 'profile',    icon: 'bi-briefcase-fill', label: 'Profil' },
  { key: 'perf',       icon: 'bi-bar-chart-fill', label: 'Perf' },
  { key: 'plan2d',     icon: 'bi-map-fill', label: 'Plan 2D' },
  { key: 'layers',     icon: 'bi-layers-fill', label: 'Calques' },
  { key: 'interactif', icon: 'bi-controller', label: 'Interact' },
  { key: 'personnage', icon: 'bi-person-fill', label: 'PNJ' },
];

export const ALL_HAIR_COLORS: string[] = [
  'naturel', 'noir', 'brun', 'chatain', 'blond', 'roux', 'rouge', 'blanc', 'bleu', 'vert', 'rose', 'violet', 'arc-en-ciel'
];
