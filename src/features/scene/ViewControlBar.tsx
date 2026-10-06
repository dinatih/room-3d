import { useSceneStore } from './store/useSceneStore';
import { dispatchView } from './sidepanel/types';
import { getLaraGridCameraView } from './character/laraGridUtils';

// ── Presets groupés ────────────────────────────────────────────────────────

const ORTHO_VIEWS = [
  { key: 'front',  label: 'Face',     shortcut: 'Alt+1', bi: 'bi-arrow-up' },
  { key: 'back',   label: 'Arrière',  shortcut: 'Alt+2', bi: 'bi-arrow-down' },
  { key: 'left',   label: 'Gauche',   shortcut: 'Alt+3', bi: 'bi-arrow-left' },
  { key: 'right',  label: 'Droite',   shortcut: 'Alt+4', bi: 'bi-arrow-right' },
] as const;

const EXTRA_VIEWS = [
  { key: 'top',    label: 'Dessus',   shortcut: 'Alt+5', bi: 'bi-chevron-compact-up' },
  { key: 'bottom', label: 'Dessous',  shortcut: 'Alt+6', bi: 'bi-chevron-compact-down' },
] as const;

const ISO_VIEWS = [
  { key: 'iso-se', label: 'ISO SE',  shortcut: 'Alt+7', bi: 'bi-arrow-down-right' },
  { key: 'iso-sw', label: 'ISO SW',  shortcut: 'Alt+8', bi: 'bi-arrow-down-left' },
  { key: 'iso-ne', label: 'ISO NE',  shortcut: 'Alt+9', bi: 'bi-arrow-up-right' },
  { key: 'iso-nw', label: 'ISO NW',  shortcut: 'Alt+0', bi: 'bi-arrow-up-left' },
] as const;

// ── Composant ──────────────────────────────────────────────────────────────

export interface ViewControlBarProps {
  /** Position du dock flottant. Ignoré quand inline=true. Défaut : 'bottom-center' */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'bottom-center';
  /** Rendu dans le flux du document (pas position:fixed) */
  inline?: boolean;
  /** Masquer le composant (ex: mode immersif) */
  hidden?: boolean;
  /** Afficher les commandes Follow et FPV de la scène principale */
  showCharacterModes?: boolean;
  /** Actions propres à la scène principale */
  hideUI?: boolean;
  onToggleHideUI?: () => void;
  onEnterFlight?: () => void;
}

