/**
 * SurfaceLayer.tsx — affichage surfaces m² de chaque pièce.
 * Sprites billboardés + overlays sol semi-transparents.
 */
import { useMemo } from 'react';
import * as THREE from 'three';
import {
  ROOM_W, ROOM_D,
  NICHE_X, NICHE_Z_START,
  KITCHEN_X0, KITCHEN_X1, KITCHEN_Z,
  DOOR_START,
  DiagWall,
} from '@config';
import { W, CORR_WALL_X } from './wallData';

const W2 = W / 2;
// diagAtX calcule le Z sur la face intérieure du mur diagonal pour un X donné.
// Formule simplifiée utilisant DiagWall.slope.
const diagAtX = (x: number) => DiagWall.A.z + (x - DiagWall.A.x) * DiagWall.slope;

function polyArea(pts: [number, number][]): number {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x0, z0] = pts[i];
    const [x1, z1] = pts[(i + 1) % pts.length];
    a += x0 * z1 - x1 * z0;
  }
  return Math.abs(a) / 2 / 10000;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function makeRoomSprite(label: string, area: number, color: string, worldH = 38): THREE.Sprite {
  const areaStr = area.toFixed(2) + ' m²';
  const W_PX = 256; const H_PX = 100;
  const canvas = document.createElement('canvas');
  canvas.width = W_PX; canvas.height = H_PX;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  roundRect(ctx, 2, 2, W_PX - 4, H_PX - 4, 10);
  ctx.fill();

  ctx.font = 'bold 34px sans-serif';
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, W_PX / 2, H_PX * 0.36);

  ctx.font = 'bold 28px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(areaStr, W_PX / 2, H_PX * 0.72);

  const mat = new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(canvas),
    transparent: true, depthTest: false,
  });
  const sp = new THREE.Sprite(mat);
  sp.scale.set(worldH * (W_PX / H_PX), worldH, 1);
  sp.renderOrder = 998;
  return sp;
}

function makeFloorMesh(pts: [number, number][], color: number): THREE.Mesh {
  const verts: number[] = [];
  for (let i = 1; i < pts.length - 1; i++) {
    verts.push(pts[0][0], 1, pts[0][1]);
    verts.push(pts[i][0], 1, pts[i][1]);
    verts.push(pts[i + 1][0], 1, pts[i + 1][1]);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3));
  geo.computeVertexNormals();
  const mat = new THREE.MeshBasicMaterial({
    color, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false,
  });
  return new THREE.Mesh(geo, mat);
}

function buildGroup(): THREE.Group {
  const IZ_ROOM_S  = ROOM_D - W2;       // 395
  const IZ_KITCH_B = KITCHEN_Z - W2;    // 455
  const IX_DOOR    = DOOR_START;         // 200
  const IX_CORR    = CORR_WALL_X - W2;  // 190

  const sejourArea = (ROOM_W * IZ_ROOM_S + (-NICHE_X) * (IZ_ROOM_S - (NICHE_Z_START + W2))) / 10000;
  const cuisineArea = (KITCHEN_X1 - W2 - KITCHEN_X0 - W2) * (IZ_KITCH_B - IZ_ROOM_S) / 10000;
  const coulPts:   [number, number][] = [
    [IX_DOOR, IZ_ROOM_S], [ROOM_W, IZ_ROOM_S], [ROOM_W, DiagWall.A.z], [IX_DOOR, diagAtX(IX_DOOR)],
  ];
  const coulArea = polyArea(coulPts);
  const placardW = IX_CORR - (KITCHEN_X1 + W2);
  const placardD = IZ_KITCH_B - IZ_ROOM_S;
  const placardArea = placardW * placardD / 10000;
  const sdbPts: [number, number][] = [
    [NICHE_X, IZ_KITCH_B],
    [NICHE_X, diagAtX(NICHE_X)],
    [IX_DOOR, diagAtX(IX_DOOR)],
    [IX_DOOR, IZ_KITCH_B],
  ];
  const sdbArea = polyArea(sdbPts);
  const totalArea = sejourArea + cuisineArea + coulArea + placardArea + sdbArea;

  type Zone = { label: string; area: number; cx: number; cz: number; color: string; floorColor: number; floorPts: [number, number][] };
  const zones: Zone[] = [
    {
      label: 'Séjour', area: sejourArea, cx: 130, cz: 185,
      color: '#88ccff', floorColor: 0x4499ff,
      // simple rectangle — niche strip (10×110cm) negligible visually
      floorPts: [[0, 0], [ROOM_W, 0], [ROOM_W, IZ_ROOM_S], [0, IZ_ROOM_S]],
    },
    {
      label: 'Cuisine', area: cuisineArea, cx: (KITCHEN_X0 + KITCHEN_X1) / 2, cz: (ROOM_D + KITCHEN_Z) / 2,
      color: '#ffcc88', floorColor: 0xff9900,
      floorPts: [
        [KITCHEN_X0 + W2, IZ_ROOM_S], [KITCHEN_X1 - W2, IZ_ROOM_S],
        [KITCHEN_X1 - W2, IZ_KITCH_B], [KITCHEN_X0 + W2, IZ_KITCH_B],
      ],
    },
    {
      label: 'Couloir', area: coulArea, cx: (IX_DOOR + ROOM_W) / 2, cz: (IZ_ROOM_S + DiagWall.A.z) / 2,
      color: '#cccccc', floorColor: 0x888888,
      floorPts: coulPts,
    },
    {
      label: 'Placard', area: placardArea, cx: (KITCHEN_X1 + W2 + IX_CORR) / 2, cz: (IZ_ROOM_S + IZ_KITCH_B) / 2,
      color: '#cc9966', floorColor: 0x996633,
      floorPts: [
        [KITCHEN_X1 + W2, IZ_ROOM_S], [IX_CORR, IZ_ROOM_S],
        [IX_CORR, IZ_KITCH_B], [KITCHEN_X1 + W2, IZ_KITCH_B],
      ],
    },
    {
      label: 'SDB', area: sdbArea, cx: (NICHE_X + IX_DOOR) / 2, cz: (IZ_KITCH_B + diagAtX((NICHE_X + IX_DOOR) / 2)) / 2,
      color: '#88ffcc', floorColor: 0x00cc88,
      floorPts: sdbPts,
    },
  ];

  const g = new THREE.Group();
  const Y_LABEL = 110;

  for (const z of zones) {
    g.add(makeFloorMesh(z.floorPts, z.floorColor));
    const sp = makeRoomSprite(z.label, z.area, z.color);
    sp.position.set(z.cx, Y_LABEL, z.cz);
    g.add(sp);
  }

  // Total badge
  const totalSp = makeRoomSprite('TOTAL', totalArea, '#ffdd44', 44);
  totalSp.position.set(ROOM_W / 2, Y_LABEL + 55, ROOM_D / 2);
  g.add(totalSp);

  return g;
}

export function SurfaceLayer() {
  const group = useMemo(() => buildGroup(), []);
  return <primitive object={group} />;
}
