import { forwardRef, useCallback, useEffect, useState, type ComponentProps } from 'react';
import { OrbitControls as DreiOrbitControls } from '@react-three/drei';
import { MOUSE } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import './OrbitControls.scss';

/** Commandes partagées : le curseur indique l'action pendant un glisser souris. */
export const OrbitControls = forwardRef<OrbitControlsImpl, ComponentProps<typeof DreiOrbitControls>>(
  function OrbitControls(props, forwardedRef) {
    const [controls, setControls] = useState<OrbitControlsImpl | null>(null);
    const attachRef = useCallback((value: OrbitControlsImpl | null) => {
      setControls(value);
      if (typeof forwardedRef === 'function') forwardedRef(value);
      else if (forwardedRef) forwardedRef.current = value;
    }, [forwardedRef]);

    useEffect(() => {
      if (!controls) return;
      const element = controls.domElement;
      if (!element) throw new Error('OrbitControls doit être connecté à un élément DOM.');
      let cursor: string | undefined;
      const reset = () => {
        cursor = undefined;
        delete element.dataset.orbitDrag;
      };
      const onDown = (event: PointerEvent) => {
        cursor = undefined;
        if (event.pointerType !== 'mouse' || !controls.enabled) return;
        let action = event.button === 0 ? controls.mouseButtons.LEFT
          : event.button === 1 ? controls.mouseButtons.MIDDLE
          : event.button === 2 ? controls.mouseButtons.RIGHT : undefined;
        // OrbitControls inverse rotation et translation avec ces modificateurs.
        if (event.ctrlKey || event.metaKey || event.shiftKey) {
          if (action === MOUSE.ROTATE) action = MOUSE.PAN;
          else if (action === MOUSE.PAN) action = MOUSE.ROTATE;
        }
        if (action === MOUSE.ROTATE && controls.enableRotate) cursor = 'rotate';
        else if (action === MOUSE.PAN && controls.enablePan) cursor = 'pan';
        else if (action === MOUSE.DOLLY && controls.enableZoom) cursor = 'zoom';
      };
      const onStart = () => {
        if (cursor) element.dataset.orbitDrag = cursor;
      };
      element.addEventListener('pointerdown', onDown, true);
      controls.addEventListener('start', onStart);
      controls.addEventListener('end', reset);
      window.addEventListener('pointerup', reset);
      window.addEventListener('pointercancel', reset);
      window.addEventListener('blur', reset);
      return () => {
        reset();
        element.removeEventListener('pointerdown', onDown, true);
        controls.removeEventListener('start', onStart);
        controls.removeEventListener('end', reset);
        window.removeEventListener('pointerup', reset);
        window.removeEventListener('pointercancel', reset);
        window.removeEventListener('blur', reset);
      };
    }, [controls]);

    return <DreiOrbitControls {...props} ref={attachRef} />;
  },
);
