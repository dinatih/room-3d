import * as THREE from "three";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { requestRender } from './cameraManager.js';
import { LAYER_GLB } from './config.js';

const R = 6; // rayon d'arrondi des canapés (cm)

export function buildGarden(scene) {
  // =============================================
  // CANAPÉ DE JARDIN (rouge, côté est)
  // =============================================
  {
    const SOFA_W = 160;   // 160cm le long de Z
    const SOFA_D = 60;    // 60cm profondeur (X)
    const SOFA_H = 90;    // 90cm hauteur totale
    const SEAT_H = 40;    // 40cm hauteur assise
    const BACK_T = 10;    // 10cm épaisseur dossier
    const ARM_W = 10;     // 10cm largeur accoudoir
    const ARM_H = 60;     // 60cm hauteur accoudoir

    const sofaMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.7 });

    const sofaGroup = new THREE.Group();

    // Assise
    const seat = new THREE.Mesh(
      new RoundedBoxGeometry(SOFA_D, SEAT_H, SOFA_W, 3, R),
      sofaMat,
    );
    seat.position.set(0, SEAT_H / 2, 0);
    seat.castShadow = true;
    seat.receiveShadow = true;
    sofaGroup.add(seat);

    // Dossier (contre le mur est)
    const back = new THREE.Mesh(
      new RoundedBoxGeometry(BACK_T, SOFA_H, SOFA_W, 3, R),
      sofaMat,
    );
    back.position.set(SOFA_D / 2 - BACK_T / 2, SOFA_H / 2, 0);
    back.castShadow = true;
    sofaGroup.add(back);

    // Accoudoirs
    for (const side of [-1, 1]) {
      const arm = new THREE.Mesh(
        new RoundedBoxGeometry(SOFA_D, ARM_H, ARM_W, 3, R),
        sofaMat,
      );
      arm.position.set(0, ARM_H / 2, side * (SOFA_W / 2 - ARM_W / 2));
      arm.castShadow = true;
      sofaGroup.add(arm);
    }

    sofaGroup.position.set(300 - SOFA_D / 2, 0, -110);
    scene.add(sofaGroup);
  }

  // =============================================
  // CANAPÉ DE JARDIN 2 (rouge, sans accoudoirs, côté est)
  // =============================================
  {
    const S2_W = 100;    // 100cm le long de Z
    const S2_D = 60;     // 60cm profondeur (X)
    const S2_H = 100;    // 100cm hauteur totale
    const S2_SEAT = 40;  // 40cm hauteur assise
    const S2_BACK = 10;  // 10cm épaisseur dossier

    const sofa2Mat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.7 });
    const sofa2Group = new THREE.Group();

    // Assise
    const seat2 = new THREE.Mesh(
      new RoundedBoxGeometry(S2_D, S2_SEAT, S2_W, 3, R),
      sofa2Mat,
    );
    seat2.position.set(0, S2_SEAT / 2, 0);
    seat2.castShadow = true;
    seat2.receiveShadow = true;
    sofa2Group.add(seat2);

    // Dossier
    const back2 = new THREE.Mesh(
      new RoundedBoxGeometry(S2_BACK, S2_H, S2_W, 3, R),
      sofa2Mat,
    );
    back2.position.set(S2_D / 2 - S2_BACK / 2, S2_H / 2, 0);
    back2.castShadow = true;
    sofa2Group.add(back2);

    sofa2Group.rotation.y = Math.PI;
    sofa2Group.position.set(310 - 60 - 60 - S2_D / 2 - 60, 0, -90);
    scene.add(sofa2Group);
  }

  // =============================================
  // CHAISE PLIANTE IKEA VIHALS (rouge)
  // =============================================
  new GLTFLoader().load('media/folding-chair-generic.glb', (gltf) => {
    const chair = gltf.scene;

    const rawBox = new THREE.Box3().setFromObject(chair);
    const rawSize = rawBox.getSize(new THREE.Vector3());
    chair.scale.setScalar(400 / rawSize.y);

    chair.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(chair);

    chair.position.set(
      -50 - (box.min.x + box.max.x) / 2,
      0,
      350 - (box.min.z + box.max.z) / 2,
    );

    const redMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.5 });
    chair.traverse(c => {
      c.layers.set(LAYER_GLB);
      if (c.isMesh) {
        c.material = redMat;
        c.castShadow = true;
        c.receiveShadow = true;
        c.frustumCulled = false;
      } else if (c.isLine) {
        c.visible = false;
      }
    });

    scene.add(chair);
    requestRender();
  }, undefined, err => console.error('folding-chair-generic.glb:', err));


  // =============================================
  // COFFRE BANC YITAHOME 100 Gal (gris, 122×55×62cm)
  // Derrière le canapé ouest (sofa 2)
  // =============================================
  {
    const CB_L = 122;   // 122cm le long de Z
    const CB_W = 55;    // 55cm profondeur (X)
    const CB_H = 62;    // 62cm hauteur
    const LID_H = 3;   // couvercle

    const cbMat = new THREE.MeshStandardMaterial({
      color: 0x4a4a4a, roughness: 0.6,
    });
    const cbLidMat = new THREE.MeshStandardMaterial({
      color: 0x555555, roughness: 0.5,
    });

    // Sofa 2 : dos à X≈70, Z=-80
    const cbX = 70 - CB_W / 2;  // juste derrière le dossier
    const cbZ = -90;

    // Corps
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(CB_W, CB_H - LID_H, CB_L),
      cbMat,
    );
    body.position.set(cbX, (CB_H - LID_H) / 2, cbZ);
    body.castShadow = true;
    body.receiveShadow = true;
    scene.add(body);

    // Couvercle (légèrement plus large)
    const lid = new THREE.Mesh(
      new THREE.BoxGeometry(CB_W + 1.5, LID_H, CB_L + 1.5),
      cbLidMat,
    );
    lid.position.set(cbX, CB_H - LID_H / 2, cbZ);
    lid.castShadow = true;
    scene.add(lid);

    // Poignées latérales (2 côtés Z)
    const handleMat = new THREE.MeshStandardMaterial({
      color: 0x3a3a3a, roughness: 0.4,
    });
    for (const dz of [-1, 1]) {
      const handle = new THREE.Mesh(
        new THREE.BoxGeometry(15, 3, 1.5),
        handleMat,
      );
      handle.position.set(cbX, CB_H * 0.55, cbZ + dz * (CB_L / 2 + 0.8));
      scene.add(handle);
    }
  }

  // =============================================
  // DESSERTE IKEA VIGGJA (37×50×74cm) — GLB
  // À côté du canapé ouest (côté sud)
  // =============================================
  new GLTFLoader().load('media/viggja.glb', (gltf) => {
    const viggja = gltf.scene;

    const rawBox = new THREE.Box3().setFromObject(viggja);
    const rawSize = rawBox.getSize(new THREE.Vector3());
    // Scale uniforme sur la hauteur réelle (74cm) — proportions fidèles au GLB
    viggja.scale.setScalar(74 / Math.max(rawSize.x, rawSize.y, rawSize.z));

    viggja.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(viggja);

    // Sol à Y=0, centré en X=100, bord sud à Z≈-155 (15cm du canapé, GLB centré à Z≈-35)
    viggja.position.set(
      100 - (box.min.x + box.max.x) / 2,
      -box.min.y,
      -120 - (box.max.z - box.min.z) / 2,
    );

    viggja.traverse(c => {
      c.layers.set(LAYER_GLB);
      if (c.isMesh) {
        c.castShadow = true;
        c.receiveShadow = true;
        c.frustumCulled = false;
      }
    });

    scene.add(viggja);
    requestRender();
  }, undefined, err => console.error('viggja.glb:', err));

  // =============================================
  // BAIGNOIRE — rectangle à coins arrondis, 150×70×50cm
  // =============================================
  {
    const TUB_L = 150;
    const TUB_W = 70;
    const TUB_H = 50;
    const T  = 4;   // épaisseur paroi
    const RC = 35;  // rayon coins extérieurs

    const mat = new THREE.MeshStandardMaterial({ color: 0xd4b483, roughness: 0.4 });

    // Trace un rectangle à coins arrondis sur un Shape ou Path existant
    function rrTrace(p, w, h, r) {
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

    const RC_IN = Math.max(RC - T, 2);
    const tub = new THREE.Group();

    // Parois : outer shape avec trou inner → extrude TUB_H
    const outer = new THREE.Shape();
    rrTrace(outer, TUB_W, TUB_L, RC);
    const hole = new THREE.Path();
    rrTrace(hole, TUB_W - 2 * T, TUB_L - 2 * T, RC_IN);
    outer.holes.push(hole);

    const wallGeo = new THREE.ExtrudeGeometry(outer, { depth: TUB_H, bevelEnabled: false });
    wallGeo.rotateX(-Math.PI / 2);
    const walls = new THREE.Mesh(wallGeo, mat);
    tub.add(walls);

    // Fond
    const botShape = new THREE.Shape();
    rrTrace(botShape, TUB_W - 2 * T, TUB_L - 2 * T, RC_IN);
    const botGeo = new THREE.ExtrudeGeometry(botShape, { depth: T, bevelEnabled: false });
    botGeo.rotateX(-Math.PI / 2);
    const bot = new THREE.Mesh(botGeo, mat);
    tub.add(bot);

    // Eau — surface plane statique
    {
      const waterMat = new THREE.MeshStandardMaterial({
        color: 0x1a6fa8,
        transparent: true, opacity: 0.80, depthWrite: false,
        roughness: 0.05, metalness: 0.15,
      });
      const waterShape = new THREE.Shape();
      rrTrace(waterShape, TUB_W - 2 * T - 1, TUB_L - 2 * T - 1, RC_IN);
      const waterGeo = new THREE.ShapeGeometry(waterShape, 32);
      waterGeo.rotateX(-Math.PI / 2);
      const waterPlane = new THREE.Mesh(waterGeo, waterMat);
      waterPlane.position.y = TUB_H - 12;
      tub.add(waterPlane);
    }

    tub.rotation.y = -1;
    tub.position.set(120, 0, -250);
    tub.traverse(c => {
      if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; }
    });
    scene.add(tub);
  }
}
