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
import { cameraState } from '@features/scene/cameraState';
import { appLog } from '@features/ui/AppConsole';
import { LAYER_NEIGHBORS, LAYER_LIDAR } from '@config';
import { WALKER_ANIM_OPTIONS } from './animOptions';
import { getSmartObject } from './ai/smartObjectRegistry';

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

const ACTIONS: Record<string, ActionDef> = {
  'mannequin-kallax-nw-random': { btnLabel: '🎲 Aléatoire complet', toggleKey: 'mannequin-kallax-nw-random' },
  'mannequin-kallax-nw-wig':   { btnLabel: 'Perruque 💇', toggleKey: 'mannequin-kallax-nw-wig', type: 'select', options: mappedWigOptions },
  'mannequin-kallax-nw-color': { btnLabel: 'Couleur cheveux 🎨', toggleKey: 'mannequin-kallax-nw-color', type: 'select', options: [
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
  ] },
  'mannequin-kallax-nw-wind':  { btnLabel: 'Vent 💨', toggleKey: 'mannequin-kallax-nw-wind' },

  'mannequin-kallax-ne-random': { btnLabel: '🎲 Aléatoire complet', toggleKey: 'mannequin-kallax-ne-random' },
  'mannequin-kallax-ne-wig':   { btnLabel: 'Perruque 💇', toggleKey: 'mannequin-kallax-ne-wig', type: 'select', options: mappedWigOptions },
  'mannequin-kallax-ne-color': { btnLabel: 'Couleur cheveux 🎨', toggleKey: 'mannequin-kallax-ne-color', type: 'select', options: [
    { value: 'naturel', label: 'Naturel 🟫' },
    { value: 'noir', label: 'Noir ⚫' },
    { value: 'brun', label: 'Brun 🟫' },
    { value: 'chatain', label: 'Châtain 🟤' },
    { value: 'blond', label: 'Blond 🌟' },
    { value: 'roux', label: 'Roux 🦊' },
    { value: 'rouge', label: 'Rouge ❤️' },
    { value: 'blanc', label: 'Blanc ❄️' },
    { value: 'bleu', label: 'Bleu 💙' },
    { value: 'vert', label: 'Vert 💚' },
    { value: 'rose', label: 'Rose 🌸' },
    { value: 'violet', label: 'Violet 💜' },
    { value: 'arc-en-ciel', label: 'Arc-en-ciel 🌈' },
  ] },
  'mannequin-kallax-ne-wind':  { btnLabel: 'Vent 💨', toggleKey: 'mannequin-kallax-ne-wind' },

  'mannequin-meubleT-random': { btnLabel: '🎲 Aléatoire complet', toggleKey: 'mannequin-meubleT-random' },
  'mannequin-meubleT-wig':   { btnLabel: 'Perruque 💇', toggleKey: 'mannequin-meubleT-wig', type: 'select', options: mappedWigOptions },
  'mannequin-meubleT-color': { btnLabel: 'Couleur cheveux 🎨', toggleKey: 'mannequin-meubleT-color', type: 'select', options: [
    { value: 'naturel', label: 'Naturel 🟫' },
    { value: 'noir', label: 'Noir ⚫' },
    { value: 'brun', label: 'Brun 🟫' },
    { value: 'chatain', label: 'Châtain 🟤' },
    { value: 'blond', label: 'Blond 🌟' },
    { value: 'roux', label: 'Roux 🦊' },
    { value: 'rouge', label: 'Rouge ❤️' },
    { value: 'blanc', label: 'Blanc ❄️' },
    { value: 'bleu', label: 'Bleu 💙' },
    { value: 'vert', label: 'Vert 💚' },
    { value: 'rose', label: 'Rose 🌸' },
    { value: 'violet', label: 'Violet 💜' },
    { value: 'arc-en-ciel', label: 'Arc-en-ciel 🌈' },
  ] },
  'mannequin-meubleT-wind':  { btnLabel: 'Vent 💨', toggleKey: 'mannequin-meubleT-wind' },

  'mannequin-lack-random': { btnLabel: '🎲 Aléatoire complet', toggleKey: 'mannequin-lack-random' },
  'mannequin-lack-wig':   { btnLabel: 'Perruque 💇', toggleKey: 'mannequin-lack-wig', type: 'select', options: mappedWigOptions },
  'mannequin-lack-color': { btnLabel: 'Couleur cheveux 🎨', toggleKey: 'mannequin-lack-color', type: 'select', options: [
    { value: 'naturel', label: 'Naturel 🟫' },
    { value: 'noir', label: 'Noir ⚫' },
    { value: 'brun', label: 'Brun 🟫' },
    { value: 'chatain', label: 'Châtain 🟤' },
    { value: 'blond', label: 'Blond 🌟' },
    { value: 'roux', label: 'Roux 🦊' },
    { value: 'rouge', label: 'Rouge ❤️' },
    { value: 'blanc', label: 'Blanc ❄️' },
    { value: 'bleu', label: 'Bleu 💙' },
    { value: 'vert', label: 'Vert 💚' },
    { value: 'rose', label: 'Rose 🌸' },
    { value: 'violet', label: 'Violet 💜' },
    { value: 'arc-en-ciel', label: 'Arc-en-ciel 🌈' },
  ] },
  'mannequin-lack-wind':  { btnLabel: 'Vent 💨', toggleKey: 'mannequin-lack-wind' },

  'mannequin-lamp-random': { btnLabel: '🎲 Aléatoire complet', toggleKey: 'mannequin-lamp-random' },
  'mannequin-lamp-wig':   { btnLabel: 'Perruque 💇', toggleKey: 'mannequin-lamp-wig', type: 'select', options: mappedWigOptions },
  'mannequin-lamp-color': { btnLabel: 'Couleur cheveux 🎨', toggleKey: 'mannequin-lamp-color', type: 'select', options: [
    { value: 'naturel', label: 'Naturel 🟫' },
    { value: 'noir', label: 'Noir ⚫' },
    { value: 'brun', label: 'Brun 🟫' },
    { value: 'chatain', label: 'Châtain 🟤' },
    { value: 'blond', label: 'Blond 🌟' },
    { value: 'roux', label: 'Roux 🦊' },
    { value: 'rouge', label: 'Rouge ❤️' },
    { value: 'blanc', label: 'Blanc ❄️' },
    { value: 'bleu', label: 'Bleu 💙' },
    { value: 'vert', label: 'Vert 💚' },
    { value: 'rose', label: 'Rose 🌸' },
    { value: 'violet', label: 'Violet 💜' },
    { value: 'arc-en-ciel', label: 'Arc-en-ciel 🌈' },
  ] },
  'mannequin-lamp-wind':  { btnLabel: 'Vent 💨', toggleKey: 'mannequin-lamp-wind' },

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
    const labels = ['Centré', 'Mur Ouest', 'Mur Est'];
    return p ? `Position (${labels[p.idx] ?? p.idx + 1}) →` : 'Changer position →';
  }, toggleKey: 'bed-position' },
  'desk1-toggle':  { btnLabel: 'Assis / Debout',     toggleKey: 'desk1-toggle'  },
  'desk1-position':{ btnLabel: () => { const p = positionState['desk1-position'];   return p ? `Position ${p.idx + 1}/${p.total}` : 'Changer position'; }, toggleKey: 'desk1-position'},
  'desk2-toggle':  { btnLabel: 'Assis / Debout',     toggleKey: 'desk2-toggle'  },
  'desk2-position':{ btnLabel: () => { const p = positionState['desk2-position'];   return p ? `Position ${p.idx + 1}/${p.total}` : 'Changer position'; }, toggleKey: 'desk2-position'},
  'smorkull-position': { btnLabel: () => { const p = positionState['smorkull-position']; return p ? `Position ${p.idx + 1}/${p.total}` : 'Changer position'; }, toggleKey: 'smorkull-position' },
  'shiba-replay':      { btnLabel: 'Rejouer',           toggleKey: 'shiba-replay'      },
  'robin-bird-replay': { btnLabel: 'Rejouer',           toggleKey: 'robin-bird-replay' },
  'nestMini':          { btnLabel: 'Ok Google',         toggleKey: 'nestMini'          },
  'tv':                { btnLabel: 'Allumer / Éteindre', toggleKey: 'tvOn'             },
  'bin':               { btnLabel: 'Ouvrir / Fermer',   toggleKey: 'bin-toggle'       },
  airPerformerPower:       { btnLabel: 'Allumer / Éteindre', toggleKey: 'airPerformerPower' },
  airPerformerMode:        { btnLabel: 'Changer Mode',       toggleKey: 'airPerformerMode'  },
  airPerformerSpeed:       { btnLabel: 'Vitesse +/-',        toggleKey: 'airPerformerSpeed' },
  'airperformer-position': { btnLabel: () => { const p = positionState['airperformer-position']; return p ? `Position ${p.idx + 1}/${p.total}` : 'Changer position'; }, toggleKey: 'airperformer-position' },
  'raskog-large-position': { btnLabel: () => { const p = positionState['raskog-large-position'];    return p ? `Position ${p.idx + 1}/${p.total}` : 'Changer position'; }, toggleKey: 'raskog-large-position'    },
  'select-walker': {
    btnLabel: '🎯 Définir comme personnage actif',
    toggleKey: 'select-walker'
  },
  'walker-meshes':         { btnLabel: 'Meshes',             toggleKey: 'walker-meshes'     },
  'sofa-arm-left':         { btnLabel: 'Accoudoir Gauche',  toggleKey: 'sofaArmLeft'       },
  'sofa-arm-right':        { btnLabel: 'Accoudoir Droit',   toggleKey: 'sofaArmRight'      },
  'walker-anim-lara':      { btnLabel: 'Jouer une animation', toggleKey: 'walker-anim-lara', type: 'select', options: WALKER_ANIM_OPTIONS },
  'walker-anim-xbot':      { btnLabel: 'Jouer une animation', toggleKey: 'walker-anim-xbot', type: 'select', options: WALKER_ANIM_OPTIONS },
  'lara-custom-holster':   { btnLabel: 'Holsters & Boucle', toggleKey: 'lara-custom-holster' },
  'lara-custom-pistols':   { btnLabel: 'Pistolets Mains',  toggleKey: 'lara-custom-pistols' },
  'lara-custom-backpack':  { btnLabel: 'Sac à dos',         toggleKey: 'lara-custom-backpack' },
  'lara-haircut':          { btnLabel: 'Coupe de cheveux 💇‍♀️', toggleKey: 'lara-haircut', type: 'select', options: [
    { value: 'original', label: 'Coupe d\'origine 👱‍♀️' },
    ...WIGS_ITEMS.map(wig => ({
      value: wig.id,
      label: wig.name
    }))
  ] },
};

