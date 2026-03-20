import * as THREE from 'three';
import { LAYER_FURNITURE } from '../config.js';

// Dimensions version 4 layers (cm)
const W  = 60;   // largeur
const D  = 27;   // profondeur
const H  = 154;  // hauteur totale
const TR = 0.8;  // rayon tube

export function buildShoeHatRack(scene) {
  const g = new THREE.Group();

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a, roughness: 0.5, metalness: 0.8,
  });
  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0x7a7a7a, roughness: 0.95,
  });

  // Tube entre deux points quelconques
  function tube(x1, y1, z1, x2, y2, z2) {
    const dx = x2 - x1, dy = y2 - y1, dz = z2 - z1;
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (len < 0.01) return;
    const geo = new THREE.CylinderGeometry(TR, TR, len, 8);
    const m = new THREE.Mesh(geo, metalMat);
    m.position.set((x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2);
    m.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(dx, dy, dz).normalize(),
    );
    m.castShadow = true;
    g.add(m);
  }

  // === MONTANTS VERTICAUX ===
  // Avant : pleine hauteur
  tube(TR,   0, TR,   TR,   H,      TR);
  tube(W-TR, 0, TR,   W-TR, H,      TR);
  // Arrière : zone étagères seulement (~72cm)
  const H_BACK = 72;
  tube(TR,   0, D-TR, TR,   H_BACK, D-TR);
  tube(W-TR, 0, D-TR, W-TR, H_BACK, D-TR);

  // === CADRE BAS ===
  tube(TR,   TR, TR,   W-TR, TR,   TR);    // avant
  tube(TR,   TR, D-TR, W-TR, TR,   D-TR);  // arrière
  tube(TR,   TR, TR,   TR,   TR,   D-TR);  // gauche
  tube(W-TR, TR, TR,   W-TR, TR,   D-TR);  // droite

  // === 4 ÉTAGÈRES (Y = 5, 21, 37, 53 cm) ===
  const SHELF_YS = [5, 21, 37, 53];
  for (const y of SHELF_YS) {
    tube(TR,   y, TR,   W-TR, y,   TR);    // rail avant
    tube(TR,   y, D-TR, W-TR, y,   D-TR);  // rail arrière
    tube(TR,   y, TR,   TR,   y,   D-TR);  // rail gauche
    tube(W-TR, y, TR,   W-TR, y,   D-TR);  // rail droit

    // Plateau tissu
    const sg = new THREE.BoxGeometry(W - 2 * TR - 0.5, 1.5, D - 2 * TR - 0.5);
    const sm = new THREE.Mesh(sg, fabricMat);
    sm.position.set(W / 2, y + 0.75, D / 2);
    sm.castShadow = true;
    sm.receiveShadow = true;
    g.add(sm);
  }

  // === TRANSITION : relier haut des montants arrière aux avant ===
  tube(TR,   H_BACK, D-TR, TR,   H_BACK, TR);
  tube(W-TR, H_BACK, D-TR, W-TR, H_BACK, TR);

  // === SECTION PORTE-MANTEAUX / CHAPEAUX ===
  // Deux barres horizontales frontales portant les crochets
  const Y_MID = 105;
  const Y_TOP = 140;
  tube(TR, Y_MID, TR, W-TR, Y_MID, TR);
  tube(TR, Y_TOP, TR, W-TR, Y_TOP, TR);

  // Doubles crochets en J (4 positions par barre)
  // Les bras de crochet partent vers -Z (= vers l'avant, face accessible)
  const HOOK_XS = [W * 0.12, W * 0.37, W * 0.63, W * 0.88];

  function addDoubleHook(x, barY) {
    const POST_H = 7;  // hauteur du poteau au-dessus de la barre
    // Poteau vertical
    tube(x, barY, TR, x, barY + POST_H, TR);
    // Crochet haut : du sommet du poteau, en diagonale avant+haut
    tube(x, barY + POST_H,        TR, x, barY + POST_H + 4.5, TR + 5.5);
    // Crochet bas : à mi-poteau, plus court
    tube(x, barY + POST_H * 0.55, TR, x, barY + POST_H * 0.55 + 3, TR + 4);
  }

  for (const x of HOOK_XS) {
    addDoubleHook(x, Y_MID);
    addDoubleHook(x, Y_TOP);
  }

  // === PLACEMENT ===
  // Coin SE du séjour : dos contre mur B (X=300), largeur le long de Z vers mur D (Z=400)
  // rotation.y = -π/2 : local Z → world -X, local X → world +Z
  // back face (local Z=0) à X=300, front (local Z=27) à X=273, crochets vers X-
  g.rotation.y = -Math.PI / 2;
  g.position.set(300, 0, 340);

  g.traverse(c => {
    if (c.isMesh) c.layers.set(LAYER_FURNITURE);
  });

  scene.add(g);
}
