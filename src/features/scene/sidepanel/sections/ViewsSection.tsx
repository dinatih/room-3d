import { useSceneStore } from '../../store/useSceneStore';
import { dispatchKey, dispatchView, dispatchPov } from '../types';

export interface ViewsSectionProps {
  isMobile: boolean;
  onOpenShortcuts: () => void;
  onToggleHideUI?: () => void;
}

const CAMERA_PRESETS = [
  { label: 'Perspective', key: 'perspective' },
  { label: 'Dessus 3D', key: 'top3d' },
  { label: 'Face (D)', key: 'front' },
  { label: 'Arrière (C)', key: 'back' },
  { label: 'Gauche (A)', key: 'left' },
  { label: 'Droite (B)', key: 'right' },
  { label: 'Iso Sud-Est', key: 'iso-se' },
  { label: 'Iso Nord-Ouest', key: 'iso-nw' },
  { label: 'Dessus/Dessous', key: 'bottom', fullWidth: true },
];

const POV_PRESETS = [
  { label: 'Séjour', key: 'living' },
  { label: 'Entrée', key: 'entry' },
  { label: "Salle d'eau", key: 'bathroom' },
  { label: 'Jardin', key: 'garden' },
];

export function ViewsSection({
  isMobile: _isMobile,
  onOpenShortcuts,
  onToggleHideUI,
}: ViewsSectionProps) {
  const measurementActive = useSceneStore(state => state.measurementActive);
  const setMeasurementActive = useSceneStore(state => state.setMeasurementActive);
  const cameraMode = useSceneStore(state => state.cameraMode);
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
      {b0('gray',   'Perspective / Orbit (Raccourci O)', () => dispatchKey('o'))}
      {b0('gray',   'Walk générique (Raccourci M)',    () => dispatchKey('m'))}
      {b0('gray',   'Vue 3ème personne (Raccourci 3)', () => dispatchKey('3'))}
      {b0('gray',   'Vue FPV 1ère pers. (Raccourci 1)',() => dispatchKey('1'))}
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
      {cameraMode === 'top' && (
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
          {CAMERA_PRESETS.map(preset => (
            <div key={preset.key} className={preset.fullWidth ? 'col-12' : 'col-6'}>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary w-100 py-1 px-2 text-truncate small"
                onClick={() => dispatchView(preset.key)}
              >
                {preset.label}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Points de Vue (POV 1.8m) ── */}
      <div className="p-2 border-bottom bg-transparent d-flex flex-column gap-1">
        <div className="text-muted fw-bold small text-uppercase" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>
          🚶 Points de Vue (POV 1.8m)
        </div>
        <div className="row g-1">
          {POV_PRESETS.map(preset => (
            <div key={preset.key} className="col-6">
              <button
                type="button"
                className="btn btn-sm btn-outline-danger w-100 py-1 px-2 text-truncate small"
                onClick={() => dispatchPov(preset.key)}
              >
                {preset.label}
              </button>
            </div>
          ))}
        </div>
      </div>

      {b0('teal',   'Raccourcis clavier ⌨',             onOpenShortcuts)}
    </div>
  );
}
