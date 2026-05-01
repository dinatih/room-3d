/**
 * UtakerFrame.tsx — Cadre de lit IKEA Utåker (procédural).
 * id 'utaker-lower' → cadre bas (matelas bleu, H=18cm)
 * id 'utaker-upper' → cadre haut (matelas blanc, H=24cm + couette rouge)
 * Coordonnées locales : centré XZ, Y=0 = sol.
 */
import { useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import type { SceneItemProps } from '@shared/types';

const woodMat = new THREE.MeshStandardMaterial({ color: 0xe8c39e, roughness: 0.8 });
const redMat  = new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.75 });

function Frame({ matColor, matHeight }: { matColor: number; matHeight: number }) {
  const mat = new THREE.MeshStandardMaterial({ color: matColor, roughness: 0.8 });
  return (
    <group>
      <mesh position={[0, 17, 40]}  castShadow receiveShadow material={woodMat}><boxGeometry args={[205, 12, 3]} /></mesh>
      <mesh position={[0, 17, -40]} castShadow receiveShadow material={woodMat}><boxGeometry args={[205, 12, 3]} /></mesh>
      <mesh position={[101,  17, 0]} castShadow receiveShadow material={woodMat}><boxGeometry args={[3, 12, 83]} /></mesh>
      <mesh position={[-101, 17, 0]} castShadow receiveShadow material={woodMat}><boxGeometry args={[3, 12, 83]} /></mesh>
      {([-98, 98] as const).flatMap(px => ([-38.5, 38.5] as const).map(pz => (
        <mesh key={`${px}${pz}`} position={[px, 11.5, pz]} castShadow receiveShadow material={woodMat}>
          <boxGeometry args={[4, 23, 4]} />
        </mesh>
      )))}
      <mesh position={[0, 11 + matHeight / 2, 0]} castShadow receiveShadow material={mat}>
        <boxGeometry args={[200, matHeight, 80]} />
      </mesh>
    </group>
  );
}

function Bedcovers({ matHeight }: { matHeight: number }) {
  const top = 11 + matHeight;
  const polR = 8, polL = 90;
  return (
    <group>
      <mesh position={[1.5, top + 0.6, 0]} castShadow receiveShadow material={redMat}><boxGeometry args={[203, 1.2, 86]} /></mesh>
      {([-1, 1] as const).map(s => (
        <mesh key={s} position={[1.5, top - 10, s * 43]} castShadow material={redMat}><boxGeometry args={[203, 20, 1.2]} /></mesh>
      ))}
      <mesh position={[103, top - 10, 0]} castShadow material={redMat}><boxGeometry args={[1.2, 20, 86]} /></mesh>
      {([-50, 50] as const).map(cx => (
        <mesh key={cx} position={[cx, top + 1.2 + polR + 0.5, 40 - polR - 1]}
          rotation={[0, 0, -Math.PI / 2]} castShadow material={redMat}>
          <cylinderGeometry args={[polR, polR, polL, 12]} />
        </mesh>
      ))}
    </group>
  );
}

export function UtakerFrame({ item, onSize }: SceneItemProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const isUpper  = item.id === 'utaker-upper';
  const matColor = isUpper ? 0xffffff : 0x87ceeb;
  const matHeight = isUpper ? 24 : 18;

  useLayoutEffect(() => {
    groupRef.current.updateMatrixWorld(true);
    onSize(new THREE.Box3().setFromObject(groupRef.current).getSize(new THREE.Vector3()));
  }, []);

  return (
    <group ref={groupRef}>
      <Frame matColor={matColor} matHeight={matHeight} />
      {isUpper && <Bedcovers matHeight={matHeight} />}
    </group>
  );
}
