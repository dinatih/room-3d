/**
 * Toilet.tsx — WC President Toilet Horizontal Outlet.
 * items/president-toilet/president-toilet.glb
 * GLB en mètres → scale ×100 (1 unité = 1 cm).
 * Coordonnées locales : centré X/Z, Y=0 = sol.
 */
import { useLayoutEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { removeGlbLines, glbLocalBBox } from '@features/scene/glbUtils';
import type { SceneItemProps } from '@shared/types';
import { TOILET_HINGE_ANGLE, TOILET_HINGE_SPEED, TOILET_HINGE_TOLERANCE, TOILET_FLUSH_DURATION } from './toiletAnimation';
import { ToiletWater } from './ToiletWater';

const GLB = 'items/president-toilet/president-toilet.glb';

export const TOILET_W = 40;
export const TOILET_D = 70;
export const TOILET_H = 80;

export function Toilet({ onSize, actionState, isPreview = false }: SceneItemProps) {
  const { scene } = useGLTFClone(GLB);
  const { invalidate } = useThree();

  const lidHingeRef = useRef<THREE.Group | null>(null);
  const seatHingeRef = useRef<THREE.Group | null>(null);
  const buttonRef = useRef<THREE.Object3D | null>(null);

  const isLidOpenRef = useRef(false);
  const isSeatOpenRef = useRef(false);
  const isFlushingRef = useRef(false);
  const flushTimeRef = useRef(0);
  const prevPreviewFlushRef = useRef(false);

  const triggerFlush = () => {
    isFlushingRef.current = true;
    flushTimeRef.current = 0;
    invalidate();
  };

  useLayoutEffect(() => {
    if (isPreview) return;
    const handler = (e: any) => {
      const { key, value } = e.detail;
      if (key === 'wc-lid-toggle') {
        isLidOpenRef.current = value !== undefined ? !!value : !isLidOpenRef.current;
        invalidate();
      }
      if (key === 'wc-seat-toggle') {
        isSeatOpenRef.current = value !== undefined ? !!value : !isSeatOpenRef.current;
        invalidate();
      }
      if (key === 'wc-flush') {
        if (value !== false) {
          triggerFlush();
        }
      }
    };
    document.addEventListener('furniture-toggle', handler);
    return () => document.removeEventListener('furniture-toggle', handler);
  }, [invalidate, isPreview]);

  useLayoutEffect(() => {
    if (!isPreview) return;
    isLidOpenRef.current = !!actionState['wc-lid-toggle'];
    isSeatOpenRef.current = !!actionState['wc-seat-toggle'];
    const previewFlush = !!actionState['wc-flush'];
    if (previewFlush && !prevPreviewFlushRef.current) {
      triggerFlush();
    }
    prevPreviewFlushRef.current = previewFlush;
    invalidate();
  }, [isPreview, actionState['wc-lid-toggle'], actionState['wc-seat-toggle'], actionState['wc-flush'], invalidate]);

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
    let active = false;
    if (lidHingeRef.current && lidHingeRef.current.userData.initialRotation !== undefined) {
      const targetLidAngle = lidHingeRef.current.userData.initialRotation + (isLidOpenRef.current ? -TOILET_HINGE_ANGLE : 0);
      const diff = targetLidAngle - lidHingeRef.current.rotation.x;
      if (Math.abs(diff) > TOILET_HINGE_TOLERANCE) {
        lidHingeRef.current.rotation.x += diff * TOILET_HINGE_SPEED * delta;
        active = true;
      }
    }
    
    if (seatHingeRef.current && seatHingeRef.current.userData.initialRotation !== undefined) {
      const targetSeatAngle = seatHingeRef.current.userData.initialRotation + (isSeatOpenRef.current ? -TOILET_HINGE_ANGLE : 0);
      const diff = targetSeatAngle - seatHingeRef.current.rotation.x;
      if (Math.abs(diff) > TOILET_HINGE_TOLERANCE) {
        seatHingeRef.current.rotation.x += diff * TOILET_HINGE_SPEED * delta;
        active = true;
      }
    }

    if (buttonRef.current && buttonRef.current.userData.originalZ !== undefined) {
      let buttonPress = 0;
      if (isFlushingRef.current) {
        const p = flushTimeRef.current / TOILET_FLUSH_DURATION;
        if (p < 0.15) {
          buttonPress = p / 0.15;
        } else if (p < 0.35) {
          buttonPress = Math.max(0, 1.0 - (p - 0.15) / 0.20);
        }
      }
      const targetZ = buttonRef.current.userData.originalZ - 0.03 * buttonPress;
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
      <ToiletWater
        isFlushingRef={isFlushingRef}
        flushTimeRef={flushTimeRef}
        invalidate={invalidate}
      />
    </group>
  );
}

useGLTF.preload(GLB);
