import * as THREE from 'three';
import { ROOM_D, PLATE_H, NICHE_DEPTH } from './config.js';

export function buildDecor(scene) {
  // =============================================
  // 4 CUBES ROUGES - 2 sur MACKAPÄR, 2 sur Kallax 2x5
  // =============================================
  {
    const CUBE_S = 3;
    const cubeMat = new THREE.MeshStandardMaterial({ color: 0xcc2020, roughness: 0.6 });
    const cubeGeo = new THREE.BoxGeometry(CUBE_S, CUBE_S, CUBE_S);

    const mpTopY = PLATE_H + 20;
    const mpCX = -NICHE_DEPTH + 7.8 / 2;
    const mpCZ = (ROOM_D - (2 * 3.3 + 3 * 0.15)) - 3.2 / 2;

    const c1 = new THREE.Mesh(cubeGeo, cubeMat);
    c1.position.set(mpCX - 1.8, mpTopY + CUBE_S / 2, mpCZ);
    c1.castShadow = true;
    scene.add(c1);
    const c2 = new THREE.Mesh(cubeGeo, cubeMat);
    c2.position.set(mpCX + 1.8, mpTopY + CUBE_S / 2, mpCZ);
    c2.castShadow = true;
    scene.add(c2);

    const k4TopY = PLATE_H + 17.4 + 0.075;
    const k4CX = -NICHE_DEPTH + 4 / 2;
    const k4CZ = ROOM_D - (2 * 3.3 + 3 * 0.15) / 2;

    const c3 = new THREE.Mesh(cubeGeo, cubeMat);
    c3.position.set(k4CX, k4TopY + CUBE_S / 2, k4CZ - 1.8);
    c3.castShadow = true;
    scene.add(c3);
    const c4 = new THREE.Mesh(cubeGeo, cubeMat);
    c4.position.set(k4CX, k4TopY + CUBE_S / 2, k4CZ + 1.8);
    c4.castShadow = true;
    scene.add(c4);
  }

  // =============================================
  // CONGÉLATEUR CHIQ CSD46D4E
  // =============================================
  {
    const FRZ_W = 4.5;
    const FRZ_D = 4.7;
    const FRZ_H = 5;

    const frzZ = 23.6 + 0.5 + FRZ_W / 2;
    const frzX = FRZ_D / 2 + 0.1;
    const frzBaseY = PLATE_H;

    const frzMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.3, metalness: 0.2 });
    const frzMatDark = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(FRZ_D, FRZ_H, FRZ_W), frzMat);
    body.position.set(frzX, frzBaseY + FRZ_H / 2, frzZ);
    body.castShadow = true;
    body.receiveShadow = true;
    scene.add(body);

    const door = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, FRZ_H - 0.4, FRZ_W - 0.3),
      frzMat
    );
    door.position.set(frzX + FRZ_D / 2 + 0.04, frzBaseY + FRZ_H / 2, frzZ);
    scene.add(door);

    const handle = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 2.5, 0.15),
      frzMatDark
    );
    handle.position.set(frzX + FRZ_D / 2 + 0.1, frzBaseY + FRZ_H / 2, frzZ + FRZ_W / 2 - 0.5);
    scene.add(handle);

    for (const dz of [-1, 1]) {
      for (const dx of [-1, 1]) {
        const foot = new THREE.Mesh(
          new THREE.CylinderGeometry(0.15, 0.15, 0.15, 8),
          frzMatDark
        );
        foot.position.set(
          frzX + dx * (FRZ_D / 2 - 0.3),
          frzBaseY + 0.075,
          frzZ + dz * (FRZ_W / 2 - 0.3)
        );
        scene.add(foot);
      }
    }
  }
}
