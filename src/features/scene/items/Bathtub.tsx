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

const tubMat = new THREE.MeshStandardMaterial({ color: 0xd9c9a5, roughness: 0.55 });
const innerMat = new THREE.MeshStandardMaterial({ color: 0xbda575, roughness: 0.65 });

// Carte périodique de petites rides : les UV de ShapeGeometry sont en cm.
const RIPPLE_SIZE = 64;
const RIPPLE_LENGTH = 20;
const rippleData = new Uint8Array(RIPPLE_SIZE * RIPPLE_SIZE * 4);
const normal = new THREE.Vector3();
for (let y = 0; y < RIPPLE_SIZE; y++) {
  for (let x = 0; x < RIPPLE_SIZE; x++) {
    const u = x / RIPPLE_SIZE * Math.PI * 2;
    const v = y / RIPPLE_SIZE * Math.PI * 2;
    const waveA = Math.cos(u + 2 * v);
    const waveB = Math.cos(2 * u - v);
    const waveC = Math.cos(3 * u + v);
    normal.set(0.5 * waveA + 0.7 * waveB + 0.45 * waveC,
      waveA - 0.35 * waveB + 0.15 * waveC, 1).normalize();
    const i = (y * RIPPLE_SIZE + x) * 4;
    rippleData[i] = Math.round((normal.x * 0.5 + 0.5) * 255);
    rippleData[i + 1] = Math.round((normal.y * 0.5 + 0.5) * 255);
    rippleData[i + 2] = Math.round((normal.z * 0.5 + 0.5) * 255);
    rippleData[i + 3] = 255;
  }
}
const rippleMap = new THREE.DataTexture(rippleData, RIPPLE_SIZE, RIPPLE_SIZE);
rippleMap.wrapS = rippleMap.wrapT = THREE.RepeatWrapping;
rippleMap.magFilter = THREE.LinearFilter;
rippleMap.minFilter = THREE.LinearMipmapLinearFilter;
rippleMap.generateMipmaps = true;
rippleMap.repeat.set(1 / RIPPLE_LENGTH, 1 / RIPPLE_LENGTH);
rippleMap.needsUpdate = true;
const waterMat = new THREE.MeshStandardMaterial({
  color: 0x1a6fa8, transparent: true, opacity: 0.45, depthWrite: false,
  roughness: 0.22, metalness: 0,
  normalMap: rippleMap, normalScale: new THREE.Vector2(0.035, 0.035),
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

function smoothTubWalls(geometry: THREE.ExtrudeGeometry) {
  const positions = geometry.attributes.position;
  const normals = geometry.attributes.normal;
  const segment = TUB_L / 2 - RC;
  // ExtrudeGeometry sépare les sommets de chaque face : computeVertexNormals
  // seul conserve les facettes. Les normales radiales lissent les deux parois
  // sans arrondir artificiellement les faces horizontales du fond/rebord.
  for (const group of geometry.groups) {
    if (group.materialIndex !== 1) continue;
    for (let i = group.start; i < group.start + group.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      const dz = z - THREE.MathUtils.clamp(z, -segment, segment);
      const radius = Math.hypot(x, dz);
      const direction = radius > RC - T / 2 ? 1 : -1;
      normals.setXYZ(i, direction * x / radius, 0, direction * dz / radius);
    }
  }
}

export function Bathtub({ onSize }: SceneItemProps) {
  const { wallGeo, botGeo, waterGeo, rimGeo } = useMemo(() => {
    const RC_IN = Math.max(RC - T, 2);

    const outer = new THREE.Shape();
    rrTrace(outer, TUB_W, TUB_L, RC);
    const hole = new THREE.Path();
    rrTrace(hole, TUB_W - 2 * T, TUB_L - 2 * T, RC_IN);
    outer.holes.push(hole);
    const rimRadius = T / 2;
    const wg = new THREE.ExtrudeGeometry(outer, {
      depth: TUB_H - rimRadius, bevelEnabled: false, curveSegments: 32,
    });
    wg.rotateX(-Math.PI / 2);
    smoothTubWalls(wg);

    const rimPath = new THREE.Shape();
    rrTrace(rimPath, TUB_W - T, TUB_L - T, RC - rimRadius);
    const rimPoints = rimPath.getPoints(32).map(p =>
      new THREE.Vector3(p.x, TUB_H - rimRadius, -p.y));
    // Les deux segments nuls aux pointes d'une capsule ne sont pas des
    // segments du chemin ; TubeGeometry nécessite des tangentes non nulles.
    const rimCurve = new THREE.CurvePath<THREE.Vector3>();
    for (let i = 1; i < rimPoints.length; i++) {
      if (!rimPoints[i - 1].equals(rimPoints[i])) {
        rimCurve.add(new THREE.LineCurve3(rimPoints[i - 1], rimPoints[i]));
      }
    }
    const rg = new THREE.TubeGeometry(rimCurve, rimCurve.curves.length, rimRadius, 12, true);

    const botShape = new THREE.Shape();
    rrTrace(botShape, TUB_W - 2 * T, TUB_L - 2 * T, RC_IN);
    const bg = new THREE.ExtrudeGeometry(botShape, { depth: T, bevelEnabled: false, curveSegments: 32 });
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

    return { wallGeo: wg, botGeo: bg, waterGeo: wgeo, rimGeo: rg };
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
      <mesh geometry={rimGeo} material={tubMat} castShadow receiveShadow />
    </group>
  );
}
