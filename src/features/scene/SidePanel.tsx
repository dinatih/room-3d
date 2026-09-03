/**
 * SidePanel.tsx
 * Updated: 2026-07-27 T-Pose position fix
 *
 * Desktop : panneau accordéon à gauche (sections Vues / Affichage / Mobilier
 *   / Inventaire / DevTools).
 * Mobile  : tab bar fixe en bas (📷 👁 🛋 📦 📊) qui ouvre un bottom-sheet
 *   plein-largeur avec touch targets ≥ 44 px.
 *
 * Composant HTML pur rendu HORS du Canvas R3F. Dispatche des events custom
 * écoutés par CameraController et le reste de la scène.
 * Styled using Bootstrap 5.3 and glassmorphism.
 */
import { useState, useEffect, useRef } from 'react';
import { DevToolsGroups } from '@features/scene/DevToolsOverlay';
import { solarPosition } from '@features/scene/SunLight';
import { useIsMobile } from '@shared/hooks/useIsMobile';

const SUN_LAT = parseFloat(import.meta.env.VITE_STUDIO_LAT ?? '48.828');
const SUN_LNG = parseFloat(import.meta.env.VITE_STUDIO_LNG ?? '2.376');

import { useSceneStore } from './store/useSceneStore';
import { HDRI_LIST } from './hdriConfig';
import { CHARACTERS, isCharacterVisibleInMode, npcLabel, type LaraCountMode } from './walkerConfig';
import { WIGS_ITEMS } from '../inventory/inventoryData';
import { resetAppIdle } from './idleState';
import { WALKER_ANIM_OPTIONS } from './animOptions';
import { DUO_ANIMATIONS } from './ai/duoAnimations';
import { duoSessionManager } from './ai/duoSessionManager';

import {
  ROOM_W, ROOM_D, WALL_H,
  DOOR_START, NICHE_X, KITCHEN_Z,
} from '@config';

// ── Presets caméra (miroir de VIEWS dans cameraManager.js) ───────────────────

const CX   = ROOM_W / 2;
const CY   = WALL_H / 2;
const CZ   = ROOM_D / 2;
const DIST = 600;
const ISO  = 450;

const VIEWS: Record<string, { pos: [number,number,number]; target: [number,number,number] }> = {
  perspective: { pos: [CX + 100, 200, CZ + 300],         target: [CX, WALL_H / 3, CZ] },
  top3d:       { pos: [CX, DIST + 200, CZ],               target: [CX, 0, CZ]          },
  front:       { pos: [CX, CY, CZ + DIST],                target: [CX, CY, CZ]         },
  back:        { pos: [CX, CY, CZ - DIST],                target: [CX, CY, CZ]         },
  left:        { pos: [CX - DIST, CY, CZ],                target: [CX, CY, CZ]         },
  right:       { pos: [CX + DIST, CY, CZ],                target: [CX, CY, CZ]         },
  bottom:      { pos: [CX, -DIST, CZ],                    target: [CX, 0, CZ]          },
  'iso-se':    { pos: [CX + ISO, ISO, CZ + ISO],          target: [CX, 0, CZ]          },
  'iso-nw':    { pos: [CX - ISO, ISO, CZ - ISO],          target: [CX, 0, CZ]          },
};

const POV_ROOMS: Record<string, { x: number; z: number }> = {
  living:   { x: ROOM_W / 2,                      z: ROOM_D / 2 },
  entry:    { x: (DOOR_START + ROOM_W) / 2,        z: ROOM_D + 75 },
  bathroom: { x: (NICHE_X + DOOR_START) / 2,  z: (KITCHEN_Z + 600) / 2 },
  garden:   { x: 150,                              z: -120 },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function dispatchView(key: string) {
  const v = VIEWS[key];
  if (!v) return;
  document.dispatchEvent(new CustomEvent('camera-view', { detail: v }));
}

function dispatchPov(key: string) {
  const p = POV_ROOMS[key];
  if (!p) return;
  document.dispatchEvent(new CustomEvent('camera-pov', { detail: p }));
}

function dispatchKey(key: string) {
  window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
}

// ── Accordion Group Component (Bootstrap Glass Card style) ────────────────────

function Group({ emoji, title, defaultOpen = false, extra, children }: {
  emoji: string; title: string; defaultOpen?: boolean; extra?: React.ReactNode; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card shadow-sm glass-card overflow-hidden">
      <div className="card-header p-0 border-0 bg-transparent d-flex align-items-center justify-content-between">
        <button
          className="btn flex-grow-1 text-start py-2 px-3 fw-bold d-flex align-items-center justify-content-between text-dark border-0 shadow-none"
          onClick={() => setOpen(!open)}
          style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}
        >
          <span>{emoji} {title}</span>
          <span 
            style={{ 
              fontSize: '8px', 
              color: 'var(--muted)',
              transform: open ? 'rotate(90deg)' : 'none', 
              transition: 'transform 0.18s' 
            }}
          >
            ▶
          </span>
        </button>
        {extra && (
          <div className="pe-2 d-flex align-items-center" onClick={e => e.stopPropagation()}>
            {extra}
          </div>
        )}
      </div>
      {open && (
        <div className="card-body p-0 bg-transparent d-flex flex-column border-top border-light-subtle">
          {children}
        </div>
      )}
    </div>
  );
}

// ── Modal Raccourcis Clavier (Bootstrap Modal Glass style) ────────────────────