export function ViewControlBar({
  position = 'bottom-center', inline = false, hidden = false, showCharacterModes = false,
  hideUI = false, onToggleHideUI, onEnterFlight,
}: ViewControlBarProps) {
  const cameraProjection = useSceneStore(s => s.cameraProjection);
  const cameraMode = useSceneStore(s => s.cameraMode);
  const npcGridActive = useSceneStore(s => s.layers.laraGrid);
  const activeCameraView = useSceneStore(s => s.activeCameraView);
  const toggleCameraProjection = useSceneStore(s => s.toggleCameraProjection);

  if (hidden) return null;

  const isOrtho = cameraProjection === 'ortho';

  const posStyle: React.CSSProperties | undefined = inline ? undefined : {
    'top-left':     { top: 12, left: 12 },
    'top-right':    { top: 12, right: 12 },
    'bottom-left':  { bottom: 12, left: 12 },
    'bottom-right': { bottom: 12, right: 12 },
    'bottom-center':{ bottom: 12, left: '50%', transform: 'translateX(-50%)' },
  }[position];

  const isActive = (key: string) => activeCameraView === key;
  const dispatchCameraMode = (mode: 'toggle-follow' | 'fpv' | 'orbit' | 'toggle-npc-grid') => {
    document.dispatchEvent(new CustomEvent('camera-mode', { detail: mode }));
  };

  const viewButton = (
    v: { key: string; label: string; shortcut: string; bi: string },
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
      onClick={() => dispatchView(v.key, npcGridActive ? getLaraGridCameraView().target : undefined)}
      title={`${v.label} (${v.shortcut})`}
      aria-label={`${v.label} (${v.shortcut})`}
    >
      <i className={`bi ${v.bi}`} style={{ fontSize: '14px' }} />
    </button>
  );

  const bar = (
    <div
      className="d-flex align-items-center gap-1 px-2 py-1 rounded-3 shadow"
      style={{
        background: 'rgba(30, 30, 46, 0.88)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.12)',
      }}
    >
      {showCharacterModes && <>
        <button
          type="button"
          className="btn btn-sm border-0 d-flex align-items-center justify-content-center text-white"
          style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '8px', padding: '4px 8px' }}
          onClick={onToggleHideUI}
          title={`${hideUI ? 'Afficher' : 'Masquer'} l'interface 2D (0)`}
          aria-label={`${hideUI ? 'Afficher' : 'Masquer'} l'interface 2D (0)`}
        >
          <i className={`bi ${hideUI ? 'bi-eye' : 'bi-eye-slash'}`} />
        </button>
      </>}

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
        title={`${isOrtho ? 'Basculer en Perspective (3D conique)' : 'Basculer en Orthographique (isométrique)'} (P)`}
      >
        <i className={`bi ${isOrtho ? 'bi-easel2' : 'bi-eye'}`} style={{ fontSize: '13px' }} />
        <span>{isOrtho ? 'ORTHO' : 'PERSP'}</span>
      </button>

      {showCharacterModes && <>
        <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.15)' }} />
        <button
          className={`btn btn-sm border-0 d-flex align-items-center gap-1 ${cameraMode === 'orbit' ? 'fw-bold' : ''}`}
          style={{
            background: cameraMode === 'orbit' ? 'rgba(251,191,36,0.9)' : 'rgba(255,255,255,0.08)',
            color: cameraMode === 'orbit' ? '#1a1a2e' : 'rgba(255,255,255,0.8)',
            fontSize: '11px', borderRadius: '8px', padding: '4px 8px',
          }}
          onClick={() => dispatchCameraMode('orbit')}
          title="Revenir à la caméra Orbit (O : Orbit → NPC Grid → Follow → FPV → Orbit)"
          aria-pressed={cameraMode === 'orbit'}
        >
          <i className="bi bi-globe2" />
          <span>ORBIT</span>
        </button>
        <button
          className={`btn btn-sm border-0 d-flex align-items-center gap-1 ${npcGridActive ? 'fw-bold' : ''}`}
          style={{
            background: npcGridActive ? 'rgba(14,165,233,0.9)' : 'rgba(255,255,255,0.08)',
            color: npcGridActive ? '#1a1a2e' : 'rgba(255,255,255,0.8)',
            fontSize: '11px', borderRadius: '8px', padding: '4px 8px',
          }}
          onClick={() => dispatchCameraMode('toggle-npc-grid')}
          title="Afficher ou quitter la grille des PNJ (G ; O : Orbit → NPC Grid → Follow → FPV → Orbit)"
          aria-pressed={npcGridActive}
        >
          <i className="bi bi-grid-3x3-gap-fill" />
          <span>NPC GRID</span>
        </button>
        <button
          className={`btn btn-sm border-0 d-flex align-items-center gap-1 ${cameraMode === 'follow' ? 'fw-bold' : ''}`}
          style={{
            background: cameraMode === 'follow' ? 'rgba(52,211,153,0.9)' : 'rgba(255,255,255,0.08)',
            color: cameraMode === 'follow' ? '#1a1a2e' : 'rgba(255,255,255,0.8)',
            fontSize: '11px', borderRadius: '8px', padding: '4px 8px',
          }}
          onClick={() => dispatchCameraMode('toggle-follow')}
          title="Activer ou quitter le suivi à la troisième personne (M : Follow ↔ FPV ; O : Orbit → NPC Grid → Follow → FPV → Orbit)"
          aria-pressed={cameraMode === 'follow'}
        >
          <i className="bi bi-person-walking" />
          <span>FOLLOW</span>
        </button>
        <button
          className={`btn btn-sm border-0 d-flex align-items-center gap-1 ${cameraMode === 'fpv' ? 'fw-bold' : ''}`}
          style={{
            background: cameraMode === 'fpv' ? 'rgba(56,189,248,0.9)' : 'rgba(255,255,255,0.08)',
            color: cameraMode === 'fpv' ? '#1a1a2e' : 'rgba(255,255,255,0.8)',
            fontSize: '11px', borderRadius: '8px', padding: '4px 8px',
          }}
          onClick={() => dispatchCameraMode('fpv')}
          title="Passer en vue subjective FPV (M : Follow ↔ FPV ; O : Orbit → NPC Grid → Follow → FPV → Orbit)"
          aria-pressed={cameraMode === 'fpv'}
        >
          <i className="bi bi-eye-fill" />
          <span>FPV</span>
        </button>
      </>}

      {showCharacterModes && <>
        <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.15)' }} />
        <button
          type="button"
          className="btn btn-sm border-0 d-flex align-items-center justify-content-center text-white"
          style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '8px', padding: '4px 8px' }}
          onClick={onEnterFlight}
          title="Activer le mode avion (F)"
          aria-label="Activer le mode avion (F)"
        >
          <i className="bi bi-airplane-fill" />
        </button>
        <button
          type="button"
          className="btn btn-sm border-0 d-flex align-items-center gap-1 text-white"
          style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '8px', padding: '4px 8px', fontSize: '11px' }}
          onClick={() => useSceneStore.getState().setPhotoModeOpen(true)}
          title="Ouvrir le mode photo Raytracing (F10)"
        >
          <i className="bi bi-camera-fill" />
          <span>Raytracing</span>
        </button>
        <button
          type="button"
          className="btn btn-sm border-0 d-flex align-items-center justify-content-center text-white"
          style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '8px', padding: '4px 8px' }}
          onClick={() => window.dispatchEvent(new Event('open-shortcuts-modal'))}
          title="Afficher tous les raccourcis clavier"
          aria-label="Afficher tous les raccourcis clavier"
        >
          <i className="bi bi-keyboard-fill" />
        </button>
      </>}

      <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.15)' }} />

      {ORTHO_VIEWS.map(v => viewButton(v, 'rgba(56,189,248,0.85)'))}

      <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.15)' }} />

      {EXTRA_VIEWS.map(v => viewButton(v, 'rgba(52,211,153,0.85)'))}

      <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.15)' }} />

      {ISO_VIEWS.map(v => viewButton(v, 'rgba(168,85,247,0.85)'))}
    </div>
  );

  if (inline) {
    return (
      <div
        className="d-flex justify-content-center py-2"
        style={{ background: 'rgba(30, 30, 46, 0.95)' }}
      >
        {bar}
      </div>
    );
  }

  return (
    <div
      style={{ position: 'fixed', zIndex: 1000, ...posStyle }}
      className="d-flex flex-column align-items-center gap-1"
    >
      {bar}
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
