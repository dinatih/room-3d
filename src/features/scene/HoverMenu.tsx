/**
 * HoverMenu.tsx
 *
 *   HoverRaycaster  — composant R3F (dans Canvas) : détecte l'objet survolé
 *   HoverOverlay    — composant HTML (hors Canvas) : dot sur hover, modal sur clic
 */
import React, { useEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE   from 'three';
import { hoverState } from '@features/scene/hoverState';
import { useSceneStore } from '@features/scene/store/useSceneStore';
import { LAYER_NEIGHBORS, LAYER_LIDAR } from '@config';

// ── Actions disponibles ───────────────────────────────────────────────────────

interface ActionDef { btnLabel: string; toggleKey: string; }
const ACTIONS: Record<string, ActionDef> = {
  eastGlassDoor:       { btnLabel: 'Ouvrir / Fermer',    toggleKey: 'eastGlassDoor'      },
  entryDoor:      { btnLabel: 'Ouvrir / Fermer',    toggleKey: 'entryDoor'     },
  livingDoor:     { btnLabel: 'Ouvrir / Fermer',    toggleKey: 'livingDoor'    },
  bathroomDoor:   { btnLabel: 'Ouvrir / Fermer',    toggleKey: 'bathroomDoor'  },
  corrDoors:      { btnLabel: 'Ouvrir / Fermer',    toggleKey: 'corrDoors'     },
  sdbCloset:      { btnLabel: 'Ouvrir / Fermer',    toggleKey: 'sdbCloset'     },
  cbnWest:        { btnLabel: 'Ouvrir / Fermer',    toggleKey: 'cbnWest'       },
  cbnEast:        { btnLabel: 'Ouvrir / Fermer',    toggleKey: 'cbnEast'       },
  freezer:        { btnLabel: 'Ouvrir / Fermer',    toggleKey: 'freezer'       },
  fridge:         { btnLabel: 'Ouvrir / Fermer',    toggleKey: 'fridge'        },
  ninja:          { btnLabel: 'Ouvrir / Fermer',    toggleKey: 'ninja'         },
  cabinet:        { btnLabel: 'Ouvrir / Fermer',    toggleKey: 'cabinet'       },
  wcLid:          { btnLabel: 'Ouvrir / Fermer',    toggleKey: 'wcLid'         },
  'lamp-toggle':   { btnLabel: 'Allumer / Éteindre', toggleKey: 'lampOn'        },
  'bed-toggle':    { btnLabel: 'Empiler / Déplier',  toggleKey: 'bed-toggle'    },
  'bed-position':  { btnLabel: 'Changer position',   toggleKey: 'bed-position'  },
  'bed-sofa':      { btnLabel: 'Mode canapé',        toggleKey: 'bed-sofa'      },
  'desk1-toggle':  { btnLabel: 'Assis / Debout',     toggleKey: 'desk1-toggle'  },
  'desk1-position':{ btnLabel: 'Changer position',   toggleKey: 'desk1-position'},
  'desk2-toggle':  { btnLabel: 'Assis / Debout',     toggleKey: 'desk2-toggle'  },
  'desk2-position':{ btnLabel: 'Changer position',   toggleKey: 'desk2-position'},
  'smorkull-position': { btnLabel: 'Changer position', toggleKey: 'smorkull-position' },
  'shiba-replay':      { btnLabel: 'Rejouer',           toggleKey: 'shiba-replay'      },
  'nestMini':          { btnLabel: 'Ok Google',         toggleKey: 'nestMini'          },
  'tv':                { btnLabel: 'Allumer / Éteindre', toggleKey: 'tvOn'             },
  'bin':               { btnLabel: 'Ouvrir / Fermer',   toggleKey: 'bin-toggle'       },
  airPerformerPower:   { btnLabel: 'Allumer / Éteindre', toggleKey: 'airPerformerPower' },
  airPerformerMode:    { btnLabel: 'Changer Mode',       toggleKey: 'airPerformerMode'  },
  airPerformerSpeed:   { btnLabel: 'Vitesse +/-',        toggleKey: 'airPerformerSpeed' },
};

function resolveAction(obj: THREE.Object3D): { label: string; actionIds: string[] } | null {
  let cur: THREE.Object3D | null = obj;
  while (cur) {
    const ha = cur.userData?.hoverAction as any;
    if (ha) {
      const ids: string[] = ha.actions ?? (ha.actionId ? [ha.actionId] : null);
      if (ids?.length) return { label: ha.label as string, actionIds: ids };
    }
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
      if (hoverState.touchActive) return;
      if (hoverState.locked) return;
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

    function raycastAt(clientX: number, clientY: number): { label: string; actionIds: string[] } | null {
      const rect = canvas.getBoundingClientRect();
      pointer.x =  ((clientX - rect.left) / rect.width)  * 2 - 1;
      pointer.y = -((clientY - rect.top)  / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      raycaster.layers.mask = camera.layers.mask & ~(1 << LAYER_NEIGHBORS) & ~(1 << LAYER_LIDAR);
      const hits = raycaster.intersectObjects(scene.children, true);

      for (const hit of hits) {
        if (!hit.object.visible) continue;
        const mat = (hit.object as THREE.Mesh).material as THREE.Material & {
          transparent?: boolean; opacity?: number;
        };
        const isTransparent = Array.isArray(mat)
          ? (mat as THREE.Material[]).every(m =>
              (m as typeof mat).transparent && ((m as typeof mat).opacity ?? 1) < 0.3)
          : mat?.transparent && (mat?.opacity ?? 1) < 0.3;
        if (isTransparent) continue;
        if (hit.object.userData.brickType === 'ceiling') continue;
        if (hit.object.userData.brickType === 'ground')  continue;

        // Traverse up the parent chain to find if any ancestor has side defined
        let side = null;
        let cur: THREE.Object3D | null = hit.object;
        while (cur) {
          if (cur.userData?.side) {
            side = cur.userData.side;
            break;
          }
          cur = cur.parent;
        }
        if (side === 'west' || side === 'east' || side === 'north' || side === 'both') continue;

        const action = resolveAction(hit.object);
        if (action && action.actionIds.some(id => ACTIONS[id])) return action;
        break;
      }
      return null;
    }

    // ── Souris : hover → dot ──────────────────────────────────────────────────
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      if (hoverState.touchActive) return;
      const now = performance.now();
      if (now - lastMove < 32) return;
      lastMove = now;

      const found = raycastAt(e.clientX, e.clientY);
      if (found) {
        cancelHide();
        hoverState.visible   = true;
        hoverState.label     = found.label;
        hoverState.actionIds = found.actionIds;
        hoverState.x         = e.clientX;
        hoverState.y         = e.clientY;
        canvas.style.cursor  = 'pointer';
      } else {
        scheduleHide();
        canvas.style.cursor  = '';
      }
      hoverState.onUpdate?.();
    };

    const onLeave = () => { scheduleHide(); };

    // ── Clic : épingle / ferme le modal ──────────────────────────────────────
    const onClick = (e: MouseEvent) => {
      if (hoverState.touchActive) return;
      const found = raycastAt(e.clientX, e.clientY);
      if (found) {
        const sameObject = hoverState.locked &&
          hoverState.lockedActionIds.join(',') === found.actionIds.join(',');
        if (sameObject) {
          hoverState.locked = false;
        } else {
          cancelHide();
          hoverState.locked           = true;
          hoverState.lockedLabel      = found.label;
          hoverState.lockedActionIds  = found.actionIds;
          hoverState.lockedX          = e.clientX;
          hoverState.lockedY          = e.clientY;
        }
      } else {
        hoverState.locked = false;
      }
      hoverState.onUpdate?.();
    };

    // ── Echap : ferme le modal ────────────────────────────────────────────────
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && hoverState.locked) {
        hoverState.locked = false;
        hoverState.onUpdate?.();
      }
    };

    // ── Tactile : tap pour afficher / masquer ─────────────────────────────────
    let touchMoved = false;
    const onTouchStart = () => { touchMoved = false; };
    const onTouchMove  = () => { touchMoved = true; };

    const onTouchEnd = (e: TouchEvent) => {
      if (touchMoved) return;
      const t = e.changedTouches[0];
      if (!t) return;
      const found = raycastAt(t.clientX, t.clientY);
      if (found) {
        const same = hoverState.touchActive &&
          hoverState.lockedActionIds.join(',') === found.actionIds.join(',');
        if (same) {
          hoverState.locked      = false;
          hoverState.touchActive = false;
        } else {
          cancelHide();
          hoverState.locked           = true;
          hoverState.touchActive      = true;
          hoverState.lockedLabel      = found.label;
          hoverState.lockedActionIds  = found.actionIds;
          hoverState.lockedX          = t.clientX;
          hoverState.lockedY          = t.clientY;
        }
      } else {
        hoverState.locked      = false;
        hoverState.touchActive = false;
      }
      hoverState.onUpdate?.();
    };

    canvas.addEventListener('pointermove',  onMove);
    canvas.addEventListener('pointerleave', onLeave);
    canvas.addEventListener('click',        onClick);
    window.addEventListener('keydown',      onKeyDown);
    canvas.addEventListener('touchstart',   onTouchStart, { passive: true });
    canvas.addEventListener('touchmove',    onTouchMove,  { passive: true });
    canvas.addEventListener('touchend',     onTouchEnd);
    return () => {
      canvas.removeEventListener('pointermove',  onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('click',        onClick);
      window.removeEventListener('keydown',      onKeyDown);
      canvas.removeEventListener('touchstart',   onTouchStart);
      canvas.removeEventListener('touchmove',    onTouchMove);
      canvas.removeEventListener('touchend',     onTouchEnd);
      if (hideTimer) clearTimeout(hideTimer);
      hoverState.cancelHide = null;
    };
  }, [camera, gl, scene]);

  return null;
}

