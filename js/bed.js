import * as THREE from 'three';
import { ROOM_W, KALLAX_DEPTH } from './config.js';
import { kallaxW } from './kallax.js';

let stacked = true;
let b1, b2;

export function toggleBedStack() {
  stacked = !stacked;
  b2.position.set(0, stacked ? 23 : 0, stacked ? 0 : -83);
  return stacked;
}

export function buildBed(scene) {
  const woodMat = new THREE.MeshStandardMaterial({ color: 0xe8c39e, roughness: 0.8 });

  // Utåker bed unit (from kallax.html)
  // Frame: 205×83cm, legs 23cm, sides 12cm high
  function createUtakerBed(matCol, matH) {
    const g = new THREE.Group();
    const frame = new THREE.Group();

    // Long sides
    const s1 = new THREE.Mesh(new THREE.BoxGeometry(205, 12, 3), woodMat);
    s1.position.set(0, 17, 40);
    const s2 = new THREE.Mesh(new THREE.BoxGeometry(205, 12, 3), woodMat);
    s2.position.set(0, 17, -40);

    // End pieces
    const e1 = new THREE.Mesh(new THREE.BoxGeometry(3, 12, 83), woodMat);
    e1.position.set(101, 17, 0);
    const e2 = new THREE.Mesh(new THREE.BoxGeometry(3, 12, 83), woodMat);
    e2.position.set(-101, 17, 0);

    // 4 legs
    [[-98, -38.5], [-98, 38.5], [98, -38.5], [98, 38.5]].forEach(p => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(4, 23, 4), woodMat);
      leg.position.set(p[0], 11.5, p[1]);
      frame.add(leg);
    });

    frame.add(s1, s2, e1, e2);
    frame.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
    g.add(frame);

    // Mattress
    const mat = new THREE.Mesh(
      new THREE.BoxGeometry(200, matH, 80),
      new THREE.MeshStandardMaterial({ color: matCol, roughness: 0.8 })
    );
    mat.position.y = 11 + matH / 2;
    mat.castShadow = true;
    mat.receiveShadow = true;
    g.add(mat);

    return g;
  }

  // Two stacked Utåker frames
  const utaker = new THREE.Group();
  b1 = createUtakerBed(0x87ceeb, 18); // bottom: blue mattress
  b2 = createUtakerBed(0xffffff, 24); // top: white mattress
  b2.position.y = 23; // stacked
  utaker.add(b1, b2);

  // Top of upper mattress: b2.y(23) + mat.y(11+12) + matH/2(12) = 58
  const matTopY = 23 + 11 + 24;

  // Couverture rouge + polochons — attached to b2 so they follow toggle
  const redMat = new THREE.MeshStandardMaterial({ color: 0xCC2222, roughness: 0.75 });
  const BLK_T = 1.2;
  const BLK_DRAPE = 20;
  const blkW = 86;  // slightly wider than mattress (80)
  const blkL = 203; // slightly longer than mattress (200)
  // Positions relative to b2 (subtract b2.position.y = 23)
  const relTop = matTopY - 23;

  const blkTop = new THREE.Mesh(new THREE.BoxGeometry(blkL, BLK_T, blkW), redMat);
  blkTop.position.set(1.5, relTop + BLK_T / 2, 0);
  blkTop.castShadow = true;
  blkTop.receiveShadow = true;
  b2.add(blkTop);

  // Drapé côtés longs
  for (const side of [-1, 1]) {
    const drape = new THREE.Mesh(new THREE.BoxGeometry(blkL, BLK_DRAPE, BLK_T), redMat);
    drape.position.set(1.5, relTop - BLK_DRAPE / 2, side * blkW / 2);
    drape.castShadow = true;
    b2.add(drape);
  }

  // Drapé au pied
  const drapeFoot = new THREE.Mesh(new THREE.BoxGeometry(BLK_T, BLK_DRAPE, blkW), redMat);
  drapeFoot.position.set(blkL / 2 + 1.5, relTop - BLK_DRAPE / 2, 0);
  drapeFoot.castShadow = true;
  b2.add(drapeFoot);

  // 2 polochons rouges (near head, local -X end)
  const polochonR = 8;
  const polochonL = 28;
  const polochonGeo = new THREE.CylinderGeometry(polochonR, polochonR, polochonL, 12);
  const polochonY = relTop + BLK_T + polochonR + 0.5;

  for (const side of [-1, 1]) {
    const p = new THREE.Mesh(polochonGeo, redMat);
    p.rotation.x = Math.PI / 2;
    p.position.set(-101 + 15, polochonY, side * (80 / 2 - polochonL / 2 - 2));
    p.castShadow = true;
    b2.add(p);
  }

  // Position: pivoté ~13° — 3 contraintes simultanées :
  // 1) Coin NE contre mur B (X=300)
  // 2) Face nord touche coin SO Kallax NE (261, 75.5)
  // 3) Face est touche coin NO Sunnersta (264, 243.5)
  const KALLAX_S = kallaxW(2);                // 75.5 — bord sud Kallax NE
  const KALLAX_SW_X = ROOM_W - KALLAX_DEPTH; // 261 — bord ouest Kallax NE
  const SUNNERSTA_NW_X = ROOM_W - 36;        // 264 — bord ouest Sunnersta
  const SUNNERSTA_NW_Z = 243.5;              // bord nord Sunnersta
  const halfL = 205 / 2;
  const halfW = 83 / 2;

  // Marge pour la couette/drapé (~2cm de débord du cadre)
  const PAD = 3;
  // Résolution : tan(α) = dxK/u = (dzT-u)/dxS → u²-dzT·u+dxK·dxS = 0
  const dxK = ROOM_W - KALLAX_SW_X;                    // 39
  const dxS = ROOM_W - SUNNERSTA_NW_X + PAD;           // 39
  const dzT = SUNNERSTA_NW_Z - (KALLAX_S + PAD);       // 165
  const u = (dzT - Math.sqrt(dzT * dzT - 4 * dxK * dxS)) / 2;
  const NE_Z = KALLAX_S + PAD + u;            // ~88.3
  const alpha = Math.atan2(dxK, u);           // ~77° → tilt ~13°

  // Positionner le groupe pour que le coin NE local (+halfL,+halfW) tombe à (300, NE_Z)
  const neOffX = halfL * Math.cos(alpha) + halfW * Math.sin(alpha);
  const neOffZ = -halfL * Math.sin(alpha) + halfW * Math.cos(alpha);
  utaker.rotation.y = alpha;
  utaker.position.set(ROOM_W - neOffX, 0, NE_Z - neOffZ);
  scene.add(utaker);
}
