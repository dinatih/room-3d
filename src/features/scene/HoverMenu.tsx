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
import { cameraState } from './cameraState';
import { WALKER_ANIM_OPTIONS } from './animOptions';

// ── Actions disponibles ───────────────────────────────────────────────────────

interface ActionDef { 
  btnLabel?: string | (() => string); 
  toggleKey: string;
  type?: 'button' | 'select';
  options?: { value: string; label: string }[];
}



const ACTIONS: Record<string, ActionDef> = {
  'mannequin-kallax-nw-wig':   { btnLabel: 'Perruque 💇', toggleKey: 'mannequin-kallax-nw-wig', type: 'select', options: [
    { value: '-1', label: '🎲 Aléatoire' },
    { value: '0', label: 'Coupe #1 (Carré Court / Bob)' },
    { value: '1', label: 'Coupe #2 (Queue de cheval haute & mèches visages)' },
    { value: '2', label: 'Coupe #3 (Pixie effilée & déstructurée)' },
    { value: '3', label: 'Coupe #4 (Shag mi-longue / Wolf cut)' },
    { value: '4', label: 'Coupe #5 (Mi-longue lissée avec frange)' },
    { value: '5', label: 'Coupe #6 (Queue de cheval très haute)' },
    { value: '6', label: 'Coupe #7 (Carré court avec frange droite)' },
    { value: '7', label: 'Coupe #8 (Couettes hautes & frange latérale)' },
    { value: '8', label: 'Coupe #9 (Courte hérissée avec bandeau)' },
    { value: '9', label: 'Coupe #10 (Lob ondulé / Wavy lob)' },
    { value: '10', label: 'Coupe #11 (Coupe Hime / 姫カット)' },
    { value: '11', label: 'Coupe #12 (Mi-tresse plaquée mi-ondulé)' },
    { value: '12', label: 'Coupe #13 (Chignon haut hérissé & bandeau)' }
  ] },
  'mannequin-kallax-nw-color': { btnLabel: 'Couleur cheveux 🎨', toggleKey: 'mannequin-kallax-nw-color', type: 'select', options: [
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
  'mannequin-kallax-nw-wind':  { btnLabel: 'Vent 💨', toggleKey: 'mannequin-kallax-nw-wind' },

  'mannequin-kallax-ne-wig':   { btnLabel: 'Perruque 💇', toggleKey: 'mannequin-kallax-ne-wig', type: 'select', options: [
    { value: '-1', label: '🎲 Aléatoire' },
    { value: '0', label: 'Coupe #1 (Carré Court / Bob)' },
    { value: '1', label: 'Coupe #2 (Queue de cheval haute & mèches visages)' },
    { value: '2', label: 'Coupe #3 (Pixie effilée & déstructurée)' },
    { value: '3', label: 'Coupe #4 (Shag mi-longue / Wolf cut)' },
    { value: '4', label: 'Coupe #5 (Mi-longue lissée avec frange)' },
    { value: '5', label: 'Coupe #6 (Queue de cheval très haute)' },
    { value: '6', label: 'Coupe #7 (Carré court avec frange droite)' },
    { value: '7', label: 'Coupe #8 (Couettes hautes & frange latérale)' },
    { value: '8', label: 'Coupe #9 (Courte hérissée avec bandeau)' },
    { value: '9', label: 'Coupe #10 (Lob ondulé / Wavy lob)' },
    { value: '10', label: 'Coupe #11 (Coupe Hime / 姫カット)' },
    { value: '11', label: 'Coupe #12 (Mi-tresse plaquée mi-ondulé)' },
    { value: '12', label: 'Coupe #13 (Chignon haut hérissé & bandeau)' }
  ] },
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

  'mannequin-meubleT-wig':   { btnLabel: 'Perruque 💇', toggleKey: 'mannequin-meubleT-wig', type: 'select', options: [
    { value: '-1', label: '🎲 Aléatoire' },
    { value: '0', label: 'Coupe #1 (Carré Court / Bob)' },
    { value: '1', label: 'Coupe #2 (Queue de cheval haute & mèches visages)' },
    { value: '2', label: 'Coupe #3 (Pixie effilée & déstructurée)' },
    { value: '3', label: 'Coupe #4 (Shag mi-longue / Wolf cut)' },
    { value: '4', label: 'Coupe #5 (Mi-longue lissée avec frange)' },
    { value: '5', label: 'Coupe #6 (Queue de cheval très haute)' },
    { value: '6', label: 'Coupe #7 (Carré court avec frange droite)' },
    { value: '7', label: 'Coupe #8 (Couettes hautes & frange latérale)' },
    { value: '8', label: 'Coupe #9 (Courte hérissée avec bandeau)' },
    { value: '9', label: 'Coupe #10 (Lob ondulé / Wavy lob)' },
    { value: '10', label: 'Coupe #11 (Coupe Hime / 姫カット)' },
    { value: '11', label: 'Coupe #12 (Mi-tresse plaquée mi-ondulé)' },
    { value: '12', label: 'Coupe #13 (Chignon haut hérissé & bandeau)' }
  ] },
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

  'mannequin-lack-wig':   { btnLabel: 'Perruque 💇', toggleKey: 'mannequin-lack-wig', type: 'select', options: [
    { value: '-1', label: '🎲 Aléatoire' },
    { value: '0', label: 'Coupe #1 (Carré Court / Bob)' },
    { value: '1', label: 'Coupe #2 (Queue de cheval haute & mèches visages)' },
    { value: '2', label: 'Coupe #3 (Pixie effilée & déstructurée)' },
    { value: '3', label: 'Coupe #4 (Shag mi-longue / Wolf cut)' },
    { value: '4', label: 'Coupe #5 (Mi-longue lissée avec frange)' },
    { value: '5', label: 'Coupe #6 (Queue de cheval très haute)' },
    { value: '6', label: 'Coupe #7 (Carré court avec frange droite)' },
    { value: '7', label: 'Coupe #8 (Couettes hautes & frange latérale)' },
    { value: '8', label: 'Coupe #9 (Courte hérissée avec bandeau)' },
    { value: '9', label: 'Coupe #10 (Lob ondulé / Wavy lob)' },
    { value: '10', label: 'Coupe #11 (Coupe Hime / 姫カット)' },
    { value: '11', label: 'Coupe #12 (Mi-tresse plaquée mi-ondulé)' },
    { value: '12', label: 'Coupe #13 (Chignon haut hérissé & bandeau)' },
  ] },
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
  'walker-anim-lara':      { btnLabel: 'Jouer une animation', toggleKey: 'walker-anim-lara', type: 'select', options: WALKER_ANIM_OPTIONS },
  'walker-anim-xbot':      { btnLabel: 'Jouer une animation', toggleKey: 'walker-anim-xbot', type: 'select', options: WALKER_ANIM_OPTIONS },
  'lara-expression':       { btnLabel: 'Expression faciale',  toggleKey: 'lara-expression', type: 'select', options: [
    { value: 'neutral', label: 'Neutre 😐' },
    { value: 'smile', label: 'Vrai sourire 😊' },
    { value: 'smirk', label: 'Sourire en coin 😏' },
    { value: 'wink', label: 'Clin d\'œil 😉' },
    { value: 'open_mouth', label: 'Bouche ouverte 😮' }
  ] },
  'lara-custom-holster':   { btnLabel: 'Holsters & Boucle', toggleKey: 'lara-custom-holster' },
  'lara-custom-pistols':   { btnLabel: 'Pistolets Mains',  toggleKey: 'lara-custom-pistols' },
  'lara-custom-backpack':  { btnLabel: 'Sac à dos',         toggleKey: 'lara-custom-backpack' },
  'lara-haircut':          { btnLabel: 'Coupe de cheveux 💇‍♀️', toggleKey: 'lara-haircut', type: 'select', options: [
    { value: 'original', label: 'Coupe d\'origine 👱‍♀️' },
    { value: 'hair_100', label: 'Coupe #1 (Carré Court / Bob)' },
    { value: 'hair_101', label: 'Coupe #2 (Queue de cheval haute & mèches visages)' },
    { value: 'hair_102', label: 'Coupe #3 (Pixie effilée & déstructurée)' },
    { value: 'hair_103', label: 'Coupe #4 (Shag mi-longue / Wolf cut)' },
    { value: 'hair_104', label: 'Coupe #5 (Mi-longue lissée avec frange)' },
    { value: 'hair_105', label: 'Coupe #6 (Queue de cheval très haute)' },
    { value: 'hair_106', label: 'Coupe #7 (Carré court avec frange droite)' },
    { value: 'hair_107', label: 'Coupe #8 (Couettes hautes & frange latérale)' },
    { value: 'hair_108', label: 'Coupe #9 (Courte hérissée avec bandeau)' },
    { value: 'hair_109', label: 'Coupe #10 (Lob ondulé / Wavy lob)' },
    { value: 'hair_110', label: 'Coupe #11 (Coupe Hime / 姫カット)' },
    { value: 'hair_111', label: 'Coupe #12 (Mi-tresse plaquée mi-ondulé)' },
    { value: 'hair_112', label: 'Coupe #13 (Chignon haut hérissé & bandeau)' }
  ] },
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
      raycaster.layers.enableAll();
      raycaster.layers.disable(LAYER_NEIGHBORS);
      raycaster.layers.disable(LAYER_LIDAR);
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

        if (cameraState.mode === 'walk' && resolveAction(hit.object)?.actionIds.includes('lara-expression')) {
          continue;
        }

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
      if (now - lastMove < 100) return;
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

  const [selectFilter, setSelectFilter] = useState('');
  const [selectedHoverVal, setSelectedHoverVal] = useState<string>('');
  const [copiedHover, setCopiedHover] = useState<boolean>(false);

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
              const opts = action.options ?? [];
              const filteredOpts = selectFilter.trim()
                ? opts.filter(o => o.label.toLowerCase().includes(selectFilter.trim().toLowerCase()) || o.value.toLowerCase().includes(selectFilter.trim().toLowerCase()))
                : opts;
              const filename = selectedHoverVal ? (selectedHoverVal.split('/').pop() || selectedHoverVal) : '';

              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {opts.length > 10 && action.toggleKey.startsWith('walker-anim') && (
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
                      }}
                    />
                  )}
                  <select
                    style={BTN_STYLE}
                    value={selectedHoverVal}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedHoverVal(val);
                      document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: action.toggleKey, value: val } }));
                      hoverState.onUpdate?.();
                    }}
                  >
                    <option value="" disabled>{action.btnLabel ? (typeof action.btnLabel === 'function' ? action.btnLabel() : action.btnLabel) : "Choisir une animation..."} ({filteredOpts.length})</option>
                    {filteredOpts.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.value === selectedHoverVal ? `▶ ${opt.label}` : opt.label}
                      </option>
                    ))}
                  </select>

                  {action.toggleKey.startsWith('walker-anim') && selectedHoverVal && selectedHoverVal !== 'idle' && (
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
