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
 */
import { useState, useCallback, useEffect } from 'react';
import { DevToolsGroups } from '@features/scene/DevToolsOverlay';
import { RENDER_STYLES, type RenderStyleKey } from '@features/scene/RenderStyleLayer';
import { solarPosition } from '@features/scene/SunLight';
import { useIsMobile } from '@shared/hooks/useIsMobile';

const SUN_LAT = parseFloat(import.meta.env.VITE_STUDIO_LAT ?? '48.828');
const SUN_LNG = parseFloat(import.meta.env.VITE_STUDIO_LNG ?? '2.376');

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

// ── Styles partagés ───────────────────────────────────────────────────────────

const COLORS: Record<string, string> = {
  gray: '#aaa', white: '#fff', light: '#f0f0f0',
  tan: '#e8c39e', yellow: '#ffd700', green: '#88cc88',
  blue: '#4488ff', peach: '#ff9966', purple: '#aa88ff',
  gold: '#ffaa44', teal: '#66cccc', cyan: '#44ddff',
  red: '#ff6644',
};

// ── Styles desktop ────────────────────────────────────────────────────────────

const desktopPanelStyle: React.CSSProperties = {
  position: 'fixed',
  top: 16, left: 16,
  width: 188,
  maxHeight: 'calc(100vh - 32px)',
  overflowY: 'auto',
  overflowX: 'hidden',
  zIndex: 100,
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  scrollbarWidth: 'thin',
};

const grpStyle: React.CSSProperties = {
  borderRadius: 8,
  overflow: 'hidden',
  border: '1px solid rgba(255,255,255,0.10)',
  backdropFilter: 'blur(8px)',
};

const grpHeaderStyle: React.CSSProperties = {
  background: 'rgba(10,10,20,0.92)',
  color: '#ddd',
  padding: '6px 10px',
  cursor: 'pointer',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.5px',
  textTransform: 'uppercase',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  userSelect: 'none',
};

const grpBodyStyle: React.CSSProperties = {
  background: 'rgba(0,0,0,0.72)',
};

function btn(color: string, mobile: boolean): React.CSSProperties {
  return {
    background: 'transparent', border: 'none',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 0,
    padding: mobile ? '14px 16px' : '6px 12px',
    cursor: 'pointer',
    fontSize: mobile ? 15 : 12,
    minHeight: mobile ? 48 : undefined,
    width: '100%', textAlign: 'left', display: 'block',
    whiteSpace: 'nowrap', color,
  };
}

// ── Groupe accordéon (desktop) ────────────────────────────────────────────────

