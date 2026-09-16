import { useState, useEffect, useRef } from 'react';
import { useAnimPreviewStore } from './useAnimPreviewStore';

const SPEED_OPTIONS = [0.25, 0.5, 1, 1.5, 2];

export function AnimFrameController({
  animName,
  onCycleAnim,
  bottom = 8,
}: {
  animName?: string;
  onCycleAnim?: (direction: 'next' | 'prev') => void;
  bottom?: number | string;
}) {
  const {
    isPlaying,
    currentTime,
    duration,
    fps,
    speed,
    isLooping,
    isTPose,
    clipName,
    togglePlay,
    setSpeed,
    setLooping,
    setScrubbing,
    seekToFrame,
    stepFrame,
  } = useAnimPreviewStore();

  const [inputFrame, setInputFrame] = useState<string>('');
  const [isEditingFrame, setIsEditingFrame] = useState<boolean>(false);
  const sliderRef = useRef<HTMLInputElement>(null);

  const totalFrames = duration > 0 ? Math.max(1, Math.round(duration * fps)) : 0;
  const currentFrame = duration > 0 ? Math.min(totalFrames, Math.round(currentTime * fps)) : 0;
  const progressPct = totalFrames > 0 ? (currentFrame / totalFrames) * 100 : 0;

  useEffect(() => {
    if (!isEditingFrame) {
      setInputFrame(currentFrame.toString());
    }
  }, [currentFrame, isEditingFrame]);

  // Raccourcis clavier : Espace (Play/Pause), Flèches Gauche/Droite (-1/+1 frame), Début (Frame 0)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const targetEl = e.target as HTMLElement | null;
      if (
        targetEl &&
        (targetEl.tagName === 'INPUT' ||
          targetEl.tagName === 'TEXTAREA' ||
          targetEl.isContentEditable)
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        e.stopPropagation();
        togglePlay();
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        e.stopPropagation();
        stepFrame(e.shiftKey ? -5 : -1);
        return;
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        e.stopPropagation();
        stepFrame(e.shiftKey ? 5 : 1);
        return;
      }

      if (e.key === 'Home' || e.key === '0') {
        e.preventDefault();
        e.stopPropagation();
        seekToFrame(0);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, stepFrame, seekToFrame]);

  const handleFrameCommit = () => {
    setIsEditingFrame(false);
    const parsed = parseInt(inputFrame, 10);
    if (!isNaN(parsed)) {
      seekToFrame(parsed);
    } else {
      setInputFrame(currentFrame.toString());
    }
  };

  const displayName = animName || clipName;

  return (
    <div
      className="anim-mixamo-controller"
      onClick={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
      style={{
        position: 'absolute',
        bottom,
        left: 10,
        right: 10,
        zIndex: 4,
        background: 'rgba(15, 23, 42, 0.9)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: 8,
        padding: '6px 12px',
        boxShadow: '0 6px 24px rgba(0,0,0,0.55)',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        userSelect: 'none',
        color: '#f1f5f9',
        fontSize: 11,
      }}
    >
      {/* ── Ligne 1 : Timeline Slider (Scrubber comme dans Mixamo) ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: '#94a3b8',
            minWidth: 28,
            textAlign: 'center',
            fontFamily: 'monospace',
          }}
        >
          0
        </span>

        <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
          <input
            ref={sliderRef}
            type="range"
            min={0}
            max={totalFrames}
            step={1}
            value={currentFrame}
            disabled={isTPose || totalFrames === 0}
            onPointerDown={() => setScrubbing(true)}
            onPointerUp={() => setScrubbing(false)}
            onChange={e => {
              seekToFrame(parseInt(e.target.value, 10));
            }}
            style={{
              width: '100%',
              height: 6,
              appearance: 'none',
              WebkitAppearance: 'none',
              background: `linear-gradient(to right, #0284c7 ${progressPct}%, #334155 ${progressPct}%)`,
              borderRadius: 3,
              outline: 'none',
              cursor: isTPose ? 'not-allowed' : 'pointer',
              opacity: isTPose ? 0.4 : 1,
            }}
            title={
              isTPose
                ? 'T-Pose (Pose statique sans frame)'
                : `Frame ${currentFrame} / ${totalFrames} (${currentTime.toFixed(2)}s)`
            }
          />
        </div>

        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: '#94a3b8',
            minWidth: 28,
            textAlign: 'center',
            fontFamily: 'monospace',
          }}
        >
          {totalFrames}
        </span>
      </div>

      {/* ── Ligne 2 : Transport Mixamo, Badges Frames/Temps, Vitesse ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 6,
        }}
      >
        {/* Groupe boutons de lecture */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          {/* Revenir au début (Frame 0) */}
          <button
            type="button"
            onClick={() => seekToFrame(0)}
            disabled={isTPose}
            style={{
              padding: '3px 6px',
              fontSize: 10,
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 4,
              color: '#fff',
              cursor: isTPose ? 'not-allowed' : 'pointer',
              opacity: isTPose ? 0.4 : 1,
            }}
            title="Revenir au début (Frame 0 / Raccourci: 0 ou Home)"
          >
            ⏮
          </button>

          {/* Reculer d'une frame (-1f) */}
          <button
            type="button"
            onClick={() => stepFrame(-1)}
            disabled={isTPose}
            style={{
              padding: '3px 7px',
              fontSize: 11,
              fontWeight: 'bold',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 4,
              color: '#fff',
              cursor: isTPose ? 'not-allowed' : 'pointer',
              opacity: isTPose ? 0.4 : 1,
            }}
            title="Frame précédente (-1 frame / Raccourci: Flèche Gauche, Maj+Gauche: -5f)"
          >
            ◀
          </button>

          {/* Play / Pause Toggle principal */}
          <button
            type="button"
            onClick={togglePlay}
            disabled={isTPose}
            style={{
              padding: '3px 10px',
              fontSize: 11,
              fontWeight: 'bold',
              background: isPlaying
                ? 'linear-gradient(135deg, #0284c7, #0369a1)'
                : 'linear-gradient(135deg, #f59e0b, #d97706)',
              border: 'none',
              borderRadius: 4,
              color: '#fff',
              cursor: isTPose ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              boxShadow: isPlaying ? '0 0 10px rgba(2, 132, 199, 0.5)' : 'none',
              opacity: isTPose ? 0.4 : 1,
            }}
            title={isPlaying ? 'Pause (Raccourci: Espace)' : 'Play (Raccourci: Espace)'}
          >
            <span>{isPlaying ? '⏸' : '▶'}</span>
            <span style={{ fontSize: 10 }}>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          {/* Avancer d'une frame (+1f) */}
          <button
            type="button"
            onClick={() => stepFrame(1)}
            disabled={isTPose}
            style={{
              padding: '3px 7px',
              fontSize: 11,
              fontWeight: 'bold',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 4,
              color: '#fff',
              cursor: isTPose ? 'not-allowed' : 'pointer',
              opacity: isTPose ? 0.4 : 1,
            }}
            title="Frame suivante (+1 frame / Raccourci: Flèche Droite, Maj+Droite: +5f)"
          >
            ▶
          </button>

          {/* Boucle (Loop) */}
          <button
            type="button"
            onClick={() => setLooping(!isLooping)}
            style={{
              padding: '3px 6px',
              fontSize: 10,
              background: isLooping ? 'rgba(2, 132, 199, 0.3)' : 'rgba(255, 255, 255, 0.08)',
              border: `1px solid ${isLooping ? '#0284c7' : 'rgba(255, 255, 255, 0.15)'}`,
              borderRadius: 4,
              color: isLooping ? '#38bdf8' : '#94a3b8',
              cursor: 'pointer',
            }}
            title={isLooping ? 'Boucle activée' : 'Boucle désactivée'}
          >
            🔁
          </button>
        </div>

        {/* Compteur précis de Frame & Temps */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {isTPose ? (
            <span
              style={{
                background: 'rgba(42, 157, 58, 0.25)',
                border: '1px solid #2a9d3a',
                borderRadius: 4,
                padding: '2px 6px',
                color: '#86efac',
                fontSize: 10,
                fontWeight: 600,
              }}
            >
              📐 T-Pose (Rest)
            </span>
          ) : (
            <>
              {/* Badge Frame modifiable au clic / saisie directe */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(0, 0, 0, 0.45)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 4,
                  padding: '1px 6px',
                  fontFamily: 'monospace',
                }}
                title="Cliquer pour entrer directement un numéro de frame précis"
              >
                <span style={{ color: '#94a3b8', fontSize: 10, marginRight: 4 }}>Frame:</span>
                <input
                  type="number"
                  min={0}
                  max={totalFrames}
                  value={inputFrame}
                  onFocus={() => setIsEditingFrame(true)}
                  onChange={e => setInputFrame(e.target.value)}
                  onBlur={handleFrameCommit}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleFrameCommit();
                  }}
                  style={{
                    width: 38,
                    background: isEditingFrame ? '#1e293b' : 'transparent',
                    border: isEditingFrame ? '1px solid #38bdf8' : 'none',
                    borderRadius: 2,
                    color: '#38bdf8',
                    fontWeight: 700,
                    fontSize: 11,
                    textAlign: 'center',
                    outline: 'none',
                    padding: 0,
                  }}
                />
                <span style={{ color: '#64748b', fontSize: 10 }}>/ {totalFrames}</span>
              </div>

              {/* Badge Temps (secondes) */}
              <span
                style={{
                  color: '#cbd5e1',
                  fontFamily: 'monospace',
                  fontSize: 10,
                  background: 'rgba(0, 0, 0, 0.3)',
                  padding: '2px 5px',
                  borderRadius: 3,
                }}
              >
                {currentTime.toFixed(2)}s / {duration.toFixed(2)}s
              </span>
            </>
          )}
        </div>

        {/* Sélecteur de Vitesse de lecture (Mixamo 0.25x / 0.5x / 1x / 2x) & Animation en cours */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Badge animation en cours */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {onCycleAnim && (
              <button
                type="button"
                onClick={() => onCycleAnim('prev')}
                style={{
                  padding: '2px 4px',
                  fontSize: 8,
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 3,
                  color: '#cbd5e1',
                  cursor: 'pointer',
                }}
                title="Animation précédente"
              >
                ▲
              </button>
            )}
            <span
              className="text-truncate d-inline-block"
              style={{
                maxWidth: 110,
                fontSize: 10,
                fontWeight: 600,
                color: '#38bdf8',
                background: 'rgba(2, 132, 199, 0.15)',
                padding: '2px 6px',
                borderRadius: 3,
                border: '1px solid rgba(56, 189, 248, 0.3)',
                verticalAlign: 'middle',
              }}
              title={`Animation active : ${displayName}`}
            >
              🎬 {displayName}
            </span>
            {onCycleAnim && (
              <button
                type="button"
                onClick={() => onCycleAnim('next')}
                style={{
                  padding: '2px 4px',
                  fontSize: 8,
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 3,
                  color: '#cbd5e1',
                  cursor: 'pointer',
                }}
                title="Animation suivante"
              >
                ▼
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ color: '#94a3b8', fontSize: 9 }}>⚡</span>
            <select
              value={speed}
              onChange={e => setSpeed(parseFloat(e.target.value))}
              style={{
                padding: '2px 4px',
                fontSize: 10,
                fontWeight: speed !== 1 ? 'bold' : 'normal',
                background: speed !== 1 ? 'rgba(2, 132, 199, 0.3)' : 'rgba(255, 255, 255, 0.08)',
                border: `1px solid ${speed !== 1 ? '#0284c7' : 'rgba(255, 255, 255, 0.15)'}`,
                borderRadius: 4,
                color: speed !== 1 ? '#38bdf8' : '#cbd5e1',
                outline: 'none',
                cursor: 'pointer',
              }}
              title="Vitesse de lecture de l'animation"
            >
              {SPEED_OPTIONS.map(s => (
                <option key={s} value={s} style={{ background: '#0f172a', color: '#fff' }}>
                  {s}x {s < 1 ? '(Ralenti)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
