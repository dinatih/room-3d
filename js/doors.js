import * as THREE from 'three';
import { DOOR_H, DOOR_END, ROOM_D } from './config.js';

// Largeur standard NF (indépendant de la grille LEGO)
export const DOOR_W       = 83; // séjour + SDB
export const ENTRY_DOOR_W = 90; // porte d'entrée

const doorGroups = [];
let doorsOpen = false;

function toggleDoor(index) {
  const d = doorGroups[index];
  d.open = !d.open;
  d.group.rotation.y = d.open ? d.openY : d.closedY;
  return d.open;
}

export function toggleEntryDoor()    { return toggleDoor(0); }
export function toggleLivingDoor()   { return toggleDoor(1); }
export function toggleBathroomDoor() { return toggleDoor(2); }

export function toggleCorridorDoors() {
  doorsOpen = !doorsOpen;
  for (const d of doorGroups) {
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
 * Construit les 3 portes et les enregistre dans doorGroups.
 * @param {object} entry    { hingeX, hingeZ, rotY }  — position calculée depuis le mur diagonal
 * @param {object} bathroom { hingeX, hingeZ }         — position calculée depuis le couloir
 */
export function buildDoors(scene, { entry, bathroom }) {
  const doorH = DOOR_H;
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.4 });

  // ─── Porte d'entrée (rouge) — mur diagonal ───────────────────────────────
  {
    const doorMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.5, metalness: 0.1 });
    const entryGroup = new THREE.Group();
    entryGroup.userData.hoverAction = { label: 'Porte entrée', actionId: 'entry-door-toggle' };
    entryGroup.position.set(entry.hingeX, 0, entry.hingeZ);
    entryGroup.rotation.y = entry.rotY;

    const entryPanel = new THREE.Mesh(
      new THREE.BoxGeometry(4, doorH, ENTRY_DOOR_W),
      doorMat,
    );
    entryPanel.position.set(0, doorH / 2, ENTRY_DOOR_W / 2);
    entryPanel.castShadow = true;
    entryGroup.add(entryPanel);
    scene.add(entryGroup);
    doorGroups.push({ group: entryGroup, closedY: entry.rotY, openY: entry.rotY - 2 * Math.PI / 3, open: false });
  }

  // ─── Porte couloir → séjour (blanche) — mur D ────────────────────────────
  {
    const dGroup = new THREE.Group();
    dGroup.userData.hoverAction = { label: 'Porte séjour', actionId: 'living-door-toggle' };
    dGroup.position.set(DOOR_END, 0, ROOM_D);

    const dPanel = new THREE.Mesh(
      new THREE.BoxGeometry(DOOR_W, doorH, 4),
      whiteMat,
    );
    dPanel.position.set(-DOOR_W / 2, doorH / 2, 0);
    dPanel.castShadow = true;
    dGroup.add(dPanel);

    for (const [rY, zOff] of [[Math.PI, -2.5], [0, 2.5]]) {
      const t = makeTapeMesh(); t.rotation.y = rY;
      t.position.set(-DOOR_W + 15, 100, zOff);
      dGroup.add(t);
    }
    scene.add(dGroup);
    doorGroups.push({ group: dGroup, closedY: 0, openY: -Math.PI / 2, open: false });
  }

  // ─── Porte SDB (blanche) — mur couloir gauche ────────────────────────────
  {
    const sGroup = new THREE.Group();
    sGroup.userData.hoverAction = { label: 'Porte SDB', actionId: 'bathroom-door-toggle' };
    sGroup.position.set(bathroom.hingeX, 0, bathroom.hingeZ);

    const sPanel = new THREE.Mesh(
      new THREE.BoxGeometry(4, doorH, DOOR_W),
      whiteMat,
    );
    sPanel.position.set(0, doorH / 2, -DOOR_W / 2);
    sPanel.castShadow = true;
    sGroup.add(sPanel);

    for (const [rY, xOff] of [[Math.PI / 2, 2.5], [-Math.PI / 2, -2.5]]) {
      const t = makeTapeMesh(); t.rotation.y = rY;
      t.position.set(xOff, 100, -DOOR_W + 15);
      sGroup.add(t);
    }
    scene.add(sGroup);
    doorGroups.push({ group: sGroup, closedY: 0, openY: Math.PI / 2, open: false });
  }
}
