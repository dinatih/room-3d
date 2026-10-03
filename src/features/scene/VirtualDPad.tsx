/**
 * VirtualDPad.tsx — Joystick tactile virtuel (mobile only) pour diriger le walker.
 *
 * Émet des KeyboardEvent ArrowUp/Down/Left/Right que CameraController
 * et le reste de la scène écoutent déjà via window.addEventListener('keydown').
 * Format compact (80px, moitié moins encombrant que l'ancienne croix de 164px).
 */
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useIsMobile } from '@shared/hooks/useIsMobile';

type ArrowKey = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight';

function fire(type: 'keydown' | 'keyup', key: ArrowKey) {
  window.dispatchEvent(new KeyboardEvent(type, { key, code: key, bubbles: true }));
}

const BASE_SIZE = 80;         // Diamètre total du joystick en px (~moitié de l'ancien 164px)
const KNOB_SIZE = 36;         // Diamètre du stick central
const MAX_RADIUS = 24;        // Rayon max de déplacement du stick
const DEADZONE = 6;           // Seuil minimal de déplacement (en px) pour déclencher une direction
const ANGLE_THRESHOLD = 0.38; // ~22.5° pour équilibrer les 8 directions (45° chacune)

export function VirtualDPad() {
  const isMobile = useIsMobile();
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);
  const [activeDirs, setActiveDirs] = useState<Record<ArrowKey, boolean>>({
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
  });

  const baseRef = useRef<HTMLDivElement>(null);
  const activeKeysRef = useRef<Set<ArrowKey>>(new Set());
  const centerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const releaseAllKeys = useCallback(() => {
    activeKeysRef.current.forEach(k => fire('keyup', k));
    activeKeysRef.current.clear();
    setActiveDirs({
      ArrowUp: false,
      ArrowDown: false,
      ArrowLeft: false,
      ArrowRight: false,
    });
  }, []);

  // Nettoyage en cas de démontage du composant
  useEffect(() => {
    return () => {
      releaseAllKeys();
    };
  }, [releaseAllKeys]);

  if (!isMobile) return null;

  const updateFromPointer = (clientX: number, clientY: number) => {
    const dx = clientX - centerRef.current.x;
    const dy = clientY - centerRef.current.y;
    const dist = Math.hypot(dx, dy);

    // Position bornée du stick
    let kx = dx;
    let ky = dy;
    if (dist > MAX_RADIUS) {
      kx = (dx / dist) * MAX_RADIUS;
      ky = (dy / dist) * MAX_RADIUS;
    }
    setKnobPos({ x: kx, y: ky });

    const newKeys = new Set<ArrowKey>();

    if (dist >= DEADZONE) {
      const nx = dx / dist;
      const ny = dy / dist;

      if (ny < -ANGLE_THRESHOLD) newKeys.add('ArrowUp');
      if (ny > ANGLE_THRESHOLD) newKeys.add('ArrowDown');
      if (nx < -ANGLE_THRESHOLD) newKeys.add('ArrowLeft');
      if (nx > ANGLE_THRESHOLD) newKeys.add('ArrowRight');
    }

    // Réconciliation des touches
    activeKeysRef.current.forEach(k => {
      if (!newKeys.has(k)) {
        fire('keyup', k);
      }
    });
    newKeys.forEach(k => {
      if (!activeKeysRef.current.has(k)) {
        fire('keydown', k);
      }
    });

    activeKeysRef.current = newKeys;
    setActiveDirs({
      ArrowUp: newKeys.has('ArrowUp'),
      ArrowDown: newKeys.has('ArrowDown'),
      ArrowLeft: newKeys.has('ArrowLeft'),
      ArrowRight: newKeys.has('ArrowRight'),
    });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!baseRef.current) return;
    baseRef.current.setPointerCapture(e.pointerId);

    const rect = baseRef.current.getBoundingClientRect();
    centerRef.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    setActive(true);
    updateFromPointer(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!active) return;
    updateFromPointer(e.clientX, e.clientY);
  };

  const handlePointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (baseRef.current?.hasPointerCapture(e.pointerId)) {
      baseRef.current.releasePointerCapture(e.pointerId);
    }
    setActive(false);
    setKnobPos({ x: 0, y: 0 });
    releaseAllKeys();
  };

  return (
    <div
      ref={baseRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onContextMenu={e => e.preventDefault()}
      style={{
        position: 'fixed',
        bottom: 'calc(3.75rem + env(safe-area-inset-bottom) + 54px)',
        right: 16,
        width: BASE_SIZE,
        height: BASE_SIZE,
        borderRadius: '50%',
        background: active
          ? 'radial-gradient(circle, rgba(30, 45, 75, 0.75) 0%, rgba(15, 20, 35, 0.85) 100%)'
          : 'radial-gradient(circle, rgba(20, 24, 38, 0.55) 0%, rgba(10, 12, 22, 0.7) 100%)',
        border: `2px solid ${active ? 'rgba(96, 165, 250, 0.6)' : 'rgba(255, 255, 255, 0.25)'}`,
        boxShadow: active
          ? '0 0 16px rgba(59, 130, 246, 0.4), 0 4px 12px rgba(0, 0, 0, 0.4)'
          : '0 4px 12px rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 95,
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      }}
      title="Joystick tactile de déplacement"
    >
      {/* Flèches indicatrices discrètes sur le pourtour */}
      <span style={{
        position: 'absolute', top: 3, fontSize: '9px', lineHeight: 1,
        color: activeDirs.ArrowUp ? '#60a5fa' : 'rgba(255, 255, 255, 0.3)',
        fontWeight: activeDirs.ArrowUp ? 700 : 400,
        transition: 'color 0.1s',
      }}>▲</span>
      <span style={{
        position: 'absolute', bottom: 3, fontSize: '9px', lineHeight: 1,
        color: activeDirs.ArrowDown ? '#60a5fa' : 'rgba(255, 255, 255, 0.3)',
        fontWeight: activeDirs.ArrowDown ? 700 : 400,
        transition: 'color 0.1s',
      }}>▼</span>
      <span style={{
        position: 'absolute', left: 4, fontSize: '9px', lineHeight: 1,
        color: activeDirs.ArrowLeft ? '#60a5fa' : 'rgba(255, 255, 255, 0.3)',
        fontWeight: activeDirs.ArrowLeft ? 700 : 400,
        transition: 'color 0.1s',
      }}>◀</span>
      <span style={{
        position: 'absolute', right: 4, fontSize: '9px', lineHeight: 1,
        color: activeDirs.ArrowRight ? '#60a5fa' : 'rgba(255, 255, 255, 0.3)',
        fontWeight: activeDirs.ArrowRight ? 700 : 400,
        transition: 'color 0.1s',
      }}>▶</span>

      {/* Stick central mobile (Knob) */}
      <div
        style={{
          width: KNOB_SIZE,
          height: KNOB_SIZE,
          borderRadius: '50%',
          background: active
            ? 'radial-gradient(circle, #93c5fd 0%, #2563eb 100%)'
            : 'radial-gradient(circle, rgba(255, 255, 255, 0.95) 0%, rgba(203, 213, 225, 0.85) 100%)',
          border: '2px solid rgba(255, 255, 255, 0.7)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.45), inset 0 1px 2px rgba(255, 255, 255, 0.8)',
          transform: `translate3d(${knobPos.x}px, ${knobPos.y}px, 0)`,
          transition: active ? 'none' : 'transform 0.15s ease-out, background 0.15s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: active ? '#ffffff' : 'rgba(100, 116, 139, 0.5)',
            boxShadow: active ? '0 0 6px rgba(255, 255, 255, 0.8)' : 'none',
          }}
        />
      </div>
    </div>
  );
}

export const VirtualJoystick = VirtualDPad;
