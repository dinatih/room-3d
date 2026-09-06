import { CharacterAnimSelector } from '@features/scene/CharacterAnimSelector';

export interface AnimationsSectionProps {
  isMobile: boolean;
  buildAnim?: boolean;
  buildAnimMatrix?: boolean;
  onStartBuildAnim?: () => void;
  onStartBuildAnimMatrix?: () => void;
  onStopBuildAnim?: () => void;
  animDurations?: Record<string, number>;
  activeAnimValue: string;
  onSelectAnim: (val: string) => void;
}

export function AnimationsSection({
  isMobile,
  buildAnim = false,
  buildAnimMatrix = false,
  onStartBuildAnim,
  onStartBuildAnimMatrix,
  onStopBuildAnim,
  animDurations = {},
  activeAnimValue,
  onSelectAnim,
}: AnimationsSectionProps) {
  const isBuildAnimRunning = buildAnim || buildAnimMatrix;

  return (
    <div className="d-flex flex-column bg-transparent">
      {/* ── Section Scène & Assemblage 3D ── */}
      <div className="p-2 border-bottom bg-light bg-opacity-50">
        <div className="text-muted fw-bold text-uppercase mb-1.5" style={{ fontSize: '9px', letterSpacing: '0.06em' }}>
          🏗️ Démo & Assemblage 3D
        </div>
        <div className="d-flex flex-column gap-1.5">
          <div className="d-flex gap-1">
            <button
              disabled={isBuildAnimRunning && !buildAnim}
              onClick={onStartBuildAnim}
              className={`btn btn-sm flex-grow-1 text-start rounded-2 py-1 px-2 fw-bold d-flex justify-content-between align-items-center ${buildAnim ? 'btn-danger text-white' : 'btn-outline-secondary text-dark'}`}
              style={{ fontSize: isMobile ? '12px' : '10px', background: buildAnim ? undefined : 'rgba(255, 255, 255, 0.7)' }}
            >
              <span>▶ Tombée du ciel</span>
              <span className="small opacity-75">{animDurations['buildAnim'] ? `~${Math.round(animDurations['buildAnim'] / 1000)}s` : '~30s'}</span>
            </button>
            <button
              disabled={isBuildAnimRunning && !buildAnimMatrix}
              onClick={onStartBuildAnimMatrix}
              className={`btn btn-sm flex-grow-1 text-start rounded-2 py-1 px-2 fw-bold d-flex justify-content-between align-items-center ${buildAnimMatrix ? 'btn-success text-white' : 'btn-outline-secondary text-dark'}`}
              style={{ fontSize: isMobile ? '12px' : '10px', background: buildAnimMatrix ? undefined : 'rgba(255, 255, 255, 0.7)' }}
            >
              <span>▶ Matrix</span>
              <span className="small opacity-75">{animDurations['buildAnimMatrix'] ? `~${Math.round(animDurations['buildAnimMatrix'] / 1000)}s` : ''}</span>
            </button>
          </div>
          {isBuildAnimRunning && (
            <button
              onClick={onStopBuildAnim}
              className="btn btn-danger btn-sm w-100 fw-bold py-1 border-0 shadow-sm"
              style={{ fontSize: '10px', letterSpacing: '0.04em' }}
            >
              ■ Arrêter l'animation en cours
            </button>
          )}
        </div>
      </div>

      <CharacterAnimSelector
        activeAnimValue={activeAnimValue}
        onSelectAnim={onSelectAnim}
        isMobile={isMobile}
        maxHeight="50vh"
        listMaxHeight="35vh"
      />
    </div>
  );
}
