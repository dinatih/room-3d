import * as THREE from 'three';
import { gltfLoader } from '../utils/loaders.js';
import { mergeGlbByMaterial } from '../utils/mergeUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { requestRender } from '../cameraManager.js';
import { LAYER_GLB } from '../config.js';
import { buildVihals } from './vihals.js';

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
    sofaGroup.userData.inventoryId = 'sofa-red-1';

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
    sofa2Group.userData.inventoryId = 'sofa-red-2';

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
  // cx=-50 (à l'ouest du jardin), cz=350, orientée face à la pièce
  buildVihals(scene, -50, 350, Math.PI, 0xcc2222);


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

    const cbGroup = new THREE.Group();
    cbGroup.userData.inventoryId = 'chest-bench';
    scene.add(cbGroup);

    // Corps
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(CB_W, CB_H - LID_H, CB_L),
      cbMat,
    );
    body.position.set(cbX, (CB_H - LID_H) / 2, cbZ);
    body.castShadow = true;
    body.receiveShadow = true;
    cbGroup.add(body);

    // Couvercle (légèrement plus large)
    const lid = new THREE.Mesh(
      new THREE.BoxGeometry(CB_W + 1.5, LID_H, CB_L + 1.5),
      cbLidMat,
    );
    lid.position.set(cbX, CB_H - LID_H / 2, cbZ);
    lid.castShadow = true;
    cbGroup.add(lid);

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
      cbGroup.add(handle);
    }
  }

  // =============================================
  // DESSERTE IKEA VIGGJA (37×50×74cm) — GLB
  // À côté du canapé ouest (côté sud)
  // NOTE : GLB brut mesurait x=20.04, y=29.72, z=12.31. Scale 74/29.72≈2.49 appliqué
  //        et baked → résultat ~50×74×31cm. Cohérent avec 37×50×74cm réels SAUF
  //        la profondeur Z (31cm au lieu de 37cm) — les deux autres axes sont exacts.
  // TODO : trouver un modèle Viggja aux bonnes proportions (37×50×74cm) pour remplacer
  //        ce GLB dont la profondeur est incorrecte (~16% trop étroite).
  // =============================================
  gltfLoader.load('media/viggja.glb', (gltf) => {
    const viggja = gltf.scene;

    // GLB déjà en cm, centré à l'origine, posé sur Y=0
    viggja.position.set(100, 0, -178);

    viggja.traverse(c => {
      c.layers.set(LAYER_GLB);
      if (c.isMesh) {
        c.castShadow = true;
        c.receiveShadow = true;
      }
    });

    mergeGlbByMaterial(viggja);
    scene.add(viggja);
    requestRender();
  }, undefined, err => console.error('viggja.glb:', err));

  // =============================================
  // PALMIER EN POT — entre canapé rouge ouest (X=100,Z=-90) et viggja (Z≈-145)
  // =============================================
  gltfLoader.load('media/potted_palm.glb', (gltf) => {
    const palm = gltf.scene;

    const rawBox = new THREE.Box3().setFromObject(palm);
    const rawSize = rawBox.getSize(new THREE.Vector3());
    // Hauteur cible ~150cm
    palm.scale.setScalar(150 / Math.max(rawSize.x, rawSize.y, rawSize.z));

    palm.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(palm);

    // Sol à Y=0, entre sofa2 (centre Z=-90) et viggja (Z≈-140), côté ouest
    palm.position.set(
      100 - (box.min.x + box.max.x) / 2,
      -box.min.y,
      -150 - (box.min.z + box.max.z) / 2,
    );

    palm.traverse(c => {
      c.layers.set(LAYER_GLB);
      if (c.isMesh) {
        c.castShadow = true;
        c.receiveShadow = true;
      }
    });

    mergeGlbByMaterial(palm);
    scene.add(palm);
    requestRender();
  }, undefined, err => console.error('potted_palm.glb:', err));

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
    tub.userData.inventoryId = 'bathtub';

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

  // =============================================
  // LARA SWIM GEAR — allongée dans la baignoire
  // Baignoire : centre (120, 0, -250), rotation.y=-1, 150×70×50cm
  // =============================================
  gltfLoader.load('media/lara_croft_swim_gear.glb', (gltf) => {
    const lara = gltf.scene;

    // Mise à l'échelle : 170cm de hauteur
    const rawBox = new THREE.Box3().setFromObject(lara);
    const rawSize = rawBox.getSize(new THREE.Vector3());
    lara.scale.setScalar(170 / Math.max(rawSize.x, rawSize.y, rawSize.z));

    // ── Pose : hanches à 90°, genoux pliés ──────────────────
    function findBone(name) {
      let found = null;
      lara.traverse(c => { if (c.isBone && c.name === name) found = c; });
      return found;
    }
    const DEG = Math.PI / 180;

    const thighL = findBone('leg_left_thigh_04');
    const thighR = findBone('leg_right_thigh_08');
    const kneeL  = findBone('leg_left_knee_05');
    const kneeR  = findBone('leg_right_knee_09');

    if (thighL) thighL.rotation.x -= 90 * DEG;
    if (thighR) thighR.rotation.x -= 90 * DEG;
    if (kneeL)  kneeL.rotation.x  += 100 * DEG;
    if (kneeR)  kneeR.rotation.x  += 100 * DEG;

    // Allongée sur le dos, alignée avec l'axe long de la baignoire
    lara.rotation.x = -Math.PI / 2;
    lara.rotation.z = -1;

    lara.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(lara);

    const TUB_H = 50;
    lara.position.set(
      120,
      TUB_H - 20,
      -250,
    );

    lara.traverse(c => {
      c.layers.set(LAYER_GLB);
      if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; }
    });

    scene.add(lara);
    requestRender();
  }, undefined, err => console.error('lara_croft_swim_gear.glb:', err));

  // =============================================
  // TENUE RÉALISTE (rouge) — près de la baignoire
  // =============================================
  gltfLoader.load('media/realistic_human_cloths.glb', (gltf) => {
    const cloths = gltf.scene;

    const rawBox = new THREE.Box3().setFromObject(cloths);
    const rawSize = rawBox.getSize(new THREE.Vector3());
    cloths.scale.setScalar(170 / Math.max(rawSize.x, rawSize.y, rawSize.z));

    cloths.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(cloths);

    // À côté de la baignoire (+140cm depuis tub center)
    cloths.position.set(
      260 - (box.min.x + box.max.x) / 2,
      -box.min.y,
      -250 - (box.min.z + box.max.z) / 2,
    );

    const redMat = new THREE.MeshStandardMaterial({ color: 0xcc2020, roughness: 0.6 });
    cloths.traverse(c => {
      c.layers.set(LAYER_GLB);
      if (c.isMesh) {
        c.material = redMat;
        c.castShadow = true;
        c.receiveShadow = true;
      }
    });

    mergeGlbByMaterial(cloths);
    scene.add(cloths);
    requestRender();
  }, undefined, err => console.error('realistic_human_cloths.glb:', err));

  // =============================================
  // GALERIE — personnages alignés par rangées au fond du jardin
  // Rangée 1 (Z=-370) : 11 Lara/Jill
  // Rangées 2-5 (Z=-430…-610) : 34 nouveaux modèles, ~9 par rangée
  // =============================================
  function spawnRow(files, zBack) {
    const file = files[Math.floor(Math.random() * files.length)];
    gltfLoader.load(`media/${file}`, (gltf) => {
      const model = gltf.scene;
        const rawBox  = new THREE.Box3().setFromObject(model);
        const rawSize = rawBox.getSize(new THREE.Vector3());
        model.scale.setScalar(170 / Math.max(rawSize.x, rawSize.y, rawSize.z));
        model.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(model);
        model.position.set(
          150 - (box.min.x + box.max.x) / 2,
          -box.min.y,
          zBack - (box.min.z + box.max.z) / 2,
        );
        model.traverse(c => {
          c.layers.set(LAYER_GLB);
          if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; }
        });
        scene.add(model);
        requestRender();
      }, undefined, err => console.error(`${file}:`, err));
  }

  spawnRow([
    'jill_valentine.glb', 'jill_valentine_2026_rigged.glb',
    'lara_croft.glb', 'lara_croft_2026_rigged.glb', 'lara_croft_4259.glb',
    'lara_croft__2026_rigged.glb', 'lara_croft_black_tank_top.glb',
    'lara_croft__but_japanese_style.glb', 'lara_croft_gold_shades_2739_rigged.glb',
    'lara_croft_rigged.glb', 'lara_croft_swim_gear.glb',
  ], -370);

  spawnRow([
    'character_teen_red_2k.glb', 'crimson_lace_in_the_hallway.glb',
    'doa_npc_fighter.glb', 'harley_quinn_.fbx_to_daz_studio.glb',
    'harley_quinn_hip_hop_dancing.glb',
    'little_red_riding_hood.glb', 'low_animated_dog_shiba_inu.glb',
    'low_ariel_combat_idle_01.glb',
  ], -430);

  spawnRow([
    'low_lady_deadpool.glb', 'low_lady_in_red_dress.glb',
    'low_roan_of_arc_-_fortnite_skin.glb', 'low_terminator_zero.glb',
    'low_woman_in_red.glb', 'me3_doc_michel_fbx.glb',
  ], -490);

  spawnRow([
    'red_criminal_model_ff_freefire.glb', 'red_paint_3d_man_with_animation.glb',
    'red_robot.glb', 'resident_evil_creature_13.glb',
  ], -550);

  spawnRow([
    'resident_evil_npc.glb',
    'terminator_t-800_endo-skeleton_damaged.glb', 'tiffa_rigged.glb',
    'vrchat_ruiko.glb', 'zombie.glb',
  ], -610);
}
