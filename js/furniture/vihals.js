// Chaise pliante IKEA VIHALS — procédurale, position dépliée
// 43 × 47 × 80 cm  —  assise 39 × 41 × 45 cm
// https://www.ikea.com/fr/fr/p/vihals-chaise-pliante-vert-00592752/
import * as THREE from 'three';

const W  = 43;   // largeur totale
const SW = 39;   // largeur assise
const H  = 80;   // hauteur totale
const SY = 45;   // hauteur assise
const TR = 1.1;  // rayon tube acier

// ── Positions clés côté droit (plan YZ, z=0 face avant du groupe) ──────────
//   Vue de côté :
//
//   y=79  backrest_top  z=40
//          \
//   y=45    D──────── seat_back (z=29)  →  assise (panneau)
//           |
//   y=45  seat_front z=7
//           |
//   y=27  PIVOT  z=23
//         / \
//   A  /     \ C
//     /         \
//   y=0  z=3   z=44
//   pied avant  pied arrière

const PIVOT_Z = 23;
const PIVOT_Y = 27;

// Extrémités des 4 segments (format [z, y])
const FRONT_FOOT  = [3,  0 ];
const BACK_FOOT   = [44, 0 ];
const SEAT_FRONT  = [7,  SY];   // extrémité segment B (jambe avant haute)
const BACKREST_TOP= [40, H-1];  // extrémité segment D (montant dossier)

// Seat back rail : sur segment D à hauteur SY
// Segment D : (PIVOT_Z, PIVOT_Y) → (BACKREST_TOP[0], BACKREST_TOP[1])
const seatBackZ = PIVOT_Z + (BACKREST_TOP[0] - PIVOT_Z) * (SY - PIVOT_Y) / (BACKREST_TOP[1] - PIVOT_Y);
// ≈ 23 + 17 * 18/52 ≈ 28.9

function mkTube(ax, ay, az, bx, by, bz, r, mat) {
  const a = new THREE.Vector3(ax, ay, az);
  const b = new THREE.Vector3(bx, by, bz);
  const d = new THREE.Vector3().subVectors(b, a);
  const l = d.length();
  if (l < 0.3) return null;
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, l, 8, 1), mat);
  m.castShadow = true;
  m.position.copy(a).addScaledVector(d.normalize(), l / 2);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  return m;
}

export function buildVihals(scene, cx = 0, cz = 0, rotY = 0, color = 0xcc2222) {
  const fMat = new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.65 });
  const sMat = new THREE.MeshStandardMaterial({ color, roughness: 0.75 });

  const root = new THREE.Group();
  root.rotation.y = rotY;
  root.position.set(cx, 0, cz);
  scene.add(root);

  // ── Montants par côté gauche/droit ────────────────────────
  for (const x of [-W / 2, W / 2]) {
    const add = (t) => { if (t) { t.castShadow = true; root.add(t); } };

    // A : pied avant → pivot
    add(mkTube(x, FRONT_FOOT[1], FRONT_FOOT[0],
               x, PIVOT_Y,       PIVOT_Z,       TR, fMat));

    // B : pivot → rail assise avant (revient vers l'avant)
    add(mkTube(x, PIVOT_Y,     PIVOT_Z,
               x, SEAT_FRONT[1], SEAT_FRONT[0], TR, fMat));

    // C : pied arrière → pivot
    add(mkTube(x, BACK_FOOT[1], BACK_FOOT[0],
               x, PIVOT_Y,      PIVOT_Z,        TR, fMat));

    // D : pivot → sommet dossier
    add(mkTube(x, PIVOT_Y,        PIVOT_Z,
               x, BACKREST_TOP[1], BACKREST_TOP[0], TR, fMat));

    // Embouts pieds
    for (const [z, y] of [FRONT_FOOT, BACK_FOOT]) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(TR * 1.4, 8, 5), fMat);
      m.position.set(x, y, z);
      root.add(m);
    }
  }

  // ── Barres horizontales (gauche ↔ droite) ─────────────────
  const hbar = (y, z, hw) => {
    const t = mkTube(-hw, y, z, hw, y, z, TR, fMat);
    if (t) root.add(t);
  };
  hbar(0,              FRONT_FOOT[0],  W  / 2);  // barre pied avant
  hbar(0,              BACK_FOOT[0],   W  / 2);  // barre pied arrière
  hbar(SY,             SEAT_FRONT[0],  SW / 2);  // rail assise avant
  hbar(SY,             seatBackZ,      SW / 2);  // rail assise arrière
  hbar(BACKREST_TOP[1],BACKREST_TOP[0],SW / 2);  // barre sommet dossier
  // Barre mi-dossier (à mi-hauteur entre pivot et sommet)
  const midDY = PIVOT_Y + (BACKREST_TOP[1] - PIVOT_Y) * 0.45;
  const midDZ = PIVOT_Z + (BACKREST_TOP[0] - PIVOT_Z) * 0.45;
  hbar(midDY, midDZ, SW / 2);

  // Boulons de pivot
  for (const x of [-W / 2, W / 2]) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(TR * 2, 8, 5), fMat);
    m.position.set(x, PIVOT_Y, PIVOT_Z);
    root.add(m);
  }

  // ── Assise ────────────────────────────────────────────────
  // Panneau polypro qui dépasse légèrement les rails
  {
    const depth = BACK_FOOT[0] - FRONT_FOOT[0] - 4;  // ≈ 37 cm (légèrement moins que 41 pour ne pas dépasser les pieds)
    const centerZ = (SEAT_FRONT[0] + BACK_FOOT[0] - 2) / 2;  // centré entre rail avant et pied arrière
    const m = new THREE.Mesh(new THREE.BoxGeometry(SW, 2, depth), sMat);
    m.castShadow = true; m.receiveShadow = true;
    m.position.set(0, SY + 1, centerZ);
    root.add(m);
  }

  // ── Dossier ───────────────────────────────────────────────
  // Panneau entre le rail assise arrière et le sommet dossier, dans le plan du segment D
  {
    // Vecteur du segment D (direction du montant dossier)
    const dz = BACKREST_TOP[0] - PIVOT_Z;  // 17
    const dy = BACKREST_TOP[1] - PIVOT_Y;  // 52
    const len = Math.sqrt(dz * dz + dy * dy);
    const angle = Math.atan2(dz, dy);  // inclinaison en X (autour de X)

    // Hauteur utile du panneau : du rail assise-arrière au sommet dossier
    const startFrac = (SY - PIVOT_Y) / dy;  // ≈ 18/52
    const backH = len * (1 - startFrac);     // portion au-dessus du rail
    const backCenterFrac = startFrac + (1 - startFrac) / 2;
    const backCZ = PIVOT_Z + dz * backCenterFrac;
    const backCY = PIVOT_Y + dy * backCenterFrac;

    const m = new THREE.Mesh(new THREE.BoxGeometry(SW - 2, backH, 2), sMat);
    m.castShadow = true; m.receiveShadow = true;
    m.position.set(0, backCY, backCZ);
    m.rotation.x = angle;    // inclinaison du dossier selon segment D (vers l'arrière)
    root.add(m);
  }

  return root;
}
