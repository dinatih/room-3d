// ============================================================
// VIHALS — Chaise pliante IKEA (procédurale)
// 43 × 47 × 80 cm, assise 39 × 41 × 45 cm
// Mécanisme : frameA (jambes avant) + frameB (jambes arrière + dossier)
//   pivotent autour d'un axe X au point (0, PIVOT_Y, 0) dans le groupe.
//   La géométrie est construite VERTICALE dans l'espace local de chaque frame ;
//   c'est la rotation X qui donne l'angle d'ouverture/fermeture.
// ============================================================
import * as THREE from 'three';

const W      = 43;    // largeur totale (cm)
const SW     = 39;    // largeur assise (cm)
const H      = 80;    // hauteur totale
const SEAT_H = 45;    // hauteur de l'assise
const BACK_H = 34;    // hauteur du dossier (cm, net)
const PY     = 27;    // hauteur du pivot dans la scène
const TR     = 1.1;   // rayon tube acier

// Longueurs des segments partant du pivot
const LEG_A  = SEAT_H;              // frameA descend jusqu'au sol : PY cm + surplus jusqu'à y=0
const LEG_BL = PY;                  // frameB descend PY cm jusqu'au sol
const LEG_BU = H - PY;              // frameB monte (H-PY) cm jusqu'au sommet dossier

// Angles (rotation X) pour les deux états
//   > 0 = le bas du frame bascule vers +Z (avant de la chaise dans l'espace local du root)
//   Quand ouvert :
//     frameA : le pied avant est à z = +sin(αA)*LEG_A ≈ +4 cm devant le pivot
//     frameB : le pied arrière est à z = -sin(αB)*LEG_BL ≈ -20 cm derrière le pivot
const alphaA_open  = Math.atan2(4,   LEG_A);   // ~5°, jambes avant quasi verticales
const alphaB_open  = Math.atan2(20,  LEG_BL);  // ~36°, jambes arrière bien inclinées
const alphaA_fold  = Math.atan2(0.5, LEG_A);   // quasi vertical replié
const alphaB_fold  = Math.atan2(4.5, LEG_BL);  // quasi vertical replié

function mkTube(a, b, r, mat) {
  const d = new THREE.Vector3().subVectors(b, a);
  const l = d.length();
  if (l < 0.5) return null;
  const g = new THREE.CylinderGeometry(r, r, l, 8, 1);
  const m = new THREE.Mesh(g, mat);
  m.castShadow = true;
  m.position.copy(a).addScaledVector(d.normalize(), l / 2);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  return m;
}
function mkBall(p, r, mat) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 5), mat);
  m.position.copy(p);
  return m;
}
function v3(x, y, z) { return new THREE.Vector3(x, y, z); }

