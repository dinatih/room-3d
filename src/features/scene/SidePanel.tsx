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
import { CHARACTERS } from './Walker';
import { WALKER_ANIM_OPTIONS } from './animOptions';

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

type TabKey = 'views' | 'layers' | 'personnage' | 'perf' | 'anims' | 'interactif' | null;

const TABS: Array<{ key: Exclude<TabKey, null>; emoji: string; label: string }> = [
  { key: 'perf',       emoji: '📊', label: 'Perf' },
  { key: 'views',      emoji: '📷', label: 'Vues' },
  { key: 'layers',     emoji: '📑', label: 'Calques' },
  { key: 'interactif', emoji: '🎮', label: 'Interact' },
  { key: 'personnage', emoji: '👤', label: 'Perso' },
  { key: 'anims',      emoji: '💃', label: 'Anim Perso' },
];

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
              <option value="hair_100" className="bg-light text-dark">Coupe #1 (Carré Court / Bob)</option>
              <option value="hair_101" className="bg-light text-dark">Coupe #2 (Queue de cheval haute & mèches visages)</option>
              <option value="hair_102" className="bg-light text-dark">Coupe #3 (Pixie effilée & déstructurée)</option>
              <option value="hair_103" className="bg-light text-dark">Coupe #4 (Shag mi-longue / Wolf cut)</option>
              <option value="hair_104" className="bg-light text-dark">Coupe #5 (Mi-longue lissée avec frange)</option>
              <option value="hair_105" className="bg-light text-dark">Coupe #6 (Queue de cheval très haute)</option>
              <option value="hair_106" className="bg-light text-dark">Coupe #7 (Carré court avec frange droite)</option>
              <option value="hair_107" className="bg-light text-dark">Coupe #8 (Couettes hautes & frange latérale)</option>
              <option value="hair_108" className="bg-light text-dark">Coupe #9 (Courte hérissée avec bandeau)</option>
              <option value="hair_109" className="bg-light text-dark">Coupe #10 (Lob ondulé / Wavy lob)</option>
              <option value="hair_110" className="bg-light text-dark">Coupe #11 (Coupe Hime / 姫カット)</option>
              <option value="hair_111" className="bg-light text-dark">Coupe #12 (Mi-tresse plaquée mi-ondulé)</option>
              <option value="hair_112" className="bg-light text-dark">Coupe #13 (Chignon haut hérissé & bandeau)</option>
              <option value="hair_zepeto" className="bg-light text-dark">Coupe #14 (Zepeto, zHairezt)</option>
              <option value="hair_pigtails" className="bg-light text-dark">Coupe #15 (Longues Couettes Blanches, zHairezt)</option>
              <option value="hair_buns" className="bg-light text-dark">Coupe #16 (Longs Chignons Buns, zHairezt)</option>
              <option value="hair_short_layers" className="bg-light text-dark">Coupe #17 (Courte Dégradée, zHairezt)</option>
              <option value="hair_nmixx_hat_braids" className="bg-light text-dark">Coupe #18 (NMIXX Bonnet & Tresses, zHairezt)</option>
              <option value="hair_very_long" className="bg-light text-dark">Coupe #19 (Très Longue, zHairezt)</option>
              <option value="hair_two_braids_bangs" className="bg-light text-dark">Coupe #20 (Deux Tresses Frange, zHairezt)</option>
              <option value="hair_aespa_short" className="bg-light text-dark">Coupe #21 (Aespa Courte, zHairezt)</option>
              <option value="hair_wavy_ponytail" className="bg-light text-dark">Coupe #22 (Queue de Cheval Ondulée, zHairezt)</option>
              <option value="hair_nimxx_short" className="bg-light text-dark">Coupe #23 (NIMXX Courte V1, zHairezt)</option>
              <option value="hair_short_combed" className="bg-light text-dark">Coupe #24 (Courte Plaquée Arrière, zHairezt)</option>
              <option value="hair_low_bun" className="bg-light text-dark">Coupe #25 (Chignon Bas Frange, zHairezt)</option>
              <option value="hair_high_bun" className="bg-light text-dark">Coupe #26 (Chignon Haut Frange, zHairezt)</option>
              <option value="hair_high_ponytail" className="bg-light text-dark">Coupe #27 (Petite Queue de Cheval Haute, zHairezt)</option>
              <option value="hair_nmixx_short" className="bg-light text-dark">Coupe #28 (NMIXX Courte V2, zHairezt)</option>
              <option value="hair_long_braids" className="bg-light text-dark">Coupe #29 (Longues Tresses Frange, zHairezt)</option>
              <option value="hair_nmixx_16" className="bg-light text-dark">Coupe #30 (NMIXX #16, zHairezt)</option>
              <option value="hair_zepeto_nmixx" className="bg-light text-dark">Coupe #31 (Zepeto NMIXX, zHairezt)</option>
              <option value="hair_bob_buns" className="bg-light text-dark">Coupe #32 (Carré Bob Buns, zHairezt)</option>
              <option value="hair_wavy_ponytails" className="bg-light text-dark">Coupe #33 (Longues Couettes Ondulées Blanches, zHairezt)</option>
              <option value="hair_two_long_ponytails" className="bg-light text-dark">Coupe #34 (Deux Longues Couettes, zHairezt)</option>
              <option value="hair_cyber_two_long_ponytails" className="bg-light text-dark">Coupe #35 (Cyber Deux Longues Couettes, zHairezt)</option>
              <option value="hair_white_hair_with_bun" className="bg-light text-dark">Coupe #36 (Cheveux Blancs avec Chignon, zHairezt)</option>
              <option value="hair_short_hair" className="bg-light text-dark">Coupe #37 (Cheveux Courts, zHairezt)</option>
              <option value="hair_white_ponytail" className="bg-light text-dark">Coupe #38 (Queue de Cheval Blanche, zHairezt)</option>
              <option value="hair_nmixx_hair_with_bangs" className="bg-light text-dark">Coupe #39 (NMIXX avec Frange, zHairezt)</option>
              <option value="hair_two_white_ponytails" className="bg-light text-dark">Coupe #40 (Deux Queues de Cheval Blanches, zHairezt)</option>
              <option value="hair_wolf_haircut" className="bg-light text-dark">Coupe #41 (Coupe Wolf, zHairezt)</option>
              <option value="hair_white_bob_hairct" className="bg-light text-dark">Coupe #42 (Carré Bob Blanc, zHairezt)</option>
              <option value="hair_scbe_hair_combed_to_one_side" className="bg-light text-dark">Coupe #43 (Cheveux Plaqués sur le Côté, zHairezt)</option>
              <option value="hair_wavy_wet_white_hair" className="bg-light text-dark">Coupe #44 (Cheveux Blancs Ondulés Mouillés, zHairezt)</option>
              <option value="hair_nyyd_wavy_hair" className="bg-light text-dark">Coupe #45 (NYYD Ondulés, zHairezt)</option>
              <option value="hair_short_wavy_hair_with_bangs" className="bg-light text-dark">Coupe #46 (Courts Ondulés avec Frange, zHairezt)</option>
              <option value="hair_nmixxhair_whith_bangs" className="bg-light text-dark">Coupe #47 (NMIXX Frange V2, zHairezt)</option>
              <option value="hair_long_hair_styled_to_the_sides" className="bg-light text-dark">Coupe #48 (Longs Stylisés sur les Côtés, zHairezt)</option>
              <option value="hair_wavy_long_hair_with_bangs" className="bg-light text-dark">Coupe #49 (Longs Ondulés Frange, zHairezt)</option>
              <option value="hair_wavy_white_hair_to_one_side" className="bg-light text-dark">Coupe #50 (Ondulés Blancs sur le Côté, zHairezt)</option>
              <option value="hair_high_white_bunponytail" className="bg-light text-dark">Coupe #51 (Chignon/Queue Haut Blanc, zHairezt)</option>
              <option value="hair_white_hair_arraged_to_one_side" className="bg-light text-dark">Coupe #52 (Cheveux Blancs Arrangés sur un Côté, zHairezt)</option>
            </select>
          </div>
        </div>
      )}

      {/* SHIBA INU SECTION */}
      <div className="p-2 border-bottom bg-transparent d-flex flex-column gap-2">
        <div className="text-muted fw-semibold mb-1 text-dark mt-2" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🐕 Ushiro (Shiba Inu)</div>
        <button 
          className="btn btn-sm btn-outline-dark text-start px-2 py-1" 
          style={{ fontSize: '11px' }}
          onClick={() => { document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'shiba-replay' } })); }}
        >
          ▶️ 🤖 Mode Autonome (Roaming)
        </button>
        <div className="d-flex flex-wrap gap-1 mt-1">
          {['Idle', 'Jump', 'Run', 'SitDown', 'Walk'].map((animName, i) => (
            <button
              key={animName}
              className="btn btn-sm btn-outline-secondary px-2 py-1 flex-grow-1"
              style={{ fontSize: '10px' }}
              onClick={() => {
                document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: `shiba-play-${i}` } }));
              }}
            >
              🔄 {animName}
            </button>
          ))}
        </div>
      </div>

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
      {layerBtn('pink',   'Physique poitrine 💃', 'breastPhysics')}
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
                💥 Intensité Physique Poitrine
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
                ⚖️ Masse / Poids Poitrine (breastMass)
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
                🧶 Fermeté / Maintien Poitrine (breastFirmness)
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
  const [activeAnimValue, setActiveAnimValue] = useState<string>('idle');
  const [copiedAnim, setCopiedAnim] = useState<string | null>(null);
  const [animLoopMode, setAnimLoopMode] = useState<'infinite' | '3x' | '1x'>('infinite');

  const setLoopMode = (mode: 'infinite' | '3x' | '1x') => {
    setAnimLoopMode(mode);
    document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'walker-anim-loop', value: mode } }));
  };
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
    if (!q) return WALKER_ANIM_OPTIONS;
    return WALKER_ANIM_OPTIONS.filter(a =>
      a.label.toLowerCase().includes(q) || a.value.toLowerCase().includes(q)
    );
  }, [animSearch]);

  const animsContainerRef = useRef<HTMLDivElement>(null);

  const selectNextAnim = (direction: 'next' | 'prev') => {
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
    const pool = WALKER_ANIM_OPTIONS.filter(a => a.value !== 'idle');
    if (!pool.length) return;
    const randomAnim = pool[Math.floor(Math.random() * pool.length)];
    if (randomAnim) {
      document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'walker-anim-lara', value: randomAnim.value } }));
      document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'walker-anim-xbot', value: randomAnim.value } }));
    }
  };

  const handleKeyDownAnims = (e: React.KeyboardEvent | KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      selectNextAnim(e.key === 'ArrowDown' ? 'next' : 'prev');
    }
  };

  useEffect(() => {
    if (activeAnimValue && animsContainerRef.current) {
      const container = animsContainerRef.current;
      const activeEl = container.querySelector('.active-anim-item') as HTMLElement | null;
      if (activeEl) {
        const elTop = activeEl.offsetTop;
        const elHeight = activeEl.offsetHeight;
        const containerScrollTop = container.scrollTop;
        const containerHeight = container.clientHeight;

        if (elTop < containerScrollTop) {
          container.scrollTop = elTop;
        } else if (elTop + elHeight > containerScrollTop + containerHeight) {
          container.scrollTop = elTop + elHeight - containerHeight;
        }
      }
    }
  }, [activeAnimValue]);

  const activeAnimOpt = WALKER_ANIM_OPTIONS.find(a => a.value === activeAnimValue);

  const AnimationsSection = (
    <div
      className="d-flex flex-column bg-transparent overflow-hidden"
      style={{ maxHeight: '55vh', outline: 'none' }}
      tabIndex={0}
      onKeyDown={handleKeyDownAnims}
    >
      <div className="p-2 border-bottom shadow-sm sticky-top" style={{ zIndex: 5, background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(8px)' }}>
        <div className="input-group input-group-sm mb-1">
          <span className="input-group-text bg-light text-muted border-end-0">🔍</span>
          <input
            type="text"
            className="form-control border-start-0 ps-0"
            placeholder="Filtrer ou ↕ flèches..."
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
            title="Jouer une animation au hasard parmi les 750+ GLBs"
            style={{ fontSize: '10px' }}
          >
            🎲 Aléatoire
          </button>
        </div>

        <div className="d-flex align-items-center justify-content-between mb-2 px-1" style={{ fontSize: '10px' }}>
          <span className="text-muted fw-semibold">Lecture :</span>
          <div className="btn-group btn-group-sm" role="group">
            <button
              type="button"
              className={`btn ${animLoopMode === 'infinite' ? 'btn-danger active fw-bold' : 'btn-outline-secondary'} py-0 px-2`}
              style={{ fontSize: '9px' }}
              onClick={() => setLoopMode('infinite')}
              title="Boucle infinie (par défaut)"
            >
              ∞ Infini
            </button>
            <button
              type="button"
              className={`btn ${animLoopMode === '3x' ? 'btn-danger active fw-bold' : 'btn-outline-secondary'} py-0 px-2`}
              style={{ fontSize: '9px' }}
              onClick={() => setLoopMode('3x')}
              title="Répéter 3 fois"
            >
              3x
            </button>
            <button
              type="button"
              className={`btn ${animLoopMode === '1x' ? 'btn-danger active fw-bold' : 'btn-outline-secondary'} py-0 px-2`}
              style={{ fontSize: '9px' }}
              onClick={() => setLoopMode('1x')}
              title="Jouer 1 seule fois"
            >
              1x
            </button>
          </div>
        </div>

        {recentAnims.slice(0, 2).length > 0 && !animSearch && (
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

      <div ref={animsContainerRef} className="overflow-auto flex-grow-1" style={{ maxHeight: '40vh' }}>
        {filteredAnims.length === 0 ? (
          <div className="p-3 text-center text-muted small">
            Aucune animation ne correspond à &quot;{animSearch}&quot;
          </div>
        ) : (
          filteredAnims.map(anim => {
            const isActive = activeAnimValue === anim.value;
            const isPose = anim.label.toLowerCase().includes('pose') || anim.value.toLowerCase().includes('pose');
            const filename = anim.value.split('/').pop() || anim.value;

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

  // ── Rendu mobile : tab bar bottom + sheet ───────────────────────────────────

  if (isMobile) {
    const sheetOpen = activeTab !== null;
    const sheetTitle: Record<Exclude<TabKey, null>, string> = {
      views: '📷 Vues', layers: '📑 Calques', personnage: '👤 Personnage',
      perf: '📊 Perf', anims: '💃 Animations Perso', interactif: '🎮 Interactif'
    };
    const sheetBody: Record<Exclude<TabKey, null>, React.ReactNode> = {
      views: ViewsSection,
      layers: LayersSection,
      interactif: InteractifSection,
      personnage: PersonnageSection,
      anims: AnimationsSection,
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
      </div>

      {showViews     && <ViewsModal     onClose={() => setShowViews(false)} />}
      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
    </>
  );
}
