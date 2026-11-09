import { forwardRef, useCallback, useEffect, useMemo, useRef, useState, type ComponentProps } from 'react';
import { OrbitControls as DreiOrbitControls } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { MOUSE, Vector3, Quaternion, DoubleSide, type Group, type LineSegments } from 'three';
import { cameraState } from '../cameraState';
import type { CameraZoomDetail } from './types';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import './OrbitControls.scss';

function TargetDisc({ opacity = 0.2 }: { opacity?: number }) {
  return <>
    <mesh renderOrder={1000} raycast={() => {}}>
      <ringGeometry args={[0.65, 1, 32]} />
      <meshBasicMaterial color="#ff0000" transparent opacity={opacity} depthTest={false} depthWrite={false} toneMapped={false} side={DoubleSide} />
    </mesh>
    <mesh renderOrder={1000} raycast={() => {}}>
      <circleGeometry args={[0.2, 16]} />
      <meshBasicMaterial color="#ff0000" transparent opacity={opacity} depthTest={false} depthWrite={false} toneMapped={false} side={DoubleSide} />
    </mesh>
  </>;
}

/** Commandes partagées : le curseur indique l'action pendant un glisser souris. */
export const OrbitControls = forwardRef<OrbitControlsImpl, ComponentProps<typeof DreiOrbitControls> & {
  zoomScope?: 'scene' | 'preview';
  showTargetMarker?: boolean;
}>(
  function OrbitControls({ zoomScope = 'preview', showTargetMarker = true, ...props }, forwardedRef) {
    const [controls, setControls] = useState<OrbitControlsImpl | null>(null);
    const helperGroup = useRef<Group>(null);
    const targetMarker = useRef<Group>(null);
    const groundMarker = useRef<Group>(null);
    const lineRef = useRef<LineSegments>(null);
    const linePositions = useMemo(() => new Float32Array(6), []);
    const interacting = useRef(false);
    const previousPose = useRef({ position: new Vector3(), target: new Vector3(), rotation: new Quaternion(), initialized: false });
    const attachRef = useCallback((value: OrbitControlsImpl | null) => {
      setControls(value);
      if (typeof forwardedRef === 'function') forwardedRef(value);
      else if (forwardedRef) forwardedRef.current = value;
    }, [forwardedRef]);

    useFrame(({ camera, viewport, size }) => {
      const helper = helperGroup.current;
      if (!helper || !controls) return;
      const previous = previousPose.current;
      const precision = Number.EPSILON * Math.max(1, camera.position.lengthSq(), controls.target.lengthSq());
      const rotationDelta = (previous.rotation.x - camera.quaternion.x) ** 2 +
        (previous.rotation.y - camera.quaternion.y) ** 2 +
        (previous.rotation.z - camera.quaternion.z) ** 2 +
        (previous.rotation.w - camera.quaternion.w) ** 2;
      const moved = previous.initialized && (
        previous.position.distanceToSquared(camera.position) > precision ||
        previous.target.distanceToSquared(controls.target) > precision ||
        rotationDelta > Number.EPSILON
      );
      previous.position.copy(camera.position);
      previous.target.copy(controls.target);
      previous.rotation.copy(camera.quaternion);
      previous.initialized = true;
      helper.visible = (interacting.current || cameraState.isDragging || moved) &&
        !cameraState.isIntroRunning && !cameraState.isXR && cameraState.mode !== 'fpv' && cameraState.mode !== 'plane';
      if (!helper.visible) return;

      helper.position.set(controls.target.x, 0, controls.target.z);
      const targetY = controls.target.y;
      const hasHeight = Math.abs(targetY) >= 1;

      if (targetMarker.current) {
        targetMarker.current.position.y = targetY;
        targetMarker.current.quaternion.copy(camera.quaternion);
        // Rayon de 8 pixels, quelle que soit la projection ou la distance.
        targetMarker.current.scale.setScalar(8 * viewport.getCurrentViewport(camera, controls.target).height / size.height);
      }

      if (groundMarker.current) {
        groundMarker.current.visible = hasHeight;
        if (hasHeight) {
          groundMarker.current.scale.setScalar(8 * viewport.getCurrentViewport(camera, helper.position).height / size.height);
        }
      }

      if (lineRef.current) {
        lineRef.current.visible = hasHeight;
        if (hasHeight) {
          linePositions[4] = targetY;
          const posAttr = lineRef.current.geometry.getAttribute('position');
          if (posAttr) {
            posAttr.needsUpdate = true;
            lineRef.current.computeLineDistances();
          }
        }
      }
    });

    useEffect(() => {
      if (!controls) return;
      const onZoom = (event: Event) => {
        const { direction, scope, amount } = (event as CustomEvent<CameraZoomDetail>).detail;
        if (scope !== zoomScope || !controls.enabled || !controls.enableZoom) return;
        // Dix pas natifs par clic, fractionnés pour conserver l'amorti.
        const scale = Math.pow(0.95, (amount ?? 1) * 10);
        if (direction === 'in') controls.dollyIn(scale);
        else controls.dollyOut(scale);
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
        interacting.current = false;
        cursor = undefined;
        delete element.dataset.orbitDrag;
        if (helperGroup.current) helperGroup.current.visible = false;
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
        interacting.current = true;
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

    return <>
      <DreiOrbitControls {...props} ref={attachRef} />
      {zoomScope === 'scene' && showTargetMarker && <group ref={helperGroup} name="orbit-target-helper" visible={false}>
        <lineSegments ref={lineRef} renderOrder={1000} raycast={() => {}}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
          </bufferGeometry>
          <lineDashedMaterial color="#ff0000" dashSize={4} gapSize={3} transparent opacity={0.4} depthTest={false} depthWrite={false} toneMapped={false} />
        </lineSegments>
        <group ref={groundMarker} position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <TargetDisc opacity={0.25} />
        </group>
        <group ref={targetMarker}>
          <TargetDisc opacity={0.2} />
        </group>
      </group>}
    </>;
  },
);
