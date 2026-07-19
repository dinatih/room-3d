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
import { positionState } from '@features/scene/positionState';
import { LAYER_NEIGHBORS, LAYER_LIDAR } from '@config';

// ── Actions disponibles ───────────────────────────────────────────────────────

interface ActionDef { 
  btnLabel?: string | (() => string); 
  toggleKey: string;
  type?: 'button' | 'select';
  options?: { value: string; label: string }[];
}

export const WALKER_ANIM_OPTIONS = [
  { value: "idle", label: "Idle / Return to Default" },
  { value: "media/glb-animations/catwalk_sequence_01.glb", label: "Catwalk Sequence 1" },
  { value: "media/glb-animations/catwalk_sequence_02.glb", label: "Catwalk Sequence 2" },
  { value: "media/glb-animations/catwalk_sequence_03.glb", label: "Catwalk Sequence 3" },
  { value: "media/glb-animations/catwalk_sequence_04.glb", label: "Catwalk Sequence 4" },
  { value: "media/glb-animations/catwalk_sequence_05.glb", label: "Catwalk Sequence 5" },
  { value: "media/sandbox/anim_happy_walk_not_in_place.glb", label: "Happy Walk" },
  { value: "media/sandbox/anim_sitting_idle.glb", label: "Sitting Idle" },
  { value: "media/sandbox/anim_sitting_angry.glb", label: "Sitting Angry" },
  { value: "media/sandbox/anim_t_pose.glb", label: "T-Pose de Test" },
  { value: "media/sandbox/anim_jump.glb", label: "Saut" },
  { value: "media/sandbox/anim_sleeping_idle.glb", label: "Dormir" },
  { value: "media/sandbox/anim_laying_idle.glb", label: "Laying Idle" },
  { value: "media/sandbox/anim_skinning_test.glb", label: "Skinning Test" },
  { value: "media/sandbox/anim_samba_dancing.glb", label: "Samba Dancing" },
  { value: "media/sandbox/anim_back_flip_to_uppercut.glb", label: "Back Flip to Uppercut" },
  { value: "media/sandbox/anim_idle.glb", label: "Idle" },
  { value: "media/sandbox/anim_walking.glb", label: "Walking" },
  { value: "media/sandbox/anim_right_turn_90.glb", label: "Right Turn 90" },
  { value: "media/sandbox/anim_left_turn_90.glb", label: "Left Turn 90" },
  { value: "media/sandbox/anim_gangnam_style.glb", label: "Gangnam Style" },
  { value: "media/sandbox/anim_drinking_fountain.glb", label: "Drinking Fountain" },
  { value: "media/sandbox/anim_martelo_do_chau_sem_mao.glb", label: "Martelo Do Chau Sem Mao" },
  { value: "media/sandbox/anim_female_dynamic_pose.glb", label: "Female Dynamic Pose" },
  { value: "media/sandbox/anim_push_up.glb", label: "Push Up" },
  { value: "media/sandbox/anim_laying_idle_1.glb", label: "Laying Idle 1" },
  { value: "media/sandbox/anim_swimming_to_edge.glb", label: "Swimming to Edge" },
  { value: "media/sandbox/anim_dancing_maraschino_step.glb", label: "Dancing Maraschino Step" },
  { value: "media/sandbox/anim_tender_placement.glb", label: "Tender Placement" },
  { value: "media/sandbox/anim_running.glb", label: "Running" },
  { value: "media/sandbox/anim_left_turn.glb", label: "Left Turn" },
  { value: "media/sandbox/anim_right_turn.glb", label: "Right Turn" },
  { value: "media/sandbox/anim_left_turn_2.glb", label: "Left Turn 2" },
  { value: "media/sandbox/anim_right_turn_2.glb", label: "Right Turn 2" },
  { value: "media/sandbox/anim_climbing.glb", label: "Climbing" },
  { value: "media/sandbox/anim_macarena_dance.glb", label: "Macarena Dance" },
  { value: "media/sandbox/anim_knee-push-up.glb", label: "Knee Push Up" }
].sort((a, b) => {
  if (a.value === "idle") return -1;
  if (b.value === "idle") return 1;
  return a.label.localeCompare(b.label, 'fr', { sensitivity: 'base' });
});

