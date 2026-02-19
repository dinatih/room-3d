import * as THREE from 'three';

export function buildChair(scene) {
  const chairX = 3;
  const chairZ = 13;
  const chairRot = Math.PI / 2;

  const redMat = new THREE.MeshStandardMaterial({ color: 0xcc2020, roughness: 0.6 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0xaa1a1a, metalness: 0.4, roughness: 0.35 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0xb01818, roughness: 0.55 });

  const chairGroup = new THREE.Group();
  chairGroup.position.set(chairX, 0, chairZ);
  chairGroup.rotation.y = chairRot;

  // --- Base étoile 5 branches ---
  const baseY = 0.2;
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const branchLen = 2.8;
    const branch = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.2, branchLen),
      metalMat
    );
    branch.position.set(
      Math.sin(angle) * branchLen / 2,
      baseY,
      Math.cos(angle) * branchLen / 2
    );
    branch.rotation.y = -angle;
    chairGroup.add(branch);

    const wheel = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 8, 8),
      darkMat
    );
    wheel.position.set(
      Math.sin(angle) * branchLen,
      0.15,
      Math.cos(angle) * branchLen
    );
    chairGroup.add(wheel);
  }

  // --- Vérin central ---
  const liftH = 3.5;
  const lift = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.25, liftH, 8),
    metalMat
  );
  lift.position.set(0, baseY + liftH / 2, 0);
  chairGroup.add(lift);

  const seatY = baseY + liftH;

  // --- Assise ---
  const seatW = 4.5;
  const seatD = 4.5;
  const seatH = 0.6;
  const seat = new THREE.Mesh(
    new THREE.BoxGeometry(seatW, seatH, seatD),
    redMat
  );
  seat.position.set(0, seatY + seatH / 2, 0);
  seat.castShadow = true;
  chairGroup.add(seat);

  // Coussin bord arrondi
  const cushFront = new THREE.Mesh(
    new THREE.CylinderGeometry(seatH / 2, seatH / 2, seatW - 0.2, 12),
    redMat
  );
  cushFront.rotation.z = Math.PI / 2;
  cushFront.position.set(0, seatY + seatH / 2, seatD / 2);
  chairGroup.add(cushFront);

  // --- Dossier ---
  const backW = 4.2;
  const backH = 5;
  const backT = 0.5;
  const back = new THREE.Mesh(
    new THREE.BoxGeometry(backW, backH, backT),
    redMat
  );
  back.position.set(0, seatY + seatH + backH / 2, -seatD / 2 + backT / 2);
  back.rotation.x = 0.1;
  back.castShadow = true;
  chairGroup.add(back);

  const backTop = new THREE.Mesh(
    new THREE.CylinderGeometry(backT / 2, backT / 2, backW - 0.2, 12),
    redMat
  );
  backTop.rotation.z = Math.PI / 2;
  backTop.position.set(0, seatY + seatH + backH, -seatD / 2 + backT / 2);
  backTop.rotation.x = 0.1;
  chairGroup.add(backTop);

  // --- Accoudoirs ---
  for (const side of [-1, 1]) {
    const armSupport = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 2, 0.3),
      darkMat
    );
    armSupport.position.set(side * (seatW / 2 - 0.2), seatY + seatH + 1, 0);
    chairGroup.add(armSupport);

    const armPad = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.25, 2.5),
      darkMat
    );
    armPad.position.set(side * (seatW / 2 - 0.2), seatY + seatH + 2.1, 0.2);
    chairGroup.add(armPad);
  }

  scene.add(chairGroup);
}
