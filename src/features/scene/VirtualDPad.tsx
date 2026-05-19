/**
 * VirtualDPad.tsx — D-pad tactile (mobile only) pour diriger le walker.
 *
 * Émet des KeyboardEvent ArrowUp/Down/Left/Right que CameraController
 * et le reste de la scène écoutent déjà via window.addEventListener('keydown').
 * Touche pressée → keydown ; relâchée / sortie de zone → keyup.
 */
import React from 'react';
import { useIsMobile } from '@shared/hooks/useIsMobile';

type ArrowKey = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight';

function fire(type: 'keydown' | 'keyup', key: ArrowKey) {
  window.dispatchEvent(new KeyboardEvent(type, { key, code: key, bubbles: true }));
}

function PadBtn({ label, k }: { label: string; k: ArrowKey }) {
  const [pressed, setPressed] = React.useState(false);

  const start = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setPressed(true);
    fire('keydown', k);
  };
  const stop = () => {
    if (!pressed) return;
    setPressed(false);
    fire('keyup', k);
  };

  return (
    <button
      onPointerDown={start}
      onPointerUp={stop}
      onPointerCancel={stop}
      onPointerLeave={stop}
      onContextMenu={e => e.preventDefault()}
      style={{
        background: pressed ? 'rgba(100,150,255,0.45)' : 'rgba(10,10,20,0.65)',
        border: '1px solid rgba(255,255,255,0.25)',
        borderRadius: 10,
        color: '#fff',
        fontSize: 26,
        lineHeight: 1,
        cursor: 'pointer',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
        touchAction: 'none',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 0,
        transition: 'background 0.08s',
      }}
    >
      {label}
    </button>
  );
}

export function VirtualDPad() {
  const isMobile = useIsMobile();
  if (!isMobile) return null;

  const cellSize = 52;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 'calc(64px + env(safe-area-inset-bottom) + 12px)',
        right: 12,
        zIndex: 95,
        display: 'grid',
        gridTemplateColumns: `repeat(3, ${cellSize}px)`,
        gridTemplateRows:    `repeat(3, ${cellSize}px)`,
        gap: 4,
        touchAction: 'none',
        pointerEvents: 'auto',
      }}
      onContextMenu={e => e.preventDefault()}
    >
      <div />
      <PadBtn label="↑" k="ArrowUp" />
      <div />

      <PadBtn label="←" k="ArrowLeft" />
      <div />
      <PadBtn label="→" k="ArrowRight" />

      <div />
      <PadBtn label="↓" k="ArrowDown" />
      <div />
    </div>
  );
}
