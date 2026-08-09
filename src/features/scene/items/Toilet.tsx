/**
 * Toilet.tsx — WC President Toilet Horizontal Outlet.
 * media/glb/president_toilet_horizontal_outlet.glb
 * GLB en mètres → scale ×100 (1 unité = 1 cm).
 * Coordonnées locales : centré X/Z, Y=0 = sol.
 */
import { useLayoutEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { removeGlbLines, glbLocalBBox } from '@features/scene/glbUtils';
import type { SceneItemProps } from '@shared/types';

const GLB = 'media/glb/president_toilet_horizontal_outlet.glb';

export function Toilet({ actionState, onSize }: SceneItemProps) {
  const { scene } = useGLTFClone(GLB);

  const lidHingeRef = useRef<THREE.Group | null>(null);
  const seatHingeRef = useRef<THREE.Group | null>(null);
  const buttonRef = useRef<THREE.Object3D | null>(null);

  const isLidOpen = !!actionState?.['wc-lid-toggle'];
  const isSeatOpen = !!actionState?.['wc-seat-toggle'];
  const isFlushing = !!actionState?.['wc-flush'];

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

    if (lid && !lidHingeRef.current) {
      const box = glbLocalBBox(lid);
      const hinge = new THREE.Group();
      // Hinge at the back (min Z) and top (max Y)
      hinge.position.set(0, box.max.y, box.min.z);
      scene.add(hinge);
      lid.position.set(0, -box.max.y, -box.min.z);
      hinge.add(lid);
      lidHingeRef.current = hinge;
    }

    if (seat && !seatHingeRef.current) {
      const box = glbLocalBBox(seat);
      const hinge = new THREE.Group();
      hinge.position.set(0, box.max.y, box.min.z);
      scene.add(hinge);
      seat.position.set(0, -box.max.y, -box.min.z);
      hinge.add(seat);
      seatHingeRef.current = hinge;
    }

    if (button) {
      buttonRef.current = button;
      button.userData.originalY = button.position.y;
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
    if (lidHingeRef.current) {
      const targetLidAngle = isLidOpen ? -Math.PI / 2.2 : 0;
      lidHingeRef.current.rotation.x += (targetLidAngle - lidHingeRef.current.rotation.x) * 10 * delta;
    }
    
    if (seatHingeRef.current) {
      const targetSeatAngle = isSeatOpen ? -Math.PI / 2.2 : 0;
      seatHingeRef.current.rotation.x += (targetSeatAngle - seatHingeRef.current.rotation.x) * 10 * delta;
    }

    if (buttonRef.current && buttonRef.current.userData.originalY !== undefined) {
      const targetY = isFlushing ? buttonRef.current.userData.originalY - 0.03 : buttonRef.current.userData.originalY;
      buttonRef.current.position.y += (targetY - buttonRef.current.position.y) * 15 * delta;
    }
  });

  return <primitive object={scene} />;
}

useGLTF.preload(GLB);
