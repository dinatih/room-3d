import * as THREE from 'three';
import { COLORS, STUD_R, STUD_HT, GAP, BRICK_H } from './config.js';

// =============================================
// VUE LEGO — 2 premières rangées de briques
// Utilisé pour planifier la construction réelle
// =============================================
export function buildLegoView(scene, allBricks) {
  const group = new THREE.Group();
  const dummy = new THREE.Object3D();
  const studGeo = new THREE.CylinderGeometry(STUD_R, STUD_R, STUD_HT, 16);

  const mats = {
    wall:        new THREE.MeshStandardMaterial({ color: COLORS.wall,    roughness: 0.35 }),
    accent:      new THREE.MeshStandardMaterial({ color: COLORS.accent,  roughness: 0.3  }),
    glass_frame: new THREE.MeshStandardMaterial({ color: 0x4477aa,       roughness: 0.3  }),
  };
  const studMats = {
    wall:        new THREE.MeshStandardMaterial({ color: COLORS.studWall, roughness: 0.3  }),
    accent:      new THREE.MeshStandardMaterial({ color: COLORS.accentS,  roughness: 0.25 }),
    glass_frame: new THREE.MeshStandardMaterial({ color: 0x336688,        roughness: 0.25 }),
  };

  // Layers 0 et 1 : Y < BRICK_H * 2 (< 60cm)
  const filtered = allBricks.filter(b =>
    ['wall', 'accent', 'glass_frame'].includes(b.type) && b.y < BRICK_H * 2
  );

  for (const type of ['wall', 'accent', 'glass_frame']) {
    const bricks = filtered.filter(b => b.type === type);
    if (!bricks.length) continue;

    // Grouper par taille pour InstancedMesh
    const bySize = new Map();
    for (const b of bricks) {
      const key = `${b.sx.toFixed(2)}_${b.sy.toFixed(2)}_${b.sz.toFixed(2)}`;
      if (!bySize.has(key)) bySize.set(key, { sx: b.sx, sy: b.sy, sz: b.sz, items: [] });
      bySize.get(key).items.push(b);
    }
    for (const [, g] of bySize) {
      const mesh = new THREE.InstancedMesh(
        new THREE.BoxGeometry(g.sx, g.sy, g.sz),
        mats[type], g.items.length
      );
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
      group.add(mesh);
    }

    // Studs
    const studPos = [];
    for (const b of bricks) {
      const topY = b.y + b.sy / 2 + STUD_HT / 2;
      const cosR = Math.cos(b.rotY || 0);
      const sinR = Math.sin(b.rotY || 0);
      if (b.axis === 'x' || b.sx > b.sz) {
        const count = Math.round((b.sx + GAP) / 10);
        for (let s = 0; s < count; s++) {
          const dx = -(b.sx + GAP) / 2 + 5 + s * 10;
          studPos.push(b.x + dx * cosR, topY, b.z - dx * sinR);
        }
      } else {
        const count = Math.round((b.sz + GAP) / 10);
        for (let s = 0; s < count; s++) {
          const dz = -(b.sz + GAP) / 2 + 5 + s * 10;
          studPos.push(b.x + dz * sinR, topY, b.z + dz * cosR);
        }
      }
    }
    if (studPos.length) {
      const count = studPos.length / 3;
      const sm = new THREE.InstancedMesh(studGeo, studMats[type], count);
      for (let i = 0; i < count; i++) {
        dummy.position.set(studPos[i * 3], studPos[i * 3 + 1], studPos[i * 3 + 2]);
        dummy.updateMatrix();
        sm.setMatrixAt(i, dummy.matrix);
      }
      sm.instanceMatrix.needsUpdate = true;
      group.add(sm);
    }
  }

  group.visible = false;
  scene.add(group);
  return group;
}
