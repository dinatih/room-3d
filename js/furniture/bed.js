import * as THREE from 'three';
import { ROOM_W, KALLAX_DEPTH, LAYER_FURNITURE } from '../config.js';
import { kallaxW } from './kallax.js';
import { gltfLoader } from '../utils/loaders.js';
import { requestRender } from '../cameraManager.js';

let stacked = true;
let b1, b2;

let proceduralGroup = null;
let glbGroup = null;
let glbB2 = null;          // second GLB instance
let glbB2Base = null;      // {x, y, z} — position de b2 empilé (référence)
let useGlb = false;

export function toggleBedStack() {
  stacked = !stacked;
  // Procédural
  b2.position.set(0, stacked ? 23 : 0, stacked ? 0 : -83);
  // GLB
  if (glbB2 && glbB2Base) {
    glbB2.position.set(
      glbB2Base.x,
      stacked ? glbB2Base.y : glbB2Base.y - 23,
      stacked ? glbB2Base.z : glbB2Base.z - 83,
    );
  }
  return stacked;
}

export function toggleBedVersion() {
  useGlb = !useGlb;
  if (proceduralGroup) proceduralGroup.visible = !useGlb;
  if (glbGroup) glbGroup.visible = useGlb;
  return useGlb; // true = GLB
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
  b1.userData.inventoryId = 'utaker-lower';
  b2 = createUtakerBed(0xffffff, 24); // top: white mattress
  b2.userData.inventoryId = 'utaker-upper';
  b2.position.y = 23; // stacked
  utaker.userData.hoverAction = { label: 'Lit Utåker', actionId: 'bed-toggle' };
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

  // 2 polochons rouges 90cm — axe X (longueur du lit), côté mur (local Z+)
  const polochonR = 8;
  const polochonL = 90;
  const polochonGeo = new THREE.CylinderGeometry(polochonR, polochonR, polochonL, 12);
  const polochonY = relTop + BLK_T + polochonR + 0.5;
  const polochonZ = 40 - polochonR - 1; // near wall-side edge of mattress

  for (const cx of [-50, 50]) {
    const p = new THREE.Mesh(polochonGeo, redMat);
    p.rotation.z = -Math.PI / 2; // cylinder axis → local X (bed length)
    p.position.set(cx, polochonY, polochonZ);
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
  const posX = ROOM_W - neOffX;
  const posZ = NE_Z - neOffZ;

  utaker.rotation.y = alpha;
  utaker.position.set(posX, 0, posZ);
  scene.add(utaker);
  proceduralGroup = utaker;

  // Version GLB — même position/rotation, chargée en async
  gltfLoader.load('media/UTAKER.glb', (gltf) => {
    const model = gltf.scene;

    // Scale : axe long X → 205cm (1 unit ≈ 1 inch = 2.54cm)
    const rawBox = new THREE.Box3().setFromObject(model);
    const rawSize = new THREE.Vector3();
    rawBox.getSize(rawSize);
    const scl = 205 / rawSize.x;

    // Centrage XZ, base à Y=0 — calculé depuis rawBox (avant scale)
    const offX = -(rawBox.min.x + rawSize.x / 2) * scl;
    const offY = -rawBox.min.y * scl;
    const offZ = -(rawBox.min.z + rawSize.z / 2) * scl;

    model.scale.setScalar(scl);
    model.position.set(offX, offY, offZ);

    // Instance b2 — clonée, empilée par défaut (Y +23cm)
    const model2 = model.clone();
    model2.position.set(offX, offY + 23, offZ);
    glbB2 = model2;
    glbB2Base = { x: offX, y: offY + 23, z: offZ };

    // Wrapper group : même rotation/position que le lit procédural
    glbGroup = new THREE.Group();
    glbGroup.add(model);
    glbGroup.add(model2);
    glbGroup.rotation.y = alpha;
    glbGroup.position.set(posX, 0, posZ);

    for (const m of [model, model2]) {
      m.traverse(c => {
        if (c.isMesh) {
          c.castShadow = true;
          c.receiveShadow = true;
          c.layers.set(LAYER_FURNITURE);
        }
      });
    }

    // Ajouter visible=true pour que setFromObject fonctionne
    glbGroup.visible = true;
    scene.add(glbGroup);

    // Correction : aligner le centre XZ du GLB sur le centre XZ du lit procédural
    proceduralGroup.updateMatrixWorld(true);
    glbGroup.updateMatrixWorld(true);
    const procBox = new THREE.Box3().setFromObject(proceduralGroup);
    const glbBox2 = new THREE.Box3().setFromObject(glbGroup);
    glbGroup.position.x += (procBox.min.x + procBox.max.x) / 2 - (glbBox2.min.x + glbBox2.max.x) / 2;
    glbGroup.position.z += (procBox.min.z + procBox.max.z) / 2 - (glbBox2.min.z + glbBox2.max.z) / 2;

    glbGroup.visible = false; // caché par défaut
    requestRender();
  }, undefined, err => console.error('UTAKER.glb:', err));
}
