import { useSceneStore } from '../../store/useSceneStore';
import { dispatchKey, dispatchView } from '../types';

export interface ViewsSectionProps {
  isMobile: boolean;
  onOpenShortcuts: () => void;
  onToggleHideUI?: () => void;
}

const CAMERA_PRESETS = [
  { label: 'Perspective', key: 'perspective' },
  { label: 'Dessus', key: 'top' },
  { label: 'Dessus 3D', key: 'top3d' },
  { label: 'Face', key: 'front' },
  { label: 'Arrière', key: 'back' },
  { label: 'Gauche', key: 'left' },
  { label: 'Droite', key: 'right' },
  { label: 'Iso Sud-Est', key: 'iso-se' },
  { label: 'Iso Nord-Ouest', key: 'iso-nw' },
  { label: 'Iso Nord-Est', key: 'iso-ne' },
  { label: 'Iso Sud-Ouest', key: 'iso-sw' },
  { label: 'Dessous', key: 'bottom', fullWidth: true },
];

export function ViewsSection({
  isMobile: _isMobile,
  onOpenShortcuts,
  onToggleHideUI,
}: ViewsSectionProps) {
  const measurementActive = useSceneStore(state => state.measurementActive);
  const setMeasurementActive = useSceneStore(state => state.setMeasurementActive);
  const cameraMode = useSceneStore(state => state.cameraMode);
  const cameraProjection = useSceneStore(state => state.cameraProjection);
  const activeCameraView = useSceneStore(state => state.activeCameraView);
  const toggleCameraProjection = useSceneStore(state => state.toggleCameraProjection);
  const fpvRealisticEyes = useSceneStore(state => state.layers.fpvRealisticEyes ?? true);
  const fpvStabilization = useSceneStore(state => state.layers.fpvStabilization ?? true);
  const fpvStabilizationFactor = useSceneStore(state => state.layers.fpvStabilizationFactor ?? 0.7);

  const b0 = (_color: string, label: string, onClick: () => void) => {
    return (
      <button 
        className="btn btn-sm btn-light w-100 text-start rounded-0 border-0 border-bottom py-2 px-3 text-dark bg-transparent small"
        onClick={onClick}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="d-flex flex-column bg-transparent">
      <button
        className="btn btn-sm btn-warning text-dark w-100 text-start rounded-0 border-0 border-bottom py-2 px-3 fw-bold d-flex align-items-center justify-content-between shadow-sm small"
        onClick={() => useSceneStore.getState().setPhotoModeOpen(true)}
        style={{
          background: 'linear-gradient(90deg, #ffc107 0%, #ffca2c 100%)',
        }}
        title="Prendre une photo au Raytracing Ultra-Réaliste (Touche F10)"
      >
        <span className="d-flex align-items-center gap-2">
          <span>📸 Photo Raytracing HD</span>
        </span>
        <kbd className="bg-dark text-white border-0 px-1 rounded font-monospace small">F10</kbd>
      </button>
      {b0('gray',   'Cycle caméra (Orbit → NPC Grid → Follow → FPV, raccourci O)', () => dispatchKey('o'))}
      <button
        className="btn btn-sm btn-light w-100 text-start rounded-0 border-0 border-bottom py-2 px-3 text-dark d-flex align-items-center justify-content-between bg-transparent small"
        onClick={toggleCameraProjection}
        title="Basculer entre la projection Perspective (conique 3D) et Orthographique (parallèle / isométrique)"
      >
        <span className="d-flex align-items-center gap-2">
          <span>{cameraProjection === 'ortho' ? '📐 Projection Orthographique' : '👁️ Projection Perspective'}</span>
        </span>
        <span className={`badge ${cameraProjection === 'ortho' ? 'bg-primary' : 'bg-secondary'}`}>
          {cameraProjection === 'ortho' ? 'ORTHO' : 'PERSP'}
        </span>
      </button>
      {b0('gray',   'Vue 3ème personne (3 / M)', () => dispatchKey('3'))}
      {b0('gray',   'Vue FPV (1 / M)',           () => dispatchKey('1'))}
      {cameraMode === 'fpv' && (
        <button
          className="btn btn-sm btn-light w-100 text-start rounded-0 border-0 border-bottom py-2 px-3 text-dark d-flex align-items-center justify-content-between bg-transparent small"
          onClick={() => {
            useSceneStore.setState(st => ({
              layers: { ...st.layers, fpvRealisticEyes: !st.layers.fpvRealisticEyes }
            }));
          }}
          title="Positionne la caméra au centre des yeux du personnage et suit fidèlement les mouvements de la tête"
        >
          <span>👁️ Caméra Yeux Réaliste</span>
          <span className={`badge ${fpvRealisticEyes ? 'bg-info text-dark' : 'bg-secondary'}`}>
            {fpvRealisticEyes ? 'ACTIVE' : 'DÉSACTIVÉE'}
          </span>
        </button>
      )}
      {cameraMode === 'fpv' && fpvRealisticEyes && (
        <button
          className="btn btn-sm btn-light w-100 text-start rounded-0 border-0 border-bottom py-1 px-3 text-dark d-flex align-items-center justify-content-between bg-transparent small"
          onClick={() => {
            useSceneStore.setState(st => ({
              layers: { ...st.layers, fpvStabilization: !(st.layers.fpvStabilization ?? true) }
            }));
          }}
          title="Amortit les secousses et saccades de la tête"
        >
          <span className="ps-2">⚖️ Stabilisation ({Math.round(fpvStabilizationFactor * 100)}%)</span>
          <span className={`badge ${fpvStabilization ? 'bg-info text-dark' : 'bg-secondary'}`}>
            {fpvStabilization ? 'ACTIVE' : 'OFF'}
          </span>
        </button>
      )}
      {b0('gray',   '2D Dessus (Raccourci T)',         () => dispatchKey('t'))}
      {b0('gray',   '2D Suivi Perso (Raccourci Y)',    () => dispatchKey('y'))}
      {(cameraMode === 'top' || (cameraMode === 'orbit' && activeCameraView === 'top')) && (
        <button
          className="btn btn-sm btn-light w-100 text-start rounded-0 border-0 border-bottom py-2 px-3 text-dark d-flex align-items-center justify-content-between bg-transparent small"
          onClick={() => setMeasurementActive(!measurementActive)}
        >
          <span>📏 Prise de mesure</span>
          <span className={`badge ${measurementActive ? 'bg-danger' : 'bg-secondary'}`}>
            {measurementActive ? 'ACTIVE' : 'DÉSACTIVÉE'}
          </span>
        </button>
      )}
      {b0('cyan',   'Avion ✈ (Raccourci F)',           () => dispatchKey('f'))}
      {onToggleHideUI && b0('dark',   'Masquer l\'interface 2D (Raccourci 0)', onToggleHideUI)}
      {/* ── Angles de Caméra ── */}
      <div className="p-2 border-bottom bg-transparent d-flex flex-column gap-1">
        <div className="text-muted fw-bold small text-uppercase" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>
          📷 Angles Caméra
        </div>
        <div className="row g-1">
          {CAMERA_PRESETS.map(preset => {
            const isActive = cameraMode === 'orbit' && activeCameraView === preset.key;
            return (
              <div key={preset.key} className={preset.fullWidth ? 'col-12' : 'col-6'}>
                <button
                  type="button"
                  className={`btn btn-sm w-100 py-1 px-2 text-truncate small ${
                    isActive ? 'btn-info fw-bold text-dark' : 'btn-outline-secondary'
                  }`}
                  onClick={() => dispatchView(preset.key)}
                >
                  {preset.label}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {b0('teal',   'Raccourcis clavier ⌨',             onOpenShortcuts)}
    </div>
  );
}
