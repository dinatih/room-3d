import * as THREE from 'three';
import { DOOR_W } from './doors.js';
import {
  ROOM_W, ROOM_D, WALL_H,
  NICHE_DEPTH, NICHE_Z_START,
  GLASS_START, GLASS_END,
  DOOR_START, DOOR_END, DOOR_H,
  KITCHEN_X0, KITCHEN_X1, KITCHEN_DEPTH, KITCHEN_Z,
  SDB_Z_END,
  DIAG_AX, DIAG_AZ, DIAG_CX, DIAG_CZ,
  LAYER_NEIGHBORS,
} from '../config.js';

const W = 10;

// Ghost material — semi-transparent blue-grey, double-sided
const mat = new THREE.MeshStandardMaterial({
  color: 0xa8c8e8,
  roughness: 0.85,
  transparent: true,
  opacity: 0.35,
  depthWrite: false,
  side: THREE.DoubleSide,
});

// Construit tous les panneaux structurels dans le groupe fourni.
function populateGroup(group) {
  function panel(w, h, d, x, y, z) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    group.add(m);
  }

  function trapWall(pts, height, yBase = 0) {
    const shape = new THREE.Shape();
    shape.moveTo(pts[0][0], -pts[0][1]);
    for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i][0], -pts[i][1]);
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false });
    geo.rotateX(-Math.PI / 2);
    if (yBase > 0) geo.translate(0, yBase, 0);
    const m = new THREE.Mesh(geo, mat);
    group.add(m);
  }

  // ── MUR A (ouest, face intérieure à X=0) ─────────────────────────────────
  panel(W, WALL_H, 310, -W / 2, WALL_H / 2, (-30 + NICHE_Z_START) / 2);
  panel(W, WALL_H, DIAG_CZ + 30, -NICHE_DEPTH - W / 2, WALL_H / 2, (-30 + DIAG_CZ) / 2);
  panel(NICHE_DEPTH, WALL_H, W, -NICHE_DEPTH / 2, WALL_H / 2, NICHE_Z_START - W / 2);

  // ── MUR B (est, X=ROOM_W=300) ────────────────────────────────────────────
  panel(W, WALL_H, ROOM_D + 10 + 30, ROOM_W + W / 2, WALL_H / 2, (-30 + ROOM_D + 10) / 2);
  panel(W, WALL_H, 200, ROOM_W + W / 2, WALL_H / 2, (-230 + -30) / 2);

  // ── MUR C (nord, Z=0) — trapèze + baie vitrée ────────────────────────────
  {
    const WALL_DEPTH = 30;
    const NW_EXT = 20;
    const NE_EXT = 10;
    const GLASS_TOP_Y = 210;

    trapWall([
      [0,           0          ],
      [GLASS_START, 0          ],
      [GLASS_START, -WALL_DEPTH],
      [-NW_EXT,     -WALL_DEPTH],
    ], WALL_H);

    trapWall([
      [GLASS_END,       0          ],
      [ROOM_W,          0          ],
      [ROOM_W + NE_EXT, -WALL_DEPTH],
      [GLASS_END,       -WALL_DEPTH],
    ], WALL_H);

    const linteauH = WALL_H - GLASS_TOP_Y;
    panel(
      GLASS_END - GLASS_START, linteauH, WALL_DEPTH,
      (GLASS_START + GLASS_END) / 2, GLASS_TOP_Y + linteauH / 2, -WALL_DEPTH / 2,
    );
  }

  // ── MUR D (sud, Z=ROOM_D=400) ────────────────────────────────────────────
  panel(NICHE_DEPTH, WALL_H, W, -NICHE_DEPTH / 2, WALL_H / 2, ROOM_D + W / 2);
  panel(KITCHEN_X0, WALL_H, W, KITCHEN_X0 / 2, WALL_H / 2, ROOM_D + W / 2);
  panel(
    DOOR_START - 10 - KITCHEN_X1, WALL_H, W,
    (KITCHEN_X1 + DOOR_START - 10) / 2, WALL_H / 2, ROOM_D + W / 2,
  );
  panel(10, WALL_H, W, DOOR_START - 5, WALL_H / 2, ROOM_D + W / 2);
  panel(10, WALL_H, W, DOOR_END + 5, WALL_H / 2, ROOM_D + W / 2);
  panel(
    DOOR_END - DOOR_START, WALL_H - DOOR_H, W,
    (DOOR_START + DOOR_END) / 2, DOOR_H + (WALL_H - DOOR_H) / 2, ROOM_D + W / 2,
  );
  panel(
    ROOM_W - DOOR_END - 10, WALL_H, W,
    (DOOR_END + 10 + ROOM_W) / 2, WALL_H / 2, ROOM_D + W / 2,
  );

  // ── CUISINE ───────────────────────────────────────────────────────────────
  panel(W, WALL_H, KITCHEN_DEPTH, KITCHEN_X0 - W / 2, WALL_H / 2, ROOM_D + KITCHEN_DEPTH / 2);
  panel(W, WALL_H, KITCHEN_DEPTH, KITCHEN_X1 + W / 2, WALL_H / 2, ROOM_D + KITCHEN_DEPTH / 2);
  {
    const SDB_LEN = DOOR_START + NICHE_DEPTH;
    panel(SDB_LEN, WALL_H, W, (DOOR_START - NICHE_DEPTH) / 2, WALL_H / 2, KITCHEN_Z + W / 2);
  }

  // ── Mur gauche couloir ────────────────────────────────────────────────────
  {
    const WALL_X = DOOR_START - 5;
    const LEFT_WALL_Z0 = KITCHEN_Z;
    const LEFT_WALL_LEN = SDB_Z_END - KITCHEN_Z;
    const C_DOOR_W = DOOR_W;
    const C_DOOR_START = LEFT_WALL_LEN - 10 - C_DOOR_W;
    const C_DOOR_END = C_DOOR_START + C_DOOR_W;
    const C_DOOR_START_ABS = LEFT_WALL_Z0 + C_DOOR_START;
    const C_DOOR_END_ABS = LEFT_WALL_Z0 + C_DOOR_END;
    panel(W, WALL_H, C_DOOR_START_ABS - LEFT_WALL_Z0, WALL_X, WALL_H / 2, (LEFT_WALL_Z0 + C_DOOR_START_ABS) / 2);
    panel(W, WALL_H, SDB_Z_END - C_DOOR_END_ABS, WALL_X, WALL_H / 2, (C_DOOR_END_ABS + SDB_Z_END) / 2);
    panel(W, WALL_H - DOOR_H, C_DOOR_W, WALL_X, DOOR_H + (WALL_H - DOOR_H) / 2, (C_DOOR_START_ABS + C_DOOR_END_ABS) / 2);
  }

  // ── Mur droit couloir ─────────────────────────────────────────────────────
  {
    const WALL_Z0 = ROOM_D + W;
    const CORR_RIGHT_LEN = DIAG_AZ - WALL_Z0;
    panel(W, WALL_H, CORR_RIGHT_LEN, ROOM_W + W / 2, WALL_H / 2, (WALL_Z0 + DIAG_AZ) / 2);
  }

  // ── Mur diagonal bâtiment ─────────────────────────────────────────────────
  {
    const diagDX = DIAG_CX - DIAG_AX;
    const diagDZ = DIAG_CZ - DIAG_AZ;
    const diagLen = Math.sqrt(diagDX * diagDX + diagDZ * diagDZ);
    const sinθ = diagDX / diagLen;
    const cosθ = diagDZ / diagLen;
    const DIAG_DEPTH = 10;
    const pX = cosθ;
    const pZ = -sinθ;

    const E_DOOR_START = 10;
    const E_DOOR_W = 90;
    const E_DOOR_END = E_DOOR_START + E_DOOR_W;

    function iP(dist) {
      return [DIAG_AX + dist * sinθ, DIAG_AZ + dist * cosθ];
    }
    function eP(dist) {
      return [DIAG_AX + dist * sinθ + DIAG_DEPTH * pX,
              DIAG_AZ + dist * cosθ + DIAG_DEPTH * pZ];
    }

    function diagSection(pts, height, yBase = 0) {
      const shape = new THREE.Shape();
      shape.moveTo(pts[0][0], -pts[0][1]);
      for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i][0], -pts[i][1]);
      shape.closePath();
      const geo = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false });
      geo.rotateX(-Math.PI / 2);
      if (yBase > 0) geo.translate(0, yBase, 0);
      const m = new THREE.Mesh(geo, mat);
      group.add(m);
    }

    const B_EXT_X = ROOM_W + W;
    const d_start_cut = (B_EXT_X - DIAG_AX - DIAG_DEPTH * pX) / sinθ;
    const A_EXT_X = -NICHE_DEPTH - W;
    const d_ext_cut = (A_EXT_X - DIAG_AX - DIAG_DEPTH * pX) / sinθ;

    diagSection([iP(0), iP(E_DOOR_START), eP(E_DOOR_START), eP(d_start_cut)], WALL_H);
    diagSection([iP(E_DOOR_START), iP(E_DOOR_END), eP(E_DOOR_END), eP(E_DOOR_START)], WALL_H - DOOR_H, DOOR_H);
    diagSection([iP(E_DOOR_END), iP(diagLen), eP(d_ext_cut), eP(E_DOOR_END)], WALL_H);

    {
      const A2_Z_EXT = DIAG_AZ + d_ext_cut * cosθ + DIAG_DEPTH * pZ;
      diagSection([[-NICHE_DEPTH, DIAG_CZ], [A_EXT_X, DIAG_CZ], [A_EXT_X, A2_Z_EXT]], WALL_H);
    }
    {
      const Z_se_ext = DIAG_AZ + d_start_cut * cosθ + DIAG_DEPTH * pZ;
      diagSection([[ROOM_W, DIAG_AZ], [ROOM_W + W, DIAG_AZ], [ROOM_W + W, Z_se_ext]], WALL_H);
    }
  }
}

// ── Voisin Ouest ──────────────────────────────────────────────────────────────
let _groupWest = null;

export function buildNeighborWest(scene) {
  _groupWest = new THREE.Group();
  _groupWest.position.x = -ROOM_W - 30.5;
  _groupWest.position.z = 210;
  populateGroup(_groupWest);
  scene.add(_groupWest);
}

// ── Voisin Est ────────────────────────────────────────────────────────────────
let _groupEast = null;

export function buildNeighborEast(scene) {
  _groupEast = new THREE.Group();
  _groupEast.position.x = ROOM_W + 30.5;
  _groupEast.position.z = -210;
  populateGroup(_groupEast);
  scene.add(_groupEast);
}
