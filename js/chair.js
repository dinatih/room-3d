import * as THREE from 'three';

export function buildChair(scene) {
  const chairX = 30;
  const chairZ = 130;
  const chairRot = Math.PI / 2;

  const redMat = new THREE.MeshStandardMaterial({ color: 0xcc2020, roughness: 0.6 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0xaa1a1a, metalness: 0.4, roughness: 0.35 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0xb01818, roughness: 0.55 });

  const chairGroup = new THREE.Group();
  chairGroup.position.set(chairX, 0, chairZ);
  chairGroup.rotation.y = chairRot;

  // --- Base étoile 5 branches ---
  const WHEEL_R = 1.5;
  const CASTER_H = 3;
  const baseY = CASTER_H + 1;
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const branchLen = 28;
    const tipX = Math.sin(angle) * branchLen;
    const tipZ = Math.cos(angle) * branchLen;

    // Branche (orientée du centre vers le bout)
    const branch = new THREE.Mesh(
      new THREE.BoxGeometry(3, 2, branchLen),
      metalMat
    );
    branch.position.set(
      Math.sin(angle) * branchLen / 2,
      baseY,
      Math.cos(angle) * branchLen / 2
    );
    branch.rotation.y = angle;
    chairGroup.add(branch);

    // Fourche roulette (petit cylindre vertical sous la branche)
    const fork = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 0.8, CASTER_H, 6),
      darkMat
    );
    fork.position.set(tipX, baseY - 1 - CASTER_H / 2, tipZ);
    chairGroup.add(fork);

    // Roue (essieu perpendiculaire à la branche → roule dans l'axe de la branche)
    const wheel = new THREE.Mesh(
      new THREE.CylinderGeometry(WHEEL_R, WHEEL_R, 1.2, 10),
      darkMat
    );
    wheel.position.set(tipX, WHEEL_R, tipZ);
    const branchDir = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle));
    wheel.quaternion.setFromAxisAngle(branchDir, Math.PI / 2);
    chairGroup.add(wheel);
  }

  // --- Vérin central ---
  const liftH = 35;
  const lift = new THREE.Mesh(
    new THREE.CylinderGeometry(2, 2.5, liftH, 8),
    metalMat
  );
  lift.position.set(0, baseY + liftH / 2, 0);
  chairGroup.add(lift);

  const seatY = baseY + liftH;

  // --- Assise ---
  const seatW = 45;
  const seatD = 45;
  const seatH = 6;
  const seat = new THREE.Mesh(
    new THREE.BoxGeometry(seatW, seatH, seatD),
    redMat
  );
  seat.position.set(0, seatY + seatH / 2, 0);
  seat.castShadow = true;
  chairGroup.add(seat);

  // Coussin bord arrondi
  const cushFront = new THREE.Mesh(
    new THREE.CylinderGeometry(seatH / 2, seatH / 2, seatW - 2, 12),
    redMat
  );
  cushFront.rotation.z = Math.PI / 2;
  cushFront.position.set(0, seatY + seatH / 2, seatD / 2);
  chairGroup.add(cushFront);

  // --- Dossier ---
  const backW = 42;
  const backH = 50;
  const backT = 5;
  const back = new THREE.Mesh(
    new THREE.BoxGeometry(backW, backH, backT),
    redMat
  );
  back.position.set(0, seatY + seatH + backH / 2, -seatD / 2 + backT / 2);
  back.rotation.x = 0.1;
  back.castShadow = true;
  chairGroup.add(back);

  const backTop = new THREE.Mesh(
    new THREE.CylinderGeometry(backT / 2, backT / 2, backW - 2, 12),
    redMat
  );
  backTop.rotation.z = Math.PI / 2;
  backTop.position.set(0, seatY + seatH + backH, -seatD / 2 + backT / 2);
  backTop.rotation.x = 0.1;
  chairGroup.add(backTop);

  // --- Accoudoirs ---
  for (const side of [-1, 1]) {
    const armSupport = new THREE.Mesh(
      new THREE.BoxGeometry(3, 20, 3),
      darkMat
    );
    armSupport.position.set(side * (seatW / 2 - 2), seatY + seatH + 10, 0);
    chairGroup.add(armSupport);

    const armPad = new THREE.Mesh(
      new THREE.BoxGeometry(5, 2.5, 25),
      darkMat
    );
    armPad.position.set(side * (seatW / 2 - 2), seatY + seatH + 21, 2);
    chairGroup.add(armPad);
  }

  scene.add(chairGroup);
}
