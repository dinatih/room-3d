import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { cameraState } from '../cameraState';
import { droneInput, useDroneControlStore } from '../droneControls';
import { MOUSE_SENS } from './cameraConstants';

/** Entrées exclusives au pilotage, sans verrouillage du pointeur. */
export function useDroneControls(preview: boolean) {
  const { gl, invalidate } = useThree();
  const piloting = useDroneControlStore(state => state.piloting);
  useEffect(() => {
    if (preview || !piloting) return;
    const canvas = gl.domElement;
    let pointer: number | null = null;
    let lastX = 0, lastY = 0;
    const releasePointer = () => {
      const captured = pointer;
      pointer = null;
      if (captured !== null && canvas.hasPointerCapture(captured)) canvas.releasePointerCapture(captured);
      cameraState.isDragging = false;
      invalidate();
    };
    const publishKeys = () => {
      const aliases: Record<string, string> = { z: 'ArrowUp', w: 'ArrowUp', s: 'ArrowDown', q: 'ArrowLeft', a: 'ArrowLeft', d: 'ArrowRight', ' ': 'character:Elevate', c: 'character:Descend' };
      document.dispatchEvent(new CustomEvent('camera-arrow-keys', { detail: [...droneInput.keys].map(key => aliases[key] ?? (key.startsWith('Arrow') && droneInput.keys.has('Alt') ? 'Alt' + key : key)) }));
    };
    const release = () => { droneInput.keys.clear(); releasePointer(); publishKeys(); };
    const directionInput = (event: Event) => {
      event.stopImmediatePropagation();
      const { key, pressed } = (event as CustomEvent<{ key: string; pressed: boolean }>).detail;
      droneInput.keys[pressed ? 'add' : 'delete'](key);
      publishKeys();
      invalidate();
    };
    const keyDown = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement).closest('input, textarea, select, [contenteditable="true"]') || event.ctrlKey || event.metaKey) return;
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      if (event.altKey && !key.startsWith('Arrow') && key !== 'Alt' && key !== 'Shift') return;
      if (!['z', 'w', 'q', 'a', 's', 'd', ' ', 'c', 'Shift', 'Alt', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      droneInput.keys.add(key);
      droneInput.keys[event.altKey ? 'add' : 'delete']('Alt');
      publishKeys();
      invalidate();
    };
    const keyUp = (event: KeyboardEvent) => {
      if (!droneInput.keys.delete(event.key.length === 1 ? event.key.toLowerCase() : event.key)) return;
      event.stopImmediatePropagation();
      publishKeys();
    };
    const pointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      pointer = event.pointerId;
      lastX = event.clientX;
      lastY = event.clientY;
      canvas.setPointerCapture(pointer);
      cameraState.isDragging = true;
      event.preventDefault();
    };
    const pointerMove = (event: PointerEvent) => {
      if (event.pointerId !== pointer) return;
      droneInput.yaw -= (event.clientX - lastX) * MOUSE_SENS;
      droneInput.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, droneInput.pitch - (event.clientY - lastY) * MOUSE_SENS));
      lastX = event.clientX;
      lastY = event.clientY;
      invalidate();
    };
    const focus = (event: FocusEvent) => {
      if ((event.target as HTMLElement).closest('input, textarea, select, [contenteditable="true"]')) release();
    };
    window.addEventListener('keydown', keyDown, true);
    window.addEventListener('keyup', keyUp, true);
    window.addEventListener('blur', release);
    document.addEventListener('visibilitychange', release);
    document.addEventListener('focusin', focus);
    document.addEventListener('camera-controls-release', release);
    document.addEventListener('camera-direction-input', directionInput, true);
    canvas.addEventListener('pointerdown', pointerDown);
    canvas.addEventListener('pointermove', pointerMove);
    canvas.addEventListener('pointerup', releasePointer);
    canvas.addEventListener('pointercancel', releasePointer);
    canvas.addEventListener('lostpointercapture', releasePointer);
    return () => {
      release();
      window.removeEventListener('keydown', keyDown, true);
      window.removeEventListener('keyup', keyUp, true);
      window.removeEventListener('blur', release);
      document.removeEventListener('visibilitychange', release);
      document.removeEventListener('focusin', focus);
      document.removeEventListener('camera-controls-release', release);
      document.removeEventListener('camera-direction-input', directionInput, true);
      canvas.removeEventListener('pointerdown', pointerDown);
      canvas.removeEventListener('pointermove', pointerMove);
      canvas.removeEventListener('pointerup', releasePointer);
      canvas.removeEventListener('pointercancel', releasePointer);
      canvas.removeEventListener('lostpointercapture', releasePointer);
    };
  }, [preview, piloting, gl, invalidate]);
}
