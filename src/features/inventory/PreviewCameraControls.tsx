import { useCallback, useLayoutEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { OrthographicCamera, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { OrbitControls } from '../scene/camera/OrbitControls';
import { resolveCameraView } from '../scene/camera/cameraViews';
import { getOrbitMouseButtons, getOrbitTouches } from '../scene/camera/orbitMouseButtons';
import { useSceneStore } from '../scene/store/useSceneStore';
import { usePreviewViewStore } from './usePreviewViewStore';
type PreviewCameraView = string;

function getPreviewViewConfig(key: string, elevation = 45): { direction: THREE.Vector3; up: [number, number, number] } {
  const view = resolveCameraView(key, 'persp', undefined, elevation);
  return {
    direction: new THREE.Vector3(...view.pos).sub(new THREE.Vector3(...view.target)).normalize(),
    up: [0, 1, 0],
  };
}

export function PreviewCameraControls({ mode, target, boundsRadius, autoRotate, onInteraction }: {
  mode: PreviewCameraView;
  target: [number, number, number];
  boundsRadius: number;
  autoRotate: boolean;
  onInteraction: () => void;
}) {
  const needsFraming = usePreviewViewStore(state => state.pose === null);
  const { size, camera } = useThree();
  const projection = useSceneStore(state => state.cameraProjection);
  const elevation = useSceneStore(state => state.cameraElevation);
  const mouseMode = useSceneStore(state => state.orbitMouseMode);
  const perspective = useRef<THREE.PerspectiveCamera>(null);
  const orthographic = useRef<THREE.OrthographicCamera>(null);
  const controls = useRef<OrbitControlsImpl>(null);
  const applying = useRef(false);
  const previousPreset = useRef({ mode, elevation });
  const aspect = size.width / size.height;
  const savePose = useCallback(() => {
    const ctrl = controls.current;
    if (!ctrl || applying.current || ctrl.object !== (projection === 'ortho' ? orthographic.current : perspective.current)) return;
    const cam = ctrl.object as THREE.PerspectiveCamera | THREE.OrthographicCamera;
    const offset = cam.position.clone().sub(ctrl.target);
    const height = cam instanceof THREE.OrthographicCamera
      ? (cam.top - cam.bottom) / cam.zoom
      : 2 * offset.length() * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    usePreviewViewStore.setState({ pose: {
      direction: offset.normalize().toArray(),
      targetOffset: ctrl.target.clone().sub(new THREE.Vector3(...target)).divideScalar(boundsRadius).toArray(),
      heightRatio: height / boundsRadius,
      up: cam.up.toArray(),
    } });
  }, [target, boundsRadius, projection]);

  useLayoutEffect(() => {
    const cam = projection === 'ortho' ? orthographic.current : perspective.current;
    if (!cam) return;
    applying.current = true;
    let pose = usePreviewViewStore.getState().pose;
    const presetChanged = previousPreset.current.mode !== mode || previousPreset.current.elevation !== elevation;
    if (!pose || presetChanged) {
      const config = mode === 'free'
        ? { direction: new THREE.Vector3(0.75, 0.45, 0.95).normalize(), up: [0, 1, 0] as [number, number, number] }
        : getPreviewViewConfig(mode, elevation);
      pose = { direction: config.direction.toArray(), up: config.up, targetOffset: [0, 0, 0], heightRatio: 2 };
      usePreviewViewStore.setState({ pose });
    }
    previousPreset.current = { mode, elevation };
    const center = new THREE.Vector3(...target).addScaledVector(new THREE.Vector3(...pose.targetOffset), boundsRadius);
    const height = boundsRadius * pose.heightRatio;
    const distance = height / (2 * Math.tan(Math.PI / 8));
    cam.position.copy(center).addScaledVector(new THREE.Vector3(...pose.direction), distance);
    cam.up.set(...pose.up);
    cam.layers.enableAll();
    if (cam instanceof THREE.OrthographicCamera) {
      cam.left = -height * aspect / 2;
      cam.right = height * aspect / 2;
      cam.top = height / 2;
      cam.bottom = -height / 2;
      cam.zoom = 1;
    }
    cam.lookAt(center);
    cam.updateProjectionMatrix();
    if (controls.current) {
      controls.current.object = cam;
      controls.current.target.copy(center);
      controls.current.update();
    }
    applying.current = false;
  }, [camera, mode, elevation, projection, target, boundsRadius, aspect, needsFraming]);

  return <>
    {projection === 'ortho'
      ? <OrthographicCamera ref={orthographic} makeDefault manual near={0.1} far={10000} />
      : <PerspectiveCamera ref={perspective} makeDefault fov={45} near={0.1} far={10000} />}
    <OrbitControls ref={controls} makeDefault enablePan enableZoom screenSpacePanning
      mouseButtons={getOrbitMouseButtons(mouseMode)} touches={getOrbitTouches(mouseMode)}
      autoRotate={autoRotate} autoRotateSpeed={1.2} onStart={onInteraction} onChange={savePose} />
  </>;
}

