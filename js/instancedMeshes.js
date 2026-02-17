import * as THREE from 'three';
import { COLORS, STUD_R, STUD_HT, BRICK_H, NUM_LAYERS, GAP } from './config.js';

export function buildInstancedMeshes(scene, allBricks) {
  const dummy = new THREE.Object3D();
  const studGeo = new THREE.CylinderGeometry(STUD_R, STUD_R, STUD_HT, 16);

  const mats = {
    wall:        new THREE.MeshStandardMaterial({ color: COLORS.wall, roughness: 0.35 }),
    accent:      new THREE.MeshStandardMaterial({ color: COLORS.accent, roughness: 0.3 }),
    glass_frame: new THREE.MeshStandardMaterial({ color: 0x4477aa, roughness: 0.3 }),
    floor:       new THREE.MeshStandardMaterial({ color: COLORS.floor, roughness: 0.3 }),
  };
  const studMats = {
    wall:        new THREE.MeshStandardMaterial({ color: COLORS.studWall, roughness: 0.3, metalness: 0.05 }),
    accent:      new THREE.MeshStandardMaterial({ color: COLORS.accentS, roughness: 0.25 }),
    glass_frame: new THREE.MeshStandardMaterial({ color: 0x336688, roughness: 0.25 }),
    floor:       new THREE.MeshStandardMaterial({ color: COLORS.studFloor, roughness: 0.25, metalness: 0.05 }),
  };

  for (const type of ['wall', 'accent', 'glass_frame', 'floor']) {
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
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
      scene.add(mesh);
    }

    // Studs
    const studPos = [];
    for (const b of bricks) {
      const isTopWall = type !== 'floor' && b.y + b.sy / 2 >= (NUM_LAYERS - 1) * BRICK_H;
      if (!isTopWall && type !== 'floor') continue;

      const topY = b.y + b.sy / 2 + STUD_HT / 2;
      if (b.axis === 'x' || b.sx > b.sz) {
        const startX = b.x - (b.sx + GAP) / 2 + 0.5;
        for (let s = 0; s < Math.round(b.sx + GAP); s++)
          studPos.push(startX + s, topY, b.z);
      } else {
        const startZ = b.z - (b.sz + GAP) / 2 + 0.5;
        for (let s = 0; s < Math.round(b.sz + GAP); s++)
          studPos.push(b.x, topY, startZ + s);
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
      scene.add(sm);
    }
  }

  // Ground
  const gnd = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.MeshStandardMaterial({ color: COLORS.ground, roughness: 0.9 })
  );
  gnd.rotation.x = -Math.PI / 2;
  gnd.position.y = -0.01;
  gnd.receiveShadow = true;
  scene.add(gnd);
}