function Group({ emoji, title, defaultOpen = false, children }: {
  emoji: string; title: string; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={grpStyle}>
      <div style={grpHeaderStyle} onClick={() => setOpen(o => !o)}>
        <span>{emoji} {title}</span>
        <span style={{ fontSize: 9, transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.18s' }}>▶</span>
      </div>
      {open && <div style={grpBodyStyle}>{children}</div>}
    </div>
  );
}

// ── Modal raccourcis clavier ──────────────────────────────────────────────────

function ShortcutsModal({ onClose }: { onClose: () => void }) {
  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)',
    zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center',
  };
  const modal: React.CSSProperties = {
    background: 'rgba(12,12,24,0.98)', border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 12, padding: '18px 22px', width: 340, maxHeight: '85vh',
    overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14,
    scrollbarWidth: 'thin',
  };
  const sectionTitle: React.CSSProperties = {
    color: 'rgba(255,255,255,0.45)', fontSize: 9, fontWeight: 700,
    letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4,
  };
  const row: React.CSSProperties = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
  };
  const desc: React.CSSProperties = { color: 'rgba(255,255,255,0.7)', fontSize: 11 };
  const keysCell: React.CSSProperties = { display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' };
  const kbd = (label: string, i = 0) => (
    <span key={i} style={{
      background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.22)',
      borderRadius: 4, padding: '1px 6px', fontSize: 10, fontFamily: 'monospace',
      color: '#ddd', whiteSpace: 'nowrap',
    }}>{label}</span>
  );

  const R = ({ label, keys }: { label: string; keys: string[] }) => (
    <div style={row}>
      <span style={desc}>{label}</span>
      <span style={keysCell}>{keys.map(kbd)}</span>
    </div>
  );
  const Section = ({ title }: { title: string }) => (
    <div style={sectionTitle}>{title}</div>
  );

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={e => e.stopPropagation()}>

        {/* En-tête */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ color: '#ddd', margin: 0, fontSize: 14 }}>Raccourcis clavier</h3>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none', color: '#aaa',
            fontSize: 18, cursor: 'pointer', lineHeight: 1, padding: 0,
          }}>×</button>
        </div>

        {/* Global */}
        <div>
          <Section title="Global" />
          <R label="Vue perspective (reset)"    keys={['P']} />
          <R label="Walk mode (entrer/quitter)" keys={['M']} />
          <R label="Vue top-down (toggle)"      keys={['T']} />
          <R label="Avion en papier (toggle)"   keys={['F']} />
          <R label="Quitter walk / top-down"    keys={['Échap']} />
          <R label="Changer de personnage"      keys={['L']} />
        </div>

        {/* Avion en papier */}
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

        {/* Orbit — style Google Earth */}
        <div>
          <Section title="Orbit — style Google Earth" />
          <R label="Déplacer le walker"         keys={['↑', '↓', '←', '→']} />
          <R label="Orbiter autour"             keys={['Shift + ↑↓←→']} />
          <R label="Rotation caméra"            keys={['Ctrl + ↑↓←→']} />
          <R label="Pan"                        keys={['Alt + ↑↓←→']} />
          <R label="Pan diagonal"               keys={['Shift+Ctrl + ↑↓←→']} />
        </div>

        {/* Walk mode */}
        <div>
          <Section title="Walk mode" />
          <R label="Avancer / reculer"          keys={['W', 'S', '↑', '↓']} />
          <R label="Pivoter gauche / droite"    keys={['A', 'D', '←', '→']} />
          <R label="Incliner la caméra"         keys={['Ctrl + ↑↓']} />
          <R label="Monter / descendre"         keys={['Alt + ↑↓']} />
          <R label="Regarder librement"         keys={['Clic + glisser']} />
        </div>

      </div>
    </div>
  );
}

// ── Modal vues ────────────────────────────────────────────────────────────────

function ViewsModal({ onClose }: { onClose: () => void }) {
  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)',
    zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center',
  };
  const modal: React.CSSProperties = {
    background: 'rgba(15,15,30,0.98)', border: '1px solid #444',
    borderRadius: 10, padding: '16px 20px', minWidth: 220,
    display: 'flex', flexDirection: 'column', gap: 6,
  };
  const mBtn: React.CSSProperties = {
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 6, padding: '10px 14px', cursor: 'pointer',
    color: '#ddd', fontSize: 13, textAlign: 'left', minHeight: 40,
  };
  const label: React.CSSProperties = {
    color: '#888', fontSize: 10, textTransform: 'uppercase',
    letterSpacing: '0.5px', marginTop: 6,
  };
  const close: React.CSSProperties = {
    alignSelf: 'flex-end', background: 'transparent', border: 'none',
    color: '#aaa', fontSize: 22, cursor: 'pointer', lineHeight: 1, padding: 4,
  };

  const viewBtn = (lbl: string, key: string) => (
    <button style={mBtn} onClick={() => { dispatchView(key); onClose(); }}>{lbl}</button>
  );
  const povBtn = (lbl: string, key: string) => (
    <button style={mBtn} onClick={() => { dispatchPov(key); onClose(); }}>{lbl}</button>
  );

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={e => e.stopPropagation()}>
        <button style={close} onClick={onClose}>×</button>
        <h3 style={{ color: '#ddd', margin: 0, fontSize: 14 }}>Vues</h3>
        <div style={label}>Caméra</div>
        {viewBtn('Perspective',  'perspective')}
        {viewBtn('Dessus 3D',    'top3d')}
        {viewBtn('Face (D)',     'front')}
        {viewBtn('Arrière (C)',  'back')}
        {viewBtn('Gauche (A)',   'left')}
        {viewBtn('Droite (B)',   'right')}
        {viewBtn('Dessous',      'bottom')}
        {viewBtn('Iso Sud-Est',  'iso-se')}
        {viewBtn('Iso Nord-Ouest','iso-nw')}
        <div style={label}>POV 1.8m</div>
        {povBtn('Séjour',       'living')}
        {povBtn('Entrée',       'entry')}
        {povBtn("Salle d'eau",  'bathroom')}
        {povBtn('Jardin',       'garden')}
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
  dronaRougeGlb:  boolean;
  lampSdb:        boolean;
  lampCouloir:    boolean;
  freezerOpen:    boolean;
  fridge:         boolean;
  tvOn:           boolean;
  sofaArmLeft:    boolean;
  sofaArmRight:   boolean;
  glassDoorV2:    boolean;
  glassDoorV2LeftOpen: boolean;
  glassDoorV2ShutterPos: number;
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

  skeleton:     boolean;
  doors:        boolean;
  redWalls:     boolean;
  wallEdges:    boolean;
  lidar:        boolean;
  lights:       boolean;
  shadows:      boolean;
  pillarsOnly:    boolean;
  wallsOnly:    boolean;
  realWorld:    boolean;
  realSun:      boolean;
  physics:      boolean;
  collisions:   boolean;
  grass:        boolean;
  surface:      boolean;
  ceiling:      boolean;
  walker:       boolean;
}

