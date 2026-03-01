import * as THREE from 'three';

// =============================================
// DRONA — Ported from Gemini kallax.html
// Geometry in cm
// =============================================

export class Drona {
  constructor(color = 0xcc0000, width = 33, height = 33, depth = 38) {
    this.group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 1 });
    const T = 0.5; // épaisseur paroi

    // Boîte creuse (5 faces, pas de dessus)
    // Fond
    const bottom = new THREE.Mesh(new THREE.BoxGeometry(width, T, depth), mat);
    bottom.position.y = -height / 2 + T / 2;
    this.group.add(bottom);

    // Face avant / arrière
    const fbGeo = new THREE.BoxGeometry(width, height - T, T);
    const front = new THREE.Mesh(fbGeo, mat);
    front.position.set(0, T / 2, depth / 2 - T / 2);
    front.castShadow = true;
    this.group.add(front);
    const back = new THREE.Mesh(fbGeo, mat);
    back.position.set(0, T / 2, -depth / 2 + T / 2);
    back.castShadow = true;
    this.group.add(back);

    // Côtés gauche / droit
    const sideGeo = new THREE.BoxGeometry(T, height - T, depth - T * 2);
    const left = new THREE.Mesh(sideGeo, mat);
    left.position.set(-width / 2 + T / 2, T / 2, 0);
    this.group.add(left);
    const right = new THREE.Mesh(sideGeo, mat);
    right.position.set(width / 2 - T / 2, T / 2, 0);
    this.group.add(right);

    // Languettes (toute la largeur, partent du haut)
    const handleH = 4;
    const handleGeo = new THREE.BoxGeometry(width, handleH, 0.5);
    const handleMat = new THREE.MeshStandardMaterial({ color, roughness: 0.8, emissive: 0x220000 });

    const hY = height / 2 - handleH / 2;
    const hZ = depth / 2 + 0.05;

    const hFront = new THREE.Mesh(handleGeo, handleMat);
    hFront.position.set(0, hY, hZ);
    this.group.add(hFront);

    const hBack = new THREE.Mesh(handleGeo, handleMat);
    hBack.position.set(0, hY, -hZ);
    this.group.add(hBack);
  }
}

/**
 * Add a single Drona at a cm position
 * @param {THREE.Scene|THREE.Group} parent
 * @param {number} cx - centre X (cm)
 * @param {number} cy - centre Y (cm)
 * @param {number} cz - centre Z (cm)
 * @param {number} w - width  (cm, default 33)
 * @param {number} h - height (cm, default 33)
 * @param {number} d - depth  (cm, default 38)
 */
export function addSingleDrona(parent, cx, cy, cz, w = 33, h = 33, d = 38, rotY = 0) {
  const drona = new Drona(0xcc0000, w, h, d);
  drona.group.position.set(cx, cy, cz);
  if (rotY) drona.group.rotation.y = rotY;
  parent.add(drona.group);
  return drona;
}
