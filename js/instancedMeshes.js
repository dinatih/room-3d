import * as THREE from 'three';
import { COLORS, STUD_R, STUD_HT, GAP } from './config.js';

export function buildInstancedMeshes(scene, allBricks) {
  const dummy = new THREE.Object3D();
  const studGeo = new THREE.CylinderGeometry(STUD_R, STUD_R, STUD_HT, 16);

  const mats = {
    wall:        new THREE.MeshStandardMaterial({ color: COLORS.wall, roughness: 0.35 }),
    accent:      new THREE.MeshStandardMaterial({ color: COLORS.accent, roughness: 0.3 }),
    glass_frame: new THREE.MeshStandardMaterial({ color: 0x4477aa, roughness: 0.3 }),
    floor:       new THREE.MeshStandardMaterial({ color: COLORS.floor, roughness: 0.3 }),
    tile:        new THREE.MeshStandardMaterial({ color: COLORS.tile, roughness: 0.2 }),
    parquet:     new THREE.MeshStandardMaterial({ color: COLORS.parquet, roughness: 0.25 }),
  };
  const studMats = {
    wall:        new THREE.MeshStandardMaterial({ color: COLORS.studWall, roughness: 0.3, metalness: 0.05 }),
    accent:      new THREE.MeshStandardMaterial({ color: COLORS.accentS, roughness: 0.25 }),
    glass_frame: new THREE.MeshStandardMaterial({ color: 0x336688, roughness: 0.25 }),
    floor:       new THREE.MeshStandardMaterial({ color: COLORS.studFloor, roughness: 0.25, metalness: 0.05 }),
    tile:        new THREE.MeshStandardMaterial({ color: COLORS.studTile, roughness: 0.2, metalness: 0.05 }),
  };

  for (const type of ['wall', 'accent', 'glass_frame', 'tile', 'parquet']) {
    const bricks = allBricks.filter(b => b.type === type);
    if (!bricks.length) continue;

    const bySize = new Map();
    for (const b of bricks) {
      const key = `${b.sx.toFixed(2)}_${b.sy.toFixed(2)}_${b.sz.toFixed(2)}`;
      if (!bySize.has(key)) bySize.set(key, { sx: b.sx, sy: b.sy, sz: b.sz, items: [] });
      bySize.get(key).items.push(b);
    }

    for (const [, g] of bySize) {
      const geo = new THREE.BoxGeometry(g.sx, g.sy, g.sz);
      const mesh = new THREE.InstancedMesh(geo, mats[type], g.items.length);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      g.items.forEach((b, i) => {
        dummy.position.set(b.x, b.y, b.z);
        dummy.rotation.y = b.rotY || 0;
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      });
      dummy.rotation.y = 0;
      mesh.instanceMatrix.needsUpdate = true;
      mesh.userData.brickType = type;
      scene.add(mesh);
    }

    // Studs
    const studPos = [];
    const studBrickY = []; // Y de la brique parente (pour tri animation)
    const studBrickZ = []; // Z de la brique parente (clé secondaire)
    const studBrickX = []; // X de la brique parente (clé tertiaire)
    for (const b of bricks) {
      const isWall = type === 'wall' || type === 'accent' || type === 'glass_frame';
      if (!isWall) continue;

      const topY = b.y + b.sy / 2 + STUD_HT / 2;
      const cosR = Math.cos(b.rotY || 0);
      const sinR = Math.sin(b.rotY || 0);
      if (b.axis === 'x' || b.sx > b.sz) {
        const count = Math.round((b.sx + GAP) / 10);
        for (let s = 0; s < count; s++) {
          const dx = -(b.sx + GAP) / 2 + 5 + s * 10;
          studPos.push(b.x + dx * cosR, topY, b.z - dx * sinR);
          studBrickY.push(b.y); studBrickZ.push(b.z); studBrickX.push(b.x);
        }
      } else {
        const count = Math.round((b.sz + GAP) / 10);
        for (let s = 0; s < count; s++) {
          const dz = -(b.sz + GAP) / 2 + 5 + s * 10;
          studPos.push(b.x + dz * sinR, topY, b.z + dz * cosR);
          studBrickY.push(b.y); studBrickZ.push(b.z); studBrickX.push(b.x);
        }
      }
    }

    if (studPos.length) {
      const count = studPos.length / 3;
      const sm = new THREE.InstancedMesh(studGeo, studMats[type], count);
      sm.castShadow = true;
      for (let i = 0; i < count; i++) {
        dummy.position.set(studPos[i*3], studPos[i*3+1], studPos[i*3+2]);
        dummy.updateMatrix();
        sm.setMatrixAt(i, dummy.matrix);
      }
      sm.instanceMatrix.needsUpdate = true;
      sm.userData.brickType = type;
      sm.userData.studBrickY = studBrickY;
      sm.userData.studBrickZ = studBrickZ;
      sm.userData.studBrickX = studBrickX;
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
