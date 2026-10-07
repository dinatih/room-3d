/**
 * Bathtub.tsx — Baignoire extérieure coins arrondis.
 * Coordonnées locales : X/Z centrés, Y=0 = sol.
 * Placement monde dans Garden.tsx.
 */
import { useLayoutEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { SceneItemProps } from '@shared/types';
import { BATHTUB } from '../bathtubData';

const { length: TUB_L, width: TUB_W, height: TUB_H, wallThickness: T, cornerRadius: RC } = BATHTUB;

const tubMat   = new THREE.MeshStandardMaterial({ color: 0xd4b483, roughness: 0.4 });
// Intérieur de la cuve : plus sombre pour simuler l'ombre portée des parois.
// La shadow map (1024px / 1200u ≈ 1.2u/px) ne résout pas les 4u de parois internes,
// donc la teinte est "pré-ombragée" pour compenser.
const innerMat  = new THREE.MeshStandardMaterial({ color: 0x7a5830, roughness: 0.85 });

// Carte périodique de petites rides : les UV de ShapeGeometry sont en cm.
const RIPPLE_SIZE = 64;
const RIPPLE_LENGTH = 20;
const rippleData = new Uint8Array(RIPPLE_SIZE * RIPPLE_SIZE * 4);
const normal = new THREE.Vector3();
for (let y = 0; y < RIPPLE_SIZE; y++) {
  for (let x = 0; x < RIPPLE_SIZE; x++) {
    const u = x / RIPPLE_SIZE * Math.PI * 2;
    const v = y / RIPPLE_SIZE * Math.PI * 2;
    normal.set(Math.cos(u + v) + 0.5 * Math.cos(2 * u - v),
      Math.cos(u + v) - 0.25 * Math.cos(2 * u - v), 1).normalize();
    const i = (y * RIPPLE_SIZE + x) * 4;
    rippleData[i] = Math.round((normal.x * 0.5 + 0.5) * 255);
    rippleData[i + 1] = Math.round((normal.y * 0.5 + 0.5) * 255);
    rippleData[i + 2] = Math.round((normal.z * 0.5 + 0.5) * 255);
    rippleData[i + 3] = 255;
  }
}
const rippleMap = new THREE.DataTexture(rippleData, RIPPLE_SIZE, RIPPLE_SIZE);
rippleMap.wrapS = rippleMap.wrapT = THREE.RepeatWrapping;
rippleMap.minFilter = rippleMap.magFilter = THREE.LinearFilter;
rippleMap.repeat.set(1 / RIPPLE_LENGTH, 1 / RIPPLE_LENGTH);
rippleMap.needsUpdate = true;
const waterMat = new THREE.MeshStandardMaterial({
  color: 0x1a6fa8, transparent: true, opacity: 0.45, depthWrite: false,
  roughness: 0.12, metalness: 0,
  normalMap: rippleMap, normalScale: new THREE.Vector2(0.12, 0.12),
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
    // Un retrait uniforme conserve les arcs concentriques et évite leur
    // croisement au centre lorsque la cuve a une largeur de deux rayons.
    const waterInset = 0.5;
    rrTrace(waterShape, TUB_W - 2 * (T + waterInset),
      TUB_L - 2 * (T + waterInset), RC_IN - waterInset);
    const wgeo = new THREE.ShapeGeometry(waterShape, 32);
    wgeo.rotateX(-Math.PI / 2);
    wgeo.translate(0, BATHTUB.waterHeight, 0);

    return { wallGeo: wg, botGeo: bg, waterGeo: wgeo };
  }, []);

  useLayoutEffect(() => {
    onSize(new THREE.Vector3(TUB_W, TUB_H, TUB_L));
  }, []);

  useFrame(({ clock }) => {
    // Même temps absolu pour toutes les instances (scène et inventaire).
    rippleMap.offset.set(clock.elapsedTime * 0.025, clock.elapsedTime * 0.015);
  });

  return (
    <group>
      <mesh geometry={wallGeo} material={tubMat} castShadow receiveShadow />
      <mesh geometry={botGeo} material={innerMat} receiveShadow />
      <mesh geometry={waterGeo} material={waterMat} />
    </group>
  );
}