function ShortcutsModal({ onClose }: { onClose: () => void }) {
  const kbd = (label: string, i = 0) => (
    <kbd key={i} className="bg-secondary text-white mx-1" style={{ fontSize: '10px' }}>{label}</kbd>
  );

  const R = ({ label, keys }: { label: string; keys: string[] }) => (
    <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
      <span className="text-secondary small">{label}</span>
      <span className="d-flex gap-1 flex-wrap justify-content-end">{keys.map(kbd)}</span>
    </div>
  );

  const Section = ({ title }: { title: string }) => (
    <div className="text-muted fw-bold text-uppercase mt-3 mb-1" style={{ fontSize: '9px', letterSpacing: '0.06em' }}>{title}</div>
  );

  return (
    <div className="modal fade show d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable" style={{ maxWidth: '360px' }}>
        <div className="modal-content text-dark glass-card">
          <div className="modal-header border-bottom-0">
            <h5 className="modal-title fs-6 fw-bold">⌨️ Raccourcis clavier</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body py-1">
            <div>
              <Section title="Global" />
              <R label="Inventaire (toggle)"        keys={['I']} />
              <R label="Inventaire Personnages (direct)" keys={['P']} />
              <R label="Zones IA (toggle)"          keys={['A']} />
              <R label="Vue perspective (reset)"    keys={['O']} />
              <R label="Walk mode (cycle 3P / FPV)" keys={['M']} />
              <R label="Vue 3ème personne directe"  keys={['3']} />
              <R label="Vue FPV 1ère personne directe" keys={['1']} />
              <R label="Minimap 2D (toggle)"        keys={['8']} />
              <R label="Masquer toute l'UI (Vue clean)" keys={['0']} />
              <R label="Console de logs (toggle)"   keys={['B']} />
              <R label="Vue top-down (toggle)"      keys={['T']} />
              <R label="Vue top-down suivi perso (toggle)" keys={['Y']} />
              <R label="Avion en papier (toggle)"   keys={['F']} />
              <R label="Grille Lara (toggle)"       keys={['G']} />
              <R label="Enlever le haut (toggle)"   keys={['Z']} />
              <R label="Enlever le bas (toggle)"    keys={['C']} />
              <R label="Déshabiller les Lara (toggle)" keys={['X']} />
              <R label="Squelettes / Bones (toggle)" keys={['K']} />
              <R label="Arêtes des murs (toggle)"   keys={['W']} />
              <R label="Mesures réelles 📐 (toggle)" keys={['U']} />
              <R label="Quitter walk / top-down"    keys={['Échap']} />
              <R label="Changer de personnage"      keys={['L']} />
            </div>

            <div>
              <Section title="Avion (mode vol)" />
              <R label="Décoller (pré-vol)"         keys={['Espace', 'C']} />
              <R label="Changer de vue"             keys={['C']} />
              <R label="Piquer / cabrer"            keys={['↑', '↓']} />
              <R label="Roulis (vire)"              keys={['←', '→']} />
              <R label="Accélérer"                  keys={['Espace']} />
              <R label="Freiner"                    keys={['Shift']} />
              <R label="Quitter"                    keys={['F', 'Échap']} />
            </div>

            <div>
              <Section title="Orbit — style Google Earth" />
              <R label="Déplacer le walker"         keys={['↑', '↓', '←', '→']} />
              <R label="Orbiter autour"             keys={['Shift + ↑↓←→']} />
              <R label="Rotation caméra"            keys={['Ctrl + ↑↓←→']} />
              <R label="Pan"                        keys={['Alt + ↑↓←→']} />
              <R label="Pan diagonal"               keys={['Shift+Ctrl + ↑↓←→']} />
            </div>

            <div>
              <Section title="Walk mode" />
              <R label="Avancer / reculer"          keys={['↑', '↓']} />
              <R label="Pivoter gauche / droite"    keys={['←', '→']} />
              <R label="Incliner la caméra"         keys={['Ctrl + ↑↓']} />
              <R label="Monter / descendre"         keys={['Alt + ↑↓']} />
              <R label="Regarder librement"         keys={['Clic + glisser']} />
            </div>
          </div>
          <div className="modal-footer border-top-0 p-2">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>Fermer</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Modal Vues Caméra (Bootstrap Modal Glass style) ───────────────────────────

function ViewsModal({ onClose }: { onClose: () => void }) {
  const viewBtn = (lbl: string, key: string) => (
    <button 
      className="btn btn-outline-secondary btn-sm text-start w-100" 
      onClick={() => { dispatchView(key); onClose(); }}
    >
      {lbl}
    </button>
  );
  const povBtn = (lbl: string, key: string) => (
    <button 
      className="btn btn-outline-danger btn-sm text-start w-100" 
      onClick={() => { dispatchPov(key); onClose(); }}
    >
      {lbl}
    </button>
  );

  return (
    <div className="modal fade show d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable" style={{ maxWidth: '280px' }}>
        <div className="modal-content text-dark glass-card">
          <div className="modal-header border-bottom-0">
            <h5 className="modal-title fs-6 fw-bold">📷 Sélection de Vue</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body d-flex flex-column gap-2 py-3">
            <div className="text-muted fw-bold text-uppercase" style={{ fontSize: '9px', letterSpacing: '0.06em' }}>Caméra</div>
            <div className="d-flex flex-column gap-1">
              {viewBtn('Perspective',  'perspective')}
              {viewBtn('Dessus 3D',    'top3d')}
              {viewBtn('Face (D)',     'front')}
              {viewBtn('Arrière (C)',  'back')}
              {viewBtn('Gauche (A)',   'left')}
              {viewBtn('Droite (B)',   'right')}
              {viewBtn('Dessus/Dessous', 'bottom')}
              {viewBtn('Iso Sud-Est',  'iso-se')}
              {viewBtn('Iso Nord-Ouest','iso-nw')}
            </div>
            
            <div className="text-muted fw-bold text-uppercase mt-2" style={{ fontSize: '9px', letterSpacing: '0.06em' }}>POV 1.8m</div>
            <div className="d-flex flex-column gap-1">
              {povBtn('Séjour',       'living')}
              {povBtn('Entrée',       'entry')}
              {povBtn("Salle d'eau",  'bathroom')}
              {povBtn('Jardin',       'garden')}
            </div>
          </div>
          <div className="modal-footer border-top-0 p-2">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>Fermer</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

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
  bedStacked:   boolean;
  bedSofa:      boolean;
  bedPosition:  boolean;
  smorkullPos:  boolean;
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
}

export interface LayerState {
  structure: boolean;
  equipment: boolean;
  furniture: boolean;
  neighbors:  boolean;
  xray:       boolean;
  wireframe:  boolean;
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
  grass:        boolean;
  walker:       boolean;
  animals:      boolean;
  accessories:  boolean;
  laraPistols:  boolean;
  laraNude?:    boolean;
  laraTopOff?:  boolean;
  laraBottomOff?: boolean;
  laraShoes?:   boolean;
  laraCount?:   LaraCountMode;
  showAllLaraStyles: boolean;
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
  thoughtBubble?: boolean;
}


export interface SidePanelProps {
  layers:          LayerState;
  onToggleLayer:   (key: keyof LayerState) => void;
}

export type LidarMode = 0 | 1 | 2 | 3;

import type { PlaneModelKey } from './PaperPlane';

export interface SidePanelProps2 extends SidePanelProps {
  onOpenInventory:         () => void;
  lidarMode:               LidarMode;
  onCycleLidar:            () => void;
  lidarOpacity:            number;
  onToggleLidarOpacity:    () => void;
  // Contrôles Animations & Avion (fusionnés depuis le panneau droit)
  buildAnim?:              boolean;
  onStartBuildAnim?:       () => void;
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
}

type TabKey = 'views' | 'layers' | 'personnage' | 'perf' | 'anims' | 'animsCouple' | 'interactif' | null;

const TABS: Array<{ key: Exclude<TabKey, null>; emoji: string; label: string }> = [
  { key: 'perf',       emoji: '📊', label: 'Perf' },
  { key: 'views',      emoji: '📷', label: 'Vues' },
  { key: 'layers',     emoji: '📑', label: 'Calques' },
  { key: 'interactif', emoji: '🎮', label: 'Interact' },
  { key: 'personnage', emoji: '👤', label: 'Perso' },
  { key: 'anims',      emoji: '💃', label: 'Anim Perso' },
  { key: 'animsCouple',emoji: '👯‍♀️', label: 'Couple' },
];

export { ANIM_CATEGORIES, getAnimCategory } from './CharacterAnimSelector';
import { CharacterAnimSelector } from './CharacterAnimSelector';

// ── Composant principal ───────────────────────────────────────────────────────

const ALL_HAIR_COLORS: string[] = [
  'naturel', 'noir', 'brun', 'chatain', 'blond', 'roux', 'rouge', 'blanc', 'bleu', 'vert', 'rose', 'violet', 'arc-en-ciel'
];

export function SidePanel({ 
  layers, 
  onToggleLayer, 
  onOpenInventory, 
  lidarMode, 
  onCycleLidar, 
  lidarOpacity, 
  onToggleLidarOpacity,
  buildAnim = false,
  onStartBuildAnim,
  buildAnimMatrix = false,
  onStartBuildAnimMatrix,
  onStopBuildAnim,
  animDurations = {},
  planeModel = 'paper',
  onSetPlaneModel,
  autopilotVisible = false,
  onToggleAutopilot,
  showLandingStrips = false,
  onToggleLandingStrips,
  onToggleHideUI,
}: SidePanelProps2) {
  
  const measurementActive = useSceneStore(state => state.measurementActive);
  const furniture = useSceneStore(state => state.furniture);
  const toggleFurniture = useSceneStore(state => state.toggleFurniture);
  const setMeasurementActive = useSceneStore(state => state.setMeasurementActive);
  const cameraMode = useSceneStore(state => state.cameraMode);
  const extraStates = useSceneStore(state => state.extraStates);
  const isMobile = useIsMobile();
  const [showViews,     setShowViews]     = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [sunInfo, setSunInfo] = useState<{ time: string; el: number } | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>(null);
  const activeWalkerId = useSceneStore(state => state.activeWalkerId);
  const currentHdri = useSceneStore(state => state.currentHdri);
  const setHdri = useSceneStore(state => state.setHdri);

  useEffect(() => {
    if (!layers.realSun) { setSunInfo(null); return; }
    const update = () => {
      const now = new Date();
      const { elevation } = solarPosition(SUN_LAT, SUN_LNG, now);
      setSunInfo({
        time: now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        el: Math.round(elevation),
      });
    };
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, [layers.realSun]);

  const [globalHaircut, setGlobalHaircut] = useState<string>('original');
  const [globalHairColor, setGlobalHairColor] = useState<string>('rose');
  const lastWigRef = useRef<string>('hair_101');

  const handleRandomHairColor = () => {
    const otherColors = ALL_HAIR_COLORS.filter((c: string) => c !== globalHairColor);
    const newColor = otherColors[Math.floor(Math.random() * otherColors.length)];
    setGlobalHairColor(newColor);
    document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'lara-haircolor', value: newColor } }));
  };

  const handleRandomHaircut = () => {
    const allHaircuts = ['original', ...WIGS_ITEMS.map(w => w.id)];
    const otherHaircuts = allHaircuts.filter(h => h !== globalHaircut);
    const newHaircut = otherHaircuts[Math.floor(Math.random() * otherHaircuts.length)];
    setGlobalHaircut(newHaircut);
    if (newHaircut !== 'original') lastWigRef.current = newHaircut;
    document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'lara-haircut', value: newHaircut } }));
  };

  const handleRandomHaircutAndColor = () => {
    handleRandomHaircut();
    handleRandomHairColor();
  };

  useEffect(() => {
    const handleToggleHaircut = () => {
      setGlobalHaircut(prev => {
        if (prev === 'original') {
          // Choisir une perruque aléatoire à chaque activation
          const wigIds = WIGS_ITEMS.map(w => w.id);
          const next = wigIds[Math.floor(Math.random() * wigIds.length)];
          lastWigRef.current = next;
          document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'lara-haircut', value: next } }));
          return next;
        } else {
          lastWigRef.current = prev;
          document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'lara-haircut', value: 'original' } }));
          return 'original';
        }
      });
    };
    document.addEventListener('toggle-lara-haircut', handleToggleHaircut as any);
    return () => document.removeEventListener('toggle-lara-haircut', handleToggleHaircut as any);
  }, []);

  // Ferme le sheet via Escape sur mobile
  useEffect(() => {
    if (!isMobile || !activeTab) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setActiveTab(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isMobile, activeTab]);

  // Helpers de boutons (Bootstrap style, transparent backgrounds for glass card inheritance)
  const b0 = (_color: string, label: string, onClick: () => void) => {
    return (
      <button 
        className="btn btn-light w-100 text-start rounded-0 border-0 border-bottom py-2 px-3 text-dark bg-transparent"
        onClick={onClick}
        style={{ 
          fontSize: isMobile ? '14px' : '11px',
          minHeight: isMobile ? '48px' : undefined,
        }}
      >
        {label}
      </button>
    );
  };

  const layerBtn = (
    _color: string,
    label: string,
    key: keyof LayerState
  ) => {
    const on = layers[key];
    return (
      <button 
        className="btn btn-light w-100 text-start rounded-0 border-0 border-bottom py-2 px-3 text-dark d-flex align-items-center justify-content-between"
        onClick={() => onToggleLayer(key)}
        style={{ 
          fontSize: isMobile ? '14px' : '11px',
          minHeight: isMobile ? '48px' : undefined,
          background: 'transparent',
          opacity: on ? 1 : 0.55,
        }}
      >
        <span>{label}</span>
        <span className={`badge ${on ? 'bg-danger' : 'bg-secondary'}`} style={{ fontSize: '9px' }}>
          {on ? 'ON' : 'OFF'}
        </span>
      </button>
    );
  };

  const triggerBtn = (label: string, actionKey: string, badgeLabel = 'Action') => {
    return (
      <button 
        className="btn btn-light w-100 text-start rounded-0 border-0 border-bottom py-2 px-3 text-dark d-flex align-items-center justify-content-between"
        onClick={() => {
          document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: actionKey } }));
        }}
        style={{ 
          fontSize: isMobile ? '14px' : '11px',
          minHeight: isMobile ? '48px' : undefined,
          background: 'transparent',
        }}
      >
        <span>{label}</span>
        <span className="badge bg-secondary" style={{ fontSize: '9px' }}>
          {badgeLabel}
        </span>
      </button>
    );
  };

  const furnitureBtn = (
    label: string,
    key: keyof FurnitureState,
    txtOn = 'ON',
    txtOff = 'OFF',
    displayValue?: (val: any) => string
  ) => {
    const val = furniture[key];
    const isOn = typeof val === 'boolean' ? val : !!val;
    return (
      <button 
        className="btn btn-light w-100 text-start rounded-0 border-0 border-bottom py-2 px-3 text-dark d-flex align-items-center justify-content-between"
        onClick={() => toggleFurniture(key)}
        style={{ 
          fontSize: isMobile ? '14px' : '11px',
          minHeight: isMobile ? '48px' : undefined,
          background: 'transparent',
          opacity: isOn ? 1 : 0.55,
        }}
      >
        <span>{label}</span>
        <span className={`badge ${isOn ? 'bg-danger' : 'bg-secondary'}`} style={{ fontSize: '9px' }}>
          {displayValue ? displayValue(val) : (isOn ? txtOn : txtOff)}
        </span>
      </button>
    );
  };

  // ── Sections (utilisées dans Group desktop OU sheet mobile) ─────────────────

  const InteractifSection = (
    <div className="d-flex flex-column bg-transparent overflow-auto" style={{ maxHeight: '45vh' }}>
      <div className="text-muted fw-bold p-2 bg-light border-bottom" style={{ fontSize: '10px' }}>PORTES & FENÊTRES</div>
      {furnitureBtn('Porte Entrée', 'entryDoor', 'OUVERT', 'FERMÉ')}
      {furnitureBtn('Porte Séjour', 'livingDoor', 'OUVERT', 'FERMÉ')}
      {furnitureBtn('Porte SDB', 'bathroomDoor', 'OUVERT', 'FERMÉ')}
      {furnitureBtn('Baie Vitrée Est', 'eastGlassDoor', 'OUVERT', 'FERMÉ')}
      {furnitureBtn('Baie Vitrée Ouest', 'glassDoorV2LeftOpen', 'OUVERT', 'FERMÉ')}
      {furnitureBtn('Volets', 'glassDoorV2ShutterPos', 'ON', 'OFF', v => typeof v === 'number' ? (v === 0 ? 'OUVERT' : v === 100 ? 'FERMÉ' : `${v}%`) : `${v}%`)}
      
      <div className="text-muted fw-bold p-2 bg-light border-bottom" style={{ fontSize: '10px' }}>PLACARDS</div>
      {furnitureBtn('Placard Couloir', 'corrDoors', 'OUVERT', 'FERMÉ')}
      {furnitureBtn('Placard SDB Gauche', 'sdbClosetL', 'OUVERT', 'FERMÉ')}
      {furnitureBtn('Placard SDB Droite', 'sdbClosetR', 'OUVERT', 'FERMÉ')}
      {furnitureBtn('Armoire SDB Ouest', 'cbnWest', 'OUVERT', 'FERMÉ')}
      {furnitureBtn('Armoire SDB Est', 'cbnEast', 'OUVERT', 'FERMÉ')}
      {furnitureBtn('Meuble sous évier', 'cabinet', 'OUVERT', 'FERMÉ')}
      
      <div className="text-muted fw-bold p-2 bg-light border-bottom" style={{ fontSize: '10px' }}>MOBILIER & ÉLECTRO</div>
      {furnitureBtn('Lit Superposé', 'bedStacked', 'EMPILÉ', 'SÉPARÉ')}
      {furnitureBtn('Lit Canapé', 'bedSofa', 'CANAPÉ', 'LIT')}
      {furnitureBtn('Lit Déplié', 'bedPosition', 'DÉPLIÉ', 'PLIÉ')}
      {furnitureBtn('Accoudoir Canapé Gauche', 'sofaArmLeft')}
      {furnitureBtn('Accoudoir Canapé Droit', 'sofaArmRight')}
      {furnitureBtn('Congélateur', 'freezerOpen', 'OUVERT', 'FERMÉ')}
      {furnitureBtn('Réfrigérateur', 'fridge', 'OUVERT', 'FERMÉ')}
      {furnitureBtn('TV Allumée', 'tvOn')}
      {triggerBtn('Bureau 1 (Assis/Debout)', 'desk1-toggle')}
      {triggerBtn('Bureau 1 (Position)', 'desk1-position')}
      {triggerBtn('Bureau 2 (Assis/Debout)', 'desk2-toggle')}
      {triggerBtn('Bureau 2 (Position)', 'desk2-position')}
      {triggerBtn('Smorkull (Position)', 'smorkull-position')}
      {triggerBtn('Air Performer (Power)', 'airPerformerPower')}
      {triggerBtn('Air Performer (Mode)', 'airPerformerMode')}
      {triggerBtn('Air Performer (Vitesse)', 'airPerformerSpeed')}
      {triggerBtn('Air Performer (Position)', 'airperformer-position')}
      {triggerBtn('WC Couvercle', 'wc-lid-toggle')}
      {triggerBtn('WC Siège', 'wc-seat-toggle')}
      {triggerBtn('WC Chasse d\'eau', 'wc-flush')}
      
      <div className="text-muted fw-bold p-2 bg-light border-bottom" style={{ fontSize: '10px' }}>EXPÉRIENCES & AVION ✈</div>
      <button
        className="btn btn-outline-danger w-100 text-start rounded-0 border-0 border-bottom py-2 px-3 fw-bold"
        onClick={() => dispatchKey('f')}
        style={{ fontSize: isMobile ? '13px' : '11px' }}
      >
        ✈ Lancer / Quitter Avion [F]
      </button>
      <div className="p-2 border-bottom bg-transparent">
        <div className="text-muted fw-semibold mb-1" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Modèle d'avion
        </div>
        <div className="d-flex gap-1">
          <button 
            className={`btn btn-sm flex-grow-1 p-1 ${planeModel === 'paper' ? 'btn-danger' : 'btn-outline-secondary'}`}
            onClick={() => onSetPlaneModel?.('paper')}
            style={{ fontSize: '9px' }}
          >
            Papier
          </button>
          <button 
            className={`btn btn-sm flex-grow-1 p-1 ${planeModel === 'rocket' ? 'btn-danger' : 'btn-outline-secondary'}`}
            onClick={() => onSetPlaneModel?.('rocket')}
            style={{ fontSize: '9px' }}
          >
            Fusée
          </button>
          <button 
            className={`btn btn-sm flex-grow-1 p-1 ${planeModel === 'comet' ? 'btn-danger' : 'btn-outline-secondary'}`}
            onClick={() => onSetPlaneModel?.('comet')}
            style={{ fontSize: '9px' }}
          >
            Comète
          </button>
        </div>
      </div>
      <button
        className="btn btn-light w-100 text-start rounded-0 border-0 border-bottom py-2 px-3 text-dark d-flex align-items-center justify-content-between"
        onClick={onToggleAutopilot}
        style={{ 
          fontSize: isMobile ? '13px' : '11px', 
          background: 'transparent',
          opacity: autopilotVisible ? 1 : 0.55,
        }}
      >
        <span>Pilote auto ∞</span>
        <span className={`badge ${autopilotVisible ? 'bg-danger' : 'bg-secondary'}`} style={{ fontSize: '9px' }}>
          {autopilotVisible ? 'ON' : 'OFF'}
        </span>
      </button>
      <button
        className="btn btn-light w-100 text-start rounded-0 border-0 border-bottom py-2 px-3 text-dark d-flex align-items-center justify-content-between"
        onClick={onToggleLandingStrips}
        style={{ 
          fontSize: isMobile ? '13px' : '11px', 
          background: 'transparent',
          opacity: showLandingStrips ? 1 : 0.55,
        }}
      >
        <span>Pistes 🛬</span>
        <span className={`badge ${showLandingStrips ? 'bg-danger' : 'bg-secondary'}`} style={{ fontSize: '9px' }}>
          {showLandingStrips ? 'ON' : 'OFF'}
        </span>
      </button>

      <div className="text-muted fw-bold p-2 bg-light border-bottom" style={{ fontSize: '10px' }}>LUMIÈRES</div>
      {furnitureBtn('Lampe SDB', 'lampBath')}
      {furnitureBtn('Lampe Couloir', 'lampCorridor')}
      {furnitureBtn('Lampe Ola', 'lampOn')}
    </div>
  );

  const ViewsSection = (
    <div className="d-flex flex-column bg-transparent overflow-auto" style={{ maxHeight: '40vh' }}>
      {b0('gray',   'Perspective / Orbit (Raccourci O)', () => dispatchKey('o'))}
      {b0('gray',   'Walk générique (Raccourci M)',    () => dispatchKey('m'))}
      {b0('gray',   'Vue 3ème personne (Raccourci 3)', () => dispatchKey('3'))}
      {b0('gray',   'Vue FPV 1ère pers. (Raccourci 1)',() => dispatchKey('1'))}
      {b0('gray',   '2D Dessus (Raccourci T)',         () => dispatchKey('t'))}
      {b0('gray',   '2D Suivi Perso (Raccourci Y)',    () => dispatchKey('y'))}
      {cameraMode === 'top' && (
        <button
          className="btn btn-light w-100 text-start rounded-0 border-0 border-bottom py-2 px-3 text-dark d-flex align-items-center justify-content-between"
          onClick={() => setMeasurementActive(!measurementActive)}
          style={{ fontSize: isMobile ? '14px' : '11px', background: 'transparent' }}
        >
          <span>📏 Prise de mesure</span>
          <span className={`badge ${measurementActive ? 'bg-danger' : 'bg-secondary'}`} style={{ fontSize: '9px' }}>
            {measurementActive ? 'ACTIVE' : 'DÉSACTIVÉE'}
          </span>
        </button>
      )}
      {b0('cyan',   'Avion ✈ (Raccourci F)',           () => dispatchKey('f'))}
      {onToggleHideUI && b0('dark',   'Masquer l\'interface 2D (Raccourci 0)', onToggleHideUI)}
      {b0('yellow', 'Autres vues…',                     () => setShowViews(true))}
      {b0('teal',   'Raccourcis clavier ⌨',             () => setShowShortcuts(true))}
    </div>
  );

  const LayersSection = (
    <div className="d-flex flex-column bg-transparent overflow-auto" style={{ maxHeight: '45vh' }}>
      <div className="p-2 border-bottom bg-transparent d-flex flex-column gap-1">
        <div className="d-flex justify-content-between align-items-center mb-1">
          <div className="text-muted fw-semibold text-dark" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            🌆 Ambiance HDRI / Ciel
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary p-0 px-1 border-0"
            onClick={() => {
              const otherHdris = HDRI_LIST.filter(h => h.id !== currentHdri);
              const next = otherHdris[Math.floor(Math.random() * otherHdris.length)];
              setHdri(next.id);
            }}
            title="HDRI aléatoire 🎲"
            style={{ fontSize: '11px', lineHeight: 1 }}
          >
            🎲
          </button>
        </div>
        <select
          className="form-select form-select-sm bg-transparent text-dark border-secondary"
          style={{ fontSize: isMobile ? '14px' : '11px' }}
          onKeyDown={(e) => e.stopPropagation()}
          value={currentHdri}
          onChange={(e) => setHdri(e.target.value)}
        >
          {HDRI_LIST.map((h) => (
            <option key={h.id} value={h.id} className="bg-light text-dark">
              {h.name}
            </option>
          ))}
        </select>
      </div>
      {layerBtn('green',  'Structure',     'structure')}
      {layerBtn('gray',   'Piliers seuls', 'pillarsOnly')}
      {layerBtn('peach',  'Portes',        'doors')}
      {layerBtn('peach',  'Équipements',   'equipment')}
      {layerBtn('purple', 'Mobilier',      'furniture')}
      {layerBtn('blue',   'Animaux 🐕🐦',  'animals')}
      {layerBtn('purple', 'Miroirs',       'mirrors')}
      {layers.mirrors && layerBtn('purple', 'Miroirs HD',    'mirrorsHD')}
      {layerBtn('gray',   'Lidar 📸',        'lidar')}
      {layerBtn('gray',   'Zones IA 🤖',    'aiZones')}
      {layerBtn('blue',   'Collisions inter-PNJ 👥', 'npcCollisions')}
      {layers.npcCollisions && layerBtn('cyan', '↳ Debug PNJ (Rayon 70cm) ⭕', 'debugNpcCollisions')}
      {layerBtn('blue',   'Collisions objets/meubles 🪑', 'furnitureCollisions')}
      {layers.furnitureCollisions && layerBtn('cyan', '↳ Debug Objets/Meubles 📐', 'debugFurnitureCollisions')}
      {layerBtn('gray',   'Ombres',        'shadows')}
      {layerBtn('blue',   'Voisins',       'neighbors')}

      {layerBtn('teal',   'Grille 🌐',     'grid')}
      {layers.grid && layerBtn('teal', 'Grille Depth', 'gridDepth')}
      {layerBtn('yellow', 'Mesures réelles 📐 (U)', 'measuredDimensions')}
      {layerBtn('red',    'Aff. arêtes murs (W)', 'wallEdges')}
      {layerBtn('cyan',   'X-Ray 🩻',      'xray')}
      {layerBtn('cyan',   'Wireframe coloré 🕸', 'wireframe')}
      {layerBtn('yellow', 'Lumières ☀',    'lights')}
      {layerBtn('yellow', 'Lumières HD ✨', 'lightsHD')}
      {layerBtn('green',  'Gazon 3D 🌿',   'grass')}
      {layerBtn('cyan',   'LiDAR scan 📡', 'lidar')}
      {layers.lidar && b0('cyan', ['Photo', 'Filaire', 'Points', 'Hauteur'][lidarMode] + ' →', onCycleLidar)}
      {layers.lidar && b0('cyan', `Opacité ${Math.round(lidarOpacity * 100)}%`, onToggleLidarOpacity)}
      {layerBtn('yellow', 'Soleil réel ☀', 'realSun')}

      {sunInfo && (
        <div className="p-2 border-bottom text-muted" style={{ fontSize: '9px', background: 'transparent' }}>
          ☀️ {sunInfo.time} · {sunInfo.el > 0 ? `élév. ${sunInfo.el}°` : `sous l'horizon ${-sunInfo.el}°`}
        </div>
      )}
      <button 
        className="btn btn-light w-100 text-start rounded-0 border-0 border-bottom py-2 px-3 text-dark d-flex align-items-center justify-content-between"
        onClick={() => { if (!layers.plan) dispatchKey('t'); onToggleLayer('plan'); }}
        style={{ fontSize: isMobile ? '14px' : '11px', background: 'transparent', opacity: layers.plan ? 1 : 0.55 }}
      >
        <span>Plan 2D</span>
        <span className={`badge ${layers.plan ? 'bg-danger' : 'bg-secondary'}`} style={{ fontSize: '9px' }}>
          {layers.plan ? 'ON' : 'OFF'}
        </span>
      </button>
    </div>
  );

  const PersonnageSection = (
    <div className="d-flex flex-column bg-transparent overflow-auto" style={{ maxHeight: '40vh' }}>
      {layers.walker && (
        <div className="p-2 border-bottom bg-transparent d-flex flex-column gap-2">
          <div>
            <div className="text-muted fw-semibold mb-1 text-dark" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>👤 Choix Personnage</div>
            <select
              className="form-select form-select-sm bg-transparent text-dark border-secondary"
              style={{ fontSize: isMobile ? '14px' : '11px' }}
              value={activeWalkerId}
              onChange={(e) => {
                useSceneStore.getState().setActiveWalkerId(e.target.value);
              }}
            >
              {CHARACTERS.filter(c => isCharacterVisibleInMode(c.id, layers.laraCount ?? (isMobile ? 2 : 15), activeWalkerId) || c.id === activeWalkerId).map(c => (
                <option key={c.id} value={c.id} className="bg-light text-dark">
                  {npcLabel(c)}
                </option>
              ))}
            </select>
          </div>

          <div>
            {/* Bouton global Coupe & Couleur Aléatoire */}
            <button
              type="button"
              className="btn btn-warning w-100 text-dark fw-bold mb-3 py-2 px-3 d-flex align-items-center justify-content-center gap-2 shadow-none"
              style={{
                fontSize: isMobile ? '13px' : '11px',
                background: 'linear-gradient(135deg, #ffc107 0%, #ff9800 100%)',
                border: 'none',
                borderRadius: '6px'
              }}
              onClick={handleRandomHaircutAndColor}
              title="Changer aléatoirement la coupe et la couleur des cheveux 🎲"
            >
              <span>🎲</span>
              <span>Coupe & Couleur aléatoires</span>
            </button>

            <div className="mb-2">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <div className="text-muted fw-semibold text-dark" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  🎨 Couleur des cheveux
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary p-0 px-1 border-0"
                  onClick={handleRandomHairColor}
                  title="Couleur aléatoire 🎲"
                  style={{ fontSize: '11px', lineHeight: 1 }}
                >
                  🎲
                </button>
              </div>
              <select
                className="form-select form-select-sm bg-transparent text-dark border-secondary"
                style={{ fontSize: isMobile ? '14px' : '11px' }}
                onKeyDown={(e) => e.stopPropagation()}
                value={globalHairColor}
                onChange={(e) => {
                  const val = e.target.value;
                  setGlobalHairColor(val);
                  document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'lara-haircolor', value: val } }));
                }}
              >
                <option value="naturel" className="bg-light text-dark">Naturel</option>
                <option value="noir" className="bg-light text-dark">Noir</option>
                <option value="brun" className="bg-light text-dark">Brun</option>
                <option value="chatain" className="bg-light text-dark">Châtain</option>
                <option value="blond" className="bg-light text-dark">Blond</option>
                <option value="roux" className="bg-light text-dark">Roux</option>
                <option value="rouge" className="bg-light text-dark">Rouge</option>
                <option value="blanc" className="bg-light text-dark">Blanc</option>
                <option value="bleu" className="bg-light text-dark">Bleu</option>
                <option value="vert" className="bg-light text-dark">Vert</option>
                <option value="rose" className="bg-light text-dark">Rose</option>
                <option value="violet" className="bg-light text-dark">Violet</option>
                <option value="arc-en-ciel" className="bg-light text-dark">Arc-en-ciel 🌈</option>
              </select>
            </div>

            <div className="mb-1">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <div className="text-muted fw-semibold text-dark" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  💇‍♀️ Coupe de cheveux
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary p-0 px-1 border-0"
                  onClick={handleRandomHaircut}
                  title="Coupe aléatoire 🎲"
                  style={{ fontSize: '11px', lineHeight: 1 }}
                >
                  🎲
                </button>
              </div>
              <select
                className="form-select form-select-sm bg-transparent text-dark border-secondary"
                style={{ fontSize: isMobile ? '14px' : '11px' }}
                onKeyDown={(e) => e.stopPropagation()}
                value={globalHaircut}
                onChange={(e) => {
                  const val = e.target.value;
                  setGlobalHaircut(val);
                  if (val !== 'original') lastWigRef.current = val;
                  document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'lara-haircut', value: val } }));
                }}
              >
                <option value="original" className="bg-light text-dark">Coupe d'origine 👱‍♀️</option>
                {WIGS_ITEMS.map((wig) => (
                  <option key={wig.id} value={wig.id} className="bg-light text-dark">{wig.name}</option>
                ))}
              </select>
            </div>

            {/* ── Réglages Physique Perruques (directement sous la coupe) ── */}
            {layers.hairPhysics && (
              <div className="mt-2 pt-2 border-top border-secondary-subtle d-flex flex-column gap-2">
                <div className="text-muted fw-bold text-dark" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  💇‍♀️ Paramètres Physique Perruques
                </div>

                <div>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="text-muted fw-semibold text-dark" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      🧶 Rigidité & Maintien (Stiffness)
                    </span>
                    <span className="badge bg-primary text-white" style={{ fontSize: '9px' }}>
                      {(layers.wigStiffness ?? 1.0).toFixed(2)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    className="form-range"
                    min="0.1"
                    max="3.0"
                    step="0.1"
                    value={layers.wigStiffness ?? 1.0}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      useSceneStore.setState(st => ({
                        layers: { ...st.layers, wigStiffness: val }
                      }));
                    }}
                  />
                </div>

                <div>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="text-muted fw-semibold text-dark" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      🧯 Amortissement & Anti-vibration (Damping)
                    </span>
                    <span className="badge bg-success text-white" style={{ fontSize: '9px' }}>
                      {(layers.wigDamping ?? 0.80).toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    className="form-range"
                    min="0.50"
                    max="0.98"
                    step="0.02"
                    value={layers.wigDamping ?? 0.80}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      useSceneStore.setState(st => ({
                        layers: { ...st.layers, wigDamping: val }
                      }));
                    }}
                  />
                </div>

                <div>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="text-muted fw-semibold text-dark" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      ⚖️ Poids aux pointes / Anti-fouet (Tip Weight)
                    </span>
                    <span className="badge bg-warning text-dark" style={{ fontSize: '9px' }}>
                      {(layers.wigTipWeight ?? 1.2).toFixed(1)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    className="form-range"
                    min="0.0"
                    max="3.0"
                    step="0.1"
                    value={layers.wigTipWeight ?? 1.2}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      useSceneStore.setState(st => ({
                        layers: { ...st.layers, wigTipWeight: val }
                      }));
                    }}
                  />
                </div>

                <div>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="text-muted fw-semibold text-dark" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      📐 Angle max déviation repos (Max Angle)
                    </span>
                    <span className="badge bg-danger text-white" style={{ fontSize: '9px' }}>
                      {layers.wigMaxAngle ?? 15}°
                    </span>
                  </div>
                  <input
                    type="range"
                    className="form-range"
                    min="5"
                    max="45"
                    step="1"
                    value={layers.wigMaxAngle ?? 15}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      useSceneStore.setState(st => ({
                        layers: { ...st.layers, wigMaxAngle: val }
                      }));
                    }}
                  />
                </div>

                <div>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="text-muted fw-semibold text-dark" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      🌍 Gravité globale (Gravity)
                    </span>
                    <span className="badge bg-danger text-white" style={{ fontSize: '9px' }}>
                      {(layers.wigGravity ?? 1.0).toFixed(2)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    className="form-range"
                    min="0.0"
                    max="3.0"
                    step="0.1"
                    value={layers.wigGravity ?? 1.0}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      useSceneStore.setState(st => ({
                        layers: { ...st.layers, wigGravity: val }
                      }));
                    }}
                  />
                </div>

                <div>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="text-muted fw-semibold text-dark" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      🏃 Inertie dynamique (Inertia)
                    </span>
                    <span className="badge bg-secondary text-white" style={{ fontSize: '9px' }}>
                      {(layers.wigInertia ?? 1.0).toFixed(1)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    className="form-range"
                    min="0.0"
                    max="3.0"
                    step="0.1"
                    value={layers.wigInertia ?? 1.0}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      useSceneStore.setState(st => ({
                        layers: { ...st.layers, wigInertia: val }
                      }));
                    }}
                  />
                </div>

                <div>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="text-muted fw-semibold text-dark" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      💨 Vent / Brise ambiante (Wind)
                    </span>
                    <span className="badge bg-info text-dark" style={{ fontSize: '9px' }}>
                      {(layers.wigWind ?? 0.0).toFixed(1)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    className="form-range"
                    min="0.0"
                    max="2.0"
                    step="0.1"
                    value={layers.wigWind ?? 0.0}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      useSceneStore.setState(st => ({
                        layers: { ...st.layers, wigWind: val }
                      }));
                    }}
                  />
                </div>

                <div>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="text-muted fw-semibold text-dark" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      🛡️ Rayon Collision Tête (Head Collider)
                    </span>
                    <span className="badge bg-dark text-white" style={{ fontSize: '9px' }}>
                      {(layers.wigHeadCollisionRadius ?? 13.0).toFixed(1)} cm
                    </span>
                  </div>
                  <input
                    type="range"
                    className="form-range"
                    min="8.0"
                    max="20.0"
                    step="0.5"
                    value={layers.wigHeadCollisionRadius ?? 13.0}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      useSceneStore.setState(st => ({
                        layers: { ...st.layers, wigHeadCollisionRadius: val }
                      }));
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {layers.walker && (
        <div className="p-2 border-bottom bg-transparent d-flex flex-column gap-1">
          <div className="text-muted fw-semibold mb-1 text-dark" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            🤖 Visite guidée de l'appartement
          </div>
          <button
            type="button"
            className="btn btn-light w-100 text-start rounded-0 border-0 border-bottom py-2 px-3 text-dark d-flex align-items-center justify-content-between shadow-none"
            onClick={() => {
              useSceneStore.getState().triggerAction('aiFullTour');
            }}
            style={{ 
              fontSize: isMobile ? '14px' : '11px', 
              background: 'transparent',
              minHeight: isMobile ? '48px' : undefined 
            }}
          >
            <span>🚶‍♀️ Visite Complète (Sud ➔ Nord)</span>
            <span className={`badge ${extraStates?.aiFullTour ? 'bg-primary' : 'bg-secondary'}`} style={{ fontSize: '9px' }}>
              {extraStates?.aiFullTour ? 'EN COURS' : 'DÉMARRER'}
            </span>
          </button>
        </div>
      )}

      <div className="text-muted fw-semibold mb-1 text-dark mt-3" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>⚙️ Options d'affichage</div>
      {layerBtn('light',  'Personnage 3D (Walker)', 'walker')}
      {layerBtn('gray',   'Ombres personnage 👤', 'characterShadows')}
      {layerBtn('light',  'Pistolets Lara 🔫', 'laraPistols')}
      {layerBtn('light',  'Accessoires Lara 🎒', 'accessories')}
      {layerBtn('pink',   'Déshabiller Lara 👙 (X)', 'laraNude')}
      {layerBtn('pink',   'Enlever le haut 👚', 'laraTopOff')}
      {layerBtn('pink',   'Enlever le bas 🩳', 'laraBottomOff')}
      {layerBtn('light',  'Bottes Lara 👢', 'laraShoes')}
      {layerBtn('pink',   'Physique buste 💃', 'breastPhysics')}
      {layerBtn('pink',   'Physique cheveux 💇‍♀️', 'hairPhysics')}
      {layerBtn('cyan', 'Wallhack (Silhouettes)', 'wallhack')}
      {layerBtn('cyan', 'Squelettes / Bones 🦴 (K)', 'skeleton')}
      {layerBtn('cyan', 'Fil de fer (Wireframe) 🕸️', 'characterWireframe')}
      {layerBtn('teal', 'Bulle de pensée 💭 (Logs)', 'thoughtBubble')}
      {layers.walker && (
        <div className="p-2 border-bottom bg-transparent d-flex flex-column gap-1">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <span className="text-muted fw-semibold text-dark" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              👥 Nombre de Personnages
            </span>
            <span className="badge bg-primary" style={{ fontSize: '9px' }}>
              {(layers.laraCount ?? (isMobile ? 2 : 15)) === 1
                ? '1 (Xbot seul)'
                : (layers.laraCount ?? (isMobile ? 2 : 15)) === 2
                ? '2 (Xbot + Lara)'
                : (layers.laraCount ?? (isMobile ? 2 : 15)) === 4
                ? '4 (Lara, Xbot, Rosanna, Cha)'
                : (layers.laraCount ?? (isMobile ? 2 : 15)) === 10
                ? '10 (Eco)'
                : '15 (Toutes)'}
            </span>
          </div>
          <div className="btn-group btn-group-sm w-100" role="group">
            <button
              type="button"
              className={`btn btn-sm ${(layers.laraCount ?? (isMobile ? 2 : 15)) === 1 ? 'btn-primary text-white' : 'btn-outline-secondary text-dark'}`}
              style={{ fontSize: isMobile ? '13px' : '11px', background: (layers.laraCount ?? (isMobile ? 2 : 15)) === 1 ? undefined : 'transparent' }}
              onClick={() => useSceneStore.getState().setLaraCount(1)}
              title="1 PNJ (Xbot uniquement - léger)"
            >
              1
            </button>
            <button
              type="button"
              className={`btn btn-sm ${(layers.laraCount ?? (isMobile ? 2 : 15)) === 2 ? 'btn-primary text-white' : 'btn-outline-secondary text-dark'}`}
              style={{ fontSize: isMobile ? '13px' : '11px', background: (layers.laraCount ?? (isMobile ? 2 : 15)) === 2 ? undefined : 'transparent' }}
              onClick={() => useSceneStore.getState().setLaraCount(2)}
            >
              2
            </button>
            <button
              type="button"
              className={`btn btn-sm ${(layers.laraCount ?? (isMobile ? 2 : 15)) === 4 ? 'btn-primary text-white' : 'btn-outline-secondary text-dark'}`}
              style={{ fontSize: isMobile ? '13px' : '11px', background: (layers.laraCount ?? (isMobile ? 2 : 15)) === 4 ? undefined : 'transparent' }}
              onClick={() => useSceneStore.getState().setLaraCount(4)}
            >
              4
            </button>
            <button
              type="button"
              className={`btn btn-sm ${(layers.laraCount ?? (isMobile ? 2 : 15)) === 10 ? 'btn-primary text-white' : 'btn-outline-secondary text-dark'}`}
              style={{ fontSize: isMobile ? '13px' : '11px', background: (layers.laraCount ?? (isMobile ? 2 : 15)) === 10 ? undefined : 'transparent' }}
              onClick={() => useSceneStore.getState().setLaraCount(10)}
            >
              10
            </button>
            <button
              type="button"
              className={`btn btn-sm ${(layers.laraCount ?? (isMobile ? 2 : 15)) === 15 ? 'btn-primary text-white' : 'btn-outline-secondary text-dark'}`}
              style={{ fontSize: isMobile ? '13px' : '11px', background: (layers.laraCount ?? (isMobile ? 2 : 15)) === 15 ? undefined : 'transparent' }}
              onClick={() => useSceneStore.getState().setLaraCount(15)}
            >
              15
            </button>
          </div>
        </div>
      )}
      <button 
        className="btn btn-light w-100 text-start rounded-0 border-0 border-bottom py-2 px-3 text-dark d-flex align-items-center justify-content-between"
        onClick={() => {
          onToggleLayer('laraGrid');
          if (!layers.laraGrid) {
            document.dispatchEvent(new CustomEvent('camera-view', { detail: { pos: [150, 450, 600], target: [150, 450, 200] } }));
          }
        }}
        style={{ 
          fontSize: isMobile ? '13px' : '11px', 
          backgroundColor: layers.laraGrid ? 'rgba(13, 110, 253, 0.08)' : undefined,
          fontWeight: layers.laraGrid ? 600 : 400
        }}
      >
        <span>
          <span className="me-2">🧬</span>
          Grille de comparaison (Lara)
        </span>
        <span className={`badge ${layers.laraGrid ? 'bg-primary' : 'bg-secondary'}`} style={{ fontSize: '9px' }}>
          {layers.laraGrid ? 'ON' : 'OFF'}
        </span>
      </button>

      {/* ── Réglages Physique Buste ── */}
      {layers.walker && (
        <div className="p-2 border-bottom bg-transparent d-flex flex-column gap-2">
          <div className="text-muted fw-bold text-dark" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            💃 Paramètres Physique Buste
          </div>

          <div>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-muted fw-semibold text-dark" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                💥 Intensité Physique Buste
              </span>
              <span className="badge bg-danger" style={{ fontSize: '9px' }}>
                {(layers.breastIntensity ?? 1.0).toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              className="form-range"
              min="0.0"
              max="10.0"
              step="0.2"
              value={layers.breastIntensity ?? 1.0}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                useSceneStore.setState(st => ({
                  layers: { ...st.layers, breastIntensity: val }
                }));
              }}
            />
          </div>

          <div>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-muted fw-semibold text-dark" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                ⚖️ Masse / Poids Buste (breastMass)
              </span>
              <span className="badge bg-danger text-white" style={{ fontSize: '9px' }}>
                {(layers.breastMass ?? 1.0).toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              className="form-range"
              min="0.1"
              max="4.0"
              step="0.1"
              value={layers.breastMass ?? 1.0}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                useSceneStore.setState(st => ({
                  layers: { ...st.layers, breastMass: val }
                }));
              }}
            />
          </div>

          <div>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-muted fw-semibold text-dark" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                🧶 Fermeté / Maintien Buste (breastFirmness)
              </span>
              <span className="badge bg-purple text-white" style={{ fontSize: '9px', backgroundColor: '#6f42c1' }}>
                {(layers.breastFirmness ?? 1.0).toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              className="form-range"
              min="0.1"
              max="3.0"
              step="0.1"
              value={layers.breastFirmness ?? 1.0}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                useSceneStore.setState(st => ({
                  layers: { ...st.layers, breastFirmness: val }
                }));
              }}
            />
          </div>

          <div>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-muted fw-semibold text-dark" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                👙 Élasticité Verticale (braElasticity)
              </span>
              <span className="badge bg-primary" style={{ fontSize: '9px' }}>
                {(layers.braElasticity ?? 1.0).toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              className="form-range"
              min="0.2"
              max="4.0"
              step="0.1"
              value={layers.braElasticity ?? 1.0}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                useSceneStore.setState(st => ({
                  layers: { ...st.layers, braElasticity: val }
                }));
              }}
            />
          </div>

          <div>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-muted fw-semibold text-dark" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                ↔️ Élasticité Horizontale XZ (braElasticityXZ)
              </span>
              <span className="badge bg-success text-dark" style={{ fontSize: '9px' }}>
                {(layers.braElasticityXZ ?? 1.0).toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              className="form-range"
              min="0.2"
              max="5.0"
              step="0.1"
              value={layers.braElasticityXZ ?? 1.0}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                useSceneStore.setState(st => ({
                  layers: { ...st.layers, braElasticityXZ: val }
                }));
              }}
            />
          </div>

          <div>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-muted fw-semibold text-dark" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                ⏱️ Retard / Déphasage Inertie (breastLagDelay)
              </span>
              <span className="badge bg-secondary text-white" style={{ fontSize: '9px' }}>
                {(layers.breastLagDelay ?? 1.0).toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              className="form-range"
              min="0.0"
              max="3.0"
              step="0.1"
              value={layers.breastLagDelay ?? 1.0}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                useSceneStore.setState(st => ({
                  layers: { ...st.layers, breastLagDelay: val }
                }));
              }}
            />
          </div>

          <div>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-muted fw-semibold text-dark" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                📐 Angle Max Vertical (maxBreastAngle)
              </span>
              <span className="badge bg-info text-dark" style={{ fontSize: '9px' }}>
                {layers.maxBreastAngle ?? 25}°
              </span>
            </div>
            <input
              type="range"
              className="form-range"
              min="5"
              max="60"
              step="1"
              value={layers.maxBreastAngle ?? 25}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                useSceneStore.setState(st => ({
                  layers: { ...st.layers, maxBreastAngle: val }
                }));
              }}
            />
          </div>

          <div>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-muted fw-semibold text-dark" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                ↔️ Angle Max Horizontal (maxBreastAngleXZ)
              </span>
              <span className="badge bg-warning text-dark" style={{ fontSize: '9px' }}>
                {layers.maxBreastAngleXZ ?? 35}°
              </span>
            </div>
            <input
              type="range"
              className="form-range"
              min="5"
              max="120"
              step="1"
              value={layers.maxBreastAngleXZ ?? 35}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                useSceneStore.setState(st => ({
                  layers: { ...st.layers, maxBreastAngleXZ: val }
                }));
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
  const [activeAnimValue, setActiveAnimValue] = useState<string>('idle');

  useEffect(() => {
    const onToggle = (e: any) => {
      if (e.detail?.key === 'lara-haircut') {
        if (e.detail.value) setGlobalHaircut(e.detail.value);
      }
      if (e.detail?.key === 'walker-anim-lara' || e.detail?.key === 'walker-anim-xbot') {
        const val = e.detail.value ?? 'idle';
        setActiveAnimValue(val);
      }
    };
    document.addEventListener('furniture-toggle', onToggle);
    return () => document.removeEventListener('furniture-toggle', onToggle);
  }, []);

  const handleSelectGlobalAnim = (val: string) => {
    document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'walker-anim-lara', value: val } }));
    document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'walker-anim-xbot', value: val } }));
  };

  const handleResetAnim = (e: React.MouseEvent) => {
    e.stopPropagation();
    resetAppIdle();
    document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'walker-anim-lara', value: 'idle' } }));
    document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'walker-anim-xbot', value: 'idle' } }));
  };

  const personnageHeaderButtons = (
    <div className="d-flex align-items-center gap-1" onClick={e => e.stopPropagation()}>
      <div className="btn-group btn-group-sm" role="group">
        {([1, 2, 4, 10, 15] as const).map((cnt) => {
          const currentCount = layers.laraCount ?? (isMobile ? 2 : 15);
          const isActive = currentCount === cnt;
          return (
            <button
              key={cnt}
              type="button"
              className={`btn btn-sm py-0 px-1 fw-bold ${isActive ? 'btn-primary text-white' : 'btn-outline-secondary text-dark'}`}
              style={{
                fontSize: '10px',
                lineHeight: '16px',
                paddingTop: '1px',
                paddingBottom: '1px',
                background: isActive ? undefined : 'rgba(255, 255, 255, 0.65)',
                border: '1px solid rgba(0, 0, 0, 0.15)',
              }}
              title={`Afficher ${cnt} PNJ (${cnt === 1 ? '1 Xbot seul (Léger)' : cnt === 2 ? '2 Duo' : cnt === 4 ? '4 (Lara, Xbot, Rosanna, Cha)' : cnt === 10 ? '10 Eco' : '15 Tous'})`}
              onClick={(e) => {
                e.stopPropagation();
                useSceneStore.getState().setLaraCount(cnt);
              }}
            >
              {cnt}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        className="btn btn-sm btn-warning text-dark p-0 px-1 border-0 shadow-sm fw-bold"
        style={{ fontSize: '11px', lineHeight: 1.2, borderRadius: '4px' }}
        title="Coupe et couleur de cheveux aléatoires 🎲"
        onClick={(e) => {
          e.stopPropagation();
          handleRandomHaircutAndColor();
        }}
      >
        🎲
      </button>
    </div>
  );

  const animHeaderButtons = (
    <div className="d-flex align-items-center gap-1" onClick={e => e.stopPropagation()}>
      <button
        type="button"
        className="btn btn-sm btn-warning text-dark p-0 px-1 border-0 shadow-sm fw-bold"
        style={{ fontSize: '11px', lineHeight: 1.2, borderRadius: '4px' }}
        title="Lancer une animation aléatoire (Perso)"
        onClick={(e) => {
          e.stopPropagation();
          resetAppIdle();
          const pool = WALKER_ANIM_OPTIONS.filter(a => a.value !== 'idle');
          if (pool.length > 0) {
            const randomAnim = pool[Math.floor(Math.random() * pool.length)];
            handleSelectGlobalAnim(randomAnim.value);
          }
        }}
      >
        🎲
      </button>
      <button
        type="button"
        className="btn btn-sm btn-secondary text-white p-0 px-1 border-0 shadow-sm fw-bold"
        style={{ fontSize: '11px', lineHeight: 1.2, borderRadius: '4px' }}
        title="Désactiver l'anim (Remettre les PNJ en mode IA autonome)"
        onClick={handleResetAnim}
      >
        ⏹️
      </button>
    </div>
  );

  const isBuildAnimRunning = buildAnim || buildAnimMatrix;

  const AnimationsSection = (
    <div className="d-flex flex-column bg-transparent">
      {/* ── Section Scène & Assemblage 3D ── */}
      <div className="p-2 border-bottom bg-light bg-opacity-50">
        <div className="text-muted fw-bold text-uppercase mb-1.5" style={{ fontSize: '9px', letterSpacing: '0.06em' }}>
          🏗️ Démo & Assemblage 3D
        </div>
        <div className="d-flex flex-column gap-1.5">
          <div className="d-flex gap-1">
            <button
              disabled={isBuildAnimRunning && !buildAnim}
              onClick={onStartBuildAnim}
              className={`btn btn-sm flex-grow-1 text-start rounded-2 py-1 px-2 fw-bold d-flex justify-content-between align-items-center ${buildAnim ? 'btn-danger text-white' : 'btn-outline-secondary text-dark'}`}
              style={{ fontSize: isMobile ? '12px' : '10px', background: buildAnim ? undefined : 'rgba(255, 255, 255, 0.7)' }}
            >
              <span>▶ Tombée du ciel</span>
              <span className="small opacity-75">{animDurations['buildAnim'] ? `~${Math.round(animDurations['buildAnim'] / 1000)}s` : '~30s'}</span>
            </button>
            <button
              disabled={isBuildAnimRunning && !buildAnimMatrix}
              onClick={onStartBuildAnimMatrix}
              className={`btn btn-sm flex-grow-1 text-start rounded-2 py-1 px-2 fw-bold d-flex justify-content-between align-items-center ${buildAnimMatrix ? 'btn-success text-white' : 'btn-outline-secondary text-dark'}`}
              style={{ fontSize: isMobile ? '12px' : '10px', background: buildAnimMatrix ? undefined : 'rgba(255, 255, 255, 0.7)' }}
            >
              <span>▶ Matrix</span>
              <span className="small opacity-75">{animDurations['buildAnimMatrix'] ? `~${Math.round(animDurations['buildAnimMatrix'] / 1000)}s` : ''}</span>
            </button>
          </div>
          {isBuildAnimRunning && (
            <button
              onClick={onStopBuildAnim}
              className="btn btn-danger btn-sm w-100 fw-bold py-1 border-0 shadow-sm"
              style={{ fontSize: '10px', letterSpacing: '0.04em' }}
            >
              ■ Arrêter l'animation en cours
            </button>
          )}
        </div>
      </div>

      <CharacterAnimSelector
        activeAnimValue={activeAnimValue}
        onSelectAnim={handleSelectGlobalAnim}
        isMobile={isMobile}
        maxHeight="50vh"
        listMaxHeight="35vh"
      />
    </div>
  );

  const [selectedDuoAnimId, setSelectedDuoAnimId] = useState<string>("");

  const handleSelectDuoAnim = (animId: string) => {
    setSelectedDuoAnimId(animId);
    const def = DUO_ANIMATIONS.find(a => a.id === animId);
    if (def) {
      duoSessionManager.forceDuoAnimation(def);
    }
  };

  const handleRandomDuoAnim = () => {
    resetAppIdle();
    const randomAnim = DUO_ANIMATIONS[Math.floor(Math.random() * DUO_ANIMATIONS.length)];
    if (randomAnim) {
      handleSelectDuoAnim(randomAnim.id);
    }
  };

  const duoAnimHeaderButtons = (
    <div className="d-flex align-items-center gap-1" onClick={e => e.stopPropagation()}>
      <button
        type="button"
        className="btn btn-sm btn-warning text-dark p-0 px-1 border-0 shadow-sm fw-bold"
        style={{ fontSize: '11px', lineHeight: 1.2, borderRadius: '4px' }}
        title="Lancer une animation de couple aléatoire 🎲"
        onClick={(e) => {
          e.stopPropagation();
          handleRandomDuoAnim();
        }}
      >
        🎲
      </button>
    </div>
  );

  const AnimationsCoupleSection = (
    <div
      className="d-flex flex-column bg-transparent overflow-hidden"
      style={{ maxHeight: '55vh' }}
    >
      <div className="p-2 border-bottom shadow-sm sticky-top" style={{ zIndex: 5, background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(8px)' }}>
        <div className="d-flex align-items-center gap-1">
          <select
            className="form-select form-select-sm"
            onChange={(e) => {
              const val = e.target.value;
              if (val) handleSelectDuoAnim(val);
            }}
            value={selectedDuoAnimId}
            style={{ fontSize: isMobile ? '13px' : '11px' }}
          >
            <option value="" disabled>Sélectionner une animation de couple...</option>
            {DUO_ANIMATIONS.map(a => (
              <option key={a.id} value={a.id}>
                {a.icon} {a.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn btn-sm btn-warning text-dark px-2 shadow-sm fw-bold"
            style={{ fontSize: isMobile ? '13px' : '11px', whiteSpace: 'nowrap' }}
            title="Animation de couple aléatoire 🎲"
            onClick={handleRandomDuoAnim}
          >
            🎲
          </button>
        </div>
      </div>

      <div className="flex-grow-1 overflow-auto p-2" style={{ maxHeight: '45vh' }}>
        <div className="d-flex flex-column gap-1">
          {DUO_ANIMATIONS.map(a => {
            const isSelected = selectedDuoAnimId === a.id;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => handleSelectDuoAnim(a.id)}
                className={`btn btn-sm text-start d-flex align-items-center justify-content-between px-2 py-1 ${
                  isSelected ? 'btn-primary text-white shadow-sm' : 'btn-outline-secondary border-0 bg-transparent text-dark'
                }`}
                style={{
                  fontSize: isMobile ? '13px' : '11px',
                  borderRadius: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <span className="text-truncate me-2">
                  <span className="me-1">{a.icon}</span> {a.label}
                </span>
                <span className={`badge border ${isSelected ? 'bg-light text-dark' : 'bg-light text-secondary'}`} style={{ fontSize: '9px' }}>
                  x3
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  // ── Rendu mobile : tab bar bottom + sheet ───────────────────────────────────

  if (isMobile) {
    const sheetOpen = activeTab !== null;
    const sheetTitle: Record<Exclude<TabKey, null>, string> = {
      views: '📷 Vues', layers: '📑 Calques', personnage: '👤 Personnage',
      perf: '📊 Perf', anims: '💃 Animations Perso', animsCouple: '👯‍♀️ Animations Couple', interactif: '🎮 Interactif'
    };
    const sheetBody: Record<Exclude<TabKey, null>, React.ReactNode> = {
      views: ViewsSection,
      layers: LayersSection,
      interactif: InteractifSection,
      personnage: PersonnageSection,
      anims: AnimationsSection,
      animsCouple: AnimationsCoupleSection,
      perf: <DevToolsGroups Group={Group} />,
    };

    return (
      <>
        {/* Backdrop sheet */}
        {sheetOpen && (
          <div
            onClick={() => setActiveTab(null)}
            className="position-fixed inset-0 bg-dark bg-opacity-50"
            style={{ backdropFilter: 'blur(2px)', zIndex: 90 }}
          />
        )}

        {/* Bottom sheet */}
        {sheetOpen && activeTab !== null && (
          <div
            className="position-fixed start-0 end-0 border-top shadow-lg z-index-95 d-flex flex-column rounded-top-4"
            style={{
              bottom: 64,
              maxHeight: 'calc(100vh - 120px)',
              zIndex: 95,
              background: 'rgba(255, 255, 255, 0.75)',
              backdropFilter: 'blur(8px)',
            }}
            onWheel={e => e.stopPropagation()}
          >
            {/* Sheet header */}
            <div className="d-flex justify-content-between align-items-center p-3 border-bottom text-dark">
              <span className="fw-bold">{sheetTitle[activeTab]}</span>
              <div className="d-flex align-items-center gap-2">
                {activeTab === 'personnage' && personnageHeaderButtons}
                {activeTab === 'anims' && animHeaderButtons}
                {activeTab === 'animsCouple' && duoAnimHeaderButtons}
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={() => setActiveTab(null)}
                />
              </div>
            </div>

            {/* Sheet body */}
            <div className="overflow-auto p-2" style={{ flex: 1 }}>
              <div className="d-flex flex-column bg-transparent">
                {sheetBody[activeTab]}
              </div>
            </div>
          </div>
        )}

        {/* Tab bar */}
        <div 
          className="position-fixed bottom-0 start-0 end-0 border-top shadow-lg d-flex align-items-center"
          style={{ 
            height: '64px', 
            zIndex: 100, 
            paddingBottom: 'env(safe-area-inset-bottom)', 
            background: 'rgba(255, 255, 255, 0.75)', 
            backdropFilter: 'blur(8px)',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            whiteSpace: 'nowrap'
          }}
        >
          {/* Inventaire — ouvre le modal directement */}
          <button
            onClick={onOpenInventory}
            className="btn border-0 d-flex flex-column align-items-center justify-content-center py-1 text-secondary"
            style={{ fontSize: '10px', minWidth: '60px', flex: '0 0 auto' }}
          >
            <span style={{ fontSize: '20px', lineHeight: 1 }}>📦</span>
            <span className="fw-semibold">Inventaire</span>
          </button>
          
          {TABS.map(t => {
            const active = activeTab === t.key;
            if (t.key === 'personnage') {
              return (
                <div key={t.key} className="d-flex align-items-center position-relative" style={{ flex: '0 0 auto' }}>
                  <button
                    onClick={() => setActiveTab(a => a === t.key ? null : t.key)}
                    className={`btn border-0 d-flex flex-column align-items-center justify-content-center py-1 ${active ? 'text-danger fw-bold' : 'text-secondary'}`}
                    style={{ fontSize: '10px', minWidth: '60px' }}
                  >
                    <span style={{ fontSize: '20px', lineHeight: 1 }}>{t.emoji}</span>
                    <span className="fw-semibold">{t.label}</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRandomHaircutAndColor();
                    }}
                    className="btn btn-sm btn-warning p-0 d-flex align-items-center justify-content-center border-0 rounded-circle position-absolute shadow-sm"
                    style={{
                      width: '20px',
                      height: '20px',
                      top: '4px',
                      right: '4px',
                      fontSize: '11px',
                      zIndex: 10,
                      background: '#ffc107',
                    }}
                    title="Coupe et couleur aléatoires 🎲"
                  >
                    🎲
                  </button>
                </div>
              );
            }
            if (t.key === 'animsCouple') {
              return (
                <div key={t.key} className="d-flex align-items-center position-relative" style={{ flex: '0 0 auto' }}>
                  <button
                    onClick={() => setActiveTab(a => a === t.key ? null : t.key)}
                    className={`btn border-0 d-flex flex-column align-items-center justify-content-center py-1 ${active ? 'text-danger fw-bold' : 'text-secondary'}`}
                    style={{ fontSize: '10px', minWidth: '60px' }}
                  >
                    <span style={{ fontSize: '20px', lineHeight: 1 }}>{t.emoji}</span>
                    <span className="fw-semibold">{t.label}</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRandomDuoAnim();
                    }}
                    className="btn btn-sm btn-warning p-0 d-flex align-items-center justify-content-center border-0 rounded-circle position-absolute shadow-sm"
                    style={{
                      width: '20px',
                      height: '20px',
                      top: '4px',
                      right: '4px',
                      fontSize: '11px',
                      zIndex: 10,
                      background: '#ffc107',
                    }}
                    title="Animation de couple aléatoire 🎲"
                  >
                    🎲
                  </button>
                </div>
              );
            }
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(a => a === t.key ? null : t.key)}
                className={`btn border-0 d-flex flex-column align-items-center justify-content-center py-1 ${active ? 'text-danger fw-bold' : 'text-secondary'}`}
                style={{ fontSize: '10px', minWidth: '60px', flex: '0 0 auto' }}
              >
                <span style={{ fontSize: '20px', lineHeight: 1 }}>{t.emoji}</span>
                <span className="fw-semibold">{t.label}</span>
              </button>
            );
          })}

          {/* Bouton Masquer l'UI pour mobile */}
          {onToggleHideUI && (
            <button
              onClick={onToggleHideUI}
              className="btn border-0 d-flex flex-column align-items-center justify-content-center py-1 text-secondary"
              style={{ fontSize: '10px', minWidth: '60px', flex: '0 0 auto' }}
              title="Masquer l'interface"
            >
              <span style={{ fontSize: '20px', lineHeight: 1 }}>👁️‍🗨️</span>
              <span className="fw-semibold">Cacher UI</span>
            </button>
          )}
        </div>

        {showViews     && <ViewsModal     onClose={() => setShowViews(false)} />}
        {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
      </>
    );
  }

  // ── Rendu desktop : sidebar accordéon Bootstrap Glassmorphic ────────────────

  return (
    <>
      <div 
        className="position-fixed overflow-auto d-flex flex-column gap-2 side-panel-desktop"
        style={{
          top: 16,
          left: 16,
          width: 260,
          maxHeight: 'calc(100vh - 32px)',
          zIndex: 100,
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(0, 0, 0, 0.25) transparent',
        }}
        onWheel={e => e.stopPropagation()}
      >
        {/* ── Inventaire card (glass style) ── */}
        <div className="card shadow-sm glass-card overflow-hidden">
          <button
            className="btn btn-danger w-100 rounded-0 py-2 px-3 fw-bold text-start text-uppercase d-flex align-items-center justify-content-between border-0"
            onClick={onOpenInventory}
            title="Ouvrir l'inventaire (Touche I)"
            style={{ fontSize: '11px', letterSpacing: '0.06em' }}
          >
            <span className="d-flex align-items-center gap-1.5">
              <span>📦 Inventaire</span>
              <kbd className="bg-white bg-opacity-25 text-white border-0 px-1 rounded font-monospace" style={{ fontSize: '9px' }}>I</kbd>
            </span>
            <span style={{ fontSize: '9px' }}>▶</span>
          </button>
        </div>

        {/* ── Dev Tools / Perf ── */}
        <DevToolsGroups Group={Group} />

        <Group emoji="📷" title="Vues">{ViewsSection}</Group>
        <Group emoji="📑" title="Calques">{LayersSection}</Group>
        <Group emoji="🎮" title="Interactif">{InteractifSection}</Group>
        <Group emoji="👤" title="Personnage" extra={personnageHeaderButtons}>{PersonnageSection}</Group>
        <Group emoji="💃" title="Animations Perso" extra={animHeaderButtons}>{AnimationsSection}</Group>
        <Group emoji="👯‍♀️" title="Animations Couple" extra={duoAnimHeaderButtons}>{AnimationsCoupleSection}</Group>
      </div>

      {showViews     && <ViewsModal     onClose={() => setShowViews(false)} />}
      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
    </>
  );
}
