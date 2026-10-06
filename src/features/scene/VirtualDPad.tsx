/** Croix directionnelle tactile pour déplacer le personnage sur mobile. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useIsMobile } from '@shared/hooks/useIsMobile';
import './VirtualDPad.scss';

type ArrowKey = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight';

const DIRECTIONS: Array<{ key: ArrowKey; icon: string; label: string; position: string }> = [
  { key: 'ArrowUp', icon: 'bi-arrow-up', label: 'Avancer', position: 'up' },
  { key: 'ArrowLeft', icon: 'bi-arrow-left', label: 'Aller à gauche', position: 'left' },
  { key: 'ArrowRight', icon: 'bi-arrow-right', label: 'Aller à droite', position: 'right' },
  { key: 'ArrowDown', icon: 'bi-arrow-down', label: 'Reculer', position: 'down' },
];

function fire(type: 'keydown' | 'keyup', key: ArrowKey) {
  window.dispatchEvent(new KeyboardEvent(type, { key, code: key, bubbles: true }));
}

export function VirtualDPad({ visible = false }: { visible?: boolean }) {
  const isMobile = useIsMobile();
  const activeKeys = useRef(new Set<ArrowKey>());
  const [pressedKeys, setPressedKeys] = useState<Set<ArrowKey>>(new Set());

  const releaseKey = useCallback((key: ArrowKey) => {
    if (!activeKeys.current.delete(key)) return;
    fire('keyup', key);
    setPressedKeys(new Set(activeKeys.current));
  }, []);

  useEffect(() => () => {
    activeKeys.current.forEach(key => fire('keyup', key));
    activeKeys.current.clear();
  }, []);

  if (!isMobile || !visible) return null;

  return (
    <div className="virtual-dpad" role="group" aria-label="Commandes de déplacement">
      {DIRECTIONS.map(({ key, icon, label, position }) => (
        <button
          key={key}
          type="button"
          className={`btn btn-sm rounded-3 virtual-dpad__button virtual-dpad__button--${position} ${pressedKeys.has(key) ? 'is-pressed' : ''}`}
          aria-label={label}
          title={label}
          onPointerDown={event => {
            event.preventDefault();
            event.currentTarget.setPointerCapture(event.pointerId);
            if (activeKeys.current.has(key)) return;
            activeKeys.current.add(key);
            setPressedKeys(new Set(activeKeys.current));
            fire('keydown', key);
          }}
          onPointerUp={() => releaseKey(key)}
          onPointerCancel={() => releaseKey(key)}
          onLostPointerCapture={() => releaseKey(key)}
          onContextMenu={event => event.preventDefault()}
        >
          <i className={`bi ${icon}`} aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}

export const VirtualJoystick = VirtualDPad;
