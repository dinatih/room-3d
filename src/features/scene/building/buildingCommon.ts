/**
 * buildingCommon.ts — Matériaux, géométries partagées et helpers de coque architecturale.
 */
import * as THREE from 'three';

export const GROUND_COLOR = 0x3a7d44;

export const COLORS = {
  wall:    0xeeeeee,
  floor:   0xd4a437,
  parquet: 0xC19A6B,
  accent:  0xcc0000,
  accentS: 0xaa0000,
  ground:  GROUND_COLOR,
  tile:    0xe8e8e8,
};

// Matériaux module-level partagés
export const wallMat = new THREE.MeshStandardMaterial({ color: 0xe8e4dc, roughness: 0.9 });
export const noCapMat = new THREE.MeshBasicMaterial({ visible: false });
export const skirtingMat = new THREE.MeshStandardMaterial({ color: 0xf5f0e8, roughness: 0.4 });

// BoxGeometry face order : [+X(0), -X(1), +Y(2), -Y(3), +Z(4), -Z(5)]
export type BoxFace = '+x' | '-x' | '+y' | '-y' | '+z' | '-z';
export const BOX_FACE_ORDER: BoxFace[] = ['+x', '-x', '+y', '-y', '+z', '-z'];

export function boxFaceMats(
  visibleFaces: Partial<Record<BoxFace, THREE.Material>>,
  fallback: THREE.Material = noCapMat,
): THREE.Material[] {
  return BOX_FACE_ORDER.map(face => visibleFaces[face] ?? fallback);
}

// Matériaux dalle béton
export const slabConcreteTop = new THREE.MeshStandardMaterial({
  color: COLORS.floor, roughness: 0.6,
});
export const slabConcreteSide = new THREE.MeshStandardMaterial({
  color: COLORS.floor, roughness: 0.6, side: THREE.FrontSide,
});
export const groundExteriorMat = new THREE.MeshStandardMaterial({
  color: COLORS.ground, roughness: 0.9, transparent: true, opacity: 0.8
});

// Matériaux murs par orientation
export const westMats  = boxFaceMats({ '+x': wallMat, '+y': wallMat, '-y': wallMat, '+z': wallMat, '-z': wallMat });
export const eastMats  = boxFaceMats({ '-x': wallMat, '+y': wallMat, '-y': wallMat, '+z': wallMat, '-z': wallMat });
export const northMats = boxFaceMats({ '+x': wallMat, '-x': wallMat, '+y': wallMat, '-y': wallMat, '+z': wallMat });
export const southMats = boxFaceMats({ '+x': wallMat, '-x': wallMat, '+y': wallMat, '-y': wallMat, '-z': wallMat });

export const MAT_MAP: Record<string, THREE.Material | THREE.Material[]> = {
  west:    westMats,
  east:    eastMats,
  north:   northMats,
  south:   southMats,
  default: wallMat,
};

export function caplessZ(mat: THREE.Material | THREE.Material[]): THREE.Material[] {
  const m = Array.isArray(mat) ? mat : [mat, mat, mat, mat, mat, mat];
  return [m[0], m[1], m[2], m[3], noCapMat, noCapMat];
}

export function caplessX(mat: THREE.Material | THREE.Material[]): THREE.Material[] {
  const m = Array.isArray(mat) ? mat : [mat, mat, mat, mat, mat, mat];
  return [noCapMat, noCapMat, m[2], m[3], m[4], m[5]];
}

// Quart de rond — moulure 1,8 cm devant chaque plinthe
const R_QR = 1.8;
export const qrGeo = (() => {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.lineTo(R_QR, 0);
  s.absarc(0, 0, R_QR, 0, Math.PI / 2, false);
  s.lineTo(0, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false, curveSegments: 8 });
  g.translate(0, 0, -0.5);
  return g;
})();

/** ExtrudeGeometry depuis une liste de points [worldX, worldZ]. */
export function makeExtrudeGeo(
  pts: [number, number][],
  height: number,
  yBase = 0,
): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(pts[0][0], -pts[0][1]);
  for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i][0], -pts[i][1]);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false });
  geo.rotateX(-Math.PI / 2);
  if (yBase > 0) geo.translate(0, yBase, 0);
  return geo;
}