export interface SidePanelProps {
  furniture:       FurnitureState;
  onToggleFurniture: (key: keyof FurnitureState) => void;
  layers:          LayerState;
  onToggleLayer:   (key: keyof LayerState) => void;
}

export type LidarMode = 0 | 1 | 2 | 3;

import type { PlaneModelKey } from '@features/scene/PaperPlane';

export interface SidePanelProps2 extends SidePanelProps {
  onOpenInventory:         () => void;
  lidarMode:               LidarMode;
  onCycleLidar:            () => void;
  lidarOpacity:            number;
  onToggleLidarOpacity:    () => void;
  renderStyle:             RenderStyleKey;
  onSetRenderStyle:        (key: RenderStyleKey) => void;
  // Avion
  planeModel:              PlaneModelKey;
  onSetPlaneModel:         (m: PlaneModelKey) => void;
  autopilotVisible:        boolean;
  onToggleAutopilot:       () => void;
  showLandingStrips:       boolean;
  onToggleLandingStrips:   () => void;
}

// ── Sections (rendu commun desktop & mobile) ──────────────────────────────────

type TabKey = 'views' | 'display' | 'furniture' | 'perf' | null;

const TABS: Array<{ key: Exclude<TabKey, null>; emoji: string; label: string }> = [
  { key: 'perf',      emoji: '📊', label: 'Perf' },
  { key: 'views',     emoji: '📷', label: 'Vues' },
  { key: 'display',   emoji: '👁',  label: 'Affichage' },
  { key: 'furniture', emoji: '🛋', label: 'Mobilier' },
];

// ── Composant principal ───────────────────────────────────────────────────────

