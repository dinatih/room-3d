import { useSceneStore } from './store/useSceneStore';
import { dispatchView } from './sidepanel/types';

// ── Presets groupés ────────────────────────────────────────────────────────

const ORTHO_VIEWS = [
  { key: 'front',  label: 'Face',     bi: 'bi-arrow-up' },
  { key: 'back',   label: 'Arrière',  bi: 'bi-arrow-down' },
  { key: 'left',   label: 'Gauche',   bi: 'bi-arrow-left' },
  { key: 'right',  label: 'Droite',   bi: 'bi-arrow-right' },
] as const;

const EXTRA_VIEWS = [
  { key: 'top',    label: 'Dessus',   bi: 'bi-chevron-compact-up' },
  { key: 'bottom', label: 'Dessous',  bi: 'bi-chevron-compact-down' },
] as const;

const ISO_VIEWS = [
  { key: 'iso-se', label: 'ISO SE',  bi: 'bi-arrow-down-right' },
  { key: 'iso-sw', label: 'ISO SW',  bi: 'bi-arrow-down-left' },
  { key: 'iso-ne', label: 'ISO NE',  bi: 'bi-arrow-up-right' },
  { key: 'iso-nw', label: 'ISO NW',  bi: 'bi-arrow-up-left' },
] as const;

// ── Composant ──────────────────────────────────────────────────────────────

export interface ViewControlBarProps {
  /** Position du dock flottant. Défaut : 'bottom-center' */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'bottom-center';
  /** Masquer le composant (ex: mode immersif) */
  hidden?: boolean;
}

export function ViewControlBar({ position = 'bottom-center', hidden = false }: ViewControlBarProps) {
  const cameraProjection = useSceneStore(s => s.cameraProjection);
  const activeCameraView = useSceneStore(s => s.activeCameraView);
  const toggleCameraProjection = useSceneStore(s => s.toggleCameraProjection);

  if (hidden) return null;

  const isOrtho = cameraProjection === 'ortho';

  const posStyle: React.CSSProperties = {
    'top-left':     { top: 12, left: 12 },
    'top-right':    { top: 12, right: 12 },
    'bottom-left':  { bottom: 12, left: 12 },
    'bottom-right': { bottom: 12, right: 12 },
    'bottom-center':{ bottom: 12, left: '50%', transform: 'translateX(-50%)' },
  }[position];

  const isActive = (key: string) => activeCameraView === key;

  const viewButton = (
    v: { key: string; label: string; bi: string },
    activeColor: string,
  ) => (
    <button
      key={v.key}
      className="btn btn-sm border-0 d-flex align-items-center justify-content-center"
      style={{
        background: isActive(v.key) ? activeColor : 'rgba(255,255,255,0.08)',
        color: isActive(v.key) ? '#1a1a2e' : 'rgba(255,255,255,0.8)',
        fontSize: '11px',
        borderRadius: '8px',
        padding: '4px 8px',
        minWidth: 32,
        fontWeight: isActive(v.key) ? 700 : 400,
        transition: 'all 0.15s ease',
      }}
      onClick={() => dispatchView(v.key)}
      title={v.label}
    >
      <i className={`bi ${v.bi}`} style={{ fontSize: '14px' }} />
    </button>
  );

  return (
    <div
      style={{
        position: 'fixed',
        zIndex: 1000,
        ...posStyle,
      }}
      className="d-flex flex-column align-items-center gap-1"
    >
      {/* ── Barre principale ── */}
      <div
        className="d-flex align-items-center gap-1 px-2 py-1 rounded-3 shadow"
        style={{
          background: 'rgba(30, 30, 46, 0.88)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.12)',
        }}
      >
        {/* Toggle Persp / Ortho */}
        <button
          className="btn btn-sm border-0 d-flex align-items-center gap-1 fw-bold"
          style={{
            background: isOrtho ? 'rgba(99,102,241,0.85)' : 'rgba(251,191,36,0.85)',
            color: isOrtho ? '#fff' : '#1a1a2e',
            fontSize: '11px',
            borderRadius: '8px',
            padding: '4px 10px',
          }}
          onClick={toggleCameraProjection}
          title={isOrtho ? 'Basculer en Perspective (3D conique)' : 'Basculer en Orthographique (isométrique)'}
        >
          <i className={`bi ${isOrtho ? 'bi-easel2' : 'bi-eye'}`} style={{ fontSize: '13px' }} />
          <span>{isOrtho ? 'ORTHO' : 'PERSP'}</span>
        </button>

        {/* Séparateur */}
        <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.15)' }} />

        {/* Vues orthographiques (face / arrière / gauche / droite) */}
        {ORTHO_VIEWS.map(v => viewButton(v, 'rgba(56,189,248,0.85)'))}

        {/* Séparateur */}
        <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.15)' }} />

        {/* Dessus / Dessous */}
        {EXTRA_VIEWS.map(v => viewButton(v, 'rgba(52,211,153,0.85)'))}

        {/* Séparateur */}
        <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.15)' }} />

        {/* Vues isométriques (4 coins) */}
        {ISO_VIEWS.map(v => viewButton(v, 'rgba(168,85,247,0.85)'))}
      </div>

      {/* Label de la vue active */}
      {activeCameraView && (
        <span
          style={{
            fontSize: '10px',
            color: 'rgba(255,255,255,0.5)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            pointerEvents: 'none',
          }}
        >
          {activeCameraView === 'iso-se' ? 'ISO Sud-Est'
            : activeCameraView === 'iso-sw' ? 'ISO Sud-Ouest'
            : activeCameraView === 'iso-ne' ? 'ISO Nord-Est'
            : activeCameraView === 'iso-nw' ? 'ISO Nord-Ouest'
            : activeCameraView === 'front' ? 'Face'
            : activeCameraView === 'back' ? 'Arrière'
            : activeCameraView === 'left' ? 'Gauche'
            : activeCameraView === 'right' ? 'Droite'
            : activeCameraView === 'perspective' ? 'Perspective'
            : activeCameraView === 'top' ? 'Dessus'
            : activeCameraView === 'bottom' ? 'Dessous'
            : activeCameraView}
        </span>
      )}
    </div>
  );
}