// ── Composant HTML (à placer hors Canvas) ────────────────────────────────────

const BTN_STYLE: React.CSSProperties = {
  background: 'rgba(255,215,0,0.08)',
  color: '#ffd700',
  border: '1px solid rgba(255,215,0,0.35)',
  borderRadius: 6,
  padding: '6px 14px',
  fontSize: 12, fontWeight: 700,
  letterSpacing: '0.05em',
  cursor: 'pointer',
  fontFamily: 'inherit',
};

// Injecte l'animation pulse une seule fois dans le document
let pulseInjected = false;
function injectPulse() {
  if (pulseInjected) return;
  pulseInjected = true;
  const s = document.createElement('style');
  s.textContent = `
    @keyframes hover-dot-pulse {
      0%,100% { transform: scale(1);    opacity: 0.85; }
      50%      { transform: scale(1.25); opacity: 1;    }
    }
    .hover-dot-indicator { animation: hover-dot-pulse 1.1s ease-in-out infinite; }
  `;
  document.head.appendChild(s);
}

export function HoverOverlay() {
  const [state, setState] = useState({
    visible: false, label: '', actionIds: [] as string[], x: 0, y: 0,
    locked: false, lockedLabel: '', lockedActionIds: [] as string[], lockedX: 0, lockedY: 0,
  });

  useEffect(() => {
    injectPulse();
    hoverState.onUpdate = () => {
      setState({
        visible:         hoverState.visible,
        label:           hoverState.label,
        actionIds:       hoverState.actionIds,
        x:               hoverState.x,
        y:               hoverState.y,
        locked:          hoverState.locked,
        lockedLabel:     hoverState.lockedLabel,
        lockedActionIds: hoverState.lockedActionIds,
        lockedX:         hoverState.lockedX,
        lockedY:         hoverState.lockedY,
      });
    };
    return () => { hoverState.onUpdate = null; };
  }, []);

  const showDot   = state.visible && !state.locked;
  const showModal = state.locked;

  const lockedActions = showModal
    ? state.lockedActionIds.map(id => ACTIONS[id]).filter(Boolean)
    : [];

  let modalLeft = 0, modalTop = 0;
  if (showModal) {
    const GAP = 14, approxW = 160, approxH = 44 + lockedActions.length * 38;
    modalLeft = state.lockedX + GAP;
    modalTop  = state.lockedY - approxH / 2;
    if (modalLeft + approxW > window.innerWidth  - 8) modalLeft = state.lockedX - approxW - GAP;
    if (modalTop < 8)                                 modalTop  = 8;
    if (modalTop + approxH > window.innerHeight  - 8) modalTop  = window.innerHeight - approxH - 8;
  }

  return (
    <>
      {/* ── Indicateur circulaire de survol ── */}
      {showDot && (
        <div
          className="hover-dot-indicator"
          style={{
            position: 'fixed',
            left: state.x + 10,
            top:  state.y - 20,
            width: 14, height: 14,
            borderRadius: '50%',
            background: 'rgba(255,215,0,0.55)',
            border: '2px solid #ffd700',
            boxShadow: '0 0 10px rgba(255,215,0,0.55)',
            pointerEvents: 'none',
            zIndex: 300,
          }}
        />
      )}

      {/* ── Modal épinglé au clic ── */}
      {showModal && lockedActions.length > 0 && (
        <div
          onMouseEnter={() => { hoverState.cancelHide?.(); }}
          onTouchEnd={e => e.stopPropagation()}
          style={{
            position: 'fixed', left: modalLeft, top: modalTop, zIndex: 300,
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
          <div style={{ color: '#ddd', fontSize: 12, fontWeight: 600 }}>{state.lockedLabel}</div>
          {lockedActions.map((action, i) => (
            <button
              key={i}
              onClick={() => {
                useSceneStore.getState().triggerAction(action.toggleKey);
                hoverState.locked      = false;
                hoverState.touchActive = false;
                hoverState.onUpdate?.();
              }}
              style={BTN_STYLE}
            >
              {action.btnLabel}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