const ACTIONS: Record<string, ActionDef> = {
  eastGlassDoor: {
    btnLabel: 'Ouvrir / Fermer Droit',
    toggleKey: 'eastGlassDoor'
  },
  glassDoorLeftOpen: { btnLabel: 'Ouvrir / Fermer Gauche', toggleKey: 'glassDoorV2LeftOpen' },
  glassDoorShutter: {
    btnLabel: () => {
      const pos = useSceneStore.getState().furniture.glassDoorV2ShutterPos;
      return pos === 0 ? 'Volet : OUVERT' : pos === 100 ? 'Volet : FERMÉ' : `Volet : ${pos}% FERMÉ`;
    },
    toggleKey: 'glassDoorV2ShutterPos'
  },
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
  'bed-position':  { btnLabel: () => { const p = positionState['bed-position'];      return p ? `Position ${p.idx + 1}/${p.total}` : 'Changer position'; }, toggleKey: 'bed-position'  },
  'bed-sofa':      { btnLabel: 'Mode canapé',        toggleKey: 'bed-sofa'      },
  'desk1-toggle':  { btnLabel: 'Assis / Debout',     toggleKey: 'desk1-toggle'  },
  'desk1-position':{ btnLabel: () => { const p = positionState['desk1-position'];   return p ? `Position ${p.idx + 1}/${p.total}` : 'Changer position'; }, toggleKey: 'desk1-position'},
  'desk2-toggle':  { btnLabel: 'Assis / Debout',     toggleKey: 'desk2-toggle'  },
  'desk2-position':{ btnLabel: () => { const p = positionState['desk2-position'];   return p ? `Position ${p.idx + 1}/${p.total}` : 'Changer position'; }, toggleKey: 'desk2-position'},
  'smorkull-position': { btnLabel: () => { const p = positionState['smorkull-position']; return p ? `Position ${p.idx + 1}/${p.total}` : 'Changer position'; }, toggleKey: 'smorkull-position' },
  'shiba-replay':      { btnLabel: 'Rejouer',           toggleKey: 'shiba-replay'      },
  'nestMini':          { btnLabel: 'Ok Google',         toggleKey: 'nestMini'          },
  'tv':                { btnLabel: 'Allumer / Éteindre', toggleKey: 'tvOn'             },
  'bin':               { btnLabel: 'Ouvrir / Fermer',   toggleKey: 'bin-toggle'       },
  airPerformerPower:       { btnLabel: 'Allumer / Éteindre', toggleKey: 'airPerformerPower' },
  airPerformerMode:        { btnLabel: 'Changer Mode',       toggleKey: 'airPerformerMode'  },
  airPerformerSpeed:       { btnLabel: 'Vitesse +/-',        toggleKey: 'airPerformerSpeed' },
  'airperformer-position': { btnLabel: () => { const p = positionState['airperformer-position']; return p ? `Position ${p.idx + 1}/${p.total}` : 'Changer position'; }, toggleKey: 'airperformer-position' },
  'raskog-large-position': { btnLabel: () => { const p = positionState['raskog-large-position'];    return p ? `Position ${p.idx + 1}/${p.total}` : 'Changer position'; }, toggleKey: 'raskog-large-position'    },
  'walker-meshes':         { btnLabel: 'Meshes',             toggleKey: 'walker-meshes'     },
  'sofa-arm-left':         { btnLabel: 'Accoudoir Gauche',  toggleKey: 'sofaArmLeft'       },
  'sofa-arm-right':        { btnLabel: 'Accoudoir Droit',   toggleKey: 'sofaArmRight'      },
  'walker-anim-lara':      { btnLabel: 'Jouer une animation', toggleKey: 'walker-anim-lara', type: 'select', options: WALKER_ANIM_OPTIONS },
  'walker-anim-xbot':      { btnLabel: 'Jouer une animation', toggleKey: 'walker-anim-xbot', type: 'select', options: WALKER_ANIM_OPTIONS },
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
        continue;
      }
      return null;
    }

    // ── Souris : hover → dot ──────────────────────────────────────────────────
    let showTimer: ReturnType<typeof setTimeout> | null = null;
    let currentHoverObject: string | null = null;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      if (hoverState.touchActive) return;
      const now = performance.now();
      if (now - lastMove < 32) return;
      lastMove = now;

      const found = raycastAt(e.clientX, e.clientY);
      const newHoverId = found ? found.actionIds.join(',') : null;

      if (found) {
        cancelHide();
        
        // Si on survole le même objet, on met à jour la position
        if (currentHoverObject === newHoverId) {
          hoverState.x = e.clientX;
          hoverState.y = e.clientY;
          hoverState.onUpdate?.();
        } 
        // Si c'est un nouvel objet interactif
        else {
          currentHoverObject = newHoverId;
          hoverState.visible = false;
          hoverState.onUpdate?.();
          
          if (showTimer) clearTimeout(showTimer);
          showTimer = setTimeout(() => {
            hoverState.visible   = true;
            hoverState.label     = found.label;
            hoverState.actionIds = found.actionIds;
            canvas.style.cursor  = 'pointer';
            hoverState.onUpdate?.();
          }, 2000);
        }
      } else {
        // Plus d'objet interactif sous la souris
        if (showTimer) { clearTimeout(showTimer); showTimer = null; }
        currentHoverObject = null;
        scheduleHide();
        canvas.style.cursor  = '';
      }
    };

    const onLeave = () => { 
      if (showTimer) { clearTimeout(showTimer); showTimer = null; }
      currentHoverObject = null;
      scheduleHide(); 
    };

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
  const dotRef = React.useRef<HTMLDivElement>(null);
  const [state, setState] = useState({
    visible: false, label: '', actionIds: [] as string[],
    locked: false, lockedLabel: '', lockedActionIds: [] as string[], lockedX: 0, lockedY: 0,
  });

  useEffect(() => {
    injectPulse();
    hoverState.onUpdate = () => {
      // Direct DOM update for tracking (zero lag)
      if (dotRef.current) {
        dotRef.current.style.left = `${hoverState.x + 10}px`;
        dotRef.current.style.top  = `${hoverState.y - 20}px`;
      }

      setState(prev => {
        // Only trigger React state update if visible/locked state changes, not just coordinates
        if (prev.visible !== hoverState.visible || 
            prev.locked !== hoverState.locked || 
            prev.lockedX !== hoverState.lockedX || 
            prev.lockedY !== hoverState.lockedY ||
            prev.actionIds.join(',') !== hoverState.actionIds.join(',')) {
          return {
            visible:         hoverState.visible,
            label:           hoverState.label,
            actionIds:       hoverState.actionIds,
            locked:          hoverState.locked,
            lockedLabel:     hoverState.lockedLabel,
            lockedActionIds: hoverState.lockedActionIds,
            lockedX:         hoverState.lockedX,
            lockedY:         hoverState.lockedY,
          };
        }
        return prev;
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
      <div
        ref={dotRef}
        className="hover-dot-indicator"
        style={{
          position: 'fixed',
          display: showDot ? 'block' : 'none',
          left: hoverState.x + 10,
          top:  hoverState.y - 20,
          width: 14, height: 14,
          borderRadius: '50%',
          background: 'rgba(255,215,0,0.55)',
          border: '2px solid #ffd700',
          boxShadow: '0 0 10px rgba(255,215,0,0.55)',
          pointerEvents: 'none',
          zIndex: 300,
        }}
      />

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
          {lockedActions.map((action, i) => {
            if (action.type === 'select') {
              return (
                <select
                  key={i}
                  style={BTN_STYLE}
                  onChange={(e) => {
                    document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: action.toggleKey, value: e.target.value } }));
                    // Don't close hover overlay on select change
                    hoverState.onUpdate?.();
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>{action.btnLabel ? (typeof action.btnLabel === 'function' ? action.btnLabel() : action.btnLabel) : "Choisir une animation..."}</option>
                  {action.options?.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              );
            }
            return (
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
                {typeof action.btnLabel === 'function' ? action.btnLabel() : action.btnLabel}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
