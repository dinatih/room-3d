/**
 * Grejig.tsx — Étagère à chaussures IKEA GREJIG 60×22×50cm.
 * Cadre tubulaire métal gris, 3 niveaux.
 * Coordonnées locales : coin avant-gauche = [0,0,0], Y=0 = sol.
 * Placement monde dans Backpacks.tsx.
 */
import { useLayoutEffect } from 'react';
import * as THREE from 'three';
import type { SceneItemProps } from '../../../types';

const W = 60, D = 22, H = 50, TR = 0.4;
const SHELF_YS = [3, 19, 35] as const;

const grejigMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.4, metalness: 0.7 });

function Tube({ p1, p2 }: { p1: [number,number,number]; p2: [number,number,number] }) {
  const [x1,y1,z1] = p1, [x2,y2,z2] = p2;
  const dx=x2-x1, dy=y2-y1, dz=z2-z1;
  const len = Math.sqrt(dx*dx+dy*dy+dz*dz);
  if (len < 0.01) return null;
  const mid: [number,number,number] = [(x1+x2)/2,(y1+y2)/2,(z1+z2)/2];
  const q = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0,1,0), new THREE.Vector3(dx,dy,dz).normalize(),
  );
  return (
    <mesh position={mid} quaternion={q} castShadow material={grejigMat}>
      <cylinderGeometry args={[TR, TR, len, 6]} />
    </mesh>
  );
}

export function Grejig({ onSize }: SceneItemProps) {
  useLayoutEffect(() => {
    onSize(new THREE.Vector3(W, H, D));
  }, []);

  return (
    <group>
      {/* 4 montants */}
      <Tube p1={[TR,0,TR]} p2={[TR,H,TR]} />
      <Tube p1={[W-TR,0,TR]} p2={[W-TR,H,TR]} />
      <Tube p1={[TR,0,D-TR]} p2={[TR,H,D-TR]} />
      <Tube p1={[W-TR,0,D-TR]} p2={[W-TR,H,D-TR]} />
      {/* Cadre bas */}
      <Tube p1={[TR,TR,TR]} p2={[W-TR,TR,TR]} />
      <Tube p1={[TR,TR,D-TR]} p2={[W-TR,TR,D-TR]} />
      <Tube p1={[TR,TR,TR]} p2={[TR,TR,D-TR]} />
      <Tube p1={[W-TR,TR,TR]} p2={[W-TR,TR,D-TR]} />
      {/* 3 niveaux d'étagère */}
      {SHELF_YS.map((y) => (
        <group key={y}>
          <Tube p1={[TR,y,TR]} p2={[W-TR,y,TR]} />
          <Tube p1={[TR,y,D-TR]} p2={[W-TR,y,D-TR]} />
          <Tube p1={[TR,y,TR]} p2={[TR,y,D-TR]} />
          <Tube p1={[W-TR,y,TR]} p2={[W-TR,y,D-TR]} />
          {([1,2,3,4,5] as const).map((k) => {
            const x = TR + (W - 2 * TR) * k / 6;
            return <Tube key={k} p1={[x,y,TR]} p2={[x,y,D-TR]} />;
          })}
        </group>
      ))}
      {/* Cadre supérieur */}
      <Tube p1={[TR,H,TR]} p2={[W-TR,H,TR]} />
      <Tube p1={[TR,H,D-TR]} p2={[W-TR,H,D-TR]} />
      <Tube p1={[TR,H,TR]} p2={[TR,H,D-TR]} />
      <Tube p1={[W-TR,H,TR]} p2={[W-TR,H,D-TR]} />
    </group>
  );
}
