import { useEffect } from 'react';
import type { MutableRefObject } from 'react';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { CameraMode, WalkPosition } from './types';
import { PERSP_POS, PERSP_TARGET } from './cameraConstants';
import { useSceneStore } from '../store/useSceneStore';
import { cameraState } from '../cameraState';
import { appLog } from '@features/ui/AppConsole';
import { CHARACTERS, isCharacterVisibleInMode } from '../walkerConfig';
import { frameLaraGridOrtho, frameLaraGridCamera } from '../character/laraGridUtils';

interface UseCameraShortcutsParams {
  camera: THREE.Camera;
  ctrlRef: MutableRefObject<OrbitControlsImpl>;
  modeRef: MutableRefObject<CameraMode>;
  planeModeRef: MutableRefObject<boolean>;
  topFollowRef: MutableRefObject<boolean>;
  walkPos: MutableRefObject<WalkPosition>;
  keys: MutableRefObject<Set<string>>;
  savedPerspPos: MutableRefObject<THREE.Vector3>;
  savedPerspTarget: MutableRefObject<THREE.Vector3>;
  enterWalk: (x: number, z: number, mode?: 'walk' | 'fpv') => void;
  exitWalkMode: () => void;
  enterTop: (follow?: boolean) => void;
  exitTop: () => void;
  enterOrtho?: (config: {
    pos: [number, number, number];
    target: [number, number, number];
    up: [number, number, number];
    viewH: number;
  }) => void;
  exitOrtho?: () => void;
  invalidate: () => void;
}

