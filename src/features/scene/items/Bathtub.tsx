/**
 * Bathtub.tsx — Baignoire extérieure coins arrondis.
 * Coordonnées locales : X/Z centrés, Y=0 = sol.
 * Placement monde dans Garden.tsx.
 */
import { useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { SceneItemProps } from '@shared/types';
import { BATHTUB } from '../bathtubData';

const { length: TUB_L, width: TUB_W, height: TUB_H, wallThickness: T, cornerRadius: RC } = BATHTUB;

const tubMat = new THREE.MeshStandardMaterial({ color: 0xd9c9a5, roughness: 0.55 });
const innerMat = new THREE.MeshStandardMaterial({ color: 0xbda575, roughness: 0.65 });

const waterMat = new THREE.MeshStandardMaterial({
  color: 0x1a6fa8, transparent: true, opacity: 0.45, depthWrite: false,
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

  return (
    <group>
      <mesh geometry={wallGeo} material={tubMat} castShadow receiveShadow />
      <mesh geometry={botGeo} material={innerMat} receiveShadow />
      <mesh geometry={waterGeo} material={waterMat} />
      <mesh geometry={rimGeo} material={tubMat} castShadow receiveShadow />
    </group>
  );
}
