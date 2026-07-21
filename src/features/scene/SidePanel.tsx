/**
 * SidePanel.tsx — menu de contrôle.
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
import { useState, useEffect } from 'react';
import { DevToolsGroups } from '@features/scene/DevToolsOverlay';
import { RENDER_STYLES, type RenderStyleKey } from '@features/scene/RenderStyleLayer';
import { solarPosition } from '@features/scene/SunLight';
import { useIsMobile } from '@shared/hooks/useIsMobile';

const SUN_LAT = parseFloat(import.meta.env.VITE_STUDIO_LAT ?? '48.828');
const SUN_LNG = parseFloat(import.meta.env.VITE_STUDIO_LNG ?? '2.376');

import { useSceneStore } from './store/useSceneStore';
import { CHARACTERS, WALKER_ANIM_OPTIONS } from './Walker';

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
  sdbCloset:    boolean;
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
  realWorld:    boolean;
  realSun:      boolean;
  grass:        boolean;
  surface:      boolean;
  walker:       boolean;
  accessories:  boolean;
  laraPistols:  boolean;
  showAllLaraStyles: boolean;
  breastPhysics: boolean;
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
  renderStyle:             RenderStyleKey;
  onSetRenderStyle:        (key: RenderStyleKey) => void;
}

type TabKey = 'views' | 'layers' | 'display' | 'perf' | 'anims' | null;

const TABS: Array<{ key: Exclude<TabKey, null>; emoji: string; label: string }> = [
  { key: 'perf',      emoji: '📊', label: 'Perf' },
  { key: 'views',     emoji: '📷', label: 'Vues' },
  { key: 'layers',    emoji: '📑', label: 'Calques' },
  { key: 'anims',     emoji: '💃', label: 'Anims' },
  { key: 'display',   emoji: '👁',  label: 'Affichage' },
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
  renderStyle, 
  onSetRenderStyle 
}: SidePanelProps2) {
  
  const measurementActive = useSceneStore(state => state.measurementActive);
  const setMeasurementActive = useSceneStore(state => state.setMeasurementActive);
  const cameraMode = useSceneStore(state => state.cameraMode);
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

  // ── Sections (utilisées dans Group desktop OU sheet mobile) ─────────────────

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
    <div className="d-flex flex-column bg-transparent overflow-auto" style={{ maxHeight: '40vh' }}>
      {layerBtn('green',  'Structure',     'structure')}
      {layerBtn('gray',   'Piliers seuls', 'pillarsOnly')}
      {layerBtn('peach',  'Portes',        'doors')}
      {layerBtn('peach',  'Équipements',   'equipment')}
      {layerBtn('purple', 'Mobilier',      'furniture')}
      {layerBtn('purple', 'Miroirs',       'mirrors')}
      {layers.mirrors && layerBtn('purple', 'Miroirs HD',    'mirrorsHD')}
      {layerBtn('gray',   'Ombres',        'shadows')}
      {layerBtn('blue',   'Voisins',       'neighbors')}
      {layerBtn('light',  'Walker',        'walker')}
      {layerBtn('light',  'Pistolets Lara', 'laraPistols')}
      {layerBtn('light',  'Accessoires Lara', 'accessories')}
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
        <span>Grille Lara 👥</span>
        <span className={`badge ${layers.laraGrid ? 'bg-danger' : 'bg-secondary'}`} style={{ fontSize: '9px' }}>
          {layers.laraGrid ? 'ON' : 'OFF'}
        </span>
      </button>
      {layers.walker && (
        <div className="p-2 border-bottom bg-transparent">
          <div className="text-muted fw-semibold mb-1 text-dark" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>👤 Personnage</div>
          <select
            className="form-select form-select-sm bg-transparent text-dark border-secondary"
            style={{ fontSize: isMobile ? '14px' : '11px' }}
            value={activeWalkerId}
            onChange={(e) => {
              useSceneStore.getState().setActiveWalkerId(e.target.value);
              e.target.blur();
            }}
          >
            {CHARACTERS.filter(c => layers.showAllLaraStyles || c.id === activeWalkerId).map(c => (
              <option key={c.id} value={c.id} className="bg-light text-dark">
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );

  const DisplaySection = (
    <div className="d-flex flex-column bg-transparent overflow-auto" style={{ maxHeight: '40vh' }}>
      {layerBtn('teal',   'Grille',        'grid')}
      {layers.grid && layerBtn('teal', 'Grille Depth', 'gridDepth')}
      {layerBtn('red',    'Aff. arêtes murs', 'wallEdges')}
      {layerBtn('cyan',   'X-Ray',         'xray')}
      {layerBtn('white',  'Squelette',     'skeleton')}
      {layerBtn('pink',   'Physique poitrine', 'breastPhysics')}
      {layerBtn('yellow', 'Lumières ☀',    'lights')}
      {layerBtn('green',  'Gazon 3D 🌿',   'grass')}
      {layerBtn('cyan',   'LiDAR scan',    'lidar')}
      {layers.lidar && b0('cyan', ['Photo', 'Filaire', 'Points', 'Hauteur'][lidarMode] + ' →', onCycleLidar)}
      {layers.lidar && b0('cyan', `Opacité ${Math.round(lidarOpacity * 100)}%`, onToggleLidarOpacity)}
      {layerBtn('teal',   'Monde réel 🌍', 'realWorld')}
      {layerBtn('yellow', 'Soleil réel ☀', 'realSun')}
      {layerBtn('green',  'Surfaces m²',   'surface')}

      
      <div className="p-2 border-bottom bg-transparent">
        <div className="text-muted fw-semibold mb-1" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🎨 Rendu</div>
        <div className="d-flex flex-wrap gap-1">
          {RENDER_STYLES.map(({ key, label }) => {
            const active = renderStyle === key;
            return (
              <button
                key={key}
                onClick={() => onSetRenderStyle(key)}
                className={`btn btn-sm ${active ? 'btn-danger' : 'btn-outline-secondary'}`}
                style={{
                  fontSize: isMobile ? '12px' : '9px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

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
        <span>Plan</span>
        <span className={`badge ${layers.plan ? 'bg-danger' : 'bg-secondary'}`} style={{ fontSize: '9px' }}>
          {layers.plan ? 'ON' : 'OFF'}
        </span>
      </button>
    </div>
  );
  const AnimationsSection = (
    <div className="d-flex flex-column bg-transparent overflow-auto" style={{ maxHeight: '40vh' }}>
      {WALKER_ANIM_OPTIONS.map(anim => (
        <button
          key={anim.value}
          className="btn btn-light w-100 text-start rounded-0 border-0 border-bottom py-2 px-3 text-dark"
          onClick={() => {
            document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'walker-anim-lara', value: anim.value } }));
            document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'walker-anim-xbot', value: anim.value } }));
          }}
          style={{ fontSize: isMobile ? '14px' : '11px', background: 'transparent' }}
        >
          {anim.label}
        </button>
      ))}
    </div>
  );

  // ── Rendu mobile : tab bar bottom + sheet ───────────────────────────────────

  if (isMobile) {
    const sheetOpen = activeTab !== null;
    const sheetTitle: Record<Exclude<TabKey, null>, string> = {
      views: '📷 Vues', layers: '📑 Calques', display: '👁 Affichage',
      perf: '📊 Perf', anims: '💃 Animations'
    };
    const sheetBody: Record<Exclude<TabKey, null>, React.ReactNode> = {
      views: ViewsSection,
      layers: LayersSection,
      display: DisplaySection,
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
            className="position-fixed start-0 end-0 bg-white border-top shadow-lg z-index-95 d-flex flex-column rounded-top-4"
            style={{
              bottom: 64,
              maxHeight: 'calc(100vh - 120px)',
              zIndex: 95,
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
              <div className="d-flex flex-column bg-white">
                {sheetBody[activeTab]}
              </div>
            </div>
          </div>
        )}

        {/* Tab bar */}
        <div 
          className="position-fixed bottom-0 start-0 end-0 bg-white border-top shadow-lg d-flex justify-content-around align-items-center"
          style={{ height: '64px', zIndex: 100, paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {/* Inventaire — ouvre le modal directement */}
          <button
            onClick={onOpenInventory}
            className="btn border-0 d-flex flex-column align-items-center justify-content-center py-1 text-secondary"
            style={{ fontSize: '10px', flex: 1 }}
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
                style={{ fontSize: '10px', flex: 1 }}
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
        <Group emoji="💃" title="Animations">{AnimationsSection}</Group>
        <Group emoji="👁" title="Affichage">{DisplaySection}</Group>
      </div>

      {showViews     && <ViewsModal     onClose={() => setShowViews(false)} />}
      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
    </>
  );
}
