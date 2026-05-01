/**
 * Bathtub.tsx — Baignoire extérieure coins arrondis.
 * Coordonnées locales : X/Z centrés, Y=0 = sol.
 * Placement monde dans Garden.tsx.
 */
import { useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { SceneItemProps } from '@shared/types';

const TUB_L = 150, TUB_W = 70, TUB_H = 50, T = 4, RC = 35;

const tubMat   = new THREE.MeshStandardMaterial({ color: 0xd4b483, roughness: 0.4 });
// Intérieur de la cuve : plus sombre pour simuler l'ombre portée des parois.
// La shadow map (1024px / 1200u ≈ 1.2u/px) ne résout pas les 4u de parois internes,
// donc la teinte est "pré-ombragée" pour compenser.
const innerMat  = new THREE.MeshStandardMaterial({ color: 0x7a5830, roughness: 0.85 });
const waterMat = new THREE.MeshStandardMaterial({
  color: 0x1a6fa8, transparent: true, opacity: 0.80, depthWrite: false,
  roughness: 0.05, metalness: 0.15,
});

function rrTrace(p: THREE.Shape | THREE.Path, w: number, h: number, r: number) {
  p.moveTo(-w / 2 + r, -h / 2);
  p.lineTo( w / 2 - r, -h / 2);
  p.absarc( w / 2 - r, -h / 2 + r, r, -Math.PI / 2, 0, false);
  p.lineTo( w / 2,  h / 2 - r);
  p.absarc( w / 2 - r,  h / 2 - r, r, 0, Math.PI / 2, false);
  p.lineTo(-w / 2 + r,  h / 2);
  p.absarc(-w / 2 + r,  h / 2 - r, r, Math.PI / 2, Math.PI, false);
  p.lineTo(-w / 2, -h / 2 + r);
  p.absarc(-w / 2 + r, -h / 2 + r, r, Math.PI, -Math.PI / 2, false);
}

export function Bathtub({ onSize }: SceneItemProps) {
  const { wallGeo, botGeo, waterGeo } = useMemo(() => {
    const RC_IN = Math.max(RC - T, 2);

    const outer = new THREE.Shape();
    rrTrace(outer, TUB_W, TUB_L, RC);
    const hole = new THREE.Path();
    rrTrace(hole, TUB_W - 2 * T, TUB_L - 2 * T, RC_IN);
    outer.holes.push(hole);
    const wg = new THREE.ExtrudeGeometry(outer, { depth: TUB_H, bevelEnabled: false });
    wg.rotateX(-Math.PI / 2);

    const botShape = new THREE.Shape();
    rrTrace(botShape, TUB_W - 2 * T, TUB_L - 2 * T, RC_IN);
    const bg = new THREE.ExtrudeGeometry(botShape, { depth: T, bevelEnabled: false });
    bg.rotateX(-Math.PI / 2);

    const waterShape = new THREE.Shape();
    rrTrace(waterShape, TUB_W - 2 * T - 1, TUB_L - 2 * T - 1, RC_IN);
    const wgeo = new THREE.ShapeGeometry(waterShape, 32);
    wgeo.rotateX(-Math.PI / 2);
    wgeo.translate(0, TUB_H - 12, 0);

    return { wallGeo: wg, botGeo: bg, waterGeo: wgeo };
  }, []);

  useLayoutEffect(() => {
    onSize(new THREE.Vector3(TUB_W, TUB_H, TUB_L));
  }, []);

  return (
    <group>
      <mesh geometry={wallGeo} material={tubMat} castShadow receiveShadow />
      <mesh geometry={botGeo} material={innerMat} receiveShadow />
      <mesh geometry={waterGeo} material={waterMat} />
    </group>
  );
}
