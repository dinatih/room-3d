/**
 * Toilet.tsx — WC President Toilet Horizontal Outlet.
 * media/glb/president_toilet_horizontal_outlet.glb
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

const GLB = 'media/glb/president_toilet_horizontal_outlet.glb';

export function Toilet({ actionState, onSize }: SceneItemProps) {
  const { scene } = useGLTFClone(GLB);
  const { invalidate } = useThree();

  const lidHingeRef = useRef<THREE.Group | null>(null);
  const seatHingeRef = useRef<THREE.Group | null>(null);
  const buttonRef = useRef<THREE.Object3D | null>(null);

  const isLidOpenRef = useRef(!!actionState?.['wc-lid-toggle']);
  const isSeatOpenRef = useRef(!!actionState?.['wc-seat-toggle']);
  const isFlushingRef = useRef(!!actionState?.['wc-flush']);
  
  isLidOpenRef.current = !!actionState?.['wc-lid-toggle'];
  isSeatOpenRef.current = !!actionState?.['wc-seat-toggle'];
  isFlushingRef.current = !!actionState?.['wc-flush'];

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

    // Set up pivots for lid and seat
    const lid = scene.getObjectByName('lid');
    const seat = scene.getObjectByName('seat');
    const button = scene.getObjectByName('button');

    if (lid && !lidHingeRef.current && lid.parent) {
      const box = glbLocalBBox(lid);
      const hinge = new THREE.Group();
      
      hinge.position.copy(lid.position);
      hinge.rotation.copy(lid.rotation);
      hinge.scale.copy(lid.scale);
      
      // Pivot offset in local space
      hinge.translateX(0);
      hinge.translateY(box.max.y);
      hinge.translateZ(box.min.z);

      lid.parent.add(hinge);

      lid.position.set(0, -box.max.y, -box.min.z);
      lid.rotation.set(0, 0, 0);
      lid.scale.set(1, 1, 1);
      hinge.add(lid);
      
      lidHingeRef.current = hinge;
      hinge.userData.initialRotation = hinge.rotation.x;
    }

    if (seat && !seatHingeRef.current && seat.parent) {
      const box = glbLocalBBox(seat);
      const hinge = new THREE.Group();
      
      hinge.position.copy(seat.position);
      hinge.rotation.copy(seat.rotation);
      hinge.scale.copy(seat.scale);
      
      hinge.translateX(0);
      hinge.translateY(box.max.y);
      hinge.translateZ(box.min.z);

      seat.parent.add(hinge);
      
      seat.position.set(0, -box.max.y, -box.min.z);
      seat.rotation.set(0, 0, 0);
      seat.scale.set(1, 1, 1);
      hinge.add(seat);

      seatHingeRef.current = hinge;
      hinge.userData.initialRotation = hinge.rotation.x;
    }

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
      const targetLidAngle = lidHingeRef.current.userData.initialRotation + (isLidOpenRef.current ? -Math.PI / 2.2 : 0);
      const diff = targetLidAngle - lidHingeRef.current.rotation.x;
      if (Math.abs(diff) > 0.005) {
        lidHingeRef.current.rotation.x += diff * 10 * delta;
        active = true;
      }
    }
    
    if (seatHingeRef.current && seatHingeRef.current.userData.initialRotation !== undefined) {
      const targetSeatAngle = seatHingeRef.current.userData.initialRotation + (isSeatOpenRef.current ? -Math.PI / 2.2 : 0);
      const diff = targetSeatAngle - seatHingeRef.current.rotation.x;
      if (Math.abs(diff) > 0.005) {
        seatHingeRef.current.rotation.x += diff * 10 * delta;
        active = true;
      }
    }

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

  return <primitive object={scene} />;
}

useGLTF.preload(GLB);
