import * as THREE from 'three';
import { DOOR_H, DOOR_START, DOOR_END, ROOM_D } from '../config.js';

// Largeur standard NF (indépendant de la grille LEGO)
export const DOOR_W       = 83; // séjour + SDB
export const ENTRY_DOOR_W = 90; // porte d'entrée

const WALL_W = 10;      // épaisseur des murs (cm)
const DORMANT_T = 2.5;  // épaisseur des montants du dormant (cm)
const STOP_T = 1;       // épaisseur arrêt de porte (cm)
const STOP_W = 3;       // largeur arrêt de porte (cm)
const dormantMat = new THREE.MeshStandardMaterial({ color: 0xf0ede8, roughness: 0.35 });
const stopMat    = new THREE.MeshStandardMaterial({ color: 0xe8e5e0, roughness: 0.30 });

function box(w, h, d, x, y, z, mat) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  return m;
}

let entryDoor = null, livingDoor = null, bathroomDoor = null;
let doorsOpen = false;

function toggleDoor(d) {
  d.open = !d.open;
  d.group.rotation.y = d.open ? d.openY : d.closedY;
  return d.open;
}

export function toggleEntryDoor()    { return entryDoor    ? toggleDoor(entryDoor)    : false; }
export function toggleLivingDoor()   { return livingDoor   ? toggleDoor(livingDoor)   : false; }
export function toggleBathroomDoor() { return bathroomDoor ? toggleDoor(bathroomDoor) : false; }

export function toggleCorridorDoors() {
  doorsOpen = !doorsOpen;
  for (const d of [entryDoor, livingDoor, bathroomDoor].filter(Boolean)) {
    d.open = doorsOpen;
    d.group.rotation.y = d.open ? d.openY : d.closedY;
  }
  return doorsOpen;
}

