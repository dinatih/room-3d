import { useEffect } from 'react';
import type { MutableRefObject } from 'react';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { CameraMode, FollowPosition } from './types';
import { useSceneStore } from '../store/useSceneStore';
import { cameraState } from '../cameraState';
import { appLog } from '@features/ui/AppConsole';
import { CHARACTERS, isCharacterVisibleInMode } from '../characterConfig';
import { frameLaraGridOrtho, frameLaraGridCamera } from '../character/laraGridUtils';
import { dispatchView } from '../sidepanel/types';

interface UseCameraShortcutsParams {
  camera: THREE.Camera;
  ctrlRef: MutableRefObject<OrbitControlsImpl>;
  modeRef: MutableRefObject<CameraMode>;
  planeModeRef: MutableRefObject<boolean>;
  topFollowRef: MutableRefObject<boolean>;
  followPos: MutableRefObject<FollowPosition>;
  keys: MutableRefObject<Set<string>>;
  savedPerspPos: MutableRefObject<THREE.Vector3>;
  savedPerspTarget: MutableRefObject<THREE.Vector3>;
  changeMode: (mode: CameraMode) => void;
  enterFollow: (x: number, z: number, mode?: 'follow' | 'fpv') => void;
  exitFollow: () => void;
  enterTop: (follow?: boolean) => void;
  exitTop: () => void;
  toggleOrbitType?: (
    target?: 'persp' | 'ortho',
    options?: { pos?: [number, number, number]; target?: [number, number, number]; zoom?: number }
  ) => void;
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
  followPos,
  keys,
  savedPerspPos,
  savedPerspTarget,
  changeMode,
  enterFollow,
  exitFollow,
  enterTop,
  exitTop,
  toggleOrbitType,
  enterOrtho,
  exitOrtho,
  invalidate,
}: UseCameraShortcutsParams) {
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      // Plane mode owns input — bail out so arrow/WASD don't move character or camera.
      if (planeModeRef.current || cameraState.isIntroRunning) return;

      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        return;
      }

      // Global shortcuts
      if (e.key === 'Escape') {
        if (modeRef.current === 'follow' || modeRef.current === 'fpv') exitFollow();
        else if (modeRef.current === 'top') exitTop();
        else if (modeRef.current === 'ortho' && exitOrtho) exitOrtho();
        return;
      }

      if (!e.altKey && !e.ctrlKey && !e.metaKey && (e.key === 'p' || e.key === 'P')) {
        if (modeRef.current === 'ortho' && exitOrtho) exitOrtho();
        useSceneStore.getState().toggleCameraProjection();
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

      if (!e.altKey && !e.ctrlKey && !e.metaKey && (e.key === 'o' || e.key === 'O')) {
        if (e.repeat) return;
        e.preventDefault();
        const curX = cameraState.characterX ?? followPos.current.x;
        const curZ = cameraState.characterZ ?? followPos.current.z;

        if (modeRef.current === 'orbit') {
          useSceneStore.getState().setActiveCameraView(null);
          enterFollow(curX, curZ, 'follow');
        } else if (modeRef.current === 'follow') {
          enterFollow(curX, curZ, 'fpv');
        } else if (modeRef.current === 'fpv') {
          exitFollow();
        } else if (modeRef.current === 'top') {
          exitTop();
        } else if (modeRef.current === 'ortho' && exitOrtho) {
          exitOrtho();
        }
      }

      if (e.key === '1' || e.code === 'Digit1' || e.code === 'Numpad1') {
        const curX = cameraState.characterX ?? followPos.current.x;
        const curZ = cameraState.characterZ ?? followPos.current.z;
        enterFollow(curX, curZ, 'fpv');
        appLog('system', '🎥 Mode FPV (1ère personne)');
        return;
      }

      if (e.key === '3' || e.code === 'Digit3' || e.code === 'Numpad3') {
        const curX = cameraState.characterX ?? followPos.current.x;
        const curZ = cameraState.characterZ ?? followPos.current.z;
        enterFollow(curX, curZ, 'follow');
        appLog('system', '🎥 Mode Follow (3ème personne)');
        return;
      }

      if (!e.altKey && (e.key === 'm' || e.key === 'M')) {
        const curX = cameraState.characterX ?? followPos.current.x;
        const curZ = cameraState.characterZ ?? followPos.current.z;
        if (modeRef.current === 'follow') {
          enterFollow(curX, curZ, 'fpv');
          appLog('system', '🎥 Mode FPV (1ère personne)');
        } else {
          // Si en FPV, Orbit ou Top : passer en 3ème personne intelligente
          enterFollow(curX, curZ, 'follow');
          appLog('system', '🎥 Mode Suivi Intelligent (3ème personne)');
        }
        return;
      }

      if (e.key === 'l' || e.key === 'L') {
        const store = useSceneStore.getState();
        const laraCount = store.layers.laraCount ?? (typeof window !== 'undefined' && window.innerWidth <= 768 ? 2 : 15);
        const visibleChars = CHARACTERS.filter(c => isCharacterVisibleInMode(c.id, laraCount, store.activeCharacterId, store.layers.extraCharacters ?? false, store.activeExtraIds, store.activeMainIds));
        const currentIndex = visibleChars.findIndex(c => c.id === store.activeCharacterId);
        const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % visibleChars.length;
        store.setActiveCharacterId(visibleChars[nextIndex].id);
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
          document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'character-anim-lara', value: 't-pose' } }));
          document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'character-anim-xbot', value: 't-pose' } }));
        } else {
          dispatchView('top');
          appLog('system', '🎥 Mode Vue du Dessus (Top)');
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

      // Orbit and Top mode arrow keys (Google Earth style)
      if ((modeRef.current === 'orbit' || modeRef.current === 'top') && isArrow) {
        if (!e.shiftKey && !e.ctrlKey && !e.altKey) {
          keys.current.add(k);                      // plain  → move character
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

      // Follow-only keys
      if (modeRef.current !== 'follow' && modeRef.current !== 'fpv') return;
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

    // Minimap / panel click → enter follow in that room
    const onPov = (e: Event) => {
      const { x, z } = (e as CustomEvent).detail as { x: number; z: number };
      enterFollow(x, z);
    };

    // Panel camera preset → move orbit camera
    const onView = (e: Event) => {
      const { pos, target, projection, zoom } = (e as CustomEvent).detail as {
        pos: [number, number, number];
        target: [number, number, number];
        projection?: 'persp' | 'ortho';
        zoom?: number;
      };
      if (modeRef.current === 'follow' || modeRef.current === 'fpv') exitFollow();
      if (modeRef.current === 'top') {
        topFollowRef.current = false;
        if (ctrlRef.current) {
          ctrlRef.current.mouseButtons = {
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.PAN,
          };
          ctrlRef.current.enableRotate = true;
          ctrlRef.current.enablePan = true;
          ctrlRef.current.enableZoom = true;
        }
      }
      if (modeRef.current === 'ortho' && exitOrtho) exitOrtho();
      changeMode('orbit');
      const targetProj = projection ?? 'persp';
      toggleOrbitType?.(targetProj, { pos, target, zoom });
      savedPerspPos.current.set(...pos);
      savedPerspTarget.current.set(...target);
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

    const onCameraMode = (e: Event) => {
      if (planeModeRef.current || cameraState.isIntroRunning) return;
      const requestedMode = (e as CustomEvent<'toggle-follow' | 'fpv' | 'orbit'>).detail;
      const curX = cameraState.characterX ?? followPos.current.x;
      const curZ = cameraState.characterZ ?? followPos.current.z;
      if (requestedMode === 'fpv') {
        enterFollow(curX, curZ, 'fpv');
      } else if (requestedMode === 'toggle-follow') {
        if (modeRef.current === 'follow') exitFollow();
        else enterFollow(curX, curZ, 'follow');
      } else if (requestedMode === 'orbit') {
        if (modeRef.current === 'follow' || modeRef.current === 'fpv') exitFollow();
        else if (modeRef.current === 'top') exitTop();
        else if (modeRef.current === 'ortho' && exitOrtho) exitOrtho();
      }
    };

    const onEnterTop = () => {
      enterTop(false);
    };

    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    document.addEventListener('minimap-pov', onPov);
    document.addEventListener('camera-pov', onPov);
    document.addEventListener('camera-view', onView);
    document.addEventListener('camera-mode', onCameraMode);
    document.addEventListener('camera-ortho-view', onOrthoView);
    document.addEventListener('camera-enter-top', onEnterTop);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      document.removeEventListener('minimap-pov', onPov);
      document.removeEventListener('camera-pov', onPov);
      document.removeEventListener('camera-view', onView);
      document.removeEventListener('camera-mode', onCameraMode);
      document.removeEventListener('camera-ortho-view', onOrthoView);
      document.removeEventListener('camera-enter-top', onEnterTop);
    };
  }, [camera, changeMode, ctrlRef, enterOrtho, enterTop, enterFollow, exitOrtho, exitTop, exitFollow, invalidate, keys, modeRef, planeModeRef, savedPerspPos, savedPerspTarget, toggleOrbitType, topFollowRef, followPos]);
}
