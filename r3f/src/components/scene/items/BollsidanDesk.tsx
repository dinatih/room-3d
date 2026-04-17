/**
 * BollsidanDesk.tsx — Bureau réglable IKEA BOLLSIDAN (procédural).
 * Coordonnées locales : centré XZ, Y=0 = sol, hauteur assis 70cm.
 */
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { SceneItemProps } from '../../../types';

const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
const DEFAULT_H = 70;

function DeskTop() {
  const geo = useMemo(() => {
    const w = 68, d = 36, r = 6;
    const shape = new THREE.Shape();
    shape.moveTo(-w / 2 + r, -d / 2);
    shape.lineTo( w / 2 - r, -d / 2);
    shape.absarc( w / 2 - r, -d / 2 + r, r, -Math.PI / 2, 0, false);
    shape.lineTo( w / 2,      d / 2 - r);
    shape.absarc( w / 2 - r,  d / 2 - r, r, 0, Math.PI / 2, false);
    shape.lineTo(-w / 2 + r,  d / 2);
    shape.absarc(-w / 2 + r,  d / 2 - r, r, Math.PI / 2, Math.PI, false);
    shape.lineTo(-w / 2,      -d / 2 + r);
    shape.absarc(-w / 2 + r,  -d / 2 + r, r, Math.PI, Math.PI * 1.5, false);
    const g = new THREE.ExtrudeGeometry(shape, { depth: 1.8, bevelEnabled: false });
    g.rotateX(Math.PI / 2);
    return g;
  }, []);
  return <mesh geometry={geo} material={whiteMat} castShadow receiveShadow />;
}

export function BollsidanDesk({ onSize, height = DEFAULT_H }: SceneItemProps & { height?: number }) {
  const groupRef = useRef<THREE.Group>(null!);
  const footHgt = 2.5, colSize = 4.2, w = 68;
  const refEastX = w / 2 - 8;
  const colX = refEastX - colSize;

  useLayoutEffect(() => {
    groupRef.current.updateMatrixWorld(true);
    onSize(new THREE.Box3().setFromObject(groupRef.current).getSize(new THREE.Vector3()));
  }, [height]);

  return (
    <group ref={groupRef}>
      <group position={[0, height, 0]}><DeskTop /></group>
      <mesh position={[refEastX,        footHgt / 2, 0]} castShadow material={whiteMat}><boxGeometry args={[5, footHgt, 32]} /></mesh>
      <mesh position={[refEastX - 55,   footHgt / 2, 0]} castShadow material={whiteMat}><boxGeometry args={[5, footHgt, 32]} /></mesh>
      <mesh position={[refEastX - 27.5, footHgt / 2, 0]} castShadow material={whiteMat}><boxGeometry args={[55, footHgt, 5]} /></mesh>
      <mesh position={[colX, footHgt + (height - footHgt) / 2, 0]} castShadow material={whiteMat}>
        <boxGeometry args={[colSize, height - footHgt, colSize]} />
      </mesh>
    </group>
  );
}
