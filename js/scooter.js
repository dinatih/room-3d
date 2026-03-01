import * as THREE from "three";

export function buildScooter(scene) {
  const scootMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    roughness: 0.4,
    metalness: 0.3,
  });
  const wheelMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.6,
  });
  const gripMat = new THREE.MeshStandardMaterial({
    color: 0x333333,
    roughness: 0.8,
  });
  const scootAccentMat = new THREE.MeshStandardMaterial({
    color: 0xcc0000,
    roughness: 0.4,
  });

  const scootGroup = new THREE.Group();
  scootGroup.position.set(282, 0, 460);
  scootGroup.rotation.y = 0; // avant vers +Z (vers le couloir)

  const WHEEL_R = 5;
  const DECK_L = 55;
  const DECK_W = 15;
  const DECK_H = 2;
  const DECK_Y = WHEEL_R + 3;
  const STEM_H = 90;
  const STEM_R = 1.5;
  const HBAR_W = 47;
  const FRONT_Z = -DECK_L / 2 + 3;

  // Deck (plateforme)
  const deck = new THREE.Mesh(
    new THREE.BoxGeometry(DECK_W, DECK_H, DECK_L),
    scootMat,
  );
  deck.position.set(0, DECK_Y, 0);
  deck.castShadow = true;
  scootGroup.add(deck);

  // Grip antidérapant sur le deck
  const grip = new THREE.Mesh(
    new THREE.BoxGeometry(DECK_W - 1, 0.2, DECK_L - 6),
    gripMat,
  );
  grip.position.set(0, DECK_Y + DECK_H / 2 + 0.1, 0);
  scootGroup.add(grip);

  // Roue avant
  const wheelGeo = new THREE.CylinderGeometry(WHEEL_R, WHEEL_R, 3, 16);
  const frontWheel = new THREE.Mesh(wheelGeo, wheelMat);
  frontWheel.rotation.z = Math.PI / 2;
  frontWheel.position.set(0, WHEEL_R, FRONT_Z);
  scootGroup.add(frontWheel);

  // Roue arrière
  const rearWheel = new THREE.Mesh(wheelGeo, wheelMat);
  rearWheel.rotation.z = Math.PI / 2;
  rearWheel.position.set(0, WHEEL_R, DECK_L / 2 - 3);
  scootGroup.add(rearWheel);

  // Garde-boue arrière
  const fender = new THREE.Mesh(
    new THREE.BoxGeometry(4, 0.6, WHEEL_R * 1.5),
    scootMat,
  );
  fender.position.set(0, WHEEL_R * 1.6, DECK_L / 2 - 1);
  fender.rotation.x = -0.3;
  scootGroup.add(fender);

  // Fourche avant (2 tiges)
  for (const side of [-2, 2]) {
    const forkTube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 0.6, DECK_Y - WHEEL_R + 1, 6),
      scootMat,
    );
    forkTube.position.set(side, WHEEL_R + (DECK_Y - WHEEL_R) / 2, FRONT_Z);
    scootGroup.add(forkTube);
  }

  // Stem (tube de direction)
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(STEM_R, STEM_R, STEM_H, 8),
    scootMat,
  );
  stem.position.set(0, DECK_Y + STEM_H / 2, FRONT_Z);
  stem.castShadow = true;
  scootGroup.add(stem);

  // Guidon tourné à 45° vers la droite (group pivoté autour du stem)
  const hbarGroup = new THREE.Group();
  hbarGroup.position.set(0, DECK_Y + STEM_H, FRONT_Z);
  hbarGroup.rotation.y = -Math.PI / 4; // 45° vers la droite

  const handlebar = new THREE.Mesh(
    new THREE.CylinderGeometry(STEM_R * 0.8, STEM_R * 0.8, HBAR_W, 8),
    scootMat,
  );
  handlebar.rotation.z = Math.PI / 2;
  hbarGroup.add(handlebar);

  // Poignées (grips rouges)
  for (const side of [-1, 1]) {
    const gripHandle = new THREE.Mesh(
      new THREE.CylinderGeometry(1.8, 1.8, 8, 8),
      scootAccentMat,
    );
    gripHandle.rotation.z = Math.PI / 2;
    gripHandle.position.set(side * (HBAR_W / 2 - 3), 0, 0);
    hbarGroup.add(gripHandle);
  }

  scootGroup.add(hbarGroup);

  // Phare avant
  const headlight = new THREE.Mesh(
    new THREE.CylinderGeometry(1.5, 1.5, 0.5, 8),
    scootAccentMat,
  );
  headlight.rotation.x = Math.PI / 2;
  headlight.position.set(0, DECK_Y + STEM_H - 10, FRONT_Z - 2);
  scootGroup.add(headlight);

  scene.add(scootGroup);
}
