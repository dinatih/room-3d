import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as THREE from 'three';

interface Props {
  size: THREE.Vector3;
}

export function Controller({ size }: Props) {
  const { camera, gl } = useThree();
  const ctrlRef = useRef<OrbitControls | null>(null);

  // Setup OrbitControls once per mount
  useEffect(() => {
    const ctrl = new OrbitControls(camera, gl.domElement);
    ctrl.enableDamping   = true;
    ctrl.dampingFactor   = 0.08;
    ctrl.autoRotate      = true;
    ctrl.autoRotateSpeed = 1.5;
    ctrlRef.current = ctrl;
    return () => ctrl.dispose();
  }, [camera, gl]);

  // Refit camera whenever size changes
  useEffect(() => {
    if (!ctrlRef.current) return;
    const maxDim = Math.max(size.x, size.y, size.z);
    const cam    = camera as THREE.PerspectiveCamera;
    const fovRad = THREE.MathUtils.degToRad(cam.fov);
    const dist   = (maxDim / 2) / Math.tan(fovRad / 2) * 1.9;
    camera.position.set(dist * 0.6, dist * 0.5, dist);
    cam.near = Math.max(0.01, dist * 0.01);
    cam.far  = dist * 20;
    cam.updateProjectionMatrix();
    ctrlRef.current.target.set(0, 0, 0);
    ctrlRef.current.update();
  }, [size]);

  useFrame(() => ctrlRef.current?.update());

  return null;
}
