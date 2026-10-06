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
import { DOUBLE_BED_POSITIONS } from './furniturePositions';
import { cameraState } from '@features/scene/cameraState';
import { appLog } from '@features/ui/AppConsole';
import { LAYER_NEIGHBORS, LAYER_LIDAR } from '@config';
import { getSmartObject } from './ai/smartObjectRegistry';
import { duoSessionManager } from './ai/duoSessionManager';
import { isCharacterVisibleInMode } from './characterConfig';

// ── Actions disponibles ───────────────────────────────────────────────────────

interface ActionDef { 
  btnLabel?: string | (() => string); 
  toggleKey: string;
  type?: 'button' | 'select';
  options?: { value: string; label: string }[];
}



import { WIGS_ITEMS } from '@features/inventory/inventoryData';

const mappedWigOptions = WIGS_ITEMS.map((wig, i) => ({
  value: i.toString(),
  label: wig.name
}));

const HAIR_COLORS = [
  { value: 'naturel', label: 'Naturel 🟫' },
  { value: 'noir', label: 'Noir ⚫' },
  { value: 'brun', label: 'Brun 🟫' },
  { value: 'chatain', label: 'Châtain 🟤' },
  { value: 'blond', label: 'Blond 🌟' },
  { value: 'roux', label: 'Roux 🦊' },
  { value: 'blanc', label: 'Blanc ❄️' },
  { value: 'bleu', label: 'Bleu 💙' },
  { value: 'vert', label: 'Vert 💚' },
  { value: 'rouge', label: 'Rouge ❤️' },
  { value: 'rose', label: 'Rose 🌸' },
  { value: 'violet', label: 'Violet 💜' },
  { value: 'arc-en-ciel', label: 'Arc-en-ciel 🌈' },
];

function makeMannequinActions(loc: string): Record<string, ActionDef> {
  return {
    [`mannequin-${loc}-random`]: { btnLabel: '🎲 Aléatoire complet', toggleKey: `mannequin-${loc}-random` },
    [`mannequin-${loc}-wig`]:   { btnLabel: 'Perruque 💇', toggleKey: `mannequin-${loc}-wig`, type: 'select', options: mappedWigOptions },
    [`mannequin-${loc}-color`]: { btnLabel: 'Couleur cheveux 🎨', toggleKey: `mannequin-${loc}-color`, type: 'select', options: HAIR_COLORS },
    [`mannequin-${loc}-wind`]:  { btnLabel: 'Vent 💨', toggleKey: `mannequin-${loc}-wind` },
  };
}

function makePositionAction(key: string): Record<string, ActionDef> {
  return {
    [key]: {
      btnLabel: () => {
        const p = positionState[key];
        return p ? `Position ${p.idx + 1}/${p.total}` : 'Changer position';
      },
      toggleKey: key,
    },
  };
}

const MANNEQUIN_ACTIONS: Record<string, ActionDef> = {
  ...makeMannequinActions('kallax-nw'),
  ...makeMannequinActions('kallax-ne'),
  ...makeMannequinActions('meubleT'),
  ...makeMannequinActions('lack'),
  ...makeMannequinActions('lamp'),
};

const POSITION_ACTIONS: Record<string, ActionDef> = {
  ...makePositionAction('desk1-position'),
  ...makePositionAction('desk2-position'),
  ...makePositionAction('smorkull-position'),
  ...makePositionAction('airperformer-position'),
  ...makePositionAction('raskog-large-position'),
};

