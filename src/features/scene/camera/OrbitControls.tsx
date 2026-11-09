import { forwardRef, useCallback, useEffect, useMemo, useRef, useState, type ComponentProps } from 'react';
import { OrbitControls as DreiOrbitControls } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { MOUSE, DoubleSide, RingGeometry, CircleGeometry, MeshBasicMaterial, LineDashedMaterial, type Group, type Mesh, type LineSegments } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { cameraState } from '../cameraState';
import type { CameraZoomDetail } from './types';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import './OrbitControls.scss';

const TARGET_GEOM = mergeGeometries([new RingGeometry(0.65, 1, 32), new CircleGeometry(0.2, 16)]);
const TARGET_MAT = new MeshBasicMaterial({ color: '#ff0000', transparent: true, opacity: 0.25, depthTest: false, depthWrite: false, toneMapped: false, side: DoubleSide });
const LINE_MAT = new LineDashedMaterial({ color: '#ff0000', dashSize: 4, gapSize: 3, transparent: true, opacity: 0.4, depthTest: false, depthWrite: false, toneMapped: false });

/** Commandes partagées : le curseur indique l'action pendant un glisser souris. */
export const OrbitControls = forwardRef<OrbitControlsImpl, ComponentProps<typeof DreiOrbitControls> & {
  zoomScope?: 'scene' | 'preview';
  showTargetMarker?: boolean;
}>(
  function OrbitControls({ zoomScope = 'preview', showTargetMarker = true, ...props }, forwardedRef) {
    const [controls, setControls] = useState<OrbitControlsImpl | null>(null);
    const helper = useRef<Group>(null);
    const groundGroup = useRef<Group>(null);
    const airTarget = useRef<Mesh>(null);
    const groundTarget = useRef<Mesh>(null);
    const lineRef = useRef<LineSegments>(null);
    const linePositions = useMemo(() => new Float32Array(6), []);
    const interacting = useRef(false);
    const attachRef = useCallback((value: OrbitControlsImpl | null) => {
      setControls(value);
      if (typeof forwardedRef === 'function') forwardedRef(value);
      else if (forwardedRef) forwardedRef.current = value;
    }, [forwardedRef]);

    useFrame(({ camera, viewport, size }) => {
      const helperGroup = helper.current;
      if (!helperGroup || !controls) return;
      helperGroup.visible = (interacting.current || cameraState.isDragging || cameraState.isUserMovingCamera) &&
        !cameraState.isIntroRunning && !cameraState.isXR && cameraState.mode !== 'fpv' && cameraState.mode !== 'plane';
      if (!helperGroup.visible) return;

      helperGroup.position.set(controls.target.x, 0, controls.target.z);
      const targetY = controls.target.y;
      const scale = 8 * viewport.getCurrentViewport(camera, controls.target).height / size.height;

      for (const t of [airTarget.current, groundTarget.current]) t?.scale.setScalar(scale);
      if (airTarget.current) {
        airTarget.current.position.y = targetY;
        airTarget.current.quaternion.copy(camera.quaternion);
      }

      const hasHeight = Math.abs(targetY) >= 1;
      if (groundGroup.current) groundGroup.current.visible = hasHeight;
      if (hasHeight && lineRef.current) {
        linePositions[4] = targetY;
        lineRef.current.geometry.getAttribute('position').needsUpdate = true;
        lineRef.current.computeLineDistances();
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
        if (helper.current) helper.current.visible = false;
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
      {zoomScope === 'scene' && showTargetMarker && <group ref={helper} name="orbit-target-helper" visible={false}>
        <group ref={groundGroup} visible={false}>
          <lineSegments ref={lineRef} material={LINE_MAT} renderOrder={1000} raycast={() => {}}>
            <bufferGeometry><bufferAttribute attach="attributes-position" args={[linePositions, 3]} /></bufferGeometry>
          </lineSegments>
          <mesh ref={groundTarget} geometry={TARGET_GEOM} material={TARGET_MAT} position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1000} raycast={() => {}} />
        </group>
        <mesh ref={airTarget} geometry={TARGET_GEOM} material={TARGET_MAT} renderOrder={1000} raycast={() => {}} />
      </group>}
    </>;
  },
);
