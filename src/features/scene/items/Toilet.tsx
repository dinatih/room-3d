/**
 * Toilet.tsx — WC President Toilet Horizontal Outlet.
 * items/president-toilet/president-toilet.glb
 * GLB en mètres → scale ×100 (1 unité = 1 cm).
 * Coordonnées locales : centré X/Z, Y=0 = sol.
 */
import { useLayoutEffect, useRef } from 'react';
import { useDoorOpen } from './useDoorOpen';
import { useGLTF } from '@react-three/drei';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { removeGlbLines, glbLocalBBox } from '@features/scene/glbUtils';
import type { SceneItemProps } from '@shared/types';
import { TOILET_HINGE_ANGLE, TOILET_HINGE_SPEED, TOILET_HINGE_TOLERANCE } from './toiletAnimation';

const GLB = 'items/president-toilet/president-toilet.glb';

export const TOILET_W = 40;
export const TOILET_D = 70;

/** Centre de la cuvette dans le modèle recentré, également utilisé par l'eau. */
export const TOILET_BOWL_CENTER: [number, number, number] = [0, 17.5, 10];

const waterGeo = new THREE.CircleGeometry(1, 32);
const waterMat = new THREE.MeshStandardMaterial({
  color: 0x2ba6e3,
  transparent: true,
  opacity: 0.7,
  roughness: 0.1,
  metalness: 0.1,
  depthWrite: false,
});

function animateHinge(hinge: THREE.Group | null, open: boolean, delta: number): boolean {
  if (!hinge) return false;
  const target = hinge.userData.initialRotation + (open ? -TOILET_HINGE_ANGLE : 0);
  if (Math.abs(target - hinge.rotation.x) <= TOILET_HINGE_TOLERANCE) return false;
  hinge.rotation.x = THREE.MathUtils.damp(hinge.rotation.x, target, TOILET_HINGE_SPEED, delta);
  return true;
}

export function Toilet({ onSize, actionState = {}, isPreview = false }: Partial<Omit<SceneItemProps, 'item'>>) {
  const { scene } = useGLTFClone(GLB);
  const { invalidate } = useThree();

  const lidHingeRef = useRef<THREE.Group | null>(null);
  const seatHingeRef = useRef<THREE.Group | null>(null);
  const buttonRef = useRef<THREE.Object3D | null>(null);

  const isLidOpen = useDoorOpen('wc-lid-toggle', isPreview, actionState);
  const isSeatOpen = useDoorOpen('wc-seat-toggle', isPreview, actionState);
  const isFlushingRef = useRef(false);

  useLayoutEffect(() => {
    if (isPreview) return;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const handler = (event: Event) => {
      const { key, value } = (event as CustomEvent<{ key: string; value?: boolean }>).detail;
      if (key !== 'wc-flush') return;
      clearTimeout(timeout);
      isFlushingRef.current = value === undefined || !!value;
      invalidate();
      if (isFlushingRef.current) {
        timeout = setTimeout(() => {
          isFlushingRef.current = false;
          invalidate();
        }, 1500);
      }
    };
    document.addEventListener('furniture-toggle', handler);
    return () => {
      document.removeEventListener('furniture-toggle', handler);
      clearTimeout(timeout);
      isFlushingRef.current = false;
    };
  }, [invalidate, isPreview]);

  useLayoutEffect(() => {
    if (!isPreview) return;
    isFlushingRef.current = !!actionState['wc-flush'];
    invalidate();
  }, [isPreview, actionState['wc-flush'], invalidate]);

  useLayoutEffect(() => {
    removeGlbLines(scene);
    scene.scale.setScalar(100);
    
    scene.traverse((c) => {
      const m = c as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });

    const setupHinge = (meshName: string, hingeRef: React.MutableRefObject<THREE.Group | null>) => {
      const mesh = scene.getObjectByName(meshName);
      if (mesh && !hingeRef.current && mesh.parent) {
        const box = glbLocalBBox(mesh);
        const hinge = new THREE.Group();
        
        hinge.position.copy(mesh.position);
        hinge.rotation.copy(mesh.rotation);
        hinge.scale.copy(mesh.scale);
        
        hinge.translateX(0);
        hinge.translateY(box.max.y);
        hinge.translateZ(box.min.z);

        mesh.parent.add(hinge);

        mesh.position.set(0, -box.max.y, -box.min.z);
        mesh.rotation.set(0, 0, 0);
        mesh.scale.set(1, 1, 1);
        hinge.add(mesh);
        
        hingeRef.current = hinge;
        hinge.userData.initialRotation = hinge.rotation.x;
      }
    };

    setupHinge('lid', lidHingeRef);
    setupHinge('seat', seatHingeRef);

    const button = scene.getObjectByName('button');
    if (button) {
      buttonRef.current = button;
      button.userData.originalZ = button.position.z;
    }

    const box = glbLocalBBox(scene);
    scene.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.min.y,
      -(box.min.z + box.max.z) / 2,
    );
    onSize?.(box.getSize(new THREE.Vector3()));
  }, [scene, onSize]);

  useFrame((_, delta) => {
    let active = animateHinge(lidHingeRef.current, isLidOpen, delta);
    active = animateHinge(seatHingeRef.current, isSeatOpen, delta) || active;

    if (buttonRef.current && buttonRef.current.userData.originalZ !== undefined) {
      const targetZ = isFlushingRef.current ? buttonRef.current.userData.originalZ - 0.03 : buttonRef.current.userData.originalZ;
      const diff = targetZ - buttonRef.current.position.z;
      if (Math.abs(diff) > 0.001) {
        buttonRef.current.position.z += diff * 15 * delta;
        active = true;
      }
    }

    if (active) invalidate();
  });

  return (
    <group>
      <primitive object={scene} />
      <mesh
        geometry={waterGeo}
        material={waterMat}
        position={TOILET_BOWL_CENTER}
        rotation-x={-Math.PI / 2}
        scale={[4.5, 6, 1]}
        receiveShadow
        renderOrder={2}
      />
    </group>
  );
}

useGLTF.preload(GLB);
