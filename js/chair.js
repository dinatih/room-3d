import * as THREE from 'three';

export function buildChair(scene) {
  const chairX = 30;
  const chairZ = 145;
  const chairRot = Math.PI / 2;

  const redMat = new THREE.MeshStandardMaterial({ color: 0xcc2020, roughness: 0.6 });

  const chairGroup = new THREE.Group();
  chairGroup.position.set(chairX, 0, chairZ);
  chairGroup.rotation.y = chairRot;

  // Base étoile 5 branches (from kallax.html Smörkull)
  const base = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const leg = new THREE.Mesh(new THREE.BoxGeometry(25, 2, 3), redMat);
    leg.position.set(Math.cos(angle) * 12.5, 5, Math.sin(angle) * 12.5);
    leg.rotation.y = -angle;
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 3, 12), redMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(Math.cos(angle) * 25, 3, Math.sin(angle) * 25);
    base.add(leg, wheel);
  }
  chairGroup.add(base);

  // Vérin
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(2, 2.5, 35), redMat);
  pole.position.y = 22;
  chairGroup.add(pole);

  // Assise (capsule aplatie)
  const seat = new THREE.Mesh(new THREE.CapsuleGeometry(22, 5, 4, 16), redMat);
  seat.scale.set(1, 0.4, 1.1);
  seat.position.y = 45;
  seat.castShadow = true;
  chairGroup.add(seat);

  // Dossier (capsule aplatie en Z)
  const back = new THREE.Mesh(new THREE.CapsuleGeometry(18, 40, 4, 16), redMat);
  back.scale.set(1, 1, 0.2);
  back.position.set(0, 80, -18);
  back.rotation.x = -0.15;
  back.castShadow = true;
  chairGroup.add(back);

  // Accoudoirs
  for (const side of [1, -1]) {
    const sup = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 15), redMat);
    sup.position.set(side * 22, 52, 0);
    const pad = new THREE.Mesh(new THREE.CapsuleGeometry(3, 10, 4, 10), redMat);
    pad.rotation.x = Math.PI / 2;
    pad.position.set(side * 22, 59, 0);
    chairGroup.add(sup, pad);
  }

  scene.add(chairGroup);
}
