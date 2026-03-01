import * as THREE from 'three';

// =============================================
// DRONA — Ported from Gemini kallax.html
// Geometry in cm
// =============================================

export class Drona {
  constructor(color = 0xcc0000, width = 33, height = 33, depth = 38) {
    this.group = new THREE.Group();
    const material = new THREE.MeshStandardMaterial({ color, roughness: 1 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
    body.castShadow = true;
    this.group.add(body);

    // Sangles horizontales (30cm de large, position haute)
    const handleW = width - 3; // proportional to body width
    const handleGeom = new THREE.BoxGeometry(handleW, 2.5, 0.5);
    const handleMat = new THREE.MeshStandardMaterial({ color, roughness: 0.8, emissive: 0x220000 });

    const posY = height / 2 - 3;
    const posZ = depth / 2 + 0.05;

    const hFront = new THREE.Mesh(handleGeom, handleMat);
    hFront.position.set(0, posY, posZ);
    this.group.add(hFront);

    const hBack = new THREE.Mesh(handleGeom, handleMat);
    hBack.position.set(0, posY, -posZ);
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
export function addSingleDrona(parent, cx, cy, cz, w = 33, h = 33, d = 38) {
  const drona = new Drona(0xcc0000, w, h, d);
  drona.group.position.set(cx, cy, cz);
  parent.add(drona.group);
  return drona;
}