export function SidePanel({ furniture, onToggleFurniture, layers, onToggleLayer, onOpenInventory, lidarMode, onCycleLidar, lidarOpacity, onToggleLidarOpacity, renderStyle, onSetRenderStyle, planeModel, onSetPlaneModel, autopilotVisible, onToggleAutopilot, showLandingStrips, onToggleLandingStrips }: SidePanelProps2) {
  const isMobile = useIsMobile();
  const [showViews,     setShowViews]     = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [sunInfo, setSunInfo] = useState<{ time: string; el: number } | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>(null);

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

  // Helpers de bouton tenant compte de isMobile
  const b0 = (color: string, label: string, onClick: () => void, first = false) => {
    const s = { ...btn(COLORS[color] ?? color, isMobile) };
    if (first) s.borderTop = 'none';
    return <button style={s} onClick={onClick}>{label}</button>;
  };

  const layerBtn = (
    color: string,
    label: string,
    key: keyof LayerState,
    first = false,
  ) => {
    const on = layers[key];
    const s = { ...btn(COLORS[color] ?? color, isMobile) };
    if (first) s.borderTop = 'none';
    if (!on) s.opacity = 0.45;
    return (
      <button style={s} onClick={() => onToggleLayer(key)}>
        {label} : {on ? 'ON' : 'OFF'}
      </button>
    );
  };

  // ── Sections (utilisées dans Group desktop OU sheet mobile) ─────────────────

  const ViewsSection = (
    <>
      {b0('gray',   'Perspective P', () => dispatchKey('p'), true)}
      {b0('gray',   'Walk M',        () => dispatchKey('m'))}
      {b0('gray',   '2D Dessus T',   () => dispatchKey('t'))}
      {b0('cyan',   'Avion ✈ F',        () => dispatchKey('f'))}
      {b0('yellow', 'Autres vues…',  () => setShowViews(true))}
      {b0('teal',   'Raccourcis ⌨',  () => setShowShortcuts(true))}
    </>
  );

  const DisplaySection = (
    <>
      {layerBtn('teal',   'Grille',        'grid')}
      {layers.grid && layerBtn('teal', 'Grille Depth', 'gridDepth')}
      {layerBtn('peach',  'Physique',      'physics')}
      {layerBtn('peach',  'Collision objets', 'collisions')}
      {layerBtn('red',    'Aff. arêtes murs', 'wallEdges')}
      {layerBtn('green',  'Structure',     'structure', true)}
      {layerBtn('gray',   'Piliers seuls', 'pillarsOnly')}
      {layerBtn('gray',   'Murs seuls',    'wallsOnly')}
      {layerBtn('peach',  'Portes',        'doors')}
      {layerBtn('peach',  'Équipements',   'equipment')}
      {layerBtn('purple', 'Mobilier',      'furniture')}
      {layerBtn('blue',   'Voisins',       'neighbors')}
      {layerBtn('cyan',   'X-Ray',         'xray')}
      {layerBtn('purple', 'Miroirs',       'mirrors')}
      {layers.mirrors && layerBtn('purple', 'Miroirs HD',    'mirrorsHD')}
      {layerBtn('light',  'Walker',        'walker')}
      {layerBtn('white',  'Squelette',     'skeleton')}
      {layerBtn('yellow', 'Lumières ☀',    'lights')}
      {layerBtn('green',  'Gazon 3D 🌿',   'grass')}
      {layerBtn('gray',   'Ombres',        'shadows')}
      {layerBtn('cyan',   'LiDAR scan',    'lidar')}
      {layers.lidar && b0('cyan',
        ['Photo', 'Filaire', 'Points', 'Hauteur'][lidarMode] + ' →',
        onCycleLidar)}
      {layers.lidar && b0('cyan',
        `Opacité ${Math.round(lidarOpacity * 100)}%`,
        onToggleLidarOpacity)}
      {layerBtn('red',    'Murs rouges',   'redWalls')}
      {layerBtn('teal',   'Monde réel 🌍', 'realWorld')}
      {layerBtn('yellow', 'Soleil réel ☀', 'realSun')}
      {layerBtn('green',  'Surfaces m²',   'surface')}
      <div style={{ padding: '6px 8px 6px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontSize: 9, color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>🎨 Rendu</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: isMobile ? 6 : 3 }}>
          {RENDER_STYLES.map(({ key, label }) => {
            const active = renderStyle === key;
            return (
              <button
                key={key}
                onClick={() => onSetRenderStyle(key)}
                style={{
                  background: active ? 'rgba(100,150,255,0.25)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${active ? 'rgba(100,150,255,0.6)' : 'rgba(255,255,255,0.10)'}`,
                  borderRadius: 4,
                  padding: isMobile ? '8px 12px' : '3px 6px',
                  color: active ? '#88aaff' : '#888',
                  fontSize: isMobile ? 13 : 10,
                  minHeight: isMobile ? 40 : undefined,
                  cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
      {sunInfo && (
        <div style={{ padding: '3px 12px 5px', fontSize: 10, color: '#ffaa44', borderTop: '1px solid rgba(255,255,255,0.06)', opacity: 0.85 }}>
          {sunInfo.time} · {sunInfo.el > 0 ? `élév. ${sunInfo.el}°` : `sous l'horizon ${-sunInfo.el}°`}
        </div>
      )}
      <button
        style={{ ...btn(COLORS['gold'], isMobile), opacity: layers.plan ? 1 : 0.45 }}
        onClick={() => { if (!layers.plan) dispatchKey('t'); onToggleLayer('plan'); }}
      >
        Plan : {layers.plan ? 'ON' : 'OFF'}
      </button>
    </>
  );

  const FurnitureSection = (
    <>
      {b0('red', `Porte-fenêtre : ${furniture.glassDoorV2 ? 'V2 (DÉTAILLÉE)' : 'V1 (SIMPLIFIÉE)'}`,
          () => onToggleFurniture('glassDoorV2'), true)}
      {!furniture.glassDoorV2 ? (
        b0('light', `Ouverture : ${furniture.eastGlassDoor ? 'OUVERTE' : 'FERMÉE'}`,
            () => onToggleFurniture('eastGlassDoor'))
      ) : (
        <>
          {b0('light', `Battant droit : ${furniture.eastGlassDoor ? 'OUVERT' : 'FERMÉ'}`,
              () => onToggleFurniture('eastGlassDoor'))}
          {b0('light', `Battant gauche : ${furniture.glassDoorV2LeftOpen && furniture.eastGlassDoor ? 'OUVERT' : 'FERMÉ'}`,
              () => onToggleFurniture('glassDoorV2LeftOpen'))}
          {b0('light', `Volet : ${furniture.glassDoorV2ShutterPos === 0 ? 'OUVERT' : furniture.glassDoorV2ShutterPos === 100 ? 'FERMÉ' : furniture.glassDoorV2ShutterPos + '% FERMÉ'}`,
              () => onToggleFurniture('glassDoorV2ShutterPos'))}
        </>
      )}
      {b0('light', `Porte entrée : ${furniture.entryDoor ? 'OUVERTE' : 'FERMÉE'}`,
          () => onToggleFurniture('entryDoor'))}
      {b0('light', `Porte séjour : ${furniture.livingDoor ? 'OUVERTE' : 'FERMÉE'}`,
          () => onToggleFurniture('livingDoor'))}
      {b0('light', `Porte SDB : ${furniture.bathroomDoor ? 'OUVERTE' : 'FERMÉE'}`,
          () => onToggleFurniture('bathroomDoor'))}
      {b0('light', `Portes couloir : ${furniture.corrDoors ? 'OUVERTES' : 'FERMÉES'}`,
          () => onToggleFurniture('corrDoors'))}
      {b0('light', `Placard SDB : ${furniture.sdbCloset ? 'OUVERT' : 'FERMÉ'}`,
          () => onToggleFurniture('sdbCloset'))}
      {b0('light', `Meuble SDB ouest : ${furniture.cbnWest ? 'OUVERT' : 'FERMÉ'}`,
          () => onToggleFurniture('cbnWest'))}
      {b0('light', `Meuble SDB est : ${furniture.cbnEast ? 'OUVERT' : 'FERMÉ'}`,
          () => onToggleFurniture('cbnEast'))}
      {b0('light', `Meuble évier : ${furniture.cabinet ? 'OUVERT' : 'FERMÉ'}`,
          () => onToggleFurniture('cabinet'))}
      {b0('light', `Lit : ${furniture.bedStacked ? 'EMPILÉ' : 'DÉPLIÉ'}`,
          () => onToggleFurniture('bedStacked'))}
      {b0('light', `Lit canapé : ${furniture.bedSofa ? 'ON' : 'OFF'}`,
          () => onToggleFurniture('bedSofa'))}
      {b0('light', 'Lit changer position',
          () => onToggleFurniture('bedPosition'))}
      {b0('light', 'Smörkull changer position',
          () => onToggleFurniture('smorkullPos'))}
      {b0('yellow', `Lampe OLA : ${furniture.lampOn ? 'ON' : 'OFF'}`,
          () => onToggleFurniture('lampOn'))}
      {b0('yellow', `Ampoule SDB : ${furniture.lampSdb ? 'ON' : 'OFF'}`,
          () => onToggleFurniture('lampSdb'))}
      {b0('yellow', `Ampoule couloir : ${furniture.lampCouloir ? 'ON' : 'OFF'}`,
          () => onToggleFurniture('lampCouloir'))}
      {b0('red', `Drona : ${furniture.dronaRougeGlb ? 'Rouge GLB' : 'DRÖNA.glb'}`,
          () => onToggleFurniture('dronaRougeGlb'))}
      {b0('light', `Frigo compact : ${furniture.freezerOpen ? 'OUVERT' : 'FERMÉ'}`,
          () => onToggleFurniture('freezerOpen'))}
      {b0('light', `Frigo LAGAN : ${furniture.fridge ? 'OUVERT' : 'FERMÉ'}`,
          () => onToggleFurniture('fridge'))}
      {b0('yellow', `TV : ${furniture.tvOn ? 'ON' : 'OFF'}`,
          () => onToggleFurniture('tvOn'))}
      {b0('light', `Sofa accoudoir gauche : ${furniture.sofaArmLeft ? 'À PLAT' : 'LEVÉ'}`,
          () => onToggleFurniture('sofaArmLeft'))}
      {b0('light', `Sofa accoudoir droit : ${furniture.sofaArmRight ? 'À PLAT' : 'LEVÉ'}`,
          () => onToggleFurniture('sofaArmRight'))}
    </>
  );

  // ── Section Avion ─────────────────────────────────────────────────────────────

  const modelBtnStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    background: active ? 'rgba(68,136,255,0.25)' : 'rgba(255,255,255,0.06)',
    border: `1px solid ${active ? 'rgba(68,136,255,0.6)' : 'rgba(255,255,255,0.12)'}`,
    borderRadius: 4,
    padding: isMobile ? '8px 4px' : '4px 6px',
    color: active ? '#88aaff' : '#aaa',
    fontSize: isMobile ? 12 : 10,
    minHeight: isMobile ? 40 : undefined,
    cursor: 'pointer',
  });

  const AvionSection = (
    <>
      {/* Lancer / quitter */}
      {b0('cyan', 'Avion ✈ F — lancer / quitter', () => dispatchKey('f'), true)}

      {/* Sélecteur de modèle */}
      <div style={{ padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontSize: 9, color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
          Modèle
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button style={modelBtnStyle(planeModel === 'paper')}  onClick={() => onSetPlaneModel('paper')}>Papier</button>
          <button style={modelBtnStyle(planeModel === 'rocket')} onClick={() => onSetPlaneModel('rocket')}>Fusée</button>
          <button style={modelBtnStyle(planeModel === 'comet')}  onClick={() => onSetPlaneModel('comet')}>Comète</button>
        </div>
      </div>

      {/* Pilote automatique */}
      <button
        style={{ ...btn(COLORS['purple'], isMobile), opacity: autopilotVisible ? 1 : 0.5 }}
        onClick={onToggleAutopilot}
      >
        Pilote auto ∞ : {autopilotVisible ? 'ON' : 'OFF'}
      </button>

      {/* Pistes d'atterrissage */}
      <button
        style={{ ...btn(COLORS['gold'], isMobile), opacity: showLandingStrips ? 1 : 0.5 }}
        onClick={onToggleLandingStrips}
      >
        Pistes 🛬 : {showLandingStrips ? 'ON' : 'OFF'}
      </button>

      {/* Info vue */}
      <div style={{
        padding: '4px 10px', fontSize: 10, color: '#666',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        [C] changer vue (cockpit / suivre / walker) pendant le vol
      </div>
    </>
  );

  // ── Rendu mobile : tab bar bottom + sheet ───────────────────────────────────

  if (isMobile) {
    const sheetOpen = activeTab !== null;
    const sheetTitle: Record<Exclude<TabKey, null>, string> = {
      views: '📷 Vues', display: '👁 Affichage',
      furniture: '🛋 Mobilier', perf: '📊 Perf',
    };
    const sheetBody: Record<Exclude<TabKey, null>, React.ReactNode> = {
      views: ViewsSection,
      display: DisplaySection,
      furniture: FurnitureSection,
      perf: <DevToolsGroups Group={Group} />,
    };

    return (
      <>
        {/* Backdrop sheet */}
        {sheetOpen && (
          <div
            onClick={() => setActiveTab(null)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(2px)', zIndex: 90,
            }}
          />
        )}

        {/* Bottom sheet */}
        {sheetOpen && activeTab !== null && (
          <div
            style={{
              position: 'fixed', left: 0, right: 0, bottom: 64,
              maxHeight: 'calc(100vh - 120px)',
              background: 'rgba(10,10,20,0.96)',
              borderTop: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '14px 14px 0 0',
              zIndex: 95,
              display: 'flex', flexDirection: 'column',
              boxShadow: '0 -8px 32px rgba(0,0,0,0.5)',
            }}
            onWheel={e => e.stopPropagation()}
          >
            {/* Sheet header */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              color: '#ddd', fontSize: 14, fontWeight: 600,
            }}>
              <span>{sheetTitle[activeTab]}</span>
              <button
                onClick={() => setActiveTab(null)}
                style={{
                  background: 'transparent', border: 'none', color: '#aaa',
                  fontSize: 26, cursor: 'pointer', lineHeight: 1,
                  padding: '0 8px', minHeight: 32, minWidth: 32,
                }}
              >×</button>
            </div>

            {/* Sheet body */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '4px 0' }}>
              {sheetBody[activeTab]}
            </div>
          </div>
        )}

        {/* Tab bar */}
        <div style={{
          position: 'fixed', left: 0, right: 0, bottom: 0,
          height: 64, zIndex: 100,
          background: 'rgba(10,10,20,0.96)',
          borderTop: '1px solid rgba(255,255,255,0.12)',
          display: 'flex',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}>
          {/* Inventaire — ouvre le modal directement */}
          <button
            onClick={onOpenInventory}
            style={{
              flex: 1, background: 'transparent',
              border: 'none', borderTop: '2px solid transparent',
              color: '#aaa',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 2, cursor: 'pointer', padding: '4px 0',
              fontSize: 10,
            }}
          >
            <span style={{ fontSize: 22, lineHeight: 1 }}>📦</span>
            <span>Inventaire</span>
          </button>
          {TABS.map(t => {
            const active = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(a => a === t.key ? null : t.key)}
                style={{
                  flex: 1, background: 'transparent',
                  border: 'none',
                  borderTop: active ? '2px solid #4488ff' : '2px solid transparent',
                  color: active ? '#88aaff' : '#aaa',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: 2, cursor: 'pointer', padding: '4px 0',
                  fontSize: 10,
                }}
              >
                <span style={{ fontSize: 22, lineHeight: 1 }}>{t.emoji}</span>
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {showViews     && <ViewsModal     onClose={() => setShowViews(false)} />}
        {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
      </>
    );
  }

  // ── Rendu desktop : sidebar accordéon (inchangé) ────────────────────────────

  return (
    <>
      <div style={desktopPanelStyle} onWheel={e => e.stopPropagation()}>

        {/* ── Inventaire ── */}
        <div style={grpStyle}>
          <button
            style={{ ...grpHeaderStyle, width: '100%', border: 'none', cursor: 'pointer' }}
            onClick={onOpenInventory}
          >
            <span>📦 Inventaire</span>
            <span style={{ fontSize: 9 }}>▶</span>
          </button>
        </div>

        {/* ── Dev Tools / Perf ── */}
        <DevToolsGroups Group={Group} />

        <Group emoji="📷" title="Vues">{ViewsSection}</Group>
        <Group emoji="✈" title="Avion">{AvionSection}</Group>
        <Group emoji="👁" title="Affichage">{DisplaySection}</Group>
        <Group emoji="🛋" title="Mobilier">{FurnitureSection}</Group>

      </div>

      {showViews     && <ViewsModal     onClose={() => setShowViews(false)} />}
      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
    </>
  );
}
