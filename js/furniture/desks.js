import * as THREE from 'three';
import { requestRender } from '../cameraManager.js';
import { smorkullGroup } from './chair.js';
const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
const footHgt = 2.5;
const colSize = 4.2;

const desks = [];
let standing = false;
let _scene = null;
let desk1PosIdx = 0;
let desk2PosIdx = 0;
const DESK1_POSITIONS = [
  { x: 22, z: 74.5, ry: Math.PI / 2 },  // pos 1 : contre mur A
  { x: 73.5, z: 18, ry: 0 },             // pos 2 : face mur C (Z=0), devant Kallax NW (bord ouest à X=39.5)
];
const SIT_H = 70;
const STAND_H = 103;

class Bollsidan {
  constructor() {
    this.group = new THREE.Group();
    this.currentHeight = SIT_H;

    // Plateau arrondi (ExtrudeGeometry)
    const w = 68, d = 36, r = 6;
    const shape = new THREE.Shape();
    shape.moveTo(-w / 2 + r, -d / 2);
    shape.lineTo(w / 2 - r, -d / 2);
    shape.absarc(w / 2 - r, -d / 2 + r, r, -Math.PI / 2, 0, false);
    shape.lineTo(w / 2, d / 2 - r);
    shape.absarc(w / 2 - r, d / 2 - r, r, 0, Math.PI / 2, false);
    shape.lineTo(-w / 2 + r, d / 2);
    shape.absarc(-w / 2 + r, d / 2 - r, r, Math.PI / 2, Math.PI, false);
    shape.lineTo(-w / 2, -d / 2 + r);
    shape.absarc(-w / 2 + r, -d / 2 + r, r, Math.PI, Math.PI * 1.5, false);

    this.top = new THREE.Mesh(
      new THREE.ExtrudeGeometry(shape, { depth: 1.8, bevelEnabled: false }),
      whiteMat
    );
    this.top.rotation.x = Math.PI / 2;
    this.top.castShadow = true;
    this.top.receiveShadow = true;

    // Piètement H
    const footH = new THREE.Group();
    const footW = 5;
    const refEastX = w / 2 - 8;

    const barEast = new THREE.Mesh(new THREE.BoxGeometry(footW, footHgt, 32), whiteMat);
    barEast.position.set(refEastX, footHgt / 2, 0);
    const barWest = new THREE.Mesh(new THREE.BoxGeometry(footW, footHgt, 32), whiteMat);
    barWest.position.set(refEastX - 55, footHgt / 2, 0);
    const connector = new THREE.Mesh(new THREE.BoxGeometry(55, footHgt, footW), whiteMat);
    connector.position.set(refEastX - 27.5, footHgt / 2, 0);
    footH.add(barEast, barWest, connector);
    footH.traverse(c => { if (c.isMesh) { c.castShadow = true; } });

    // Colonne rectangulaire
    this.colX = refEastX - footW;
    this.column = new THREE.Mesh(new THREE.BoxGeometry(colSize, 1, colSize), whiteMat);

    // Surface anchor (non-rotated group that follows desk height)
    this.surface = new THREE.Group();

    this.group.add(this.top, this.column, footH, this.surface);
    this.updateView();
  }

  updateView() {
    const colHeight = this.currentHeight - footHgt;
    this.top.position.y = this.currentHeight;
    this.surface.position.y = this.currentHeight;
    this.column.scale.y = colHeight;
    this.column.position.set(this.colX, colHeight / 2 + footHgt, 0);
  }

  setHeight(h) {
    this.currentHeight = h;
    this.updateView();
  }
}

export function toggleDesksHeight() {
  standing = !standing;
  const h = standing ? STAND_H : SIT_H;
  desks.forEach(d => d.setHeight(h));
  return standing;
}

export function toggleDesk2Position() {
  desk2PosIdx = (desk2PosIdx + 1) % 2;
  const g = desks[1].group;
  if (desk2PosIdx === 1) {
    // Espace de travail : bureau 2 enfant de smorkullGroup, juste devant la chaise
    smorkullGroup.add(g);
    g.position.set(50, 0, 0); // 50cm est du centre chaise (local smorkullGroup)
    g.rotation.y = Math.PI / 2;
  } else {
    // Position initiale
    _scene.add(g);
    g.position.set(200, 0, 170);
    g.rotation.y = Math.PI;
  }
  requestRender();
  return desk2PosIdx;
}

export function toggleDesk1Position() {
  desk1PosIdx = (desk1PosIdx + 1) % DESK1_POSITIONS.length;
  const p = DESK1_POSITIONS[desk1PosIdx];
  const g = desks[0].group;
  g.rotation.y = p.ry;
  g.position.set(p.x, 0, p.z);
  requestRender();
  return desk1PosIdx;
}

export function toggleDesk1Height() {
  const d = desks[0];
  const newH = d.currentHeight === SIT_H ? STAND_H : SIT_H;
  d.setHeight(newH);
  return newH === STAND_H;
}

export function toggleDesk2Height() {
  const d = desks[1];
  const newH = d.currentHeight === SIT_H ? STAND_H : SIT_H;
  d.setHeight(newH);
  return newH === STAND_H;
}

export let desk2Surface; // non-rotated anchor on desk 2 surface for laptop.js

export function buildDesks(scene) {
  _scene = scene;
  // Desk 1 : against mur A
  const d1 = new Bollsidan();
  d1.group.userData.inventoryId = 'desk-bollsidan-1';
  d1.group.userData.hoverAction = { label: 'Bureau 1', actions: ['desk1-toggle', 'desk1-position'] };
  d1.group.position.set(22, 0, 74.5);
  d1.group.rotation.y = Math.PI / 2;
  scene.add(d1.group);
  desks.push(d1);

  // Desk 2 : in the room
  const d2 = new Bollsidan();
  d2.group.userData.inventoryId = 'desk-bollsidan-2';
  d2.group.userData.hoverAction = { label: 'Bureau 2', actions: ['desk2-toggle', 'desk2-position'] };
  d2.group.position.set(200, 0, 170);
  d2.group.rotation.y = Math.PI;
  scene.add(d2.group);
  desks.push(d2);
  desk2Surface = d2.surface; // items added here follow height changes
}
