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
      {b0('gray',   'Perspective / Orbit (Raccourci O)', () => dispatchKey('o'))}
      {b0('gray',   'Walk générique (Raccourci M)',    () => dispatchKey('m'))}
      {b0('gray',   'Vue 3ème personne (Raccourci 3)', () => dispatchKey('3'))}
      {b0('gray',   'Vue FPV 1ère pers. (Raccourci 1)',() => dispatchKey('1'))}
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
