import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useSceneStore } from '../scene/store/useSceneStore';

const _previewTmpSph = new THREE.Spherical();
const _previewTmpOffset = new THREE.Vector3();
const _previewTmpCamRight = new THREE.Vector3();
const _previewTmpCamForward = new THREE.Vector3();
const _previewTmpPanDelta = new THREE.Vector3();
const _previewTmpDollyDir = new THREE.Vector3();

export function PreviewCameraKeyboardController({
  onResetView,
  onUserInteraction,
  onTogglePerformance,
}: {
  onResetView?: () => void;
  onUserInteraction?: () => void;
  onTogglePerformance?: () => void;
}) {
  const { camera, invalidate } = useThree();
  const controls = useThree(state => state.controls as OrbitControlsImpl | null);
  const keys = useRef(new Set<string>());

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)) {
        return;
      }

      if (onTogglePerformance && !e.altKey && !e.ctrlKey && !e.metaKey && e.key.toLowerCase() === 'h') {
        if (e.repeat) return;
        e.preventDefault();
        onTogglePerformance();
        return;
      }

      // Projection toggle (O / P)
      if (!e.altKey && !e.ctrlKey && !e.metaKey && (e.key === 'o' || e.key === 'O' || e.key === 'p' || e.key === 'P')) {
        if (e.repeat) return;
        e.preventDefault();
        const store = useSceneStore.getState();
        const requested = e.key.toLowerCase() === 'o' ? 'ortho' : 'persp';
        const next = store.cameraProjection === requested ? (requested === 'ortho' ? 'persp' : 'ortho') : requested;
        store.setCameraProjection(next);
        return;
      }

      // Mouse mode toggle (R / T)
      if (!e.altKey && !e.ctrlKey && !e.metaKey && (e.key === 'r' || e.key === 'R' || e.key === 't' || e.key === 'T')) {
        if (e.repeat) return;
        e.preventDefault();
        const store = useSceneStore.getState();
        const requested = e.key.toLowerCase() === 'r' ? 'rotate' : 'translate';
        const next = store.orbitMouseMode === requested ? (requested === 'rotate' ? 'translate' : 'rotate') : requested;
        store.setOrbitMouseMode(next);
        return;
      }

      // Reset view (Alt + O)
      if (e.altKey && !e.ctrlKey && !e.metaKey && (e.key === 'o' || e.key === 'O')) {
        e.preventDefault();
        onResetView?.();
        return;
      }

      // Preset views (Alt + 1..8)
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const viewByCode: Record<string, string> = {
          Digit1: 'north', Digit2: 'north-east', Digit3: 'east', Digit4: 'south-east',
          Digit5: 'south', Digit6: 'south-west', Digit7: 'west', Digit8: 'north-west',
        };
        const view = viewByCode[e.code];
        if (view) {
          e.preventDefault();
          document.dispatchEvent(new CustomEvent('camera-view', { detail: { key: view, projection: 'persp' } }));
          return;
        }
      }

      // Numpad views (Ortho)
      const isNum1 = e.code === 'Numpad1' && !e.ctrlKey;
      const isNum2 = (e.code === 'Numpad1' && e.ctrlKey) || e.code === 'Numpad2';
      const isNum3 = (e.code === 'Numpad3' && !e.ctrlKey) || e.code === 'Numpad4';
      const isNum4 = e.code === 'Numpad3' && e.ctrlKey;
      const isNum7 = e.code === 'Numpad7' && !e.ctrlKey;
      const isNum9 = (e.code === 'Numpad7' && e.ctrlKey) || e.code === 'Numpad9' || e.code === 'Numpad8';
      const isNum5 = e.code === 'Numpad5';

      if (isNum1 || isNum2 || isNum3 || isNum4 || isNum7 || isNum9 || isNum5) {
        e.preventDefault();
        if (isNum5) {
          const store = useSceneStore.getState();
          store.setCameraProjection(store.cameraProjection === 'ortho' ? 'persp' : 'ortho');
          return;
        }
        const view = isNum1 ? 'north' : isNum2 ? 'south' : isNum3 ? 'west' : isNum4 ? 'east' : isNum7 ? 'top' : 'bottom';
        document.dispatchEvent(new CustomEvent('camera-view', { detail: { key: view, projection: 'ortho' } }));
        return;
      }

      // Movement & Zoom keys
      const k = e.key;
      const isArrow = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(k);
      const isPage = k === 'PageUp' || k === 'PageDown';

      if (isPage) {
        keys.current.add(k);
        onUserInteraction?.();
        e.preventDefault();
        invalidate();
        return;
      }

      if (isArrow) {
        if (!e.shiftKey && !e.ctrlKey && !e.altKey) {
          keys.current.add(k);
        } else if (e.shiftKey && e.ctrlKey) {
          keys.current.add('ShiftCtrl' + k);
        } else if (e.shiftKey) {
          keys.current.add('Shift' + k);
        } else if (e.ctrlKey) {
          keys.current.add('Ctrl' + k);
        } else if (e.altKey) {
          keys.current.add('Alt' + k);
        }
        onUserInteraction?.();
        e.preventDefault();
        invalidate();
      }
    };

    const onUp = (e: KeyboardEvent) => {
      const k = e.key;
      keys.current.delete(k);
      keys.current.delete('Shift' + k);
      keys.current.delete('Ctrl' + k);
      keys.current.delete('Alt' + k);
      keys.current.delete('ShiftCtrl' + k);
      if (k === 'Shift') for (const key of [...keys.current]) { if (key.startsWith('Shift')) keys.current.delete(key); }
      if (k === 'Control') for (const key of [...keys.current]) { if (key.startsWith('Ctrl')) keys.current.delete(key); }
      if (k === 'Alt') for (const key of [...keys.current]) { if (key.startsWith('Alt')) keys.current.delete(key); }
    };

    const clear = () => { keys.current.clear(); };

    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    window.addEventListener('blur', clear);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      window.removeEventListener('blur', clear);
    };
  }, [invalidate, onResetView, onUserInteraction, onTogglePerformance]);

  useFrame((_, delta) => {
    if (keys.current.size === 0 || !controls) return;
    const dt = Math.min(delta, 0.1) * 60;
    const k = keys.current;
    const isOrtho = (camera as THREE.OrthographicCamera).isOrthographicCamera;

    // 1. Zoom (Ctrl + ↑ / ↓ ou PageUp / PageDown)
    const hasZoomIn = k.has('PageUp') || k.has('CtrlArrowUp');
    const hasZoomOut = k.has('PageDown') || k.has('CtrlArrowDown');
    if (hasZoomIn || hasZoomOut) {
      if (isOrtho) {
        const factor = Math.pow(0.95, dt);
        const ortho = camera as THREE.OrthographicCamera;
        if (hasZoomIn) ortho.zoom = Math.min(50, ortho.zoom / factor);
        if (hasZoomOut) ortho.zoom = Math.max(0.1, ortho.zoom * factor);
        ortho.updateProjectionMatrix();
      } else {
        _previewTmpDollyDir.subVectors(controls.target, camera.position);
        const dist = _previewTmpDollyDir.length();
        _previewTmpDollyDir.normalize();
        const step = Math.min(dist * 0.02 * dt, Math.max(0, dist - 2));
        if (hasZoomIn) camera.position.addScaledVector(_previewTmpDollyDir, step);
        if (hasZoomOut) camera.position.addScaledVector(_previewTmpDollyDir, -dist * 0.02 * dt);
      }
      controls.update();
      invalidate();
    }

    // 2. Pan (Alt, Shift+Ctrl, Ctrl+gauche/droite, ou flèches simples en Ortho)
    const plainPan = isOrtho;
    const hasPan = (plainPan && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].some(a => k.has(a))) ||
      ['ArrowLeft', 'ArrowRight'].some(a => k.has('Ctrl' + a)) ||
      ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].some(a => k.has('Alt' + a) || k.has('ShiftCtrl' + a));

    if (hasPan) {
      _previewTmpCamRight.setFromMatrixColumn(camera.matrixWorld, 0);
      _previewTmpCamForward.setFromMatrixColumn(camera.matrixWorld, 1);
      const panStep = Math.max(0.5, controls.target.distanceTo(camera.position) * 0.015) * dt;
      _previewTmpPanDelta.set(0, 0, 0);
      const isPanKey = (a: string) => (plainPan && k.has(a)) || k.has('Alt' + a) || k.has('ShiftCtrl' + a) || ((a === 'ArrowLeft' || a === 'ArrowRight') && k.has('Ctrl' + a));

      if (isPanKey('ArrowLeft')) _previewTmpPanDelta.addScaledVector(_previewTmpCamRight, -panStep);
      if (isPanKey('ArrowRight')) _previewTmpPanDelta.addScaledVector(_previewTmpCamRight, panStep);
      if (isPanKey('ArrowUp')) _previewTmpPanDelta.addScaledVector(_previewTmpCamForward, panStep);
      if (isPanKey('ArrowDown')) _previewTmpPanDelta.addScaledVector(_previewTmpCamForward, -panStep);

      camera.position.add(_previewTmpPanDelta);
      controls.target.add(_previewTmpPanDelta);
      controls.update();
      invalidate();
    }

    // 3. Orbit (Shift+flèches, ou flèches simples en Perspective)
    const plainOrbit = !isOrtho;
    const hasOrbit = (plainOrbit && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].some(a => k.has(a))) ||
      ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].some(a => k.has('Shift' + a));

    if (hasOrbit) {
      const rotates = (key: string) => k.has('Shift' + key) || (plainOrbit && k.has(key));
      _previewTmpOffset.copy(camera.position).sub(controls.target);
      _previewTmpSph.setFromVector3(_previewTmpOffset);
      if (rotates('ArrowLeft')) _previewTmpSph.theta -= 0.03 * dt;
      if (rotates('ArrowRight')) _previewTmpSph.theta += 0.03 * dt;
      if (rotates('ArrowUp')) _previewTmpSph.phi -= 0.03 * dt;
      if (rotates('ArrowDown')) _previewTmpSph.phi += 0.03 * dt;
      _previewTmpSph.makeSafe();
      _previewTmpOffset.setFromSpherical(_previewTmpSph);
      camera.position.copy(controls.target).add(_previewTmpOffset);
      controls.update();
      invalidate();
    }
  });

  return null;
}