const ACTIONS: Record<string, ActionDef> = {
  ...MANNEQUIN_ACTIONS,
  ...POSITION_ACTIONS,

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
  showerDoor:     { btnLabel: 'Ouvrir / Fermer',    toggleKey: 'showerDoor'    },
  corrDoors:      { btnLabel: 'Ouvrir / Fermer',    toggleKey: 'corrDoors'     },
  sdbClosetL:     { btnLabel: 'Ouvrir / Fermer Gauche', toggleKey: 'sdbClosetL' },
  sdbClosetR:     { btnLabel: 'Ouvrir / Fermer Droite', toggleKey: 'sdbClosetR' },
  cbnWest:        { btnLabel: 'Ouvrir / Fermer',    toggleKey: 'cbnWest'       },
  cbnEast:        { btnLabel: 'Ouvrir / Fermer',    toggleKey: 'cbnEast'       },
  freezer:        { btnLabel: 'Ouvrir / Fermer',    toggleKey: 'freezer'       },
  fridge:         { btnLabel: 'Ouvrir / Fermer',    toggleKey: 'fridge'        },
  ninja:          { btnLabel: 'Ouvrir / Fermer',    toggleKey: 'ninja'         },
  cabinet:        { btnLabel: 'Ouvrir / Fermer',    toggleKey: 'cabinet'       },
  'wc-lid-toggle':  { btnLabel: 'Ouvrir / Fermer Couvercle', toggleKey: 'wc-lid-toggle'  },
  'wc-seat-toggle': { btnLabel: 'Ouvrir / Fermer Siège',     toggleKey: 'wc-seat-toggle' },
  'wc-flush':       { btnLabel: 'Appuyer sur la chasse',     toggleKey: 'wc-flush'       },
  'lamp-toggle':   { btnLabel: 'Allumer / Éteindre', toggleKey: 'lampOn'        },
  lampBath:        { btnLabel: () => useSceneStore.getState().furniture.lampBath ? 'Éteindre SDB' : 'Allumer SDB', toggleKey: 'lampBath' },
  lampCorridor:    { btnLabel: () => useSceneStore.getState().furniture.lampCorridor ? 'Éteindre Couloir' : 'Allumer Couloir', toggleKey: 'lampCorridor' },
  'bed-double':    { btnLabel: () => useSceneStore.getState().furniture.bedDouble ? 'Lits séparés' : 'Lit double', toggleKey: 'bed-double' },
  'bed-position':  { btnLabel: () => {
    const p = positionState['bed-position'];
    return p ? `Position (${DOUBLE_BED_POSITIONS[p.idx]?.label ?? p.idx + 1}) →` : 'Changer position →';
  }, toggleKey: 'bed-position' },
  'desk1-toggle':  { btnLabel: 'Assis / Debout',     toggleKey: 'desk1-toggle'  },
  'desk2-toggle':  { btnLabel: 'Assis / Debout',     toggleKey: 'desk2-toggle'  },
  'shiba-replay':      { btnLabel: 'Rejouer',           toggleKey: 'shiba-replay'      },
  'robin-bird-replay': { btnLabel: 'Rejouer',           toggleKey: 'robin-bird-replay' },
  'nestMini':          { btnLabel: 'Ok Google',         toggleKey: 'nestMini'          },
  'tv':                { btnLabel: 'Allumer / Éteindre', toggleKey: 'tvOn'             },
  'bin':               { btnLabel: 'Ouvrir / Fermer',   toggleKey: 'bin-toggle'       },
  airPerformerPower:       { btnLabel: 'Allumer / Éteindre', toggleKey: 'airPerformerPower' },
  airPerformerMode:        { btnLabel: 'Changer Mode',       toggleKey: 'airPerformerMode'  },
  airPerformerSpeed:       { btnLabel: 'Vitesse +/-',        toggleKey: 'airPerformerSpeed' },
  'character-meshes':         { btnLabel: 'Meshes',             toggleKey: 'character-meshes'     },
  'sofa-arm-left':         { btnLabel: 'Accoudoir Gauche',  toggleKey: 'sofaArmLeft'       },
  'sofa-arm-right':        { btnLabel: 'Accoudoir Droit',   toggleKey: 'sofaArmRight'      },
  'lara-haircut':          { btnLabel: 'Coupe de cheveux 💇‍♀️', toggleKey: 'lara-haircut', type: 'select', options: [
    { value: 'original', label: 'Coupe d\'origine 👱‍♀️' },
    ...WIGS_ITEMS.map(wig => ({
      value: wig.id,
      label: wig.name
    }))
  ] },
  utdrag: {
    btnLabel: () => useSceneStore.getState().extraStates.utdrag ? 'Rentrer la hotte' : 'Déplier la hotte',
    toggleKey: 'utdrag',
  },
};

