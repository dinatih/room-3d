/**
 * UtakerFrame.tsx — Cadre lit IKEA Utåker (GLB) + matelas et housses procéduraux.
 * id 'utaker-lower' → cadre bas GLB, matelas bleu, H=18 cm
 * id 'utaker-upper' → cadre haut GLB, matelas blanc, H=24 cm + couette rouge
 * Coordonnées locales : centré XZ (longueur sur X), Y=0 = sol.
 */
import { useLayoutEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import { removeGlbLines, mergeGlbByMaterial } from '@features/scene/glbUtils';
import * as THREE from 'three';
import type { SceneItemProps } from '@shared/types';

const BAS_GLB  = 'media/glb/ikea-official/UTÅKER lit empilable 80x200 pin (bas).glb';
const HAUT_GLB = 'media/glb/ikea-official/UTÅKER lit empilable 80x200 pin (haut).glb';

const redMat = new THREE.MeshStandardMaterial({ 
  color: 0xcc2222, 
  roughness: 0.75,
  polygonOffset: true,
  polygonOffsetFactor: -1,
  polygonOffsetUnits: -1 
});

function Mattress({ matColor, matHeight }: { matColor: number; matHeight: number }) {
  const mat = new THREE.MeshStandardMaterial({ color: matColor, roughness: 0.8 });
  return (
    <mesh position={[0, 11 + matHeight / 2, 0]} castShadow receiveShadow material={mat}>
      <boxGeometry args={[200, matHeight, 80]} />
    </mesh>
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

function Cadre({ glbPath }: { glbPath: string }) {
  const { scene } = useGLTFClone(glbPath);
  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);
    scene.rotation.set(0, 0, 0);
    removeGlbLines(scene);
    scene.scale.setScalar(100);
    scene.rotation.y = Math.PI / 2;
    mergeGlbByMaterial(scene);
  }, [scene]);
  return <primitive object={scene} />;
}

export function UtakerFrame({ item, onSize }: SceneItemProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const isUpper  = item.id === 'utaker-upper';
  const matColor = isUpper ? 0xffffff : 0x87ceeb;
  const matHeight = isUpper ? 24 : 18;
  const glbPath  = isUpper ? HAUT_GLB : BAS_GLB;

  useLayoutEffect(() => {
    groupRef.current.updateMatrixWorld(true);
    onSize(new THREE.Box3().setFromObject(groupRef.current).getSize(new THREE.Vector3()));
  }, []);

  return (
    <group ref={groupRef}>
      <Cadre glbPath={glbPath} />
      <Mattress matColor={matColor} matHeight={matHeight} />
      {isUpper && <Bedcovers matHeight={matHeight} />}
    </group>
  );
}

useGLTF.preload(BAS_GLB);
useGLTF.preload(HAUT_GLB);
