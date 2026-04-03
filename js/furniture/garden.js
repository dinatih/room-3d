import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { gltfLoader } from '../utils/loaders.js';
import { mergeGlbByMaterial } from '../utils/mergeUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { requestRender, registerAnimTicker } from '../cameraManager.js';
import { LAYER_GLB } from '../config.js';
import { buildVihals } from './vihals.js';
import { attachDance } from '../decor/dance.js';

const R = 6; // rayon d'arrondi des canapés (cm)

// Pool d'animations pour les modèles de la galerie
const _galleryMixers = [];

// Skeletons de la galerie (cachés par défaut)
const _gallerySkelHelpers = [];
export function toggleGallerySkeletons() {
  const next = !_gallerySkelHelpers.some(s => s.visible);
  _gallerySkelHelpers.forEach(s => { s.visible = next; });
  requestRender();
  return next;
}
registerAnimTicker((dt) => {
  if (_galleryMixers.length === 0) return;
  for (const m of _galleryMixers) m.update(dt);
  requestRender();
});

export function buildGarden(scene) {
  // Mettre à true pour cacher temporairement tous les GLBs contenant "lara"
  const HIDE_LARA = true;
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
  // SHIBA INU — près du grand canapé rouge (sofa 1 : X=270, Z=-110)
  // =============================================
  gltfLoader.load('media/low_animated_dog_shiba_inu.glb', (gltf) => {
    const dog = gltf.scene;

    const rawBox = new THREE.Box3().setFromObject(dog);
    const rawSize = rawBox.getSize(new THREE.Vector3());
    // Chien ~40cm de hauteur
    dog.scale.setScalar(40 / Math.max(rawSize.x, rawSize.y, rawSize.z));

    dog.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(dog);

    // Devant le canapé, légèrement décalé sur le côté
    dog.position.set(
      230 - (box.min.x + box.max.x) / 2,
      -box.min.y,
      -140 - (box.min.z + box.max.z) / 2,
    );

    dog.traverse(c => {
      c.layers.set(LAYER_GLB);
      if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; }
    });

    // Animation jouée une seule fois, puis retirée du ticker
    if (gltf.animations?.length > 0) {
      const mixer = new THREE.AnimationMixer(dog);
      const action = mixer.clipAction(gltf.animations[0]);
      action.loop = THREE.LoopOnce;
      action.clampWhenFinished = true;
      action.play();
      _galleryMixers.push(mixer);
      mixer.addEventListener('finished', () => {
        const idx = _galleryMixers.indexOf(mixer);
        if (idx !== -1) _galleryMixers.splice(idx, 1);
      });
    }

    scene.add(dog);
    requestRender();
  }, undefined, err => console.error('low_animated_dog_shiba_inu.glb:', err));

  // =============================================
  // ANALYSE — copies statiques des 3 Lara, côté ouest (X=20)
  // =============================================
  if (!HIDE_LARA) {
    function loadStaticLara(file, zPos, materialOverride, phase = 0) {
      gltfLoader.load(`media/${file}`, (gltf) => {
        const model = gltf.scene;
        const rawBox = new THREE.Box3().setFromObject(model);
        const rawSize = rawBox.getSize(new THREE.Vector3());
        model.scale.setScalar(170 / Math.max(rawSize.x, rawSize.y, rawSize.z));
        model.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(model);
        model.position.set(
          0 - (box.min.x + box.max.x) / 2,
          -box.min.y,
          zPos - (box.min.z + box.max.z) / 2,
        );
        if (materialOverride) materialOverride(model);
        model.traverse(c => {
          c.layers.set(LAYER_GLB);
          if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; }
        });
        scene.add(model);
        const danceCtrl = attachDance(model, phase);
        if (danceCtrl) danceCtrl.stop();
        addGalleryUI(model, gltf, file, danceCtrl);
        requestRender();
      }, undefined, err => console.error(`${file}:`, err));
    }

    // Lara rouge — 200cm à gauche de lara_croft.glb (X=200)
    loadStaticLara('lara_croft__2026_rigged.glb', -265, (model) => {
      const redMat = new THREE.MeshStandardMaterial({ color: 0xcc1111, roughness: 0.6 });
      const redMatNames = new Set(['5_Shirt_1.0_0_0', '5_BackPack_1.0_0_0', '5_Shorts_1.0_0_0']);
      const redMeshNames = new Set(['Object_116']);
      model.traverse(c => {
        if (!c.isMesh) return;
        if (redMatNames.has(c.material?.name) || redMeshNames.has(c.name)) {
          c.material = redMat;
        }
      });
    }, 2.1);
  }

  // =============================================
  // HELPER — skeleton + label + boutons (copier / 🎨 / ▶) pour un modèle chargé
  // =============================================
  function addGalleryUI(model, gltf, file, danceCtrl = null) {
    const skel = new THREE.SkeletonHelper(model);
    skel.visible = false;
    _gallerySkelHelpers.push(skel);
    scene.add(skel);

    model.updateMatrixWorld(true);
    const topBox = new THREE.Box3().setFromObject(model);

    const btnStyle = 'background:rgba(0,0,0,.6);color:#fff;border:none;border-radius:3px;padding:1px 5px;font:11px monospace;cursor:pointer;pointer-events:auto;';

    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;align-items:center;gap:4px;pointer-events:auto;position:relative;';

    // Nom du fichier
    const span = document.createElement('span');
    span.textContent = file;
    span.style.cssText = 'color:#fff;background:rgba(0,0,0,.6);padding:2px 6px;border-radius:3px;font:11px monospace;white-space:nowrap;';

    // Bouton copier
    const btn = document.createElement('button');
    btn.textContent = '⎘';
    btn.title = 'Copier le nom';
    btn.style.cssText = btnStyle;
    btn.addEventListener('click', () => {
      navigator.clipboard.writeText(file);
      btn.textContent = '✓';
      setTimeout(() => { btn.textContent = '⎘'; }, 1200);
    });

    // Bouton inspecteur matériaux
    const btnMat = document.createElement('button');
    btnMat.textContent = '🎨';
    btnMat.title = 'Inspecter les matériaux';
    btnMat.style.cssText = btnStyle;

    const matPanel = document.createElement('div');
    matPanel.style.cssText = 'display:none;position:absolute;bottom:100%;left:0;margin-bottom:4px;background:rgba(0,0,0,.85);color:#fff;border-radius:4px;padding:6px 8px;font:10px monospace;white-space:nowrap;z-index:20;pointer-events:auto;max-height:220px;overflow-y:auto;';

    // matMap : materialName → { meshObjs: [Mesh], hasMap, color }
    const matMap = new Map();
    model.traverse(c => {
      if (!c.isMesh) return;
      const mats = Array.isArray(c.material) ? c.material : [c.material];
      mats.forEach(m => {
        if (!m) return;
        const key = m.name || '(unnamed)';
        if (!matMap.has(key)) matMap.set(key, { meshObjs: [], hasMap: !!m.map, color: m.color ? '#' + m.color.getHexString() : null });
        matMap.get(key).meshObjs.push(c);
      });
    });
    matMap.forEach(({ meshObjs, hasMap, color }, matName) => {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:6px;padding:1px 0;border-bottom:1px solid rgba(255,255,255,.1);';
      const swatch = document.createElement('span');
      swatch.style.cssText = `display:inline-block;width:10px;height:10px;border-radius:2px;border:1px solid #fff4;flex-shrink:0;background:${color ?? '#888'};`;
      const texIcon = document.createElement('span');
      texIcon.style.cssText = 'font-size:9px;opacity:.7;flex-shrink:0;';
      texIcon.textContent = hasMap ? '🖼' : '○';
      texIcon.title = hasMap ? 'a une texture (map)' : 'couleur unie';
      const lbl = document.createElement('span');
      lbl.style.color = '#aef';
      lbl.textContent = matName;
      const meshNames = meshObjs.map(c => c.name || '(unnamed)');
      const meshLbl = document.createElement('span');
      meshLbl.style.cssText = 'opacity:.5;font-size:9px;';
      meshLbl.textContent = meshNames.slice(0, 3).join(', ') + (meshNames.length > 3 ? ` +${meshNames.length - 3}` : '');
      meshLbl.title = meshNames.join('\n');
      const btnStyle2 = 'background:none;border:none;cursor:pointer;font-size:10px;padding:0;line-height:1;pointer-events:auto;flex-shrink:0;color:#fff;';
      // Bouton cacher/afficher
      const btnVis = document.createElement('button');
      btnVis.textContent = '👁';
      btnVis.title = 'Cacher/afficher';
      btnVis.style.cssText = btnStyle2;
      let visible = true;
      btnVis.addEventListener('click', (e) => {
        e.stopPropagation();
        visible = !visible;
        meshObjs.forEach(c => { c.visible = visible; });
        btnVis.style.opacity = visible ? '1' : '0.35';
        requestRender();
      });
      // Bouton colorier en rouge
      const btnRed = document.createElement('button');
      btnRed.textContent = '🔴';
      btnRed.title = 'Colorier en rouge (map=null)';
      btnRed.style.cssText = btnStyle2;
      btnRed.addEventListener('click', (e) => {
        e.stopPropagation();
        const redMat = new THREE.MeshStandardMaterial({ color: 0xcc1111, roughness: 0.6 });
        meshObjs.forEach(c => { c.material = redMat; });
        swatch.style.background = '#cc1111';
        texIcon.textContent = '○';
        btnRed.style.opacity = '0.4';
        btnRed.disabled = true;
        requestRender();
      });
      row.append(swatch, texIcon, lbl, meshLbl, btnVis, btnRed);
      matPanel.appendChild(row);
    });
    wrap.appendChild(matPanel);
    btnMat.addEventListener('click', (e) => {
      e.stopPropagation();
      matPanel.style.display = matPanel.style.display === 'none' ? 'block' : 'none';
    });

    // Bouton poids de rig (weight paint)
    const skinnedMeshes = [];
    model.traverse(c => { if (c.isSkinnedMesh) skinnedMeshes.push(c); });

    const btnWeight = document.createElement('button');
    btnWeight.textContent = '⚖';
    btnWeight.title = 'Poids de rig';
    btnWeight.style.cssText = btnStyle;

    const weightPanel = document.createElement('div');
    weightPanel.style.cssText = 'display:none;position:absolute;bottom:100%;left:0;margin-bottom:4px;background:rgba(0,0,0,.9);color:#fff;border-radius:4px;padding:6px 8px;font:10px monospace;white-space:nowrap;z-index:30;pointer-events:auto;max-height:260px;overflow-y:auto;min-width:200px;';
    wrap.appendChild(weightPanel);

    if (skinnedMeshes.length > 0) {
      const skeleton = skinnedMeshes[0].skeleton;
      const origMaterials = new Map();
      skinnedMeshes.forEach(m => origMaterials.set(m, Array.isArray(m.material) ? [...m.material] : m.material));

      function heatColor(w) {
        // Bleu(0) → Cyan → Vert(0.5) → Jaune → Rouge(1)
        const t = Math.max(0, Math.min(1, w));
        const r = t < 0.5 ? 0 : (t - 0.5) * 2;
        const g = t < 0.25 ? t * 4 : t < 0.75 ? 1 : (1 - t) * 4;
        const b = t < 0.5 ? 1 - t * 2 : 0;
        return [r, g, b];
      }

      function paintBone(boneIdx) {
        skinnedMeshes.forEach(mesh => {
          const geo = mesh.geometry;
          const si  = geo.attributes.skinIndex;
          const sw  = geo.attributes.skinWeight;
          if (!si || !sw) return;
          const n = geo.attributes.position.count;
          const cols = new Float32Array(n * 3);
          for (let i = 0; i < n; i++) {
            let w = 0;
            for (let j = 0; j < 4; j++) {
              if (si.getComponent(i, j) === boneIdx) { w = sw.getComponent(i, j); break; }
            }
            const [r, g, b] = heatColor(w);
            cols[i * 3] = r; cols[i * 3 + 1] = g; cols[i * 3 + 2] = b;
          }
          geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
          geo.attributes.color.needsUpdate = true;
          mesh.material = new THREE.MeshBasicMaterial({ vertexColors: true });
        });
        requestRender();
      }

      function resetWeights() {
        skinnedMeshes.forEach(m => { m.material = origMaterials.get(m); });
        skinnedMeshes.forEach(m => { if (m.geometry.attributes.color) { delete m.geometry.attributes.color; } });
        requestRender();
      }

      // Ligne reset
      const resetRow = document.createElement('div');
      resetRow.style.cssText = 'padding:2px 0 4px;border-bottom:1px solid rgba(255,255,255,.2);margin-bottom:3px;cursor:pointer;color:#fa0;';
      resetRow.textContent = '↩ reset matériaux';
      resetRow.addEventListener('click', (e) => { e.stopPropagation(); resetWeights(); });
      weightPanel.appendChild(resetRow);

      // Panneau rotation (partagé, réutilisé par chaque bone)
      const rotPanel = document.createElement('div');
      rotPanel.style.cssText = 'display:none;background:rgba(30,30,30,.95);border-top:1px solid rgba(255,255,255,.15);padding:5px 4px 3px;margin-top:2px;';
      weightPanel.appendChild(rotPanel);

      let activeBoneForRot = null;
      const DEG = Math.PI / 180;

      function openRotPanel(bone) {
        activeBoneForRot = bone;
        rotPanel.innerHTML = '';
        rotPanel.style.display = 'block';

        const title = document.createElement('div');
        title.style.cssText = 'color:#aef;margin-bottom:4px;font-size:9px;';
        title.textContent = `↻ ${bone.name}`;
        rotPanel.appendChild(title);

        ['x', 'y', 'z'].forEach((axis, ai) => {
          const colors = ['#f66', '#6f6', '#68f'];
          const row = document.createElement('div');
          row.style.cssText = 'display:flex;align-items:center;gap:4px;margin-bottom:3px;';

          const lbl = document.createElement('span');
          lbl.style.cssText = `color:${colors[ai]};width:10px;flex-shrink:0;font-weight:bold;`;
          lbl.textContent = axis.toUpperCase();

          const slider = document.createElement('input');
          slider.type = 'range';
          slider.min = -180; slider.max = 180; slider.step = 1;
          slider.value = Math.round(bone.rotation[axis] / DEG);
          slider.style.cssText = 'flex:1;cursor:pointer;accent-color:' + colors[ai] + ';';

          const val = document.createElement('span');
          val.style.cssText = 'width:36px;text-align:right;flex-shrink:0;';
          val.textContent = slider.value + '°';

          const resetBtn = document.createElement('button');
          resetBtn.textContent = '0';
          resetBtn.style.cssText = 'background:none;border:1px solid rgba(255,255,255,.2);color:#aaa;border-radius:2px;padding:0 3px;cursor:pointer;font-size:9px;flex-shrink:0;';
          resetBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            bone.rotation[axis] = 0;
            slider.value = 0;
            val.textContent = '0°';
            requestRender();
          });

          slider.addEventListener('input', (e) => {
            e.stopPropagation();
            bone.rotation[axis] = parseFloat(slider.value) * DEG;
            val.textContent = slider.value + '°';
            requestRender();
          });
          slider.addEventListener('click', e => e.stopPropagation());

          row.append(lbl, slider, val, resetBtn);
          rotPanel.appendChild(row);
        });

        // Bouton reset total pour ce bone
        const resetAll = document.createElement('button');
        resetAll.textContent = '↩ reset bone';
        resetAll.style.cssText = 'margin-top:2px;width:100%;background:rgba(255,100,0,.2);border:none;color:#fa0;border-radius:2px;padding:2px 0;cursor:pointer;font:9px monospace;';
        resetAll.addEventListener('click', (e) => {
          e.stopPropagation();
          bone.rotation.set(0, 0, 0);
          openRotPanel(bone); // rafraîchit les sliders
          requestRender();
        });
        rotPanel.appendChild(resetAll);
      }

      // Liste de bones
      skeleton.bones.forEach((bone, idx) => {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:3px;padding:1px 0;border-bottom:1px solid rgba(255,255,255,.05);';

        const nameLbl = document.createElement('span');
        nameLbl.style.cssText = 'flex:1;cursor:pointer;overflow:hidden;text-overflow:ellipsis;';
        nameLbl.textContent = `${idx.toString().padStart(2,' ')}  ${bone.name}`;
        nameLbl.title = bone.name;
        nameLbl.addEventListener('mouseenter', () => { row.style.background = 'rgba(255,255,255,.08)'; });
        nameLbl.addEventListener('mouseleave', () => { row.style.background = ''; });
        nameLbl.addEventListener('click', (e) => { e.stopPropagation(); paintBone(idx); });

        const rotBtn = document.createElement('button');
        rotBtn.textContent = '↻';
        rotBtn.title = 'Rotation';
        rotBtn.style.cssText = 'background:none;border:1px solid rgba(255,255,255,.2);color:#aef;border-radius:2px;padding:0 3px;cursor:pointer;font-size:10px;flex-shrink:0;';
        rotBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (activeBoneForRot === bone && rotPanel.style.display !== 'none') {
            rotPanel.style.display = 'none';
            activeBoneForRot = null;
          } else {
            openRotPanel(bone);
          }
        });

        row.append(nameLbl, rotBtn);
        weightPanel.insertBefore(row, rotPanel);
      });
    } else {
      weightPanel.textContent = 'Pas de SkinnedMesh';
    }

    btnWeight.addEventListener('click', (e) => {
      e.stopPropagation();
      weightPanel.style.display = weightPanel.style.display === 'none' ? 'block' : 'none';
      matPanel.style.display = 'none';
    });

    // Bouton animation native
    if (gltf.animations?.length > 0) {
      const mixer = new THREE.AnimationMixer(model);
      const actions = gltf.animations.map(clip => mixer.clipAction(clip));
      let playing = false;
      const btnAnim = document.createElement('button');
      btnAnim.textContent = '▶';
      btnAnim.title = `${gltf.animations.length} animation(s)`;
      btnAnim.style.cssText = btnStyle;
      btnAnim.addEventListener('click', () => {
        playing = !playing;
        if (playing) {
          actions.forEach(a => a.reset().play());
          _galleryMixers.push(mixer);
          btnAnim.textContent = '⏹';
          requestRender();
        } else {
          actions.forEach(a => a.stop());
          const idx = _galleryMixers.indexOf(mixer);
          if (idx !== -1) _galleryMixers.splice(idx, 1);
          btnAnim.textContent = '▶';
        }
      });
      wrap.append(span, btn, btnMat, btnWeight, btnAnim);
    } else if (danceCtrl) {
      // Bouton danse procédurale
      const btnDance = document.createElement('button');
      btnDance.textContent = '💃';
      btnDance.title = 'Danse procédurale';
      btnDance.style.cssText = btnStyle + 'opacity:0.45;';
      btnDance.addEventListener('click', () => {
        const on = danceCtrl.toggle();
        btnDance.style.opacity = on ? '1' : '0.45';
        if (!on) requestRender();
      });
      wrap.append(span, btn, btnMat, btnWeight, btnDance);
    } else {
      wrap.append(span, btn, btnMat, btnWeight);
    }

    const obj = new CSS2DObject(wrap);
    obj.position.set(
      (topBox.min.x + topBox.max.x) / 2,
      topBox.max.y + 3,
      (topBox.min.z + topBox.max.z) / 2,
    );
    scene.add(obj);
  }

  // =============================================
  // GALERIE — personnages alignés par rangées au fond du jardin
  // Rangée 1 (Z=-370) : 11 Lara/Jill
  // Rangées 2-5 (Z=-430…-610) : 34 nouveaux modèles, ~9 par rangée
  // =============================================
  function spawnRow(files, zBack, cx, spacing = 90) {
    const filtered = HIDE_LARA ? files.filter(f => !f.includes('lara')) : files;
    const SPACING = spacing;
    const startX = cx - (filtered.length - 1) * SPACING / 2;
    filtered.forEach((file, i) => {
      const xPos = startX + i * SPACING;
      gltfLoader.load(`media/${file}`, (gltf) => {
        if (gltf.animations?.length > 0) return; // dans la rangée anim dédiée
        const model = gltf.scene;
        const rawBox = new THREE.Box3().setFromObject(model);
        const rawSize = rawBox.getSize(new THREE.Vector3());
        model.scale.setScalar(170 / Math.max(rawSize.x, rawSize.y, rawSize.z));
        model.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(model);
        model.position.set(
          xPos - (box.min.x + box.max.x) / 2,
          -box.min.y,
          zBack - (box.min.z + box.max.z) / 2,
        );
        model.traverse(c => {
          c.layers.set(LAYER_GLB);
          if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; }
        });
        scene.add(model);
        const danceCtrl = attachDance(model, i * 0.7);
        if (danceCtrl) danceCtrl.stop(); // démarre arrêté
        addGalleryUI(model, gltf, file, danceCtrl);
        requestRender();
      }, undefined, err => console.error(`${file}:`, err));
    });
  }

  // Rangées décalées en X (−120, −60, 0, +60, +120 autour de X=150)
  // Lara statique rouge à X=0 → lara_new_rigged à X=200 → lara_croft à X=400 → lara_2026 à X=600 (écart 2m)
  spawnRow([
    'lara_new_rigged.glb',
    'lara_croft.glb',
    'lara_croft__2026_rigged.glb',
  ], -265, 400, 200);


}
