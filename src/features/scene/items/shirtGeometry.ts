import * as THREE from 'three';

export const SHIRT_HALF_DEPTH = 1;

/** Contour commun des deux vêtements ; seul le rayon du bord-côte diffère. */
export function createShirtGeometry(collarRadius: number) {
  const HALF_D = SHIRT_HALF_DEPTH;
  const perimeter = [
    new THREE.Vector2(5.5, 13.5),    // 0: Encolure droite
    new THREE.Vector2(19.5, 4.5),    // 1: Pointe épaule droite
    new THREE.Vector2(26.0, 0.0),    // 2: Haut manche droite
    new THREE.Vector2(22.5, -11.0),  // 3: Bas manche droite (ouverture)
    new THREE.Vector2(18.5, -8.0),   // 4: Aisselle droite
    new THREE.Vector2(18.5, -42.0),  // 5: Bas droit
    new THREE.Vector2(0.0, -42.6),   // 6: Centre bas
    new THREE.Vector2(-18.5, -42.0), // 7: Bas gauche
    new THREE.Vector2(-18.5, -8.0),  // 8: Aisselle gauche
    new THREE.Vector2(-22.5, -11.0), // 9: Bas manche gauche (ouverture)
    new THREE.Vector2(-26.0, 0.0),   // 10: Haut manche gauche
    new THREE.Vector2(-19.5, 4.5),   // 11: Pointe épaule gauche
    new THREE.Vector2(-5.5, 13.5),   // 12: Encolure gauche
  ];
  const [frontGeometry, backGeometry] = [3.7, 0.7].map(depth => {
    const shape = new THREE.Shape();
    shape.moveTo(perimeter[0].x, perimeter[0].y);
    for (let i = 1; i < perimeter.length; i++) {
      shape.lineTo(perimeter[i].x, perimeter[i].y);
    }
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      const x = -5.5 + 11.0 * t;
      const y = 13.5 - depth * (1 - (x / 5.5) * (x / 5.5));
      shape.lineTo(x, y);
    }
    shape.closePath();
    return new THREE.ShapeGeometry(shape);
  });
  const positions: number[] = [];
  const indices: number[] = [];
  const uvs: number[] = [];

  for (let i = 0; i < perimeter.length; i++) {
    const p = perimeter[i];
    positions.push(p.x, p.y, HALF_D);
    positions.push(p.x, p.y, -HALF_D);
    uvs.push(i / (perimeter.length - 1), 1);
    uvs.push(i / (perimeter.length - 1), 0);
  }

  for (let i = 0; i < perimeter.length - 1; i++) {
    const a = 2 * i;
    const b = 2 * i + 1;
    const c = 2 * (i + 1);
    const d = 2 * (i + 1) + 1;
    indices.push(a, c, b);
    indices.push(b, c, d);
  }

  const sideGeometry = new THREE.BufferGeometry();
  sideGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  sideGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  sideGeometry.setIndex(indices);
  sideGeometry.computeVertexNormals();

  const collarPoints = [
    new THREE.Vector3(-5.5, 13.5, 0.0),
    new THREE.Vector3(-3.2, 10.8, HALF_D * 0.95),
    new THREE.Vector3(0.0, 9.8, HALF_D * 1.02),
    new THREE.Vector3(3.2, 10.8, HALF_D * 0.95),
    new THREE.Vector3(5.5, 13.5, 0.0),
    new THREE.Vector3(3.2, 13.0, -HALF_D * 0.95),
    new THREE.Vector3(0.0, 12.8, -HALF_D * 1.02),
    new THREE.Vector3(-3.2, 13.0, -HALF_D * 0.95),
  ];
  const curve = new THREE.CatmullRomCurve3(collarPoints, true);
  const collarGeometry = new THREE.TubeGeometry(curve, 36, collarRadius, 8, true);

  return { frontGeometry, backGeometry, sideGeometry, collarGeometry };
}
