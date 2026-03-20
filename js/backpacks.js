import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { LAYER_FURNITURE } from './config.js';

// =============================================
// SAC À DOS TEMU "LIVING TRAVELING SHARE"
// Roll-top backpack rouge
// Taille S : 34×39×15cm (devant 29cm)
// Taille L : 40×43×17cm (devant 32cm)
// =============================================

const _bag = new THREE.MeshStandardMaterial({
  color: 0xcc0000, roughness: 0.83, metalness: 0.0,
});
const _bagDark = new THREE.MeshStandardMaterial({
  color: 0xaa0000, roughness: 0.88, metalness: 0.0,
});
const _buck = new THREE.MeshStandardMaterial({
  color: 0x1a1a1a, roughness: 0.5, metalness: 0.35,
});
const _silver = new THREE.MeshStandardMaterial({
  color: 0x9a9a9a, roughness: 0.25, metalness: 0.9,
});
const _label = new THREE.MeshStandardMaterial({
  color: 0x0e0e0e, roughness: 0.8,
});

// W=front width, H=total height, D=depth
function buildBag(W, H, D) {
  const bag = new THREE.Group();

  const FLAP_H = H * 0.21;   // fold-over flap (~21% height)
  const BODY_H = H - FLAP_H; // main body height

  // ─────────────────────────────────────
  // CORPS PRINCIPAL
  // ─────────────────────────────────────
  const body = new THREE.Mesh(
    new RoundedBoxGeometry(W, BODY_H, D, 4, 1.2),
    _bag,
  );
  body.position.set(0, BODY_H / 2, 0);
  body.castShadow = true;
  body.receiveShadow = true;
  bag.add(body);

  // ─────────────────────────────────────
  // RABAT ROLL-TOP (dépasse légèrement en avant et sur les côtés)
  // ─────────────────────────────────────
  const flap = new THREE.Mesh(
    new RoundedBoxGeometry(W + 2, FLAP_H, D + 0.8, 4, 1.2),
    _bag,
  );
  flap.position.set(0, BODY_H + FLAP_H / 2, 0.4);
  flap.castShadow = true;
  bag.add(flap);

  // Couture entre corps et rabat
  const seam = new THREE.Mesh(
    new THREE.BoxGeometry(W + 2.5, 0.9, D + 1.2),
    _bagDark,
  );
  seam.position.set(0, BODY_H, 0.4);
  bag.add(seam);

  // ─────────────────────────────────────
  // GRANDE POCHE FRONTALE zippée
  // ─────────────────────────────────────
  const PW = W * 0.82;
  const PH = BODY_H * 0.43;
  const PY = BODY_H * 0.07 + PH / 2;
  const PZ = D / 2 + 0.5;

  const pocket = new THREE.Mesh(
    new RoundedBoxGeometry(PW, PH, 2.0, 4, 0.7),
    _bag,
  );
  pocket.position.set(0, PY, PZ);
  pocket.castShadow = true;
  bag.add(pocket);

  // Liseré de fermeture éclair (couture haut de poche)
  const zipLine = new THREE.Mesh(
    new THREE.BoxGeometry(PW, 0.7, 0.4),
    _bagDark,
  );
  zipLine.position.set(0, PY + PH / 2 - 0.2, D / 2 + 1.55);
  bag.add(zipLine);

  // Tirette zip (argent)
  const zipPull = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 1.4, 0.8),
    _silver,
  );
  zipPull.position.set(-PW / 2 + 3.5, PY + PH / 2 + 0.2, D / 2 + 1.7);
  bag.add(zipPull);

  // Étiquette "LIVING TRAVELING SHARE"
  const lbl = new THREE.Mesh(
    new THREE.BoxGeometry(8.5, 5.5, 0.5),
    _label,
  );
  lbl.position.set(W * 0.1, PY - PH * 0.22, D / 2 + 2.1);
  bag.add(lbl);

  // ─────────────────────────────────────
  // POCHES LATÉRALES (ouvertes, faibles relief)
  // ─────────────────────────────────────
  const SPW = D * 0.55; // largeur avant→arrière de la poche
  const SPH = BODY_H * 0.32;
  const SPT = 2.5;

  for (const s of [-1, 1]) {
    const sp = new THREE.Mesh(
      new RoundedBoxGeometry(SPW, SPH, SPT, 3, 0.6),
      _bag,
    );
    sp.position.set(s * (W / 2 + SPT / 2 - 0.4), SPH / 2 + BODY_H * 0.06, 0);
    sp.castShadow = true;
    bag.add(sp);
  }

  // ─────────────────────────────────────
  // POIGNÉES PORTATIVES (boucle en tissu)
  // ─────────────────────────────────────
  const HW = 2.8;  // largeur sangle
  const HT = 0.9;  // épaisseur sangle
  const HLEN = 11; // longueur verticale
  const HGAP = W * 0.17; // espacement entre les deux sangles

  for (const s of [-1, 1]) {
    // Montant vertical
    const hv = new THREE.Mesh(
      new RoundedBoxGeometry(HW, HLEN, HT, 2, 0.3),
      _bag,
    );
    hv.rotation.z = -s * 0.06; // légère inclinaison vers le centre
    hv.position.set(s * HGAP, H + HLEN / 2 - FLAP_H * 0.3, D / 2 - D * 0.18);
    bag.add(hv);
  }

  // Arc horizontal reliant les deux poignées au sommet
  const hTop = new THREE.Mesh(
    new RoundedBoxGeometry(HGAP * 2 + HW, HW, HT, 2, 0.3),
    _bag,
  );
  hTop.position.set(0, H + HLEN - FLAP_H * 0.28, D / 2 - D * 0.18);
  bag.add(hTop);

  // Boucle de suspension centrale (dos, tout en haut)
  const loop = new THREE.Mesh(
    new RoundedBoxGeometry(3.5, 5, HT, 2, 0.3),
    _bag,
  );
  loop.position.set(0, H + 2.5, -(D / 2) + HT * 0.5);
  bag.add(loop);

  // ─────────────────────────────────────
  // SANGLE CENTRALE + BOUCLE CLIP
  // ─────────────────────────────────────
  const SW = 3.5;
  const SLEN = FLAP_H * 0.65;

  const buckStrap = new THREE.Mesh(
    new THREE.BoxGeometry(SW, SLEN, HT),
    _bag,
  );
  buckStrap.position.set(0, BODY_H + FLAP_H * 0.06 + SLEN / 2, D / 2 + 0.6);
  bag.add(buckStrap);

  // Corps de la boucle clip (plastique noir)
  const bW = 6.5, bH = 3.8, bD = 2.2;
  const buckle = new THREE.Mesh(
    new THREE.BoxGeometry(bW, bH, bD),
    _buck,
  );
  buckle.position.set(0, BODY_H + FLAP_H * 0.06 + SLEN + bH / 2, D / 2 + 0.5);
  bag.add(buckle);

  // Fente centrale de la boucle
  const bSlot = new THREE.Mesh(
    new THREE.BoxGeometry(bW * 0.5, bH * 0.35, bD * 0.6),
    new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.7 }),
  );
  bSlot.position.copy(buckle.position);
  bag.add(bSlot);

  // ─────────────────────────────────────
  // BRETELLES DOS (rembourrées, larges)
  // ─────────────────────────────────────
  const SSW = 4.8;
  const SST = 1.8;
  const SSSp = W * 0.22;
  const SS_TOP_Y = H * 0.88;
  const SS_BOT_Y = 2.5;

  for (const s of [-1, 1]) {
    const ssH = SS_TOP_Y - SS_BOT_Y;

    // Sangle principale
    const ss = new THREE.Mesh(
      new RoundedBoxGeometry(SSW, ssH, SST, 4, 0.5),
      _bag,
    );
    ss.position.set(s * SSSp, SS_BOT_Y + ssH / 2, -(D / 2) + SST / 2);
    ss.castShadow = true;
    bag.add(ss);

    // Striure de rembourrage (texture légère — bandes horizontales)
    for (let i = 0; i < 4; i++) {
      const rib = new THREE.Mesh(
        new THREE.BoxGeometry(SSW + 0.4, 0.5, SST + 0.2),
        _bagDark,
      );
      rib.position.set(s * SSSp, SS_BOT_Y + ssH * (0.2 + i * 0.2), -(D / 2) + SST / 2);
      bag.add(rib);
    }

    // Curseur de réglage (argent, milieu de la bretelle)
    const slider = new THREE.Mesh(
      new THREE.BoxGeometry(SSW + 1.5, 1.8, SST + 0.6),
      _silver,
    );
    slider.position.set(s * SSSp, SS_BOT_Y + ssH * 0.6, -(D / 2) + SST / 2);
    bag.add(slider);

    // D-ring / boucle bas (plastique noir)
    const dRing = new THREE.Mesh(
      new THREE.BoxGeometry(SSW + 1.5, 3.2, 3),
      _buck,
    );
    dRing.position.set(s * SSSp, SS_BOT_Y - 1, -(D / 2) + 0.5);
    bag.add(dRing);
  }

  // ─────────────────────────────────────
  // FERMETURE ÉCLAIR LATÉRALE (côté droit, vue de côté)
  // ─────────────────────────────────────
  {
    const szH = BODY_H * 0.55;
    const szY = BODY_H * 0.2 + szH / 2;
    const szLine = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, szH, 0.4),
      _bagDark,
    );
    szLine.position.set(W / 2 + 0.3, szY, 0);
    bag.add(szLine);

    const szPull = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 1.5, 0.8),
      _silver,
    );
    szPull.position.set(W / 2 + 0.5, szY + szH / 2 - 2, 0);
    bag.add(szPull);
  }

  return bag;
}

export function buildBackpacks(scene) {
  // Taille S : 34×39×15cm — corps W=29, H=39, D=15
  const bagS = buildBag(29, 39, 15);
  bagS.traverse(c => { if (c.isMesh) c.layers.set(LAYER_FURNITURE); });
  bagS.position.set(175, 17, 75);  // sur le lit (surface matelas ≈ Y=17)
  scene.add(bagS);

  // Taille L : 40×43×17cm — corps W=32, H=43, D=17
  const bagL = buildBag(32, 43, 17);
  bagL.traverse(c => { if (c.isMesh) c.layers.set(LAYER_FURNITURE); });
  bagL.position.set(210, 17, 75);  // sur le lit, à côté du S
  scene.add(bagL);
}
