import { useEffect } from 'react';
import type { MutableRefObject } from 'react';
import type * as THREE from 'three';
import type { CameraMode } from './types';
import { MOUSE_SENS } from './cameraConstants';
import { cameraState } from '../cameraState';

interface UseCameraPointerEventsParams {
  domElement: HTMLElement;
  camera: THREE.Camera;
  modeRef: MutableRefObject<CameraMode>;
  orbitYaw: MutableRefObject<number>;
  orbitPitch: MutableRefObject<number>;
  orbitDistance: MutableRefObject<number>;
  walkYaw: MutableRefObject<number>;
  walkPitch: MutableRefObject<number>;
  dragging: MutableRefObject<boolean>;
  updateWalkLook: () => void;
  invalidate: () => void;
}

export function useCameraPointerEvents({
  domElement,
  camera,
  modeRef,
  orbitYaw,
  orbitPitch,
  orbitDistance,
  walkYaw,
  walkPitch,
  dragging,
  updateWalkLook,
  invalidate,
}: UseCameraPointerEventsParams) {
  useEffect(() => {
    let touchLastX = 0;
    let touchLastY = 0;
    let touchLastDist = 0;

    const getTouchDist = (e: TouchEvent) => {
      if (e.touches.length < 2) return 0;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      return Math.hypot(dx, dy);
    };

    const onDown = (e: MouseEvent) => {
      if ((modeRef.current === 'walk' || modeRef.current === 'fpv') && e.button === 0) {
        dragging.current = true;
        cameraState.isDragging = true;
      }
    };

    const onUp = () => {
      dragging.current = false;
      cameraState.isDragging = false;
    };

    const onMove = (e: MouseEvent) => {
      if (!dragging.current || (modeRef.current !== 'walk' && modeRef.current !== 'fpv')) return;
      if (modeRef.current === 'walk') {
        orbitYaw.current += e.movementX * MOUSE_SENS;
        orbitPitch.current = Math.max(-0.6, Math.min(1.45, orbitPitch.current - e.movementY * MOUSE_SENS));
      } else {
        walkYaw.current -= e.movementX * MOUSE_SENS;
        walkPitch.current = Math.max(-1.4, Math.min(1.4, walkPitch.current - e.movementY * MOUSE_SENS));
      }
      updateWalkLook();
      invalidate();
    };

    // ── Mobile Touch controls (Walk orientation & 2-finger Pinch-to-Zoom) ────────
    const onTouchStart = (e: TouchEvent) => {
      if (modeRef.current !== 'walk' && modeRef.current !== 'fpv') return;
      if (e.touches.length === 1) {
        dragging.current = true;
        cameraState.isDragging = true;
        touchLastX = e.touches[0].clientX;
        touchLastY = e.touches[0].clientY;
        touchLastDist = 0;
      } else if (e.touches.length === 2) {
        dragging.current = false;
        cameraState.isDragging = false;
        touchLastDist = getTouchDist(e);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (modeRef.current !== 'walk' && modeRef.current !== 'fpv') return;

      if (e.touches.length === 2) {
        const dist = getTouchDist(e);
        if (touchLastDist > 0) {
          const delta = dist - touchLastDist;
          if (modeRef.current === 'walk') {
            orbitDistance.current = Math.max(30, Math.min(800, orbitDistance.current - delta * 0.8));
            updateWalkLook();
          } else {
            const cam = camera as THREE.PerspectiveCamera;
            if (cam.isPerspectiveCamera) {
              cam.fov = Math.max(30, Math.min(110, cam.fov - delta * 0.08));
              cam.updateProjectionMatrix();
            }
          }
          invalidate();
        }
        touchLastDist = dist;
        return;
      }

      if (!dragging.current || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - touchLastX;
      const dy = e.touches[0].clientY - touchLastY;
      touchLastX = e.touches[0].clientX;
      touchLastY = e.touches[0].clientY;

      const TOUCH_SENS = MOUSE_SENS * 1.5;
      if (modeRef.current === 'walk') {
        orbitYaw.current += dx * TOUCH_SENS;
        orbitPitch.current = Math.max(-0.6, Math.min(1.45, orbitPitch.current - dy * TOUCH_SENS));
      } else {
        walkYaw.current -= dx * TOUCH_SENS;
        walkPitch.current = Math.max(-1.4, Math.min(1.4, walkPitch.current - dy * TOUCH_SENS));
      }
      updateWalkLook();
      invalidate();
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchLastX = e.touches[0].clientX;
        touchLastY = e.touches[0].clientY;
        touchLastDist = 0;
        dragging.current = true;
        cameraState.isDragging = true;
      } else if (e.touches.length === 0) {
        dragging.current = false;
        cameraState.isDragging = false;
        touchLastDist = 0;
      }
    };

    // Scroll wheel : en 3ème personne ajuste la distance d'orbite ; en FPV ajuste le FOV
    const onWheel = (e: WheelEvent) => {
      if (modeRef.current !== 'walk' && modeRef.current !== 'fpv') return;
      e.preventDefault();
      if (modeRef.current === 'walk') {
        const step = e.deltaY > 0 ? 15 : -15;
        orbitDistance.current = Math.max(30, orbitDistance.current + step);
        updateWalkLook();
      } else {
        const cam = camera as THREE.PerspectiveCamera;
        if (!cam.isPerspectiveCamera) return;
        const step = e.deltaY > 0 ? 2 : -2;
        cam.fov = Math.max(30, Math.min(110, cam.fov + step));
        cam.updateProjectionMatrix();
      }
      invalidate();
    };

    domElement.addEventListener('mousedown', onDown);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('mousemove', onMove);

    domElement.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });

    domElement.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      domElement.removeEventListener('mousedown', onDown);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('mousemove', onMove);

      domElement.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);

      domElement.removeEventListener('wheel', onWheel);
    };
  }, [domElement, camera, modeRef, orbitYaw, orbitPitch, orbitDistance, walkYaw, walkPitch, dragging, updateWalkLook, invalidate]);
}
