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
        return;
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
        const visibleChars = CHARACTERS.filter(c => isCharacterVisibleInMode(c.id, laraCount, store.activeWalkerId));
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
          document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'walker-anim-lara', value: 'animations/poses_idles/anim_t_pose.glb' } }));
          document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'walker-anim-xbot', value: 'animations/poses_idles/anim_t_pose.glb' } }));
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
        keys.current.add(k);
        if (e.ctrlKey) keys.current.add('Ctrl' + k);
        if (e.altKey)  keys.current.add('Alt' + k);
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
      camera.position.set(...pos);
      savedPerspPos.current.set(...pos);
      savedPerspTarget.current.set(...target);
      if (ctrlRef.current) {
        ctrlRef.current.target.set(...target);
        ctrlRef.current.update();
      }
      invalidate();
    };

    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    document.addEventListener('minimap-pov', onPov);
    document.addEventListener('camera-pov', onPov);
    document.addEventListener('camera-view', onView);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      document.removeEventListener('minimap-pov', onPov);
      document.removeEventListener('camera-pov', onPov);
      document.removeEventListener('camera-view', onView);
    };
  }, [camera, ctrlRef, enterTop, enterWalk, exitTop, exitWalkMode, invalidate, keys, modeRef, planeModeRef, savedPerspPos, savedPerspTarget, topFollowRef, walkPos]);
}