export function useCameraShortcuts({
  camera,
  ctrlRef,
  modeRef,
  planeModeRef,
  topFollowRef,
  walkPos,
  keys,
  savedPerspPos,
  savedPerspTarget,
  enterWalk,
  exitWalkMode,
  enterTop,
  exitTop,
  enterOrtho,
  exitOrtho,
  invalidate,
}: UseCameraShortcutsParams) {
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      // Plane mode owns input — bail out so arrow/WASD don't move walker or camera.
      if (planeModeRef.current) return;

      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        return;
      }

      // Global shortcuts
      if (e.key === 'Escape') {
        if (modeRef.current === 'walk' || modeRef.current === 'fpv') exitWalkMode();
        else if (modeRef.current === 'top') exitTop();
        else if (modeRef.current === 'ortho' && exitOrtho) exitOrtho();
        return;
      }

      // Raccourcis grille Lara (vues orthographiques)
      const laraGridActive = useSceneStore.getState().layers.laraGrid;
      if (laraGridActive) {
        const isNum1 = e.code === 'Numpad1' && !e.ctrlKey;
        const isNum2 = (e.code === 'Numpad1' && e.ctrlKey) || (e.code === 'Numpad2');
        const isNum3 = e.code === 'Numpad3' && e.ctrlKey;
        const isNum4 = (e.code === 'Numpad3' && !e.ctrlKey) || (e.code === 'Numpad4');
        const isNum7 = e.code === 'Numpad7' && !e.ctrlKey;
        const isNum9 = (e.code === 'Numpad7' && e.ctrlKey) || (e.code === 'Numpad9') || (e.code === 'Numpad8');
        const isNum5 = e.code === 'Numpad5';

        const isAlt1 = e.altKey && (e.key === '1' || e.code === 'Digit1');
        const isAlt2 = e.altKey && (e.key === '2' || e.code === 'Digit2');
        const isAlt3 = e.altKey && (e.key === '3' || e.code === 'Digit3');
        const isAlt4 = e.altKey && (e.key === '4' || e.code === 'Digit4');
        const isAlt7 = e.altKey && (e.key === '7' || e.code === 'Digit7');
        const isAlt9 = e.altKey && (e.key === '9' || e.code === 'Digit9');
        const isAlt5 = e.altKey && (e.key === '5' || e.code === 'Digit5');

        if (isNum1 || isAlt1) {
          e.preventDefault();
          frameLaraGridOrtho('front');
          return;
        }
        if (isNum2 || isAlt2) {
          e.preventDefault();
          frameLaraGridOrtho('back');
          return;
        }
        if (isNum3 || isAlt3) {
          e.preventDefault();
          frameLaraGridOrtho('left');
          return;
        }
        if (isNum4 || isAlt4) {
          e.preventDefault();
          frameLaraGridOrtho('right');
          return;
        }
        if (isNum7 || isAlt7) {
          e.preventDefault();
          frameLaraGridOrtho('top');
          return;
        }
        if (isNum9 || isAlt9) {
          e.preventDefault();
          frameLaraGridOrtho('bottom');
          return;
        }
        if (isNum5 || isAlt5) {
          e.preventDefault();
          if (modeRef.current === 'ortho' && exitOrtho) {
            exitOrtho();
            frameLaraGridCamera();
          } else {
            frameLaraGridOrtho('front');
          }
          return;
        }
      }

      if (e.key === 'o' || e.key === 'O') {
        const laraGridActive = useSceneStore.getState().layers.laraGrid;
        if (laraGridActive) {
          document.dispatchEvent(new CustomEvent('toggle-lara-haircut'));
          return;
        }

        if (modeRef.current === 'walk' || modeRef.current === 'fpv') exitWalkMode();
        else if (modeRef.current === 'top') exitTop();

        // Reset to default perspective
        camera.position.set(...PERSP_POS);
        savedPerspPos.current.set(...PERSP_POS);
        savedPerspTarget.current.set(...PERSP_TARGET);
        if (ctrlRef.current) {
          ctrlRef.current.target.set(...PERSP_TARGET);
          ctrlRef.current.update();
        }
        return;
      }

      if (e.key === '1' || e.code === 'Digit1' || e.code === 'Numpad1') {
        const curX = cameraState.walkerX ?? walkPos.current.x;
        const curZ = cameraState.walkerZ ?? walkPos.current.z;
        enterWalk(curX, curZ, 'fpv');
        appLog('system', '🎥 Mode FPV (1ère personne)');
        return;
      }

      if (e.key === '3' || e.code === 'Digit3' || e.code === 'Numpad3') {
        const curX = cameraState.walkerX ?? walkPos.current.x;
        const curZ = cameraState.walkerZ ?? walkPos.current.z;
        enterWalk(curX, curZ, 'walk');
        appLog('system', '🎥 Mode Follow (3ème personne)');
        return;
      }

      if (e.key === 'm' || e.key === 'M') {
        const curX = cameraState.walkerX ?? walkPos.current.x;
        const curZ = cameraState.walkerZ ?? walkPos.current.z;
        if (modeRef.current === 'walk') {
          enterWalk(curX, curZ, 'fpv');
          appLog('system', '🎥 Mode FPV (1ère personne)');
        } else {
          // Si en FPV, Orbit ou Top : passer en 3ème personne intelligente
          enterWalk(curX, curZ, 'walk');
          appLog('system', '🎥 Mode Suivi Intelligent (3ème personne)');
        }
        return;
      }

      if (e.key === 'l' || e.key === 'L') {
        const store = useSceneStore.getState();
        const laraCount = store.layers.laraCount ?? (typeof window !== 'undefined' && window.innerWidth <= 768 ? 2 : 15);
        const visibleChars = CHARACTERS.filter(c => isCharacterVisibleInMode(c.id, laraCount, store.activeWalkerId, store.layers.extraCharacters ?? false, store.activeExtraIds));
        const currentIndex = visibleChars.findIndex(c => c.id === store.activeWalkerId);
        const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % visibleChars.length;
        store.setActiveWalkerId(visibleChars[nextIndex].id);
        return;
      }

      if (e.key === 'y' || e.key === 'Y') {
        if (modeRef.current === 'top' && topFollowRef.current) {
          exitTop();
          appLog('system', '🎥 Mode Vue Libre (Orbit)');
        } else {
          enterTop(true);
          appLog('system', '🎥 Mode 2D Top (Suivi Perso)');
        }
        return;
      }

      if (e.key === 't' || e.key === 'T') {
        const laraGridActive = useSceneStore.getState().layers.laraGrid;
        if (laraGridActive) {
          document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'walker-anim-lara', value: 't-pose' } }));
          document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'walker-anim-xbot', value: 't-pose' } }));
        } else {
          if (modeRef.current === 'top' && !topFollowRef.current) {
            exitTop();
            appLog('system', '🎥 Mode Vue Libre (Orbit)');
          } else {
            enterTop(false);
            appLog('system', '🎥 Mode 2D Top (Pièce)');
          }
        }
        return;
      }

      const k = e.key;
      const isArrow = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(k);

      // Orbit-mode zoom (PageUp/PageDown)
      if (modeRef.current === 'orbit' && (k === 'PageUp' || k === 'PageDown')) {
        keys.current.add(k);
        e.preventDefault();
        invalidate();
        return;
      }

      // Orbit-mode arrow keys (Google Earth style)
      if (modeRef.current === 'orbit' && isArrow) {
        if (!e.shiftKey && !e.ctrlKey && !e.altKey) {
          keys.current.add(k);                      // plain  → move walker
        } else if (e.shiftKey && e.ctrlKey) {
          keys.current.add('ShiftCtrl' + k);         // Shift+Ctrl → pan
        } else if (e.shiftKey) {
          keys.current.add('Shift' + k);             // Shift  → orbit
        } else if (e.ctrlKey) {
          keys.current.add('Ctrl' + k);              // Ctrl   → rotate camera
        } else if (e.altKey) {
          keys.current.add('Alt' + k);               // Alt    → pan
        }
        e.preventDefault();
        invalidate();
        return;
      }

      // Walk-only keys
      if (modeRef.current !== 'walk' && modeRef.current !== 'fpv') return;
      if (isArrow) {
        if (e.ctrlKey) {
          keys.current.add('Ctrl' + k);
        } else if (e.altKey) {
          keys.current.add('Alt' + k);
        } else {
          keys.current.add(k);
        }
        e.preventDefault();
      }
      if (keys.current.size > 0) invalidate();
    };

    const onUp = (e: KeyboardEvent) => {
      const k = e.key;
      keys.current.delete(k);
      keys.current.delete('Shift' + k);
      keys.current.delete('Ctrl' + k);
      keys.current.delete('Alt' + k);
      keys.current.delete('ShiftCtrl' + k);
      // Modifier released → clear all keys that used it
      if (k === 'Shift')   for (const key of [...keys.current]) { if (key.startsWith('Shift')) keys.current.delete(key); }
      if (k === 'Control') for (const key of [...keys.current]) { if (key.startsWith('Ctrl')) keys.current.delete(key); }
      if (k === 'Alt')     for (const key of [...keys.current]) { if (key.startsWith('Alt')) keys.current.delete(key); }
    };

    // Minimap / panel click → enter walk in that room
    const onPov = (e: Event) => {
      const { x, z } = (e as CustomEvent).detail as { x: number; z: number };
      enterWalk(x, z);
    };

    // Panel camera preset → move orbit camera
    const onView = (e: Event) => {
      const { pos, target } = (e as CustomEvent).detail as {
        pos: [number, number, number];
        target: [number, number, number];
      };
      if (modeRef.current === 'walk' || modeRef.current === 'fpv') exitWalkMode();
      if (modeRef.current === 'top') exitTop();
      if (modeRef.current === 'ortho' && exitOrtho) exitOrtho();
      camera.position.set(...pos);
      savedPerspPos.current.set(...pos);
      savedPerspTarget.current.set(...target);
      if (ctrlRef.current) {
        ctrlRef.current.target.set(...target);
        ctrlRef.current.update();
      }
      invalidate();
    };

    // Grille Lara preset → bascule vue orthographique
    const onOrthoView = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail) return;
      if (enterOrtho) {
        enterOrtho(detail);
      }
    };

    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    document.addEventListener('minimap-pov', onPov);
    document.addEventListener('camera-pov', onPov);
    document.addEventListener('camera-view', onView);
    document.addEventListener('camera-ortho-view', onOrthoView);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      document.removeEventListener('minimap-pov', onPov);
      document.removeEventListener('camera-pov', onPov);
      document.removeEventListener('camera-view', onView);
      document.removeEventListener('camera-ortho-view', onOrthoView);
    };
  }, [camera, ctrlRef, enterOrtho, enterTop, enterWalk, exitOrtho, exitTop, exitWalkMode, invalidate, keys, modeRef, planeModeRef, savedPerspPos, savedPerspTarget, topFollowRef, walkPos]);
}