// Helper to resolve action definition (supports dynamic actions like select-character-*)
function getActionDef(actionId: string): ActionDef | undefined {
  if (ACTIONS[actionId]) return ACTIONS[actionId];
  if (actionId.startsWith('select-character-')) {
    return {
      btnLabel: '🎯 Définir comme personnage actif',
      toggleKey: actionId,
    };
  }
  if (actionId.startsWith('smart-object:::')) {
    // Format : smart-object:::{objectId}:::{slotId}
    const [, objectId, slotId] = actionId.split(':::');
    const obj = getSmartObject(objectId);
    const slot = obj?.slots.find(s => s.slotId === slotId);
    const slotName = slot?.name || slotId || 'Interagir';
    const prefix = slot?.isDuo ? '🛋️ Duo' : '⚡ Utiliser';
    return {
      btnLabel: `${prefix} (${slotName})`,
      toggleKey: actionId,
    };
  }
  return undefined;
}

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
    let hideTimer: ReturnType<typeof setTimeout> | null = null;
    let interactiveCache: THREE.Object3D[] = [];
    let occluderCache: THREE.Object3D[] = [];
    let lastCacheTime = 0;
    const downPos = { x: 0, y: 0 };
    let isDragGesture = false;

    function refreshCaches() {
      const now = performance.now();
      if (now - lastCacheTime < 3000 && interactiveCache.length > 0) return;
      interactiveCache = [];
      occluderCache = [];
      scene.traverse(obj => {
        if (obj.userData?.hoverAction) {
          interactiveCache.push(obj);
        }
        // Collecter uniquement les structures opaques (murs, cloisons, portes) comme occulteurs potentiels
        if (
          obj.visible &&
          (
            obj.userData?.brickType === 'wall' ||
            obj.userData?.isDoor ||
            obj.name === 'merged-walls' ||
            obj.name?.includes('door') ||
            obj.name?.includes('Door') ||
            obj.name === 'walls-group'
          )
        ) {
          occluderCache.push(obj);
        }
      });
      lastCacheTime = now;
    }

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

    const occlusionRaycaster = new THREE.Raycaster();

    function isOccluded(targetPoint: THREE.Vector3, targetObj: THREE.Object3D): boolean {
      const dir = targetPoint.clone().sub(camera.position);
      const dist = dir.length();
      if (dist < 1.0) return false;
      dir.normalize();

      occlusionRaycaster.set(camera.position, dir);
      occlusionRaycaster.camera = camera;
      occlusionRaycaster.near = 0.5;
      occlusionRaycaster.far = Math.max(0.6, dist - 1.0);
      occlusionRaycaster.layers.enableAll();
      occlusionRaycaster.layers.disable(LAYER_NEIGHBORS);
      occlusionRaycaster.layers.disable(LAYER_LIDAR);

      refreshCaches();
      // Test d'occlusion ciblé sur la vingtaine de maillages de murs/portes au lieu des 10 000+ objets de scene.children
      const occHits = occlusionRaycaster.intersectObjects(occluderCache, true);

      // Trouver la racine de l'objet cible pour éviter l'auto-occlusion
      let targetRoot: THREE.Object3D = targetObj;
      while (targetRoot.parent && targetRoot.parent !== scene) {
        if (targetRoot.userData?.hoverAction) break;
        targetRoot = targetRoot.parent;
      }

      for (const occ of occHits) {
        if (!occ.object.visible) continue;

        // Ignorer les éléments non surfaciques (lignes, sprites, points)
        if ((occ.object as any).isLine || (occ.object as any).isSprite || (occ.object as any).isPoints) continue;

        // Ignorer si l'occulteur fait partie du même objet interactif
        let cur: THREE.Object3D | null = occ.object;
        let isSelf = false;
        while (cur) {
          if (cur === targetRoot || cur === targetObj || cur.userData?.hoverAction === targetRoot.userData?.hoverAction) {
            isSelf = true;
            break;
          }
          cur = cur.parent;
        }
        if (isSelf) continue;

        // Ignorer plafonds, sols et helpers
        if (occ.object.userData?.brickType === 'ceiling' || occ.object.userData?.brickType === 'ground') continue;
        if (occ.object.userData?.isHelper || occ.object.name?.includes('helper') || occ.object.name?.includes('Helper')) continue;

        // Ignorer les objets transparents (verre, portes vitrées, etc.)
        const mat = (occ.object as THREE.Mesh).material as any;
        if (mat) {
          const isTransparent = Array.isArray(mat)
            ? mat.every(m => (m.transparent && (m.opacity ?? 1) < 0.4) || m.transmission > 0.4)
            : ((mat.transparent && (mat.opacity ?? 1) < 0.4) || mat.transmission > 0.4);
          if (isTransparent) continue;
        }

        // Un obstacle opaque se trouve entre la caméra et l'objet
        return true;
      }

      return false;
    }

    function raycastAt(clientX: number, clientY: number): { label: string; actionIds: string[] } | null {
      if (cameraState.isDragging) return null;

      refreshCaches();
      if (interactiveCache.length === 0) return null;

      const rect = canvas.getBoundingClientRect();
      pointer.x =  ((clientX - rect.left) / rect.width)  * 2 - 1;
      pointer.y = -((clientY - rect.top)  / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      raycaster.layers.enableAll();
      raycaster.layers.disable(LAYER_NEIGHBORS);
      raycaster.layers.disable(LAYER_LIDAR);
      const hits = raycaster.intersectObjects(interactiveCache, true);
      let bestAction: { label: string; actionIds: string[] } | null = null;

      for (const hit of hits) {
        if (!hit.object.visible) continue;
        const mat = (hit.object as THREE.Mesh).material as THREE.Material & {
          transparent?: boolean; opacity?: number;
        };
        const isTransparent = Array.isArray(mat)
          ? (mat as THREE.Material[]).every(m =>
              (m as typeof mat).transparent && ((m as typeof mat).opacity ?? 1) < 0.3)
          : mat?.transparent && (mat?.opacity ?? 1) < 0.3;
        if (!hit.object.userData?.isHoverProxy && isTransparent) continue;
        if (hit.object.userData?.brickType === 'ceiling') continue;
        if (hit.object.userData?.brickType === 'ground')  continue;

        const action = resolveAction(hit.object);
        if (action && action.actionIds.some(id => getActionDef(id))) {
          // Vérifier si l'objet est masqué par un mur ou obstacle devant lui
          if (isOccluded(hit.point, hit.object)) {
            continue;
          }

          // Si on touche un smart-object (ex: cercle AiZone Dormir/S'asseoir), priorité absolue immédiate
          if (action.actionIds.some(id => id.startsWith('smart-object:::'))) {
            return action;
          }
          if (!bestAction) {
            bestAction = action;
            break;
          }
        }
      }
      return bestAction;
    }

    // ── Souris : hover → dot réactif (250ms) et suivi fluide ──
    let showTimer: ReturnType<typeof setTimeout> | null = null;
    let currentHoverKey: string | null = null;
    let lastClientX = 0;
    let lastClientY = 0;
    let lastMoveCheck = 0;

    const onPointerDown = (e: PointerEvent) => {
      downPos.x = e.clientX;
      downPos.y = e.clientY;
      isDragGesture = false;

      // Si double-clic ou clic multiple rapide, fermer immédiatement tout menu
      if (e.detail >= 2) {
        if (showTimer) { clearTimeout(showTimer); showTimer = null; }
        currentHoverKey = null;
        if (hoverState.locked) {
          hoverState.locked = false;
        }
        hoverState.visible = false;
        hoverState.onUpdate?.();
      }
    };

    function checkHover() {
      if (cameraState.isDragging || isDragGesture) return;

      const found = raycastAt(lastClientX, lastClientY);
      const newKey = found ? found.actionIds.join(',') : null;

      if (found && newKey) {
        cancelHide();
        if (currentHoverKey === newKey) {
          hoverState.x = lastClientX;
          hoverState.y = lastClientY;
          if (!hoverState.visible) {
            hoverState.visible   = true;
            hoverState.label     = found.label;
            hoverState.actionIds = found.actionIds;
            canvas.style.cursor  = 'pointer';
          }
          hoverState.onUpdate?.();
        } else {
          currentHoverKey = newKey;
          if (showTimer) clearTimeout(showTimer);
          showTimer = setTimeout(() => {
            showTimer = null;
            if (cameraState.isDragging || isDragGesture) return;
            const recheck = raycastAt(lastClientX, lastClientY);
            if (recheck && recheck.actionIds.join(',') === newKey) {
              hoverState.visible   = true;
              hoverState.x         = lastClientX;
              hoverState.y         = lastClientY;
              hoverState.label     = recheck.label;
              hoverState.actionIds = recheck.actionIds;
              canvas.style.cursor  = 'pointer';
              hoverState.onUpdate?.();
            }
          }, 250);
        }
      } else {
        currentHoverKey = null;
        if (showTimer) { clearTimeout(showTimer); showTimer = null; }
        scheduleHide();
      }
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      if (hoverState.touchActive) return;

      if (e.buttons > 0 || Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y) > 6) {
        isDragGesture = true;
      }

      if (isDragGesture || cameraState.isDragging || e.buttons > 0) {
        if (showTimer) { clearTimeout(showTimer); showTimer = null; }
        currentHoverKey = null;
        scheduleHide();
        return;
      }

      lastClientX = e.clientX;
      lastClientY = e.clientY;

      // Si le point est déjà visible sur un objet, mise à jour fluide de ses coordonnées DOM directes
      if (hoverState.visible && !hoverState.locked) {
        hoverState.x = e.clientX;
        hoverState.y = e.clientY;
        hoverState.onUpdate?.();
      }

      // Throttle les raycasts pendant le déplacement de la souris (max 1 fois toutes les 80ms)
      const now = performance.now();
      if (now - lastMoveCheck < 80) {
        if (showTimer) clearTimeout(showTimer);
        showTimer = setTimeout(checkHover, 250);
        return;
      }
      lastMoveCheck = now;

      checkHover();
    };

    const onLeave = () => { 
      if (showTimer) { clearTimeout(showTimer); showTimer = null; }
      currentHoverKey = null;
      scheduleHide(); 
    };

    const onDblClick = () => {
      if (showTimer) { clearTimeout(showTimer); showTimer = null; }
      currentHoverKey = null;
      hoverState.locked = false;
      hoverState.visible = false;
      hoverState.onUpdate?.();
    };

    // ── Clic : épingle / ferme le modal ──────────────────────────────────────
    const onClick = (e: MouseEvent) => {
      if (hoverState.touchActive) return;

      // Double-clic, glissé de caméra ou caméra en cours de drag -> ignorer et fermer
      if (isDragGesture || e.detail >= 2 || cameraState.isDragging) {
        if (hoverState.locked) {
          hoverState.locked = false;
          hoverState.onUpdate?.();
        }
        return;
      }

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

    canvas.addEventListener('pointerdown',  onPointerDown);
    canvas.addEventListener('pointermove',  onMove);
    canvas.addEventListener('pointerleave', onLeave);
    canvas.addEventListener('click',        onClick);
    canvas.addEventListener('dblclick',     onDblClick);
    window.addEventListener('keydown',      onKeyDown);
    canvas.addEventListener('touchstart',   onTouchStart, { passive: true });
    canvas.addEventListener('touchmove',    onTouchMove,  { passive: true });
    canvas.addEventListener('touchend',     onTouchEnd);
    return () => {
      canvas.removeEventListener('pointerdown',  onPointerDown);
      canvas.removeEventListener('pointermove',  onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('click',        onClick);
      canvas.removeEventListener('dblclick',     onDblClick);
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
  
  // S'abonne aux changements d'états du mobilier pour re-rendre les labels réactifs (ex: Ouvrir/Fermer)
  useSceneStore(state => state.furniture);
  
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

  const [selectedValues, setSelectedValues] = useState<Record<string, string>>({});

  useEffect(() => {
    const handler = (e: Event) => {
      const { key, value } = (e as CustomEvent).detail;
      if (value !== undefined) {
        setSelectedValues(prev => ({ ...prev, [key]: String(value) }));
      }
    };
    document.addEventListener('furniture-toggle', handler);
    return () => document.removeEventListener('furniture-toggle', handler);
  }, []);

  const lockedActions = showModal
    ? state.lockedActionIds.map(id => getActionDef(id)).filter(Boolean) as ActionDef[]
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
          onPointerDown={e => e.stopPropagation()}
          onClick={e => e.stopPropagation()}
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
              const opts = action.options ?? [];
              const val = selectedValues[action.toggleKey] ?? '';

              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <select
                    style={BTN_STYLE}
                    onKeyDown={(e) => e.stopPropagation()}
                    value={val}
                    onChange={(e) => {
                      const newVal = e.target.value;
                      setSelectedValues(prev => ({ ...prev, [action.toggleKey]: newVal }));
                      document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: action.toggleKey, value: newVal } }));
                      hoverState.onUpdate?.();
                    }}
                  >
                    <option value="" disabled>{action.btnLabel ? (typeof action.btnLabel === 'function' ? action.btnLabel() : action.btnLabel) : "Choisir une option..."} ({opts.length})</option>
                    {opts.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.value === val ? `▶ ${opt.label}` : opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              );
            }
            return (
              <button
                key={i}
                onClick={() => {
                  if (action.toggleKey.startsWith('select-character-')) {
                    const targetCharacterId = action.toggleKey.replace('select-character-', '');
                    useSceneStore.getState().setActiveCharacterId(targetCharacterId);
                    appLog(targetCharacterId, `🎯 Personnage actif défini : ${state.lockedLabel}`);
                  } else if (action.toggleKey.startsWith('smart-object:::')) {
                    const [, objectId, slotId] = action.toggleKey.split(':::');
                    const obj = getSmartObject(objectId);
                    const slot = obj?.slots.find(s => s.slotId === slotId);
                    const targetPos = slot?.offset ?? [0, 0, 0];

                    if (slot?.isDuo) {
                      const activeId = useSceneStore.getState().activeCharacterId;
                      const leaderId = (activeId && activeId !== 'shiba' && activeId !== 'robin')
                        ? activeId
                        : undefined;

                      const duoResult = duoSessionManager.startDuoSession(
                        objectId,
                        slotId,
                        leaderId
                      );
                      // Le leader (Rôle A) doit être invité explicitement depuis le HoverMenu
                      // (startDuoOnSmartObject ne dispatche plus d'event vers lui)
                      if (duoResult) {
                        document.dispatchEvent(new CustomEvent('npc-invite-duo', {
                          detail: {
                            targetId: duoResult.targetA,
                            fromId: 'HoverMenu',
                            objectId,
                            slotId,
                            forceRole: 'roleA',
                            targetPos: duoResult.posA,
                            targetRotY: duoResult.rotA,
                          }
                        }));
                      }
                    } else {
                      // Trouver le personnage le plus proche (en excluant les animaux et les PNJs masqués)
                      let closestCharId: string | null = null;
                      let minDistance = Infinity;

                      const store = useSceneStore.getState();
                      const laraCount = store.layers.laraCount ?? 4;
                      const extraChars = store.layers.extraCharacters ?? false;
                      const activeCharacterId = store.activeCharacterId;
                      const activeExtraIds = store.activeExtraIds;
                      const activeMainIds = store.activeMainIds;

                      const candidateIds = Object.keys(cameraState.positions).filter(
                        (charId) =>
                          charId !== 'shiba' &&
                          charId !== 'robin' &&
                          (isCharacterVisibleInMode(charId, laraCount, activeCharacterId, extraChars, activeExtraIds, activeMainIds) ||
                            charId === activeCharacterId)
                      );

                      for (const charId of candidateIds) {
                        const pos = cameraState.positions[charId];
                        if (!pos) continue;
                        const dist = Math.hypot(pos.x - targetPos[0], pos.z - targetPos[2]);
                        if (dist < minDistance) {
                          minDistance = dist;
                          closestCharId = charId;
                        }
                      }

                      if (closestCharId) {
                        appLog(closestCharId, `🤖 Ordre SmartObject: ${closestCharId} assigné à ${obj?.name ?? objectId} (${slot?.name ?? slotId})`);
                        document.dispatchEvent(
                          new CustomEvent('agent-force-smartobject', {
                            detail: {
                              targetId: closestCharId,
                              objectId,
                              slotId,
                            },
                          })
                        );
                      } else {
                        appLog('system', `⚠️ Aucun personnage actif trouvé pour interagir avec ${objectId}`);
                      }
                    }
                  } else {
                    useSceneStore.getState().triggerAction(action.toggleKey);
                  }
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