// Helper to resolve action definition (supports dynamic actions like select-walker-*)
function getActionDef(actionId: string): ActionDef | undefined {
  if (ACTIONS[actionId]) return ACTIONS[actionId];
  if (actionId.startsWith('select-walker-')) {
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
    return {
      btnLabel: `⚡ Utiliser (${slotName})`,
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
    let lastCacheTime = 0;
    const downPos = { x: 0, y: 0 };
    let isDragGesture = false;

    function getInteractiveRoots(): THREE.Object3D[] {
      const now = performance.now();
      if (now - lastCacheTime > 3000 || interactiveCache.length === 0) {
        interactiveCache = [];
        scene.traverse(obj => {
          if (obj.userData?.hoverAction) {
            interactiveCache.push(obj);
          }
        });
        lastCacheTime = now;
      }
      return interactiveCache;
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

    function raycastAt(clientX: number, clientY: number): { label: string; actionIds: string[] } | null {
      if (cameraState.isDragging) return null;

      const candidates = getInteractiveRoots();
      if (candidates.length === 0) return null;

      const rect = canvas.getBoundingClientRect();
      pointer.x =  ((clientX - rect.left) / rect.width)  * 2 - 1;
      pointer.y = -((clientY - rect.top)  / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      raycaster.layers.enableAll();
      raycaster.layers.disable(LAYER_NEIGHBORS);
      raycaster.layers.disable(LAYER_LIDAR);
      const hits = raycaster.intersectObjects(candidates, true);

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
        if (action && action.actionIds.some(id => getActionDef(id))) return action;
        continue;
      }
      return null;
    }

    // ── Souris : hover → dot (Uniquement après 3s d'arrêt complet de la souris) ──
    let showTimer: ReturnType<typeof setTimeout> | null = null;
    let lastClientX = 0;
    let lastClientY = 0;

    const onPointerDown = (e: PointerEvent) => {
      downPos.x = e.clientX;
      downPos.y = e.clientY;
      isDragGesture = false;

      // Si double-clic ou clic multiple rapide, fermer immédiatement tout menu
      if (e.detail >= 2) {
        if (showTimer) { clearTimeout(showTimer); showTimer = null; }
        if (hoverState.locked) {
          hoverState.locked = false;
        }
        hoverState.visible = false;
        hoverState.onUpdate?.();
      }
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      if (hoverState.touchActive) return;

      if (e.buttons > 0 || Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y) > 6) {
        isDragGesture = true;
      }

      if (isDragGesture || cameraState.isDragging || e.buttons > 0) {
        if (showTimer) { clearTimeout(showTimer); showTimer = null; }
        scheduleHide();
        return;
      }

      // Si la souris bouge, masquer l'indicateur actif immédiatement (0 raycast pendant le déplacement)
      if (hoverState.visible && !hoverState.locked) {
        hoverState.visible = false;
        hoverState.onUpdate?.();
        canvas.style.cursor = '';
      }

      lastClientX = e.clientX;
      lastClientY = e.clientY;

      if (showTimer) clearTimeout(showTimer);

      // Uniquement après 3 secondes d'immobilité totale : exécuter un UNIQUE raycast
      showTimer = setTimeout(() => {
        showTimer = null;
        if (cameraState.isDragging || isDragGesture) return;

        const found = raycastAt(lastClientX, lastClientY);
        if (found) {
          hoverState.visible   = true;
          hoverState.x         = lastClientX;
          hoverState.y         = lastClientY;
          hoverState.label     = found.label;
          hoverState.actionIds = found.actionIds;
          canvas.style.cursor  = 'pointer';
          hoverState.onUpdate?.();
        } else {
          canvas.style.cursor = '';
        }
      }, 3000);
    };

    const onLeave = () => { 
      if (showTimer) { clearTimeout(showTimer); showTimer = null; }
      scheduleHide(); 
    };

    const onDblClick = () => {
      if (showTimer) { clearTimeout(showTimer); showTimer = null; }
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

  const [selectFilter, setSelectFilter] = useState('');
  const [selectedValues, setSelectedValues] = useState<Record<string, string>>({});
  const [copiedHover, setCopiedHover] = useState<boolean>(false);

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
              const filteredOpts = selectFilter.trim()
                ? opts.filter(o => o.label.toLowerCase().includes(selectFilter.trim().toLowerCase()) || o.value.toLowerCase().includes(selectFilter.trim().toLowerCase()))
                : opts;
              const val = selectedValues[action.toggleKey] ?? '';
              const filename = val ? (val.split('/').pop() || val) : '';

              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {opts.length > 10 && action.toggleKey.startsWith('walker-anim') && (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <input
                        type="text"
                        placeholder="🔍 Filtrer anims..."
                        value={selectFilter}
                        onChange={e => setSelectFilter(e.target.value)}
                        style={{
                          background: 'rgba(255,255,255,0.15)',
                          color: '#fff',
                          border: '1px solid rgba(255,255,255,0.25)',
                          borderRadius: 4,
                          padding: '3px 6px',
                          fontSize: 11,
                          outline: 'none',
                          flex: 1,
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const pool = opts.filter(o => o.value !== 'idle');
                          if (pool.length > 0) {
                            const randomOpt = pool[Math.floor(Math.random() * pool.length)];
                            setSelectedValues(prev => ({ ...prev, [action.toggleKey]: randomOpt.value }));
                            document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: action.toggleKey, value: randomOpt.value } }));
                            hoverState.onUpdate?.();
                          }
                        }}
                        style={{
                          background: '#ffc107',
                          color: '#000',
                          border: 'none',
                          borderRadius: 4,
                          padding: '2px 8px',
                          fontSize: 11,
                          fontWeight: 'bold',
                          cursor: 'pointer',
                        }}
                        title="Animation aléatoire"
                      >
                        🎲
                      </button>
                    </div>
                  )}
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
                    <option value="" disabled>{action.btnLabel ? (typeof action.btnLabel === 'function' ? action.btnLabel() : action.btnLabel) : "Choisir une animation..."} ({filteredOpts.length})</option>
                    {filteredOpts.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.value === val ? `▶ ${opt.label}` : opt.label}
                      </option>
                    ))}
                  </select>

                  {action.toggleKey.startsWith('walker-anim') && val && val !== 'idle' && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 6,
                      background: 'rgba(255,215,0,0.12)',
                      border: '1px solid rgba(255,215,0,0.3)',
                      borderRadius: 6,
                      padding: '4px 8px',
                      fontSize: 10,
                      color: '#ffd700',
                    }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={filename}>
                        📁 {filename}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(filename);
                          setCopiedHover(true);
                          setTimeout(() => setCopiedHover(false), 2000);
                        }}
                        style={{
                          background: 'rgba(255,215,0,0.25)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 4,
                          padding: '2px 6px',
                          fontSize: 9,
                          fontWeight: 700,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {copiedHover ? '✓ Copié !' : '📋 Copier'}
                      </button>
                    </div>
                  )}
                </div>
              );
            }
            return (
              <button
                key={i}
                onClick={() => {
                  if (action.toggleKey.startsWith('select-walker-')) {
                    const targetWalkerId = action.toggleKey.replace('select-walker-', '');
                    useSceneStore.getState().setActiveWalkerId(targetWalkerId);
                    appLog(targetWalkerId, `🎯 Personnage actif défini : ${state.lockedLabel}`);
                  } else if (action.toggleKey.startsWith('smart-object:::')) {
                    const [, objectId, slotId] = action.toggleKey.split(':::');
                    const obj = getSmartObject(objectId);
                    const slot = obj?.slots.find(s => s.slotId === slotId);
                    const targetPos = slot?.offset ?? obj?.position ?? [0, 0, 0];

                    // Trouver le personnage le plus proche (en excluant les animaux comme le shiba)
                    let closestCharId: string | null = null;
                    let minDistance = Infinity;

                    const candidateIds = Object.keys(cameraState.positions);

                    for (const charId of candidateIds) {
                      if (charId === 'shiba') continue;
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
