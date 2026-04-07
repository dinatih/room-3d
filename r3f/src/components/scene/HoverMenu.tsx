/**
 * HoverMenu.tsx — port de js/ui/hoverMenu.js
 *
 * Deux exports :
 *   HoverRaycaster  — composant R3F (dans Canvas) : détecte l'objet survolé
 *   HoverOverlay    — composant HTML (hors Canvas) : affiche le popup
 */
import { useEffect, useRef, useState } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE   from 'three';
import { hoverState } from './hoverState';

// ── Actions disponibles ───────────────────────────────────────────────────────
// actionId → { label bouton, clé furniture-toggle }

interface ActionDef { btnLabel: string; toggleKey: string; }
const ACTIONS: Record<string, ActionDef> = {
  eastDoor:  { btnLabel: 'Ouvrir / Fermer', toggleKey: 'eastDoor'  },
  corrDoors: { btnLabel: 'Ouvrir / Fermer', toggleKey: 'corrDoors' },
  freezer:   { btnLabel: 'Ouvrir / Fermer', toggleKey: 'freezer'   },
  fridge:    { btnLabel: 'Ouvrir / Fermer', toggleKey: 'fridge'    },
  cabinet:   { btnLabel: 'Ouvrir / Fermer', toggleKey: 'cabinet'   },
  wcLid:     { btnLabel: 'Ouvrir / Fermer', toggleKey: 'wcLid'     },
};

function resolveAction(obj: THREE.Object3D): { label: string; actionId: string } | null {
  let cur: THREE.Object3D | null = obj;
  while (cur) {
    if (cur.userData?.hoverAction) return cur.userData.hoverAction as { label: string; actionId: string };
    cur = cur.parent;
  }
  return null;
}

// ── Composant R3F (à placer dans Canvas) ─────────────────────────────────────

export function HoverRaycaster() {
  const { camera, gl, scene } = useThree();

  useEffect(() => {
    const canvas = gl.domElement;
    const raycaster = new THREE.Raycaster();
    const pointer   = new THREE.Vector2();
    let lastMove    = 0;
    let hideTimer: ReturnType<typeof setTimeout> | null = null;

    function scheduleHide() {
      if (hideTimer) return;
      hideTimer = setTimeout(() => {
        hoverState.visible = false;
        hoverState.onUpdate?.();
        hideTimer = null;
        canvas.style.cursor = '';
      }, 420);
    }

    function cancelHide() {
      if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    }
    hoverState.cancelHide = cancelHide;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      const now = performance.now();
      if (now - lastMove < 32) return;
      lastMove = now;

      const rect = canvas.getBoundingClientRect();
      pointer.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
      pointer.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(scene.children, true);

      let found: { label: string; actionId: string } | null = null;
      for (const hit of hits) {
        if (!hit.object.visible) continue;
        // Skip transparent surfaces (ghost material, glass, neighbors)
        const mat = (hit.object as THREE.Mesh).material as THREE.Material & {
          transparent?: boolean; opacity?: number;
        };
        const isTransparent = Array.isArray(mat)
          ? (mat as THREE.Material[]).every(m =>
              (m as typeof mat).transparent && ((m as typeof mat).opacity ?? 1) < 0.3)
          : mat?.transparent && (mat?.opacity ?? 1) < 0.3;
        if (isTransparent) continue;
        if (hit.object.userData.brickType === 'ceiling') continue;

        const action = resolveAction(hit.object);
        if (action && ACTIONS[action.actionId]) {
          found = action;
        }
        break; // first opaque surface — stop here (occluded objects hidden)
      }

      if (found) {
        cancelHide();
        hoverState.visible  = true;
        hoverState.label    = found.label;
        hoverState.actionId = found.actionId;
        hoverState.x        = e.clientX;
        hoverState.y        = e.clientY;
        canvas.style.cursor = 'pointer';
      } else {
        scheduleHide();
      }
      hoverState.onUpdate?.();
    };

    const onLeave = () => { scheduleHide(); };

    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);
    return () => {
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      if (hideTimer) clearTimeout(hideTimer);
      hoverState.cancelHide = null;
    };
  }, [camera, gl, scene]);

  return null;
}

// ── Composant HTML (à placer hors Canvas) ────────────────────────────────────

export function HoverOverlay() {
  const [state, setState] = useState({ visible: false, label: '', actionId: '', x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    hoverState.onUpdate = () => {
      setState({
        visible:  hoverState.visible,
        label:    hoverState.label,
        actionId: hoverState.actionId,
        x:        hoverState.x,
        y:        hoverState.y,
      });
    };
    return () => { hoverState.onUpdate = null; };
  }, []);

  if (!state.visible) return null;

  const action = ACTIONS[state.actionId];
  if (!action) return null;

  // Position near cursor
  const GAP = 14;
  const approxW = 160, approxH = 70;
  let left = state.x + GAP;
  let top  = state.y - approxH / 2;
  if (left + approxW > window.innerWidth  - 8) left = state.x - approxW - GAP;
  if (top < 8)                                  top  = 8;
  if (top + approxH > window.innerHeight  - 8) top  = window.innerHeight - approxH - 8;

  const handleClick = () => {
    document.dispatchEvent(new CustomEvent('furniture-toggle', {
      detail: { key: action.toggleKey },
    }));
  };

  return (
    <div
      ref={menuRef}
      onMouseEnter={() => { hoverState.cancelHide?.(); hoverState.visible = true; }}
      onMouseLeave={() => { hoverState.visible = false; hoverState.onUpdate?.(); }}
      style={{
        position: 'fixed', left, top, zIndex: 300,
        background: 'rgba(10,10,20,0.45)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: 10,
        padding: '10px 14px',
        display: 'flex', flexDirection: 'column', gap: 8,
        pointerEvents: 'all',
        minWidth: 140,
      }}
    >
      <div style={{ color: '#ddd', fontSize: 12, fontWeight: 600 }}>{state.label}</div>
      <button
        onClick={handleClick}
        style={{
          background: 'rgba(255,215,0,0.08)',
          color: '#ffd700',
          border: '1px solid rgba(255,215,0,0.35)',
          borderRadius: 6,
          padding: '6px 14px',
          fontSize: 12, fontWeight: 700,
          letterSpacing: '0.05em',
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        {action.btnLabel}
      </button>
    </div>
  );
}
