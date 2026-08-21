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
import { useState, useEffect, useMemo, useRef } from 'react';
import { DevToolsGroups } from '@features/scene/DevToolsOverlay';
import { solarPosition } from '@features/scene/SunLight';
import { useIsMobile } from '@shared/hooks/useIsMobile';

const SUN_LAT = parseFloat(import.meta.env.VITE_STUDIO_LAT ?? '48.828');
const SUN_LNG = parseFloat(import.meta.env.VITE_STUDIO_LNG ?? '2.376');

import { useSceneStore } from './store/useSceneStore';
import { CHARACTERS } from './walkerConfig';
import { WIGS_ITEMS } from '../inventory/inventoryData';
import { WALKER_ANIM_OPTIONS } from './animOptions';
import { resetAppIdle } from './idleState';

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

function Group({ emoji, title, defaultOpen = false, children }: {
  emoji: string; title: string; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card shadow-sm glass-card overflow-hidden">
      <div className="card-header p-0 border-0 bg-transparent">
        <button
          className="btn w-100 text-start py-2 px-3 fw-bold d-flex align-items-center justify-content-between text-dark border-0 shadow-none"
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
              <R label="Vue perspective (reset)"    keys={['P']} />
              <R label="Walk mode (entrer/quitter)" keys={['M']} />
              <R label="Vue top-down (toggle)"      keys={['T']} />
              <R label="Avion en papier (toggle)"   keys={['F']} />
              <R label="Grille Lara (toggle)"       keys={['G']} />
              <R label="Quitter walk / top-down"    keys={['Échap']} />
              <R label="Changer de personnage"      keys={['L']} />
            </div>

            <div>
              <Section title="Avion (mode vol)" />
              <R label="Décoller (pré-vol)"         keys={['Espace', 'C']} />
              <R label="Changer de vue"             keys={['C']} />
              <R label="Piquer / cabrer"            keys={['W', 'S', '↑', '↓']} />
              <R label="Roulis (vire)"              keys={['A', 'D', '←', '→']} />
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
              <R label="Avancer / reculer"          keys={['W', 'S', '↑', '↓']} />
              <R label="Pivoter gauche / droite"    keys={['A', 'D', '←', '→']} />
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
  bimDoubleDoor:     boolean;
  bimDoorLeftOpen:   boolean;
  bimDoorRightOpen:  boolean;
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
  lampSdb:        boolean;
  lampCouloir:    boolean;
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
  lidar:        boolean;
  lights:       boolean;
  shadows:      boolean;
  pillarsOnly:    boolean;
  realSun:      boolean;
  grass:        boolean;
  walker:       boolean;
  accessories:  boolean;
  laraPistols:  boolean;
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
  characterShadows: boolean;
}

export interface SidePanelProps {
  layers:          LayerState;
  onToggleLayer:   (key: keyof LayerState) => void;
}

export type LidarMode = 0 | 1 | 2 | 3;

export interface SidePanelProps2 extends SidePanelProps {
  onOpenInventory:         () => void;
  lidarMode:               LidarMode;
  onCycleLidar:            () => void;
  lidarOpacity:            number;
  onToggleLidarOpacity:    () => void;
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

export const ANIM_CATEGORIES = [
  { key: 'combat', label: 'Combat', icon: '⚔️' },
  { key: 'dances', label: 'Danses', icon: '💃' },
  { key: 'emotes_gestures', label: 'Emotes & Gestes', icon: '👋' },
  { key: 'interactions', label: 'Interactions', icon: '🎮' },
  { key: 'locomotion', label: 'Locomotion', icon: '🏃' },
  { key: 'poses_idles', label: 'Poses & Idles', icon: '🧘' },
  { key: 'sports_fitness', label: 'Sports & Fitness', icon: '⚽' },
] as const;

export function getAnimCategory(val: string): string {
  if (val === 'idle') return 'poses_idles';
  if (val.startsWith('animations/')) {
    const parts = val.split('/');
    if (parts.length > 1) {
      return parts[1];
    }
  }
  return 'other';
}

// ── Composant principal ───────────────────────────────────────────────────────

export function SidePanel({ 
  layers, 
  onToggleLayer, 
  onOpenInventory, 
  lidarMode, 
  onCycleLidar, 
  lidarOpacity, 
  onToggleLidarOpacity,
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
  const lastWigRef = useRef<string>('hair_101');

  useEffect(() => {
    const handleToggleHaircut = () => {
      setGlobalHaircut(prev => {
        if (prev === 'original') {
          const next = lastWigRef.current;
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
      {furnitureBtn('Porte Double BIM', 'bimDoubleDoor', 'ON', 'OFF')}
      {furnitureBtn('Baie Vitrée Ouest', 'glassDoorV2LeftOpen', 'OUVERT', 'FERMÉ')}
      {furnitureBtn('Volets', 'glassDoorV2ShutterPos', 'ON', 'OFF', v => `${v}%`)}
      
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
      
      <div className="text-muted fw-bold p-2 bg-light border-bottom" style={{ fontSize: '10px' }}>LUMIÈRES</div>
      {furnitureBtn('Lampe SDB', 'lampSdb')}
      {furnitureBtn('Lampe Couloir', 'lampCouloir')}
      {furnitureBtn('Lampe Ola', 'lampOn')}
    </div>
  );

  const ViewsSection = (
    <div className="d-flex flex-column bg-transparent overflow-auto" style={{ maxHeight: '40vh' }}>
      {b0('gray',   'Perspective (Raccourci P)', () => dispatchKey('p'))}
      {b0('gray',   'Walk (Raccourci M)',        () => dispatchKey('m'))}
      {b0('gray',   '2D Dessus (Raccourci T)',   () => dispatchKey('t'))}
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
      {b0('cyan',   'Avion ✈ (Raccourci F)',        () => dispatchKey('f'))}
      {b0('yellow', 'Autres vues…',  () => setShowViews(true))}
      {b0('teal',   'Raccourcis clavier ⌨',  () => setShowShortcuts(true))}
    </div>
  );

  const LayersSection = (
    <div className="d-flex flex-column bg-transparent overflow-auto" style={{ maxHeight: '45vh' }}>
      {layerBtn('green',  'Structure',     'structure')}
      {layerBtn('gray',   'Piliers seuls', 'pillarsOnly')}
      {layerBtn('peach',  'Portes',        'doors')}
      {layerBtn('peach',  'Équipements',   'equipment')}
      {layerBtn('purple', 'Mobilier',      'furniture')}
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
      {layerBtn('red',    'Aff. arêtes murs', 'wallEdges')}
      {layerBtn('cyan',   'X-Ray 🩻',      'xray')}
      {layerBtn('yellow', 'Lumières ☀',    'lights')}
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
              {CHARACTERS.filter(c => layers.showAllLaraStyles || c.id === activeWalkerId).map(c => (
                <option key={c.id} value={c.id} className="bg-light text-dark">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            
          <div className="mb-2">
            <div className="text-muted fw-semibold mb-1 text-dark" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🎨 Couleur des cheveux</div>
            <select
              className="form-select form-select-sm bg-transparent text-dark border-secondary"
              style={{ fontSize: isMobile ? '14px' : '11px' }}
              onKeyDown={(e) => e.stopPropagation()}
              defaultValue="rose"
              onChange={(e) => {
                const val = e.target.value;
                document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'lara-haircolor', value: val } }));
              }}
            >
              <option value="rouge" className="bg-light text-dark">Rouge</option>
              <option value="rose" className="bg-light text-dark">Rose</option>
              <option value="noir" className="bg-light text-dark">Noir</option>
              <option value="brun" className="bg-light text-dark">Brun</option>
              <option value="chatain" className="bg-light text-dark">Châtain</option>
              <option value="blond" className="bg-light text-dark">Blond</option>
              <option value="roux" className="bg-light text-dark">Roux</option>
              <option value="rouge" className="bg-light text-dark">Rouge</option>
              <option value="bleu" className="bg-light text-dark">Bleu</option>
              <option value="vert" className="bg-light text-dark">Vert</option>
              <option value="violet" className="bg-light text-dark">Violet</option>
              <option value="arc-en-ciel" className="bg-light text-dark">Arc-en-ciel</option>
            </select>
          </div>

          <div className="text-muted fw-semibold mb-1 text-dark" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>💇‍♀️ Coupe de cheveux</div>
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
        </div>
      )}

      <div className="text-muted fw-semibold mb-1 text-dark mt-2" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🤖 Actions IA (Autopilot)</div>
      {(() => {
        const aiBtn = (label: string, key: string, emoji: string) => {
          const isPlaying = extraStates[key as keyof typeof extraStates];
          return (
            <button
              key={key}
              className="btn btn-light w-100 text-start rounded-0 border-0 border-bottom py-2 px-3 text-dark d-flex align-items-center justify-content-between"
              onClick={() => useSceneStore.getState().triggerAction(key)}
              style={{ fontSize: isMobile ? '14px' : '11px', background: 'transparent' }}
            >
              <span>{label} {emoji}</span>
              <span className={`badge ${isPlaying ? 'bg-primary' : 'bg-secondary'}`} style={{ fontSize: '9px' }}>
                {isPlaying ? 'EN COURS' : 'JOUER'}
              </span>
            </button>
          );
        };
        return (
          <>
            {aiBtn('Visite guidée complète', 'aiFullTour', '🤖')}
            {aiBtn('Aller aux toilettes (pipi)', 'aiGoToilet', '🚽')}
            {aiBtn('Travailler Bureau 1', 'aiSitDesk1', '💻')}
            {aiBtn('Chaise de bureau', 'aiSitOfficeChair', '🪑')}
            {aiBtn('Travailler Bureau 2', 'aiSitDesk2', '💻')}
            {aiBtn('Dormir Lit Principal (Ouest)', 'aiBedWest', '🛌')}
            {aiBtn('Dormir Lit Secondaire (Est)', 'aiBedEast', '🛌')}
            {aiBtn('Se baigner (Baignoire)', 'aiBathtub', '🛀')}
            {aiBtn('Se doucher', 'aiShower', '🚿')}
            {aiBtn('Détente Canapé Jardin Est', 'aiGardenSofaEast', '🛋️')}
            {aiBtn('Détente Canapé Jardin Ouest', 'aiGardenSofaWest', '🛋️')}
            {aiBtn('Faire à manger (Cuisine)', 'aiCooking', '🍳')}
            {aiBtn('Prendre objet Kallax NE', 'aiKallaxNE', '📦')}
            {aiBtn('Prendre l\'air au fond du jardin', 'aiFreshAir', '🌳')}
          </>
        );
      })()}
      <div className="text-muted fw-semibold mb-1 text-dark mt-3" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>⚙️ Options d'affichage</div>
      {layerBtn('light',  'Personnage 3D (Walker)', 'walker')}
      {layerBtn('gray',   'Ombres personnage 👤', 'characterShadows')}
      {layerBtn('light',  'Pistolets Lara 🔫', 'laraPistols')}
      {layerBtn('light',  'Accessoires Lara 🎒', 'accessories')}
      {layerBtn('pink',   'Physique buste 💃', 'breastPhysics')}
      {layerBtn('pink',   'Physique cheveux 💇‍♀️', 'hairPhysics')}
      {layerBtn('cyan', 'Wallhack (Silhouettes)', 'wallhack')}
      {layerBtn('cyan', 'Squelettes / Bones', 'skeleton')}
      {layers.walker && layerBtn('light',  'Toutes les Lara 👥', 'showAllLaraStyles')}
      <button 
        className="btn btn-light w-100 text-start rounded-0 border-0 border-bottom py-2 px-3 text-dark d-flex align-items-center justify-content-between"
        onClick={() => {
          onToggleLayer('laraGrid');
          if (!layers.laraGrid) {
            document.dispatchEvent(new CustomEvent('camera-view', { detail: { pos: [150, 450, 600], target: [150, 450, 200] } }));
          }
        }}
        style={{ 
          fontSize: isMobile ? '14px' : '11px',
          minHeight: isMobile ? '48px' : undefined,
          background: 'transparent',
          opacity: layers.laraGrid ? 1 : 0.55,
        }}
      >
        <span>Grille Lara 👥 (G)</span>
        <span className={`badge ${layers.laraGrid ? 'bg-danger' : 'bg-secondary'}`} style={{ fontSize: '9px' }}>
          {layers.laraGrid ? 'ON' : 'OFF'}
        </span>
      </button>
      {layers.walker && (
        <div className="p-2 border-bottom bg-transparent d-flex flex-column gap-2">

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
  const [animSearch, setAnimSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const [activeAnimValue, setActiveAnimValue] = useState<string>('idle');
  const [copiedAnim, setCopiedAnim] = useState<string | null>(null);
  const [recentAnims, setRecentAnims] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('recent_animations');
      if (!saved) return [];
      const parsed = JSON.parse(saved).slice(0, 2);
      return parsed.filter((v: string) => WALKER_ANIM_OPTIONS.some(a => a.value === v));
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setCategoryDropdownOpen(false);
      }
    };
    if (categoryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [categoryDropdownOpen]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    WALKER_ANIM_OPTIONS.forEach(a => {
      const cat = getAnimCategory(a.value);
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, []);

  useEffect(() => {
    const onToggle = (e: any) => {
      if (e.detail?.key === 'lara-haircut') {
        if (e.detail.value) setGlobalHaircut(e.detail.value);
      }
      if (e.detail?.key === 'walker-anim-lara' || e.detail?.key === 'walker-anim-xbot') {
        const val = e.detail.value ?? 'idle';
        setActiveAnimValue(val);
        if (val && val !== 'idle') {
          setRecentAnims(prev => {
            const next = [val, ...prev.filter(v => v !== val)].slice(0, 2);
            try {
              localStorage.setItem('recent_animations', JSON.stringify(next));
            } catch {}
            return next;
          });
        }
      }
    };
    document.addEventListener('furniture-toggle', onToggle);
    return () => document.removeEventListener('furniture-toggle', onToggle);
  }, []);

  const handleCopyAnim = (anim: { value: string; label: string }, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const filename = anim.value.split('/').pop() || anim.value;
    navigator.clipboard.writeText(filename);
    setCopiedAnim(anim.value);
    setTimeout(() => setCopiedAnim(null), 2000);
  };

  const filteredAnims = useMemo(() => {
    const q = animSearch.trim().toLowerCase();
    return WALKER_ANIM_OPTIONS.filter(a => {
      if (selectedCategories.length > 0) {
        const cat = getAnimCategory(a.value);
        if (!selectedCategories.includes(cat)) {
          return false;
        }
      }
      if (q) {
        return a.label.toLowerCase().includes(q) || a.value.toLowerCase().includes(q);
      }
      return true;
    });
  }, [animSearch, selectedCategories]);

  const animsContainerRef = useRef<HTMLDivElement>(null);

  const selectNextAnim = (direction: 'next' | 'prev') => {
    resetAppIdle();
    if (!filteredAnims.length) return;
    const currentIndex = filteredAnims.findIndex(a => a.value === activeAnimValue);
    let nextIndex = 0;
    if (currentIndex === -1) {
      nextIndex = direction === 'next' ? 0 : filteredAnims.length - 1;
    } else {
      if (direction === 'next') {
        nextIndex = (currentIndex + 1) % filteredAnims.length;
      } else {
        nextIndex = (currentIndex - 1 + filteredAnims.length) % filteredAnims.length;
      }
    }
    const targetAnim = filteredAnims[nextIndex];
    if (targetAnim) {
      document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'walker-anim-lara', value: targetAnim.value } }));
      document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'walker-anim-xbot', value: targetAnim.value } }));
    }
  };

  const playRandomAnim = () => {
    resetAppIdle();
    const pool = (filteredAnims.length > 0 ? filteredAnims : WALKER_ANIM_OPTIONS).filter(a => a.value !== 'idle');
    if (!pool.length) return;
    const randomAnim = pool[Math.floor(Math.random() * pool.length)];
    if (randomAnim) {
      document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'walker-anim-lara', value: randomAnim.value } }));
      document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'walker-anim-xbot', value: randomAnim.value } }));
    }
  };

  const handleKeyDownAnims = (e: React.KeyboardEvent | KeyboardEvent) => {
    resetAppIdle();
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      selectNextAnim(e.key === 'ArrowDown' ? 'next' : 'prev');
    }
  };

  useEffect(() => {
    if (activeAnimValue && animsContainerRef.current) {
      const container = animsContainerRef.current;
      const frameId = requestAnimationFrame(() => {
        const activeEl = container.querySelector('.active-anim-item') as HTMLElement | null;
        if (activeEl) {
          const containerRect = container.getBoundingClientRect();
          const activeRect = activeEl.getBoundingClientRect();

          if (activeRect.top < containerRect.top) {
            container.scrollTop -= (containerRect.top - activeRect.top + 6);
          } else if (activeRect.bottom > containerRect.bottom) {
            container.scrollTop += (activeRect.bottom - containerRect.bottom + 6);
          }
        }
      });
      return () => cancelAnimationFrame(frameId);
    }
  }, [activeAnimValue, filteredAnims]);

  const activeAnimOpt = WALKER_ANIM_OPTIONS.find(a => a.value === activeAnimValue);

  const AnimationsSection = (
    <div
      className="d-flex flex-column bg-transparent overflow-hidden"
      style={{ maxHeight: '55vh', outline: 'none' }}
      tabIndex={0}
      onKeyDown={handleKeyDownAnims}
    >
      <div className="p-2 border-bottom shadow-sm sticky-top" style={{ zIndex: 5, background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)' }}>
        {/* Barre de recherche pattern text */}
        <div className="input-group input-group-sm mb-1.5">
          <span className="input-group-text bg-light text-muted border-end-0">🔍</span>
          <input
            type="text"
            className="form-control border-start-0 ps-0"
            placeholder="Filtrer texte ou ↕ flèches..."
            value={animSearch}
            onChange={e => setAnimSearch(e.target.value)}
            onKeyDown={handleKeyDownAnims}
            style={{ fontSize: isMobile ? '13px' : '11px' }}
          />
          {animSearch && (
            <button
              className="btn btn-outline-secondary border-start-0"
              type="button"
              onClick={() => setAnimSearch('')}
              style={{ fontSize: '10px' }}
            >
              ✕
            </button>
          )}
          <button
            className="btn btn-warning text-dark fw-bold border-start-0 px-2"
            type="button"
            onClick={playRandomAnim}
            title="Jouer une animation au hasard parmi la sélection"
            style={{ fontSize: '10px' }}
          >
            🎲 Aléatoire
          </button>
        </div>

        {/* Filtre select à choix multiple par catégorie / nom de sous-dossier */}
        <div ref={categoryDropdownRef} className="position-relative mb-1.5">
          <div className="d-flex gap-1">
            <button
              type="button"
              className={`btn btn-sm w-100 text-start d-flex justify-content-between align-items-center py-1 px-2 ${
                selectedCategories.length > 0
                  ? 'btn-danger bg-danger text-white border-danger shadow-sm'
                  : 'btn-outline-secondary bg-white text-dark border'
              }`}
              style={{ fontSize: isMobile ? '12px' : '11px', borderRadius: '4px' }}
              onClick={() => setCategoryDropdownOpen(prev => !prev)}
            >
              <span className="text-truncate">
                📁 <strong>Catégories :</strong> {selectedCategories.length === 0
                  ? `Toutes (${ANIM_CATEGORIES.length})`
                  : `${selectedCategories.map(k => ANIM_CATEGORIES.find(c => c.key === k)?.label).join(', ')} (${selectedCategories.length})`
                }
              </span>
              <span className="ms-1 opacity-75" style={{ fontSize: '9px' }}>{categoryDropdownOpen ? '▲' : '▼'}</span>
            </button>

            {selectedCategories.length > 0 && (
              <button
                type="button"
                className="btn btn-sm btn-outline-danger px-2 shrink-0"
                style={{ fontSize: '10px' }}
                onClick={() => setSelectedCategories([])}
                title="Réinitialiser toutes les catégories"
              >
                ✕
              </button>
            )}
          </div>

          {categoryDropdownOpen && (
            <div
              className="position-absolute start-0 end-0 mt-1 p-2 bg-white border rounded shadow-lg"
              style={{
                zIndex: 1050,
                backdropFilter: 'blur(12px)',
                background: 'rgba(255, 255, 255, 0.98)',
                maxHeight: '230px',
                overflowY: 'auto'
              }}
            >
              <div className="d-flex justify-content-between align-items-center mb-1.5 pb-1 border-bottom">
                <button
                  type="button"
                  className="btn btn-link btn-sm p-0 text-decoration-none fw-semibold"
                  style={{ fontSize: '10.5px' }}
                  onClick={() => setSelectedCategories(ANIM_CATEGORIES.map(c => c.key))}
                >
                  ✓ Tout cocher
                </button>
                <button
                  type="button"
                  className="btn btn-link btn-sm p-0 text-decoration-none text-danger fw-semibold"
                  style={{ fontSize: '10.5px' }}
                  onClick={() => setSelectedCategories([])}
                >
                  ✕ Tout décocher (Toutes)
                </button>
              </div>

              <div className="d-flex flex-column gap-1">
                {ANIM_CATEGORIES.map(cat => {
                  const isChecked = selectedCategories.includes(cat.key);
                  const count = categoryCounts[cat.key] || 0;
                  return (
                    <label
                      key={cat.key}
                      className={`d-flex align-items-center justify-content-between px-2 py-1 rounded cursor-pointer mb-0 ${
                        isChecked ? 'bg-danger-subtle text-danger-emphasis fw-semibold' : 'hover-bg-light text-dark'
                      }`}
                      style={{ fontSize: '11px', cursor: 'pointer', userSelect: 'none' }}
                    >
                      <span className="d-flex align-items-center gap-1.5">
                        <input
                          type="checkbox"
                          className="form-check-input mt-0 me-1.5"
                          checked={isChecked}
                          onChange={() => {
                            setSelectedCategories(prev =>
                              prev.includes(cat.key)
                                ? prev.filter(k => k !== cat.key)
                                : [...prev, cat.key]
                            );
                          }}
                        />
                        <span>{cat.icon} {cat.label}</span>
                      </span>
                      <span className={`badge ${isChecked ? 'bg-danger text-white' : 'bg-secondary-subtle text-secondary-emphasis'}`} style={{ fontSize: '9px' }}>
                        {count}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {recentAnims.slice(0, 2).length > 0 && !animSearch && selectedCategories.length === 0 && (
          <div className="mb-2 p-1.5 bg-light rounded border">
            <div className="text-muted fw-bold mb-1 px-1" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              🕒 Récentes ({recentAnims.slice(0, 2).length})
            </div>
            <div className="d-flex flex-wrap gap-1">
              {recentAnims.slice(0, 2).map(val => {
                const opt = WALKER_ANIM_OPTIONS.find(a => a.value === val);
                const isAct = activeAnimValue === val;
                const label = opt ? opt.label : val.split('/').pop() || val;
                return (
                  <button
                    key={val}
                    className={`btn btn-xs ${isAct ? 'btn-danger fw-bold' : 'btn-outline-dark'} py-0 px-2 text-truncate`}
                    style={{ fontSize: '10px', maxWidth: '100%' }}
                    onClick={() => {
                      document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'walker-anim-lara', value: val } }));
                      document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'walker-anim-xbot', value: val } }));
                    }}
                    title={label}
                  >
                    {isAct ? '▶ ' : ''}{label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {activeAnimOpt && activeAnimValue !== 'idle' && (
          <div className="p-2 mb-1 rounded border border-danger-subtle bg-danger-subtle bg-opacity-25 d-flex flex-column gap-1">
            <div className="d-flex justify-content-between align-items-center">
              <span className="fw-bold text-danger text-truncate me-1" style={{ fontSize: '11px' }}>
                ▶ En cours : {activeAnimOpt.label}
              </span>
              <button
                className="btn btn-sm btn-outline-danger py-0 px-2 fw-semibold shrink-0"
                style={{ fontSize: '9px' }}
                onClick={(e) => handleCopyAnim(activeAnimOpt, e)}
                title="Copier le nom du fichier GLB"
              >
                {copiedAnim === activeAnimOpt.value ? '✓ Copié !' : '📋 Copier nom'}
              </button>
            </div>
            <div className="font-monospace text-muted text-truncate" style={{ fontSize: '9px' }}>
              📁 {activeAnimOpt.value.split('/').pop()}
            </div>
          </div>
        )}

        <div className="text-muted small px-1 d-flex justify-content-between" style={{ fontSize: '9px' }}>
          <span>{filteredAnims.length} animation{filteredAnims.length > 1 ? 's' : ''}</span>
          <span className="text-muted">↕ Flèches Clavier</span>
        </div>
      </div>

      <div ref={animsContainerRef} className="overflow-auto flex-grow-1" style={{ maxHeight: '40vh', position: 'relative', scrollBehavior: 'smooth' }}>
        {filteredAnims.length === 0 ? (
          <div className="p-3 text-center text-muted small">
            Aucune animation ne correspond aux filtres actuels
          </div>
        ) : (
          filteredAnims.map(anim => {
            const isActive = activeAnimValue === anim.value;
            const isPose = anim.label.toLowerCase().includes('pose') || anim.value.toLowerCase().includes('pose');
            const filename = anim.value.split('/').pop() || anim.value;
            const animCat = getAnimCategory(anim.value);
            const catObj = ANIM_CATEGORIES.find(c => c.key === animCat);

            return (
              <div
                key={anim.value}
                className={`d-flex align-items-center justify-content-between border-bottom px-2 py-2 ${
                  isActive ? 'active-anim-item bg-danger text-white fw-bold shadow-sm' : 'bg-transparent hover-bg-light text-dark'
                }`}
                style={{
                  fontSize: isMobile ? '13px' : '11px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onClick={() => {
                  document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'walker-anim-lara', value: anim.value } }));
                  document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'walker-anim-xbot', value: anim.value } }));
                }}
              >
                <div className="d-flex align-items-center gap-1 overflow-hidden me-2" style={{ flex: 1 }}>
                  <span style={{ fontSize: '10px' }}>{isActive ? '▶' : ''}</span>
                  <span className="text-truncate" title={anim.label}>{anim.label}</span>
                  {catObj && (
                    <span
                      className={`badge ${isActive ? 'bg-white bg-opacity-25 text-white' : 'bg-secondary-subtle text-secondary-emphasis'} ms-1 fw-normal`}
                      style={{ fontSize: '8px', letterSpacing: '0.02em', flexShrink: 0 }}
                      title={`Sous-dossier: ${catObj.label}`}
                    >
                      {catObj.icon}
                    </span>
                  )}
                  {isPose && (
                    <span
                      className={`badge ${isActive ? 'bg-light text-danger' : 'bg-warning text-dark'} ms-1 fw-normal`}
                      style={{ fontSize: '8px', letterSpacing: '0.02em', flexShrink: 0 }}
                    >
                      POSE 10s
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  className={`btn btn-sm ${isActive ? 'btn-light text-danger border-0' : 'btn-outline-secondary border-0'} p-1 shrink-0`}
                  style={{ fontSize: '10px', lineHeight: 1 }}
                  onClick={(e) => handleCopyAnim(anim, e)}
                  title={`Copier "${filename}"`}
                >
                  {copiedAnim === anim.value ? '✓' : '📋'}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  const [autoCycleIndex, setAutoCycleIndex] = useState(0);
  const isFirstMountRef = useRef(true);

  interface CoupleAnimConfig {
    label: string;
    icon: string;
    s: string;
    r: string;
    dist?: number;
    rotS?: number;
    rotR?: number;
    sPos?: [number, number, number];
    rPos?: [number, number, number];
  }

  const coupleAnims: CoupleAnimConfig[] = [
    { label: 'B1', icon: '💥', s: 'animations/combat/miley_armature_b1_fall_kicked_knockout.glb', r: 'animations/locomotion/miley_armature_b1_attack_back_somersault_flip.glb', dist: 100 },
    { label: 'D1', icon: '🤺', s: 'animations/combat/miley_armature_d1_attack_arms_block.glb', r: 'animations/combat/miley_armature_d1_dodge_sideways.glb', dist: 100 },
    { label: 'D4', icon: '🤺', s: 'animations/combat/miley_armature_d4_attack_reverse_front_snap_kick.glb', r: 'animations/combat/miley_armature_d4_dodge_roll_back.glb', dist: 100 },
    { label: 'F2', icon: '🥊', s: 'animations/combat/miley_armature_f2_attack_straight_punch02.glb', r: 'animations/locomotion/miley_armature_f2_fall_to_ground_face_up01.glb', dist: 100 },
    { label: 'H1', icon: '👊', s: 'animations/combat/miley_armature_h1_hit_punches.glb', r: 'animations/combat/miley_armature_h1_attack_punches.glb', dist: 100 },
    { label: 'H2', icon: '👊', s: 'animations/combat/miley_armature_h2_attack_side_kicks.glb', r: 'animations/combat/miley_armature_h2_hit_dodge.glb', dist: 100 },
    { label: 'H4', icon: '👊', s: 'animations/combat/miley_armature_h4_attack_rising_kick.glb', r: 'animations/combat/miley_armature_h4_hit_staggering.glb', dist: 100 },
    { label: 'Ko1', icon: '😵', s: 'animations/locomotion/miley_armature_ko1_fall_to_ground_sprawl.glb', r: 'animations/combat/miley_armature_ko1_attack_uppercut.glb', dist: 100 },
    { label: 'Ko2', icon: '😵', s: 'animations/combat/miley_armature_ko2_attack_hood_kicks.glb', r: 'animations/locomotion/miley_armature_ko2_fall_to_ground_axel_down.glb', dist: 100 },
    { label: 'Ko3', icon: '😵', s: 'animations/interactions/miley_armature_ko3_attack_hammer_fist.glb', r: 'animations/locomotion/miley_armature_ko3_fall_to_ground_side_up02.glb', dist: 100 },
    { label: 'P1', icon: '😤', s: 'animations/combat/miley_armature_p1_standoff_push_knockout.glb', r: 'animations/combat/miley_armature_p1_standoff_block_straight_punch.glb' },
    { label: 'P2', icon: '😤', s: 'animations/poses_idles/miley_armature_p2_standoff_provokes_m1.glb', r: 'animations/poses_idles/miley_armature_p2_standoff_provokes_m2.glb' },
    { label: 'S1', icon: '🥋', s: 'animations/combat/miley_armature_s1_sparring_punch_m1.glb', r: 'animations/combat/miley_armature_s1_sparring_punch_m2.glb', dist: 100 },
    { label: 'S2', icon: '🥋', s: 'animations/combat/miley_armature_s2_sparring_dodges01.glb', r: 'animations/combat/miley_armature_s2_sparring_kicks.glb', dist: 100 },
    { label: 'S3', icon: '🥋', s: 'animations/combat/miley_armature_s3_sparring_dodges02.glb', r: 'animations/combat/miley_armature_s3_sparring_reverse_kicks.glb', dist: 100 },
    { label: 'S4', icon: '🥋', s: 'animations/combat/miley_armature_s4_sparring_double_kicks_m1.glb', r: 'animations/combat/miley_armature_s4_sparring_double_kicks_m2.glb', dist: 100 },
    { label: 'S5', icon: '🥋', s: 'animations/combat/miley_armature_s5_sparring_block_kick.glb', r: 'animations/combat/miley_armature_s5_sparring_block_hit.glb', dist: 100 },
    { label: 'T1', icon: '🤼', s: 'animations/interactions/miley_armature_t1_attack_thrown.glb', r: 'animations/combat/miley_armature_t1_hit_suplex.glb', dist: 100 },
    { label: 'T3', icon: '🤼', s: 'animations/locomotion/miley_armature_t3_fall_shoulder_throw.glb', r: 'animations/interactions/miley_armature_t3_attack_shoulder_throw.glb', dist: 100 },
    { label: 'T4', icon: '🤼', s: 'animations/dances/miley_armature_t4_fall_belly_to_back_slam.glb', r: 'animations/combat/miley_armature_t4_attack_knee_strike.glb', dist: 100 },
    { label: 'T5', icon: '🤼', s: 'animations/emotes_gestures/miley_armature_t5_attack_headlock_takeover.glb', r: 'animations/locomotion/miley_armature_t5_fall_headlock_takeover.glb', dist: 100 },
    { label: 'Pop Dance', icon: '🕺', s: 'animations/dances/miley_armature_couple_pop_dance_m.glb', r: 'animations/dances/miley_armature_couple_pop_dance_f.glb', dist: 50 },
    { label: 'Energetic Dance', icon: '🕺', s: 'animations/dances/miley_armature_energetic_dance_m.glb', r: 'animations/dances/miley_armature_energetic_dance_f.glb', dist: 100 },
    { label: 'Slow Dance', icon: '💃', s: 'animations/dances/miley_armature_slow_dance_m.glb', r: 'animations/dances/miley_armature_slow_dance_f.glb', dist: 50 },
    { label: 'Cuddle Kiss', icon: '😘', s: 'animations/emotes_gestures/miley_armature_cuddle_kiss_m.glb', r: 'animations/emotes_gestures/miley_armature_cuddle_kiss_f.glb', dist: 50 },
    { label: 'Eye to Eye Kiss', icon: '🤗', s: 'animations/emotes_gestures/miley_armature_eye_to_eye_hug_kiss_f.glb', r: 'animations/emotes_gestures/miley_armature_eye_to_eye_hug_kiss_m.glb', dist: 30 },
    { label: 'Farewell Kiss', icon: '👋', s: 'animations/emotes_gestures/miley_armature_farewell_kiss_m.glb', r: 'animations/emotes_gestures/miley_armature_farewell_kiss_f.glb', dist: 100 },
    { label: 'Date Bearhug', icon: '🐻', s: 'animations/interactions/miley_armature_date_bearhug_m.glb', r: 'animations/interactions/miley_armature_date_bearhug_f.glb', dist: 50 },
    { label: 'Propose', icon: '💍', s: 'animations/poses_idles/miley_armature_propose_f.glb', r: 'animations/poses_idles/miley_armature_propose_m.glb', dist: 50 },
    { label: 'Sit Cuddle', icon: '🛋️', s: 'animations/poses_idles/miley_armature_sit_cuddle_hug_m.glb', r: 'animations/poses_idles/miley_armature_sit_cuddle_hug_f.glb', dist: 50 },
    { label: 'Double Leg Takedown', icon: '🤼', s: 'animations/combat/anim_best_double_leg_takedown_victim.glb', r: 'animations/combat/anim_best_double_leg_takedown_attacker.glb', dist: 0, rotS: Math.PI, rotR: 0, sPos: [-450, 0, 270] },
    { label: 'Prise d\'otage', icon: '🚨', s: 'animations/interactions/anim_taken_hostage_victim.glb', r: 'animations/interactions/anim_taken_hostage_villain.glb', dist: 0 },
    { label: 'Projection épaule', icon: '🥋', s: 'animations/interactions/anim_shoulder_throw_victim.glb', r: 'animations/interactions/anim_shoulder_throw_aggressor.glb', dist: 0 },
    { label: 'Baiser Homme / Femme', icon: '💋', s: 'animations/emotes_gestures/anim_kiss_from_woman.glb', r: 'animations/emotes_gestures/anim_kiss_from_man.glb', dist: 0 },
    { label: 'Baiser', icon: '💏', s: 'animations/emotes_gestures/anim_kiss.glb', r: 'animations/emotes_gestures/anim_kiss_1.glb', dist: 0 },
    { label: 'Assassinat brutal', icon: '🗡️', s: 'animations/combat/anim_brutal_assassination.glb', r: 'animations/combat/anim_brutal_assassination_1.glb', dist: 0 },
  ];

  const playCoupleAnim = (sandraPath: string, rajaaPath: string, dist: number = 50, rotS?: number, rotR?: number, sPos?: [number, number, number], rPos?: [number, number, number]) => {
    document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'walker-anim-sandra', value: sandraPath, loop: false } }));
    document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'walker-anim-rajaa', value: rajaaPath, loop: false } }));
    document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'walker-pos-sandra', value: sPos || [-450 + dist, 0, 0] } }));
    document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'walker-pos-rajaa', value: rPos || [-450, 0, 0] } }));
    document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'walker-rot-sandra', value: rotS !== undefined ? rotS : 0 } }));
    document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'walker-rot-rajaa', value: rotR !== undefined ? rotR : 0 } }));
  };

  useEffect(() => {
    if (autoCycleIndex < 0) return;
    const anim = coupleAnims[autoCycleIndex];
    if (anim) {
      const trigger = () => playCoupleAnim(
        anim.s,
        anim.r,
        anim.dist ?? 50,
        anim.rotS,
        anim.rotR,
        anim.sPos,
        anim.rPos
      );
      
      if (!isFirstMountRef.current) {
        trigger();
      } else {
        isFirstMountRef.current = false;
        const fallbackTimer = setTimeout(trigger, 1500);
        return () => clearTimeout(fallbackTimer);
      }
    }
  }, [autoCycleIndex]);

  useEffect(() => {
    const onReady = (e: any) => {
      if (e.detail?.id === 'sandra' && autoCycleIndex === 0) {
        const anim = coupleAnims[0];
        if (anim) {
          playCoupleAnim(
            anim.s,
            anim.r,
            anim.dist ?? 50,
            anim.rotS,
            anim.rotR,
            anim.sPos,
            anim.rPos
          );
        }
      }
    };
    document.addEventListener('walker-ready', onReady);
    return () => document.removeEventListener('walker-ready', onReady);
  }, [autoCycleIndex]);

  useEffect(() => {
    const onFinished = (e: any) => {
      // Only cycle when sandra finishes to avoid double triggers
      if (e.detail?.id === 'sandra') {
        setAutoCycleIndex(prev => prev < 0 ? -1 : (prev + 1) % coupleAnims.length);
      }
    };
    document.addEventListener('walker-anim-finished', onFinished);
    return () => document.removeEventListener('walker-anim-finished', onFinished);
  }, []);

  const AnimationsCoupleSection = (
    <div
      className="d-flex flex-column bg-transparent overflow-hidden"
      style={{ maxHeight: '55vh' }}
    >
      <div className="p-2 border-bottom shadow-sm sticky-top" style={{ zIndex: 5, background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(8px)' }}>
        <select
          className="form-select form-select-sm"
          onChange={(e) => {
            const val = e.target.value;
            if (val === '') return;
            const idx = coupleAnims.findIndex(anim => anim.label === val);
            if (idx !== -1) {
              setAutoCycleIndex(idx);
              const a = coupleAnims[idx];
              playCoupleAnim(
                a.s,
                a.r,
                a.dist ?? 50,
                a.rotS,
                a.rotR,
                a.sPos,
                a.rPos
              );
            }
          }}
          value={autoCycleIndex >= 0 && coupleAnims[autoCycleIndex] ? coupleAnims[autoCycleIndex].label : ""}
          style={{ fontSize: isMobile ? '13px' : '11px' }}
        >
          <option value="" disabled>Sélectionner une animation de couple...</option>
          {coupleAnims.map(a => (
            <option key={a.label} value={a.label}>
              {a.icon} {a.label}
            </option>
          ))}
        </select>
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
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={() => setActiveTab(null)}
              />
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
        className="position-fixed overflow-auto d-flex flex-column gap-2"
        style={{
          top: 16,
          left: 16,
          width: 220,
          maxHeight: 'calc(100vh - 32px)',
          zIndex: 100,
          scrollbarWidth: 'none',
        }}
        onWheel={e => e.stopPropagation()}
      >
        {/* ── Inventaire card (glass style) ── */}
        <div className="card shadow-sm glass-card overflow-hidden">
          <button
            className="btn btn-danger w-100 rounded-0 py-2 px-3 fw-bold text-start text-uppercase d-flex align-items-center justify-content-between border-0"
            onClick={onOpenInventory}
            style={{ fontSize: '11px', letterSpacing: '0.06em' }}
          >
            <span>📦 Inventaire</span>
            <span style={{ fontSize: '9px' }}>▶</span>
          </button>
        </div>

        {/* ── Dev Tools / Perf ── */}
        <DevToolsGroups Group={Group} />

        <Group emoji="📷" title="Vues">{ViewsSection}</Group>
        <Group emoji="📑" title="Calques">{LayersSection}</Group>
        <Group emoji="🎮" title="Interactif">{InteractifSection}</Group>
        <Group emoji="👤" title="Personnage">{PersonnageSection}</Group>
        <Group emoji="💃" title="Animations Perso">{AnimationsSection}</Group>
        <Group emoji="👯‍♀️" title="Animations Couple">{AnimationsCoupleSection}</Group>
      </div>

      {showViews     && <ViewsModal     onClose={() => setShowViews(false)} />}
      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
    </>
  );
}
