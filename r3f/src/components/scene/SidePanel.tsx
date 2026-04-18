/**
 * SidePanel.tsx — menu latéral, port de lego-room.html + js/ui/events.js.
 *
 * Composant HTML pur rendu HORS du Canvas R3F.
 * Dispatche des events custom écoutés par CameraController.
 *
 * Sections :
 *   📷 Vues      — presets caméra + POV 1.8m
 *   🛋 Mobilier  — toggles portes / meubles (état partagé via props callbacks)
 */
import { useState, useCallback } from 'react';
import { DevToolsGroups } from './DevToolsOverlay';

import {
  ROOM_W, ROOM_D, WALL_H,
  DOOR_START, NICHE_DEPTH, KITCHEN_Z,
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
  bathroom: { x: (-NICHE_DEPTH + DOOR_START) / 2,  z: (KITCHEN_Z + 600) / 2 },
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

// ── Styles ────────────────────────────────────────────────────────────────────

const panelStyle: React.CSSProperties = {
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

function btn(color: string): React.CSSProperties {
  return {
    background: 'transparent', border: 'none',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 0, padding: '6px 12px', cursor: 'pointer',
    fontSize: 12, width: '100%', textAlign: 'left', display: 'block',
    whiteSpace: 'nowrap', color,
  };
}

const COLORS: Record<string, string> = {
  gray: '#aaa', white: '#fff', light: '#f0f0f0',
  tan: '#e8c39e', yellow: '#ffd700', green: '#88cc88',
  blue: '#4488ff', peach: '#ff9966', purple: '#aa88ff',
  gold: '#ffaa44', teal: '#66cccc', cyan: '#44ddff',
  red: '#ff6644',
};

// ── Groupe accordéon ──────────────────────────────────────────────────────────

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

// ── Bouton toggle générique ───────────────────────────────────────────────────

function ToggleBtn({ label, onLabel, color, value, onToggle, first = false }: {
  label: string; onLabel?: string; color: string;
  value: boolean; onToggle: () => void; first?: boolean;
}) {
  const s = { ...btn(COLORS[color] ?? color) };
  if (first) s.borderTop = 'none';
  return (
    <button style={s} onClick={onToggle}>
      {value ? (onLabel ?? label) : label}
    </button>
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
    borderRadius: 10, padding: '16px 20px', minWidth: 200,
    display: 'flex', flexDirection: 'column', gap: 6,
  };
  const mBtn = (label: string, onClick: () => void): React.CSSProperties => ({
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 6, padding: '6px 14px', cursor: 'pointer',
    color: '#ddd', fontSize: 12, textAlign: 'left',
  });
  const label: React.CSSProperties = {
    color: '#888', fontSize: 10, textTransform: 'uppercase',
    letterSpacing: '0.5px', marginTop: 6,
  };
  const close: React.CSSProperties = {
    alignSelf: 'flex-end', background: 'transparent', border: 'none',
    color: '#aaa', fontSize: 18, cursor: 'pointer', lineHeight: 1,
  };

  const viewBtn = (lbl: string, key: string) => (
    <button style={mBtn(lbl, () => {})} onClick={() => { dispatchView(key); onClose(); }}>{lbl}</button>
  );
  const povBtn = (lbl: string, key: string) => (
    <button style={mBtn(lbl, () => {})} onClick={() => { dispatchPov(key); onClose(); }}>{lbl}</button>
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

// ── Composant principal ───────────────────────────────────────────────────────

export interface FurnitureState {
  eastDoor:     boolean;
  entryDoor:    boolean;
  livingDoor:   boolean;
  bathroomDoor: boolean;
  corrDoors:    boolean;
  sdbCloset:    boolean;
  cbnWest:      boolean;
  cbnEast:      boolean;
  freezer:      boolean;
  fridge:       boolean;
  cabinet:      boolean;
  wcLid:        boolean;
  bedStacked:   boolean;
  bedSofa:      boolean;
  bedPosition:  boolean;
  smorkullPos:  boolean;
  lampOn:       boolean;
}

export interface LayerState {
  structure: boolean;
  equipment: boolean;
  furniture: boolean;
  glb:       boolean;
  neighbors:  boolean;
  xray:       boolean;
  mirrorsHD:  boolean;
  plan:         boolean;
  grid:         boolean;
  dronaLabels:  boolean;
  skeleton:     boolean;
  redWalls:     boolean;
  lidar:        boolean;
}

export interface SidePanelProps {
  furniture:       FurnitureState;
  onToggleFurniture: (key: keyof FurnitureState) => void;
  layers:          LayerState;
  onToggleLayer:   (key: keyof LayerState) => void;
}

export type LidarMode = 0 | 1 | 2 | 3;

export interface SidePanelProps2 extends SidePanelProps {
  onOpenInventory:  () => void;
  lidarMode:        LidarMode;
  onCycleLidar:     () => void;
  lidarOpacity:     number;
  onToggleLidarOpacity: () => void;
}

export function SidePanel({ furniture, onToggleFurniture, layers, onToggleLayer, onOpenInventory, lidarMode, onCycleLidar, lidarOpacity, onToggleLidarOpacity }: SidePanelProps2) {
  const [showViews, setShowViews] = useState(false);

  const b0 = (color: string, label: string, onClick: () => void, first = false) => {
    const s = { ...btn(COLORS[color] ?? color) };
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
    const s = { ...btn(COLORS[color] ?? color) };
    if (first) s.borderTop = 'none';
    if (!on) s.opacity = 0.45;
    return (
      <button style={s} onClick={() => onToggleLayer(key)}>
        {label} : {on ? 'ON' : 'OFF'}
      </button>
    );
  };

  return (
    <>
      <div style={panelStyle} onWheel={e => e.stopPropagation()}>

        {/* ── Vues ── */}
        <Group emoji="📷" title="Vues" defaultOpen>
          {b0('gray',   'Perspective P', () => dispatchKey('p'), true)}
          {b0('gray',   'Walk M',        () => dispatchKey('m'))}
          {b0('gray',   '2D Dessus T',   () => dispatchKey('t'))}
          {b0('yellow', 'Autres vues…',  () => setShowViews(true))}
        </Group>

        {/* ── Affichage ── */}
        <Group emoji="👁" title="Affichage">
          {layerBtn('green',  'Structure',   'structure', true)}
          {layerBtn('peach',  'Équipements', 'equipment')}
          {layerBtn('purple', 'Mobilier',    'furniture')}
          {layerBtn('gold',   'GLB',         'glb')}
          {layerBtn('blue',   'Voisins',     'neighbors')}
          {layerBtn('cyan',   'X-Ray',       'xray')}
          {layerBtn('purple', 'Miroirs HD',  'mirrorsHD')}
          {layerBtn('teal',   'Grille',      'grid')}
          {layerBtn('red',    'N° Drona',   'dronaLabels')}
          {layerBtn('white',  'Squelette',  'skeleton')}
          {layerBtn('cyan',   'LiDAR scan', 'lidar')}
          {layers.lidar && b0('cyan',
            ['Photo', 'Filaire', 'Points', 'Hauteur'][lidarMode] + ' →',
            onCycleLidar)}
          {layers.lidar && b0('cyan',
            `Opacité ${Math.round(lidarOpacity * 100)}%`,
            onToggleLidarOpacity)}
          <button
            style={{ ...btn(COLORS['gold']), opacity: layers.plan ? 1 : 0.45 }}
            onClick={() => { if (!layers.plan) dispatchKey('t'); onToggleLayer('plan'); }}
          >
            Plan : {layers.plan ? 'ON' : 'OFF'}
          </button>
        </Group>

        {/* ── Mobilier ── */}
        <Group emoji="🛋" title="Mobilier">
          {b0('light', `Porte-fenêtre : ${furniture.eastDoor ? 'OUVERTE' : 'FERMÉE'}`,
              () => onToggleFurniture('eastDoor'), true)}
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
          {b0('light', `Congélateur : ${furniture.freezer ? 'OUVERT' : 'FERMÉ'}`,
              () => onToggleFurniture('freezer'))}
          {b0('light', `Réfrigérateur : ${furniture.fridge ? 'OUVERT' : 'FERMÉ'}`,
              () => onToggleFurniture('fridge'))}
          {b0('light', `Meuble évier : ${furniture.cabinet ? 'OUVERT' : 'FERMÉ'}`,
              () => onToggleFurniture('cabinet'))}
          {b0('light', `WC abattant : ${furniture.wcLid ? 'OUVERT' : 'FERMÉ'}`,
              () => onToggleFurniture('wcLid'))}
          {b0('light', `Lit : ${furniture.bedStacked ? 'EMPILÉ' : 'DÉPLIÉ'}`,
              () => onToggleFurniture('bedStacked'))}
          {b0('light', `Lit canapé : ${furniture.bedSofa ? 'ON' : 'OFF'}`,
              () => onToggleFurniture('bedSofa'))}
          {b0('light', 'Lit changer position',
              () => onToggleFurniture('bedPosition'))}
          {b0('light', 'Smörkull changer position',
              () => onToggleFurniture('smorkullPos'))}
          {layerBtn('red', 'Murs rouges', 'redWalls')}
          {b0('yellow', `Lampe OLA : ${furniture.lampOn ? 'ON' : 'OFF'}`,
              () => onToggleFurniture('lampOn'))}
        </Group>

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

        {/* ── Dev Tools ── */}
        <DevToolsGroups Group={Group} />

      </div>

      {showViews && <ViewsModal onClose={() => setShowViews(false)} />}
    </>
  );
}
