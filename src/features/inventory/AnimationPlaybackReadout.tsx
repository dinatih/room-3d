import { useState } from 'react';
import { useAnimPreviewStore } from './useAnimPreviewStore';

type PlaybackDimensions = { duration: number; fps: number; isTPose: boolean };

function frameAt(time: number, duration: number, fps: number) {
  const totalFrames = duration > 0 ? Math.max(1, Math.round(duration * fps)) : 0;
  return { totalFrames, currentFrame: duration > 0 ? Math.min(totalFrames, Math.round(time * fps)) : 0 };
}

// Only the readouts subscribe to the per-frame clock; animation editors stay idle.
export function AnimationTimeline({ duration, fps, isTPose }: PlaybackDimensions) {
  const currentTime = useAnimPreviewStore(state => state.currentTime);
  const setScrubbing = useAnimPreviewStore(state => state.setScrubbing);
  const seekToFrame = useAnimPreviewStore(state => state.seekToFrame);
  const { totalFrames, currentFrame } = frameAt(currentTime, duration, fps);
  return (
    <div className="d-flex align-items-center gap-2 w-100 mb-1">
      <span className="text-muted font-monospace small">0</span>
      <input
        type="range"
        className="form-range form-range-sm flex-grow-1"
        min={0}
        max={totalFrames}
        step={1}
        value={currentFrame}
        disabled={isTPose || totalFrames === 0}
        onPointerDown={() => setScrubbing(true)}
        onPointerUp={() => setScrubbing(false)}
        onChange={e => seekToFrame(parseInt(e.target.value, 10))}
        style={{ cursor: isTPose ? 'not-allowed' : 'pointer' }}
        title={
          isTPose
            ? 'T-Pose (Pose statique sans frame)'
            : `Frame ${currentFrame} / ${totalFrames} (${currentTime.toFixed(2)}s)`
        }
      />
      <span className="text-muted font-monospace small">{totalFrames}</span>
    </div>
  );
}

export function AnimationFrameReadout({ duration, fps, isTPose }: PlaybackDimensions) {
  const currentTime = useAnimPreviewStore(state => state.currentTime);
  const seekToFrame = useAnimPreviewStore(state => state.seekToFrame);
  const { totalFrames, currentFrame } = frameAt(currentTime, duration, fps);
  const [inputFrame, setInputFrame] = useState('');
  const [isEditingFrame, setIsEditingFrame] = useState(false);
  const handleFrameCommit = () => {
    setIsEditingFrame(false);
    const parsed = parseInt(inputFrame, 10);
    if (!isNaN(parsed)) {
      seekToFrame(parsed);
    } else {
      setInputFrame(currentFrame.toString());
    }
  };
  return (
    <div className="d-flex align-items-center gap-1">
      {isTPose ? (
        <span className="badge bg-success-subtle text-success border border-success-subtle">
          <i className="bi bi-person-standing" aria-hidden="true" /> T-Pose (Rest)
        </span>
      ) : (
        <>
          <div className="input-group input-group-sm font-monospace w-auto" title="Cliquer pour entrer une frame précise">
            <span className="input-group-text py-0 px-1 bg-transparent text-muted border-end-0 small">
              Frame:
            </span>
            <input
              type="number"
              aria-label="Frame courante"
              min={0}
              max={totalFrames}
              value={isEditingFrame ? inputFrame : currentFrame.toString()}
              onFocus={() => {
                setInputFrame(currentFrame.toString());
                setIsEditingFrame(true);
              }}
              onChange={e => setInputFrame(e.target.value)}
              onBlur={handleFrameCommit}
              onKeyDown={e => e.key === 'Enter' && handleFrameCommit()}
              className="form-control py-0 bg-transparent text-dark border-start-0 border-end-0 text-center fw-bold px-1"
              style={{ width: `calc(${Math.max(String(totalFrames).length, (isEditingFrame ? inputFrame : String(currentFrame)).length)}ch + 3rem)`, flex: '0 0 auto' }}
            />
            <span className="input-group-text py-0 px-1 bg-transparent text-muted border-start-0 small">
              /{totalFrames}
            </span>
          </div>
          <span
            className="badge bg-transparent text-dark border shadow-sm font-monospace py-1 px-1.5 text-center"
            style={{ minWidth: '7.5rem', fontVariantNumeric: 'tabular-nums' }}
          >
            {currentTime.toFixed(2)}s/{duration.toFixed(2)}s
          </span>
        </>
      )}
    </div>
  );
}