export function buildVihals(scene, cx = 0, cz = 0, rotY = 0, color = 0xcc2222) {
  const frameMat = new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.65 });
  const seatMat  = new THREE.MeshStandardMaterial({ color, roughness: 0.75 });

  const root = new THREE.Group();
  root.rotation.y = rotY;
  root.position.set(cx, 0, cz);
  scene.add(root);

  // ── FRAME A : jambes avant ────────────────────────────────
  // Origine locale = pivot (y=PY dans root).
  // Géométrie verticale : jambes pointent vers -Y (sol), barre assise-avant à +SEAT_H-PY.
  // Rotation X positive → bas bascule vers +Z (avant).
  const frameA = new THREE.Group();
  frameA.position.set(0, PY, 0);
  {
    const xL = -W / 2, xR = W / 2;
    // Jambes (pivot → sol) : de y=0 à y=-PY (le sol est à PY cm sous le pivot)
    for (const x of [xL, xR]) {
      frameA.add(mkTube(v3(x, 0, 0), v3(x, -PY, 0), TR, frameMat));
      frameA.add(mkBall(v3(x, -PY, 0), TR * 1.3, frameMat));  // embout pied
    }
    // Barre de pied avant (relie les deux jambes)
    frameA.add(mkTube(v3(xL, -PY, 0), v3(xR, -PY, 0), TR, frameMat));
    // Barre assise-avant (au niveau de l'assise, y_local = SEAT_H - PY = 18)
    const ya = SEAT_H - PY;
    frameA.add(mkTube(v3(-SW / 2, ya, 0), v3(SW / 2, ya, 0), TR, frameMat));
  }
  root.add(frameA);

  // ── FRAME B : jambes arrière + dossier ────────────────────
  // Rotation X négative → bas bascule vers -Z (arrière).
  // Dossier incliné légèrement vers l'arrière : on le décale de 3 cm en -Z dans local frameB.
  const frameB = new THREE.Group();
  frameB.position.set(0, PY, 0);
  {
    const xL = -W / 2, xR = W / 2;
    for (const x of [xL, xR]) {
      // Jambe basse (pivot → sol arrière)
      frameB.add(mkTube(v3(x, 0, 0), v3(x, -LEG_BL, 0), TR, frameMat));
      frameB.add(mkBall(v3(x, -LEG_BL, 0), TR * 1.3, frameMat));
      // Montant dossier (pivot → sommet) — 3 cm décalé en -Z pour inclinaison naturelle
      frameB.add(mkTube(v3(x, 0, 0), v3(x, LEG_BU, -3), TR, frameMat));
    }
    // Barre pied arrière
    frameB.add(mkTube(v3(-W / 2, -LEG_BL, 0), v3(W / 2, -LEG_BL, 0), TR, frameMat));
    // Barre assise-arrière (y_local = SEAT_H - PY = 18)
    const ys = SEAT_H - PY;
    const zs = -3 * (ys / LEG_BU);   // proportionnel au décalage du dossier
    frameB.add(mkTube(v3(-SW / 2, ys, zs), v3(SW / 2, ys, zs), TR, frameMat));
    // Barres dossier : mi-hauteur et sommet
    const yt = LEG_BU;
    for (const frac of [0.45, 1.0]) {
      const yb = yt * frac, zb = -3 * frac;
      frameB.add(mkTube(v3(-SW / 2, yb, zb), v3(SW / 2, yb, zb), TR, frameMat));
    }
  }
  root.add(frameB);

  // ── Boulons de pivot ─────────────────────────────────────
  for (const x of [-W / 2, W / 2]) {
    root.add(mkBall(v3(x, PY, 0), TR * 1.9, frameMat));
  }

  // ── Panneaux (assise + dossier) ───────────────────────────
  // Reconstruits à chaque changement de foldT car leur position et taille varient.
  const panels = new THREE.Group();
  root.add(panels);

  function updatePanels(t) {
    while (panels.children.length) {
      const c = panels.children[0]; panels.remove(c); c.geometry?.dispose();
    }

    const angA = THREE.MathUtils.lerp(alphaA_open, alphaA_fold, t);
    const angB = THREE.MathUtils.lerp(alphaB_open, alphaB_fold, t);

    // Position monde (dans root) de la barre assise-avant (en y_local = SEAT_H-PY sur frameA)
    const ya = SEAT_H - PY;
    const sf_z =  PY * Math.sin(angA) + ya * Math.sin(angA); // approx
    // Plus précis : on calcule la position du point (0, ya, 0) après rotation angA de frameA
    // Rotation X de angA : y' = ya*cos(angA), z' = ya*sin(angA)
    const sf_y_r = PY + ya * Math.cos(angA);
    const sf_z_r =      ya * Math.sin(angA);

    // Position monde de la barre assise-arrière (y_local = ya sur frameB)
    const ys = ya;
    const zs_local = -3 * (ys / LEG_BU);
    // Rotation X de -angB : y' = ys*cos(-angB) + zs_local*sin(-angB), z' = -ys*sin(-angB) + zs_local*cos(-angB)
    const sb_y_r = PY + ys * Math.cos(angB) - zs_local * Math.sin(angB);
    const sb_z_r =    - ys * Math.sin(angB) - zs_local * Math.cos(angB);

    // Assise
    const seat_cy = (sf_y_r + sb_y_r) / 2 + 1;
    const seat_cz = (sf_z_r + sb_z_r) / 2;
    const seat_depth = Math.max(1, Math.abs(sb_z_r - sf_z_r));
    {
      const g = new THREE.BoxGeometry(SW - 2, 2, seat_depth);
      const m = new THREE.Mesh(g, seatMat);
      m.castShadow = true; m.receiveShadow = true;
      m.position.set(0, seat_cy, seat_cz);
      panels.add(m);
    }

    // Dossier — entre y=SEAT_H+2 et y=H-2 environ, suit frameB au-dessus du pivot
    // Centre en y : mi-hauteur entre assise et sommet dossier
    const yd_bot = SEAT_H + 2;
    const yd_top = H - 2;
    const yd_height = THREE.MathUtils.lerp(yd_top - yd_bot, 2, t);
    if (yd_height > 1) {
      // z du dossier : suit le montant de frameB, à mi-hauteur dossier
      const yd_mid_local = ((yd_bot + yd_top) / 2) - PY;
      const zd_local = -3 * (yd_mid_local / LEG_BU);
      const bd_y_r = PY + yd_mid_local * Math.cos(angB) - zd_local * Math.sin(angB);
      const bd_z_r =    - yd_mid_local * Math.sin(angB) - zd_local * Math.cos(angB);

      const g = new THREE.BoxGeometry(SW - 2, yd_height, 2);
      const m = new THREE.Mesh(g, seatMat);
      m.castShadow = true;
      m.position.set(0, bd_y_r, bd_z_r);
      m.rotation.x = THREE.MathUtils.lerp(0.1, 0, t); // légère inclinaison arrière
      panels.add(m);
    }
  }

  // ── Contrôle pliage ───────────────────────────────────────
  let currentT = 0;

  function setFold(t) {
    currentT = THREE.MathUtils.clamp(t, 0, 1);
    frameA.rotation.x =  THREE.MathUtils.lerp(alphaA_open, alphaA_fold, currentT);
    frameB.rotation.x = -THREE.MathUtils.lerp(alphaB_open, alphaB_fold, currentT);
    updatePanels(currentT);
  }

  setFold(0);

  root.userData.setFold  = setFold;
  root.userData.getFold  = () => currentT;
  root.userData.isFolded = () => currentT > 0.5;

  return root;
}
