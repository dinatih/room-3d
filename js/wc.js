import * as THREE from 'three';
import { NICHE_DEPTH, KITCHEN_Z } from './config.js';

// Position du WC (identique à bathroom.js)
const WC_X0 = -NICHE_DEPTH + 40; // 30cm
const WC_W  = 40;
const WC_Z0 = KITCHEN_Z + 11;    // 471cm
const WC_CX = WC_X0 + WC_W / 2;  // 50cm

let wcLidGroup = null;
let wcLidOpen  = false;

export function toggleWCLid() {
  wcLidOpen = !wcLidOpen;
  if (wcLidGroup) wcLidGroup.rotation.x = wcLidOpen ? -Math.PI * 0.62 : 0;
  return wcLidOpen;
}

export function buildWC(scene) {
  const R        = WC_W / 2;  // 20cm
  const bowlOval = 1.15;      // étirement en Z (cuvette ovale)
  const bowlH    = 40;        // hauteur bord cuvette
  const tankD    = 18;        // profondeur réservoir (axe Z)
  const tankH    = 38;        // hauteur réservoir
  const tankW    = WC_W - 2;  // 38cm
  const tankLidH = 3.5;
  const bowlCZ   = WC_Z0 + tankD + R * bowlOval; // centre Z de la cuvette

  const wcMat = new THREE.MeshStandardMaterial({
    color: 0xf5f5f5, roughness: 0.12, metalness: 0.04,
  });
  const wcInnerMat = new THREE.MeshStandardMaterial({
    color: 0xdfdfdf, roughness: 0.07, side: THREE.DoubleSide,
  });

  const wcGroup = new THREE.Group();
  wcGroup.userData.inventoryId = 'toilet';
  wcGroup.userData.hoverAction = { label: 'WC', actionId: 'wc-lid-toggle' };

  // ──────────────────────────────────────────────────
  // COQUE EXTÉRIEURE (LatheGeometry — profil réaliste)
  // ──────────────────────────────────────────────────
  const outerPts = [
    new THREE.Vector2(0.1,       0),
    new THREE.Vector2(R * 0.88,  0),       // base large
    new THREE.Vector2(R * 0.88,  2.5),     // rebord de base
    new THREE.Vector2(R * 0.50,  6.0),     // contraction piédestal
    new THREE.Vector2(R * 0.39,  10.0),
    new THREE.Vector2(R * 0.37,  19.0),    // piédestal fin
    new THREE.Vector2(R * 0.55,  27.0),    // renflement pré-cuvette
    new THREE.Vector2(R * 0.88,  33.5),    // élargissement cuvette
    new THREE.Vector2(R + 1.0,   37.5),    // rebord max
    new THREE.Vector2(R,         bowlH),   // bord supérieur
    new THREE.Vector2(R * 0.68,  bowlH),   // face intérieure du rebord
  ];
  const outerMesh = new THREE.Mesh(new THREE.LatheGeometry(outerPts, 40), wcMat);
  outerMesh.scale.z = bowlOval;
  outerMesh.position.set(WC_CX, 0, bowlCZ);
  outerMesh.castShadow = true;
  outerMesh.receiveShadow = true;
  wcGroup.add(outerMesh);

  // ──────────────────────────────────────────────────
  // CAVITÉ INTÉRIEURE (LatheGeometry — entonnoir)
  // ──────────────────────────────────────────────────
  const innerPts = [
    new THREE.Vector2(R * 0.68,  bowlH),
    new THREE.Vector2(R * 0.62,  37.0),
    new THREE.Vector2(R * 0.50,  30.0),
    new THREE.Vector2(R * 0.30,  22.0),
    new THREE.Vector2(R * 0.16,  16.0),
    new THREE.Vector2(0.1,       13.5),
  ];
  const innerMesh = new THREE.Mesh(new THREE.LatheGeometry(innerPts, 40), wcInnerMat);
  innerMesh.scale.z = bowlOval;
  innerMesh.position.set(WC_CX, 0, bowlCZ);
  wcGroup.add(innerMesh);

  // Fond de cuvette
  const bottomR = R * 0.16;
  const bowlFloor = new THREE.Mesh(new THREE.CircleGeometry(bottomR, 36), wcInnerMat);
  bowlFloor.rotation.x = -Math.PI / 2;
  bowlFloor.scale.y = bowlOval;
  bowlFloor.position.set(WC_CX, 13.5, bowlCZ);
  wcGroup.add(bowlFloor);

  // Eau au fond
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x7ab8d4, roughness: 0.01, transparent: true, opacity: 0.55,
  });
  const water = new THREE.Mesh(new THREE.CircleGeometry(bottomR * 0.88, 36), waterMat);
  water.rotation.x = -Math.PI / 2;
  water.scale.y = bowlOval;
  water.position.set(WC_CX, 13.6, bowlCZ);
  wcGroup.add(water);

  // ──────────────────────────────────────────────────
  // SIÈGE — anneau elliptique (ExtrudeGeometry)
  // ──────────────────────────────────────────────────
  const seatRX = R * 0.90;
  const seatRZ = seatRX * bowlOval;

  const seatOuter = new THREE.EllipseCurve(0, 0, seatRX,        seatRZ,        0, Math.PI * 2);
  const seatInner = new THREE.EllipseCurve(0, 0, seatRX * 0.70, seatRZ * 0.70, 0, Math.PI * 2);
  const seatShape = new THREE.Shape(seatOuter.getPoints(64));
  seatShape.holes.push(new THREE.Path(seatInner.getPoints(64)));

  const seatGeo = new THREE.ExtrudeGeometry(seatShape, {
    depth: 2.8,
    bevelEnabled: true,
    bevelSize: 0.6,
    bevelThickness: 0.5,
    bevelSegments: 5,
  });
  seatGeo.rotateX(Math.PI / 2); // XY → XZ (pose à plat)

  const seatMat = new THREE.MeshStandardMaterial({ color: 0xefefef, roughness: 0.18 });
  const seat = new THREE.Mesh(seatGeo, seatMat);
  // Après rotateX(PI/2), la face extrudée est à y_local=-2.8; on place la face top à bowlH+2.8
  seat.position.set(WC_CX, bowlH + 2.8, bowlCZ);
  seat.castShadow = true;
  wcGroup.add(seat);

  // ──────────────────────────────────────────────────
  // ABATTANT (lid) — groupe charnière à l'arrière
  // ──────────────────────────────────────────────────
  const lidRX  = seatRX - 0.5;          // légèrement plus petit que le siège
  const hingeZ = bowlCZ - seatRZ + 1.5; // arrière de la cuvette (côté réservoir)

  wcLidGroup = new THREE.Group();
  wcLidGroup.position.set(WC_CX, bowlH + 3.5, hingeZ);

  const lidMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.10, metalness: 0.02 });

  // Panneau principal (CylinderGeometry = cercle aplati → ovale via scale.z)
  const lidPanel = new THREE.Mesh(new THREE.CylinderGeometry(lidRX, lidRX, 2, 48), lidMat);
  lidPanel.scale.z = bowlOval;
  // Centre à seatRZ en avant de la charnière (couvre toute la cuvette)
  lidPanel.position.set(0, 1, seatRZ - 0.5);
  lidPanel.castShadow = true;
  wcLidGroup.add(lidPanel);

  // Renfort de charnière (petite bosse à l'arrière)
  const hingeKnob = new THREE.Mesh(
    new THREE.CylinderGeometry(2, 2, 3, 12),
    new THREE.MeshStandardMaterial({ color: 0xd0d0d0, roughness: 0.25, metalness: 0.3 }),
  );
  hingeKnob.rotation.z = Math.PI / 2;
  hingeKnob.position.set(0, 1, -0.5);
  wcLidGroup.add(hingeKnob);

  wcGroup.add(wcLidGroup);

  // ──────────────────────────────────────────────────
  // RÉSERVOIR
  // ──────────────────────────────────────────────────
  const tank = new THREE.Mesh(new THREE.BoxGeometry(tankW, tankH, tankD), wcMat);
  tank.position.set(WC_CX, bowlH + tankH / 2, WC_Z0 + tankD / 2);
  tank.castShadow = true;
  tank.receiveShadow = true;
  wcGroup.add(tank);

  // Lame de façade (légèrement saillante, finition brillante)
  const tankFace = new THREE.Mesh(
    new THREE.BoxGeometry(tankW - 4, tankH - 6, 0.8),
    new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.07, metalness: 0.04 }),
  );
  tankFace.position.set(WC_CX, bowlH + tankH / 2, WC_Z0 + tankD + 0.2);
  wcGroup.add(tankFace);

  // Couvercle du réservoir
  const tankLid = new THREE.Mesh(new THREE.BoxGeometry(tankW + 1.5, tankLidH, tankD + 1.5), wcMat);
  tankLid.position.set(WC_CX, bowlH + tankH + tankLidH / 2, WC_Z0 + tankD / 2);
  tankLid.castShadow = true;
  wcGroup.add(tankLid);

  // ──────────────────────────────────────────────────
  // DOUBLE BOUTON CHASSE D'EAU (2 demi-cercles)
  // ──────────────────────────────────────────────────
  const btnY  = bowlH + tankH + tankLidH + 0.8;
  const btnCX = WC_CX;
  const btnCZ = WC_Z0 + tankD / 2;

  const btnBaseMat  = new THREE.MeshStandardMaterial({ color: 0xbababa, roughness: 0.18, metalness: 0.55 });
  const btnBigMat   = new THREE.MeshStandardMaterial({ color: 0xe2e2e2, roughness: 0.10, metalness: 0.50 });
  const btnSmallMat = new THREE.MeshStandardMaterial({ color: 0xd0d0d0, roughness: 0.13, metalness: 0.48 });

  // Plaque de fond chromée
  const btnPlate = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 0.7, 48), btnBaseMat);
  btnPlate.position.set(btnCX, btnY - 0.35, btnCZ);
  wcGroup.add(btnPlate);

  // Grand demi-cercle — chasse pleine (côté avant, vers l'utilisateur)
  // thetaStart=-PI/2, thetaLength=PI → demi-disque avant
  const bigBtn = new THREE.Mesh(
    new THREE.CylinderGeometry(5.3, 5.3, 1.8, 48, 1, false, -Math.PI / 2, Math.PI),
    btnBigMat,
  );
  bigBtn.position.set(btnCX, btnY + 0.9, btnCZ + 0.8);
  wcGroup.add(bigBtn);

  // Petit demi-cercle — demi-chasse (côté arrière, vers le mur)
  // thetaStart=PI/2, thetaLength=PI → demi-disque arrière
  const smallBtn = new THREE.Mesh(
    new THREE.CylinderGeometry(4.0, 4.0, 1.4, 48, 1, false, Math.PI / 2, Math.PI),
    btnSmallMat,
  );
  smallBtn.position.set(btnCX, btnY + 0.7, btnCZ - 0.8);
  wcGroup.add(smallBtn);

  // Ligne de séparation (fine lame chromée entre les deux boutons)
  const divider = new THREE.Mesh(
    new THREE.BoxGeometry(11.5, 0.5, 0.7),
    btnBaseMat,
  );
  divider.position.set(btnCX, btnY + 1.4, btnCZ);
  wcGroup.add(divider);

  // ──────────────────────────────────────────────────
  // RACCORD réservoir → cuvette
  // ──────────────────────────────────────────────────
  const conn = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 3.5, 5, 16), wcMat);
  conn.position.set(WC_CX, bowlH - 2.5, WC_Z0 + tankD + 3);
  wcGroup.add(conn);

  // Embase au sol (contre le mur)
  const pedBase = new THREE.Mesh(new THREE.BoxGeometry(tankW * 0.75, 3.5, 3), wcMat);
  pedBase.position.set(WC_CX, 1.75, WC_Z0 + 1.5);
  wcGroup.add(pedBase);

  scene.add(wcGroup);
}
