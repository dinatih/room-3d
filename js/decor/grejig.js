import * as THREE from 'three';
import { LAYER_FURNITURE, KITCHEN_X1, DOOR_START, ROOM_D } from '../config.js';

// IKEA GREJIG — étagère à chaussures 60×22×50cm, métal gris
// 3 niveaux, cadre tubulaire, barres transversales
// Placée dos au mur D, centrée sur les 2 paires de sneakers (X≈162)

const W  = 60;   // largeur (X)
const D  = 22;   // profondeur (Z)
const H  = 50;   // hauteur totale
const TR = 0.4;  // rayon tube (fil métal fin)

// 3 niveaux : sol+3cm, 19cm, 35cm
const SHELF_YS = [3, 19, 35];

export function buildGrejig(scene) {
  const g = new THREE.Group();

  const mat = new THREE.MeshStandardMaterial({
    color: 0x888888, roughness: 0.4, metalness: 0.7,
  });

  function tube(x1, y1, z1, x2, y2, z2) {
    const dx = x2 - x1, dy = y2 - y1, dz = z2 - z1;
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (len < 0.01) return;
    const geo = new THREE.CylinderGeometry(TR, TR, len, 6);
    const m = new THREE.Mesh(geo, mat);
    m.position.set((x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2);
    m.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(dx, dy, dz).normalize(),
    );
    m.castShadow = true;
    g.add(m);
  }

  // ── 4 montants verticaux ──────────────────────────────────────
  tube(TR,     0, TR,     TR,     H, TR    );  // avant-gauche
  tube(W - TR, 0, TR,     W - TR, H, TR    );  // avant-droit
  tube(TR,     0, D - TR, TR,     H, D - TR);  // arrière-gauche
  tube(W - TR, 0, D - TR, W - TR, H, D - TR);  // arrière-droit

  // ── Cadre de pied (bas) ───────────────────────────────────────
  tube(TR,     TR, TR,     W - TR, TR, TR    );  // avant
  tube(TR,     TR, D - TR, W - TR, TR, D - TR);  // arrière
  tube(TR,     TR, TR,     TR,     TR, D - TR);  // gauche
  tube(W - TR, TR, TR,     W - TR, TR, D - TR);  // droite

  // ── 3 niveaux d'étagère ───────────────────────────────────────
  for (const y of SHELF_YS) {
    // Cadre périmètre
    tube(TR,     y, TR,     W - TR, y, TR    );  // rail avant
    tube(TR,     y, D - TR, W - TR, y, D - TR);  // rail arrière
    tube(TR,     y, TR,     TR,     y, D - TR);  // rail gauche
    tube(W - TR, y, TR,     W - TR, y, D - TR);  // rail droit

    // Barres transversales (6 barres espacées)
    const N = 6;
    for (let k = 1; k < N; k++) {
      const x = TR + (W - 2 * TR) * k / N;
      tube(x, y, TR, x, y, D - TR);
    }
  }

  // ── Cadre supérieur ───────────────────────────────────────────
  tube(TR,     H, TR,     W - TR, H, TR    );
  tube(TR,     H, D - TR, W - TR, H, D - TR);
  tube(TR,     H, TR,     TR,     H, D - TR);
  tube(W - TR, H, TR,     W - TR, H, D - TR);

  // ── Placement ─────────────────────────────────────────────────
  // Dos au mur D (Z=400), centré sur les sneakers (X≈162)
  const MIRROR_CX = (KITCHEN_X1 + DOOR_START) / 2; // 160
  const cx = MIRROR_CX + 40 - 50 + 12;              // ≈ 162
  g.position.set(cx - W / 2, 0, ROOM_D - D);

  g.traverse(c => { if (c.isMesh) c.layers.set(LAYER_FURNITURE); });
  scene.add(g);
}