// Mètre ruban canvas (200cm)
function makeTapeMesh(totalCm = 200) {
  const pxPerCm = 8;
  const cw = 40, ch = totalCm * pxPerCm;
  const canvas = document.createElement('canvas');
  canvas.width = cw; canvas.height = ch;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#f5e6a0';
  ctx.fillRect(0, 0, cw, ch);

  for (let cm = 0; cm <= totalCm; cm++) {
    const y = (totalCm - cm) * pxPerCm;
    const isMaj = cm % 10 === 0, isMid = cm % 5 === 0;
    const tickLen = isMaj ? 18 : isMid ? 12 : 6;
    ctx.strokeStyle = '#3a2a00';
    ctx.lineWidth = isMaj ? 1.5 : isMid ? 1 : 0.5;
    ctx.beginPath(); ctx.moveTo(1, y);      ctx.lineTo(1 + tickLen, y);      ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cw - 1, y); ctx.lineTo(cw - 1 - tickLen, y); ctx.stroke();
    if (isMaj && cm > 0) {
      ctx.fillStyle = '#3a2a00';
      ctx.font = `bold ${Math.round(pxPerCm * 0.85)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(`${cm}`, cw / 2, y - 2);
    }
  }
  ctx.strokeStyle = '#8a6900'; ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, cw - 2, ch - 2);

  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, depthWrite: false });
  return new THREE.Mesh(new THREE.PlaneGeometry(5, totalCm), mat);
}

/**
 * Crée l'encadrement + panneau de la porte d'entrée (rouge) dans l'assembly fourni.
 * @param {{ hingeX, hingeZ, rotY, iP, eP, pX, pZ, E_DOOR_START, E_DOOR_END }} params
 * @param {THREE.Group} assembly — groupe parent (world-origin)
 */
export function buildEntryDoor({ hingeX, hingeZ, rotY, iP, eP, pX, pZ, E_DOOR_START, E_DOOR_END }, assembly) {
  // ── Encadrement ────────────────────────────────────────────────────────────
  const redFMat   = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.5 });
  const whiteFMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f0, roughness: 0.3 });
  const FW = 3, FT = 1;
  function chambSection(d0, d1, height, yBase, outward, mat) {
    const base = outward ? eP : iP;
    const sign = outward ? 1 : -1;
    const pts = [
      base(d0),
      base(d1),
      [base(d1)[0] + sign * FT * pX, base(d1)[1] + sign * FT * pZ],
      [base(d0)[0] + sign * FT * pX, base(d0)[1] + sign * FT * pZ],
    ];
    const shape = new THREE.Shape();
    shape.moveTo(pts[0][0], -pts[0][1]);
    for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i][0], -pts[i][1]);
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false });
    geo.rotateX(-Math.PI / 2);
    if (yBase > 0) geo.translate(0, yBase, 0);
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = true;
    assembly.add(m);
  }
  for (const [outward, mat] of [[true, redFMat], [false, whiteFMat]]) {
    chambSection(E_DOOR_START - FW, E_DOOR_START, DOOR_H, 0,      outward, mat); // jambage gauche
    chambSection(E_DOOR_END,  E_DOOR_END + FW,   DOOR_H, 0,      outward, mat); // jambage droit
    chambSection(E_DOOR_START - FW, E_DOOR_END + FW, FW, DOOR_H, outward, mat); // traverse
  }

  // ── Panneau ────────────────────────────────────────────────────────────────
  const doorH = DOOR_H;
  const doorMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.5, metalness: 0.1 });
  const handleMat = new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.85, roughness: 0.15 });

  const entryGroup = new THREE.Group();
  entryGroup.userData.hoverAction = { label: 'Porte entrée', actionId: 'entry-door-toggle' };
  entryGroup.position.set(hingeX, 0, hingeZ);
  entryGroup.rotation.y = rotY;

  const entryPanel = new THREE.Mesh(new THREE.BoxGeometry(4, doorH, ENTRY_DOOR_W), doorMat);
  entryPanel.position.set(0, doorH / 2, ENTRY_DOOR_W / 2);
  entryPanel.castShadow = true;
  entryGroup.add(entryPanel);

  // Poignée intérieure (levier en L)
  const hz = 70, hy = 100, R = 1.3;
  const rose = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 1, 12), handleMat);
  rose.rotation.z = Math.PI / 2;
  rose.position.set(-2.5, hy, hz);
  entryGroup.add(rose);
  const horiz = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 5, 8), handleMat);
  horiz.rotation.z = Math.PI / 2;
  horiz.position.set(-3 - 5 / 2, hy, hz);
  entryGroup.add(horiz);
  const manche = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 14, 8), handleMat);
  manche.rotation.x = Math.PI / 2;
  manche.position.set(-3 - 5, hy, hz - 14 / 2);
  entryGroup.add(manche);
  for (const [x, y, z] of [[-3 - 5, hy, hz], [-3 - 5, hy, hz - 14]]) {
    const ball = new THREE.Mesh(new THREE.SphereGeometry(R, 8, 6), handleMat);
    ball.position.set(x, y, z);
    entryGroup.add(ball);
  }

  // Boule extérieure rouge
  const knobMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, metalness: 0.3, roughness: 0.4 });
  const knob = new THREE.Mesh(new THREE.SphereGeometry(5, 16, 12), knobMat);
  knob.position.set(6, doorH / 2, ENTRY_DOOR_W / 2);
  entryGroup.add(knob);

  entryDoor = { group: entryGroup, closedY: rotY, openY: rotY - 2 * Math.PI / 3, open: false };
  assembly.add(entryGroup);
}

/**
 * Crée le dormant + panneau de la porte séjour dans l'assembly fourni.
 * @param {THREE.Group} assembly — groupe parent (world-origin)
 */
export function buildLivingDoor(assembly) {
  const doorH = DOOR_H;
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.4 });

  const dGroup = new THREE.Group();
  dGroup.userData.hoverAction = { label: 'Porte séjour', actionId: 'living-door-toggle' };
  dGroup.position.set(DOOR_END, 0, ROOM_D + 3);

  const dPanel = new THREE.Mesh(new THREE.BoxGeometry(DOOR_W, doorH, 4), whiteMat);
  dPanel.position.set(-DOOR_W / 2, doorH / 2, 0);
  dPanel.castShadow = true;
  dGroup.add(dPanel);

  for (const [rY, zOff] of [[Math.PI, -2.5], [0, 2.5]]) {
    const t = makeTapeMesh(); t.rotation.y = rY;
    t.position.set(-DOOR_W + 15, 100, zOff);
    dGroup.add(t);
  }

  const hMat = new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.85, roughness: 0.15 });
  const R = 1.3, hx = -DOOR_W + 15, hy = 100;
  for (const [zF, sign] of [[-2.5, -1], [2.5, 1]]) {
    const rose = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 1, 12), hMat);
    rose.rotation.x = Math.PI / 2;
    rose.position.set(hx, hy, zF);
    dGroup.add(rose);
    const horiz = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 5, 8), hMat);
    horiz.rotation.x = Math.PI / 2;
    horiz.position.set(hx, hy, zF + sign * 2.5);
    dGroup.add(horiz);
    const manche = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 14, 8), hMat);
    manche.rotation.z = Math.PI / 2;
    manche.position.set(hx + 7, hy, zF + sign * 5);
    dGroup.add(manche);
    for (const [bx, by, bz] of [[hx, hy, zF + sign * 5], [hx + 14, hy, zF + sign * 5]]) {
      const ball = new THREE.Mesh(new THREE.SphereGeometry(R, 8, 6), hMat);
      ball.position.set(bx, by, bz);
      dGroup.add(ball);
    }
  }

  livingDoor = { group: dGroup, closedY: 0, openY: -Math.PI / 2, open: false };

  // ── Dormant — dans l'épaisseur du mur D (Z: ROOM_D → ROOM_D+WALL_W) ──────
  // Mur D center Z = ROOM_D + WALL_W/2
  const wallCZ = ROOM_D + WALL_W / 2;
  const stopZ  = ROOM_D + STOP_T / 2; // face couloir (côté où la porte se ferme)

  // Montant gauche (X=DOOR_START)
  assembly.add(box(DORMANT_T, DOOR_H, WALL_W,
    DOOR_START + DORMANT_T / 2, DOOR_H / 2, wallCZ, dormantMat));
  // Montant droit (X=DOOR_END)
  assembly.add(box(DORMANT_T, DOOR_H, WALL_W,
    DOOR_END - DORMANT_T / 2, DOOR_H / 2, wallCZ, dormantMat));
  // Traverse supérieure
  assembly.add(box(DOOR_W - DORMANT_T * 2, DORMANT_T, WALL_W,
    (DOOR_START + DOOR_END) / 2, DOOR_H + DORMANT_T / 2, wallCZ, dormantMat));

  // Arrêt de porte (côté couloir, sur lequel le panneau vient butter)
  assembly.add(box(STOP_T, DOOR_H, STOP_W,
    DOOR_START + DORMANT_T + STOP_T / 2, DOOR_H / 2, stopZ, stopMat));
  assembly.add(box(STOP_T, DOOR_H, STOP_W,
    DOOR_END - DORMANT_T - STOP_T / 2, DOOR_H / 2, stopZ, stopMat));
  assembly.add(box(DOOR_W - DORMANT_T * 2 - STOP_T * 2, STOP_W, STOP_T,
    (DOOR_START + DOOR_END) / 2, DOOR_H - STOP_W / 2, stopZ, stopMat));

  assembly.add(dGroup);
}

/**
 * Crée le dormant + panneau de la porte SDB dans l'assembly fourni.
 * @param {{ hingeX, hingeZ }} params — charnière calculée depuis le couloir
 * @param {THREE.Group} assembly — groupe parent (world-origin)
 */
export function buildBathroomDoor({ hingeX, hingeZ }, assembly) {
  const doorH = DOOR_H;

  // ── Encadrement ────────────────────────────────────────────────────────────
  const frameMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f0, roughness: 0.3 });
  const FW = 3, FT = 1;
  const doorStartZ = hingeZ - DOOR_W;
  const doorEndZ   = hingeZ;
  const CZ = (doorStartZ + doorEndZ) / 2;
  function fp(w, h, d, x, y, z) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), frameMat);
    m.position.set(x, y, z);
    assembly.add(m);
  }
  for (const xF of [hingeX - WALL_W / 2 - FT / 2, hingeX + WALL_W / 2 + FT / 2]) {
    fp(FT, doorH, FW, xF, doorH / 2, doorStartZ - FW / 2);
    fp(FT, doorH, FW, xF, doorH / 2, doorEndZ   + FW / 2);
    fp(FT, FW, DOOR_W + FW * 2, xF, doorH + FW / 2, CZ);
  }

  // ── Panneau ────────────────────────────────────────────────────────────────
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.4 });

  const sGroup = new THREE.Group();
  sGroup.userData.hoverAction = { label: 'Porte SDB', actionId: 'bathroom-door-toggle' };
  sGroup.position.set(hingeX, 0, hingeZ);

  const sPanel = new THREE.Mesh(new THREE.BoxGeometry(4, doorH, DOOR_W), whiteMat);
  sPanel.position.set(0, doorH / 2, -DOOR_W / 2);
  sPanel.castShadow = true;
  sGroup.add(sPanel);

  for (const [rY, xOff] of [[Math.PI / 2, 2.5], [-Math.PI / 2, -2.5]]) {
    const t = makeTapeMesh(); t.rotation.y = rY;
    t.position.set(xOff, 100, -DOOR_W + 15);
    sGroup.add(t);
  }

  const hMat = new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.85, roughness: 0.15 });
  const R = 1.3, hz = -DOOR_W + 15, hy = 100;
  for (const [xF, sign] of [[-2.5, -1], [2.5, 1]]) {
    const rose = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 1, 12), hMat);
    rose.rotation.z = Math.PI / 2;
    rose.position.set(xF, hy, hz);
    sGroup.add(rose);
    const horiz = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 5, 8), hMat);
    horiz.rotation.z = Math.PI / 2;
    horiz.position.set(xF + sign * 2.5, hy, hz);
    sGroup.add(horiz);
    const manche = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 14, 8), hMat);
    manche.rotation.x = Math.PI / 2;
    manche.position.set(xF + sign * 5, hy, hz + 7);
    sGroup.add(manche);
    for (const [bx, by, bz] of [[xF + sign * 5, hy, hz], [xF + sign * 5, hy, hz + 14]]) {
      const ball = new THREE.Mesh(new THREE.SphereGeometry(R, 8, 6), hMat);
      ball.position.set(bx, by, bz);
      sGroup.add(ball);
    }
  }

  bathroomDoor = { group: sGroup, closedY: 0, openY: Math.PI / 2, open: false };

  // ── Dormant — dans l'épaisseur du mur couloir (X: hingeX-WALL_W/2 → hingeX+WALL_W/2) ──
  const wallCX = hingeX; // centre du mur = hingeX
  const stopX  = hingeX - WALL_W / 2 - STOP_T / 2; // face couloir
  const zS = hingeZ;              // jambage sud (côté charnière)
  const zN = hingeZ - DOOR_W;    // jambage nord

  // Jambage sud
  assembly.add(box(WALL_W, DOOR_H, DORMANT_T,
    wallCX, DOOR_H / 2, zS + DORMANT_T / 2, dormantMat));
  // Jambage nord
  assembly.add(box(WALL_W, DOOR_H, DORMANT_T,
    wallCX, DOOR_H / 2, zN - DORMANT_T / 2, dormantMat));
  // Traverse supérieure
  assembly.add(box(WALL_W, DORMANT_T, DOOR_W - DORMANT_T * 2,
    wallCX, DOOR_H + DORMANT_T / 2, (zS + zN) / 2, dormantMat));

  // Arrêt de porte (face couloir)
  assembly.add(box(STOP_T, DOOR_H, STOP_W,
    stopX, DOOR_H / 2, zS - STOP_W / 2, stopMat));
  assembly.add(box(STOP_T, DOOR_H, STOP_W,
    stopX, DOOR_H / 2, zN + STOP_W / 2, stopMat));
  assembly.add(box(STOP_T, STOP_W, DOOR_W - STOP_W * 2,
    stopX, DOOR_H - STOP_W / 2, (zS + zN) / 2, stopMat));

  assembly.add(sGroup);
}
