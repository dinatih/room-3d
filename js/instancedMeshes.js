import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { COLORS, GAP, STUD_R, WALL_H, WALL_PLATE_H, NUM_LAYERS, BRICK_H } from './config.js';

export function buildInstancedMeshes(scene, allBricks) {
  const dummy = new THREE.Object3D();

  const mats = {
    wall:        new THREE.MeshStandardMaterial({ color: 0xf0f0eb, roughness: 0.65 }),
    accent:      new THREE.MeshStandardMaterial({ color: COLORS.accent, roughness: 0.55 }),
    glass_frame: new THREE.MeshStandardMaterial({ color: 0x4477aa, roughness: 0.35 }),
  };

  for (const type of ['wall', 'accent', 'glass_frame']) {
    const bricks = allBricks.filter(b => b.type === type);
    if (!bricks.length) continue;

    const geos = [];
    for (const b of bricks) {
      // Expand by GAP to close joints between adjacent bricks → surface lisse
      const geo = new THREE.BoxGeometry(b.sx + GAP, b.sy + GAP, b.sz + GAP);
      dummy.position.set(b.x, b.y, b.z);
      dummy.rotation.y = b.rotY || 0;
      dummy.updateMatrix();
      geo.applyMatrix4(dummy.matrix);
      dummy.rotation.y = 0;
      geos.push(geo);
    }

    const merged = mergeGeometries(geos);
    geos.forEach(g => g.dispose());

    const mesh = new THREE.Mesh(merged, mats[type]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.brickType = type;
    scene.add(mesh);
  }

  // Disques de studs au sommet des murs — simule des trous dans le plafond,
  // permet de visualiser les épaisseurs de mur (comme les studs LEGO avant)
  {
    const plateY = NUM_LAYERS * BRICK_H + WALL_PLATE_H / 2; // Y des briques de finition
    const plateBricks = allBricks.filter(b =>
      (b.type === 'wall' || b.type === 'accent' || b.type === 'glass_frame') &&
      Math.abs(b.y - plateY) < 1
    );

    const studPos = [];
    for (const b of plateBricks) {
      const cosR = Math.cos(b.rotY || 0);
      const sinR = Math.sin(b.rotY || 0);
      if (b.sx >= b.sz) {
        const count = Math.round((b.sx + GAP) / 10);
        for (let s = 0; s < count; s++) {
          const dx = -(b.sx + GAP) / 2 + 5 + s * 10;
          studPos.push(b.x + dx * cosR, WALL_H, b.z - dx * sinR);
        }
      } else {
        const count = Math.round((b.sz + GAP) / 10);
        for (let s = 0; s < count; s++) {
          const dz = -(b.sz + GAP) / 2 + 5 + s * 10;
          studPos.push(b.x + dz * sinR, WALL_H, b.z + dz * cosR);
        }
      }
    }

    if (studPos.length) {
      const count = studPos.length / 3;
      const studGeo = new THREE.CylinderGeometry(STUD_R, STUD_R, 0.5, 16);
      const studMat = new THREE.MeshStandardMaterial({ color: 0xb8b8b2, roughness: 0.7 });
      const sm = new THREE.InstancedMesh(studGeo, studMat, count);
      sm.userData.brickType = 'wall';
      for (let i = 0; i < count; i++) {
        dummy.position.set(studPos[i * 3], studPos[i * 3 + 1], studPos[i * 3 + 2]);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        sm.setMatrixAt(i, dummy.matrix);
      }
      sm.instanceMatrix.needsUpdate = true;
      scene.add(sm);
    }
  }

  // Ground
  const gnd = new THREE.Mesh(
    new THREE.PlaneGeometry(2000, 2000),
    new THREE.MeshStandardMaterial({ color: COLORS.ground, roughness: 0.9 })
  );
  gnd.rotation.x = -Math.PI / 2;
  gnd.position.y = -10;
  gnd.receiveShadow = true;
  gnd.userData.brickType = 'ground';
  scene.add(gnd);
}
