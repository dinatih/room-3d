import { forwardRef, useCallback, useEffect, useRef, useState, type ComponentProps } from 'react';
import { OrbitControls as DreiOrbitControls } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { MOUSE, type Group } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import './OrbitControls.scss';

/** Commandes partagées : le curseur indique l'action pendant un glisser souris. */
export const OrbitControls = forwardRef<OrbitControlsImpl, ComponentProps<typeof DreiOrbitControls> & {
  zoomScope?: 'scene' | 'preview';
  showTargetMarker?: boolean;
}>(
  function OrbitControls({ zoomScope = 'preview', showTargetMarker = true, ...props }, forwardedRef) {
    const [controls, setControls] = useState<OrbitControlsImpl | null>(null);
    const targetMarker = useRef<Group>(null);
    const attachRef = useCallback((value: OrbitControlsImpl | null) => {
      setControls(value);
      if (typeof forwardedRef === 'function') forwardedRef(value);
      else if (forwardedRef) forwardedRef.current = value;
    }, [forwardedRef]);

    useFrame(({ camera, viewport, size }) => {
      const marker = targetMarker.current;
      if (!marker || !controls) return;
      if (!controls.enabled || !controls.enableRotate) marker.visible = false;
      if (!marker.visible) return;
      marker.position.copy(controls.target);
      marker.quaternion.copy(camera.quaternion);
      // Rayon de 8 pixels, quelle que soit la projection ou la distance.
      marker.scale.setScalar(8 * viewport.getCurrentViewport(camera, controls.target).height / size.height);
    });

    useEffect(() => {
      if (!controls) return;
      const onZoom = (event: Event) => {
        const { direction, scope } = (event as CustomEvent<{
          direction: 'in' | 'out'; scope: 'scene' | 'preview';
        }>).detail;
        if (scope !== zoomScope || !controls.enabled || !controls.enableZoom) return;
        if (direction === 'in') controls.dollyIn();
        else controls.dollyOut();
      };
      document.addEventListener('camera-zoom', onZoom);
      return () => document.removeEventListener('camera-zoom', onZoom);
    }, [controls, zoomScope]);

    useEffect(() => {
      if (!controls) return;
      if (props.mouseButtons) controls.mouseButtons = props.mouseButtons as typeof controls.mouseButtons;
      if (props.touches) controls.touches = props.touches as typeof controls.touches;
    }, [controls, props.mouseButtons, props.touches]);

    useEffect(() => {


      if (!controls) return;
      const element = controls.domElement;
      if (!element) throw new Error('OrbitControls doit être connecté à un élément DOM.');
      let cursor: string | undefined;
      const reset = () => {
        cursor = undefined;
        delete element.dataset.orbitDrag;
        if (targetMarker.current) targetMarker.current.visible = false;
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
        if (targetMarker.current) targetMarker.current.visible = cursor === 'rotate';
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

    return <>
      <DreiOrbitControls {...props} ref={attachRef} />
      {zoomScope === 'scene' && showTargetMarker && <group ref={targetMarker} name="orbit-target-marker" visible={false}>
        <mesh renderOrder={1000} raycast={() => {}}>
          <ringGeometry args={[0.65, 1, 32]} />
          <meshBasicMaterial color="#ff0000" transparent opacity={0.2} depthTest={false} depthWrite={false} toneMapped={false} />
        </mesh>
        <mesh renderOrder={1000} raycast={() => {}}>
          <circleGeometry args={[0.2, 16]} />
          <meshBasicMaterial color="#ff0000" transparent opacity={0.2} depthTest={false} depthWrite={false} toneMapped={false} />
        </mesh>
      </group>}
    </>;
  },
);
