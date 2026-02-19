import * as THREE from 'three';


function addBollsidan(scene, px, pz, rot, height) {
  const DESK_W = 6;
  const DESK_D = 3.7;
  const TOP_T = 0.25;
  const LEG_R = 0.15;

  const wMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.35 });
  const legMat = new THREE.MeshStandardMaterial({ color: 0xe0e0e0, metalness: 0.3, roughness: 0.3 });

  const deskGroup = new THREE.Group();
  deskGroup.position.set(px, 0, pz);
  deskGroup.rotation.y = rot;

  // Plateau
  const top = new THREE.Mesh(
    new THREE.BoxGeometry(DESK_W, TOP_T, DESK_D),
    wMat
  );
  top.position.set(0, height, 0);
  top.castShadow = true;
  top.receiveShadow = true;
  deskGroup.add(top);

  // Colonne excentrée
  const legOffsetX = -DESK_W / 2 + 0.5;
  const colH = height - 0.3;
  const col = new THREE.Mesh(
    new THREE.CylinderGeometry(LEG_R, LEG_R * 1.2, colH, 8),
    legMat
  );
  col.position.set(legOffsetX, colH / 2 + 0.3, 0);
  deskGroup.add(col);

  // Base en C
  const baseH = 0.25;
  const baseL = DESK_W - 0.5;
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(baseL, baseH, 0.4),
    legMat
  );
  base.position.set(legOffsetX + baseL / 2, baseH / 2, 0);
  base.castShadow = true;
  deskGroup.add(base);

  // Pieds stabilisateurs
  const footGeo = new THREE.BoxGeometry(0.3, 0.12, 2.0);
  const foot1 = new THREE.Mesh(footGeo, legMat);
  foot1.position.set(legOffsetX, 0.06, 0);
  deskGroup.add(foot1);
  const foot2 = new THREE.Mesh(footGeo, legMat);
  foot2.position.set(legOffsetX + baseL, 0.06, 0);
  deskGroup.add(foot2);

  scene.add(deskGroup);
}

export function buildDesks(scene) {
  addBollsidan(scene, 2.2, 6.8, -Math.PI / 2, 7.2);
  addBollsidan(scene, 22, 17, 0, 5.5);
}
