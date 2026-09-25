/**
 * Tapis pelouse synthétique SDB — géométrie procédurale.
 * Rendu en coordonnées locales : centre X/Z à l'origine, Y=0 = sol.
 * Utilisé dans Furniture.tsx. Pas d'entrée inventaire.
 */
import { useMemo } from 'react';
import * as THREE from 'three';
import type { SceneItemProps } from '@shared/types';
import { makeGrassTex } from '../Building';
import { noCapMat } from '../building/buildingCommon';

const RUG_W = 200;
const RUG_D = 100;
const RUG_H = 1.5;

export function GrassRug({  }: SceneItemProps) {
  const mats = useMemo(() => {
    const topTex = makeGrassTex();
    topTex.repeat.set(10, 5);
    const topMat  = new THREE.MeshStandardMaterial({
      map: topTex,
      roughness: 0.85,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const sideMat = new THREE.MeshStandardMaterial({
      color: 0x2d6e30,
      roughness: 0.9,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    // BoxFace order: [+X, -X, +Y, -Y, +Z, -Z] -> face -Y (dessous posé au sol) invisible pour éviter z-fighting avec le carrelage
    return [sideMat, sideMat, topMat, noCapMat, sideMat, sideMat];
  }, []);

  return (
    <mesh
      ref={(m) => { if (m) m.material = mats as any; }}
      position={[0, RUG_H / 2 + 0.1, 0]}
      renderOrder={1}
      receiveShadow
      userData={{ skipMerge: true, itemName: 'Tapis Gazon SDB' }}
    >
      <boxGeometry args={[RUG_W, RUG_H, RUG_D]} />
    </mesh>
  );
}
