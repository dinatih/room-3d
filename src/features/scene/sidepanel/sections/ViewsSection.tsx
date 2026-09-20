import { useSceneStore } from '../../store/useSceneStore';
import { dispatchKey } from '../types';

export interface ViewsSectionProps {
  isMobile: boolean;
  onOpenViews: () => void;
  onOpenShortcuts: () => void;
  onToggleHideUI?: () => void;
}

export function ViewsSection({
  isMobile,
  onOpenViews,
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

  return (
    <div className="d-flex flex-column bg-transparent overflow-auto" style={{ maxHeight: '40vh' }}>
      <button
        className="btn btn-warning text-dark w-100 text-start rounded-0 border-0 border-bottom py-2 px-3 fw-bold d-flex align-items-center justify-content-between shadow-sm"
        onClick={() => useSceneStore.getState().setPhotoModeOpen(true)}
        style={{
          fontSize: isMobile ? '13px' : '11px',
          minHeight: isMobile ? '44px' : undefined,
          background: 'linear-gradient(90deg, #ffc107 0%, #ffca2c 100%)',
        }}
        title="Prendre une photo au Raytracing Ultra-Réaliste (Touche F10)"
      >
        <span className="d-flex align-items-center gap-1.5">
          <span>📸 Photo Raytracing HD</span>
        </span>
        <kbd className="bg-dark text-white border-0 px-1 rounded font-monospace" style={{ fontSize: '9px' }}>F10</kbd>
      </button>
      {b0('gray',   'Perspective / Orbit (Raccourci O)', () => dispatchKey('o'))}
      {b0('gray',   'Walk générique (Raccourci M)',    () => dispatchKey('m'))}
      {b0('gray',   'Vue 3ème personne (Raccourci 3)', () => dispatchKey('3'))}
      {b0('gray',   'Vue FPV 1ère pers. (Raccourci 1)',() => dispatchKey('1'))}
      {cameraMode === 'fpv' && (
        <button
          className="btn btn-light w-100 text-start rounded-0 border-0 border-bottom py-2 px-3 text-dark d-flex align-items-center justify-content-between"
          onClick={() => {
            useSceneStore.setState(st => ({
              layers: { ...st.layers, fpvRealisticEyes: !st.layers.fpvRealisticEyes }
            }));
          }}
          style={{ fontSize: isMobile ? '14px' : '11px', background: 'transparent' }}
          title="Positionne la caméra au centre des yeux du personnage et suit fidèlement les mouvements de la tête"
        >
          <span>👁️ Caméra Yeux Réaliste</span>
          <span className={`badge ${fpvRealisticEyes ? 'bg-info text-dark' : 'bg-secondary'}`} style={{ fontSize: '9px' }}>
            {fpvRealisticEyes ? 'ACTIVE' : 'DÉSACTIVÉE'}
          </span>
        </button>
      )}
      {cameraMode === 'fpv' && fpvRealisticEyes && (
        <button
          className="btn btn-light w-100 text-start rounded-0 border-0 border-bottom py-1.5 px-3 text-dark d-flex align-items-center justify-content-between"
          onClick={() => {
            useSceneStore.setState(st => ({
              layers: { ...st.layers, fpvStabilization: !(st.layers.fpvStabilization ?? true) }
            }));
          }}
          style={{ fontSize: isMobile ? '13px' : '10.5px', background: 'transparent' }}
          title="Amortit les secousses et saccades de la tête"
        >
          <span className="ps-2">⚖️ Stabilisation ({Math.round(fpvStabilizationFactor * 100)}%)</span>
          <span className={`badge ${fpvStabilization ? 'bg-info text-dark' : 'bg-secondary'}`} style={{ fontSize: '8.5px' }}>
            {fpvStabilization ? 'ACTIVE' : 'OFF'}
          </span>
        </button>
      )}
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
      {b0('yellow', 'Autres vues…',                     onOpenViews)}
      {b0('teal',   'Raccourcis clavier ⌨',             onOpenShortcuts)}
    </div>
  );
}
