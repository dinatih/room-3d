import type { PlaneModelKey } from '../PaperPlane';
import type { LaraCountMode } from '../walkerConfig';
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
  bottom:      { pos: [CX, -DIST, CZ],                    target: [CX, 0, CZ],          projection: 'persp' },
  'iso-se':    { pos: [CX + ISO, ISO, CZ + ISO],          target: [CX, 0, CZ],          projection: 'ortho', zoom: 1 },
  'iso-nw':    { pos: [CX - ISO, ISO, CZ - ISO],          target: [CX, 0, CZ],          projection: 'ortho', zoom: 1 },
  'iso-ne':    { pos: [CX + ISO, ISO, CZ - ISO],          target: [CX, 0, CZ],          projection: 'ortho', zoom: 1 },
  'iso-sw':    { pos: [CX - ISO, ISO, CZ + ISO],          target: [CX, 0, CZ],          projection: 'ortho', zoom: 1 },
};

import { useSceneStore } from '../store/useSceneStore';

export function dispatchView(key: string) {
  useSceneStore.getState().setActiveCameraView(key);
  const v = VIEWS[key];
  if (!v) return;
  document.dispatchEvent(new CustomEvent('camera-view', { detail: { ...v, key } }));
}

export function dispatchKey(key: string) {
  window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
}

// ── Types d'état ─────────────────────────────────────────────────────────────

export interface FurnitureState {
  eastGlassDoor:     boolean;
  entryDoor:    boolean;
  livingDoor:   boolean;
  bathroomDoor: boolean;
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
  glassDoorV2LeftOpen: boolean;
  glassDoorV2ShutterPos: number;
  mackaparDoors: boolean;
  showerDoor: boolean;
  dronaMode: 'high' | 'low' | 'procedural' | 'hidden';
}

export type GroundType = 'bermuda' | 'medium_01' | 'medium_02' | 'celandine' | 'mud_leaves' | 'none';

export interface LayerState {
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
  laraGrid:     boolean;

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
  walker:       boolean;
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
  onToggleHideUI?:         () => void;
  hideUI?:                 boolean;
}

export type TabKey = 'profile' | 'views' | 'layers' | 'personnage' | 'perf' | 'interactif' | null;

export const TABS: Array<{ key: Exclude<TabKey, null>; emoji: string; label: string }> = [
  { key: 'profile',    emoji: '💼', label: 'Profil' },
  { key: 'perf',       emoji: '📊', label: 'Perf' },
  { key: 'views',      emoji: '📷', label: 'Vues' },
  { key: 'layers',     emoji: '📑', label: 'Calques' },
  { key: 'interactif', emoji: '🎮', label: 'Interact' },
  { key: 'personnage', emoji: '👤', label: 'Perso' },
];

export const ALL_HAIR_COLORS: string[] = [
  'naturel', 'noir', 'brun', 'chatain', 'blond', 'roux', 'rouge', 'blanc', 'bleu', 'vert', 'rose', 'violet', 'arc-en-ciel'
];
