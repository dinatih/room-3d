import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import {
  ROOM_D, NUM_LAYERS, BRICK_H,
  KITCHEN_X1, DOOR_START,
} from './config.js';

export function buildMirrors(scene) {
  // =============================================
  // 3x MIROIR IKEA NISSEDAL 60x60 - Mur D
  // =============================================
  {
    const MIRROR_SIZE = 6;
    const MIRROR_CX = (KITCHEN_X1 + DOOR_START) / 2;
    const MIRROR_Z = ROOM_D - 0.02;
    const WALL_TOP = NUM_LAYERS * BRICK_H;

    const frameMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3 });
    const FRAME_T = 0.2;
    const FRAME_D = 0.15;
    const MIRROR_GAP = 0;

    for (let i = 0; i < 3; i++) {
      const mirrorY = WALL_TOP - MIRROR_SIZE / 2 - i * (MIRROR_SIZE + MIRROR_GAP);
      const fz = MIRROR_Z - FRAME_D / 2;

      const mirGeo = new THREE.PlaneGeometry(MIRROR_SIZE - FRAME_T * 2, MIRROR_SIZE - FRAME_T * 2);
      const mir = new Reflector(mirGeo, {
        textureWidth: 512,
        textureHeight: 512,
        color: 0xbbbbbb,
      });
      mir.position.set(MIRROR_CX, mirrorY, fz - 0.01);
      mir.rotation.y = Math.PI;
      scene.add(mir);

      // Cadre
      const barH = new THREE.Mesh(new THREE.BoxGeometry(MIRROR_SIZE, FRAME_T, FRAME_D), frameMat);
      barH.position.set(MIRROR_CX, mirrorY + MIRROR_SIZE / 2 - FRAME_T / 2, fz);
      scene.add(barH);
      const barB = new THREE.Mesh(new THREE.BoxGeometry(MIRROR_SIZE, FRAME_T, FRAME_D), frameMat);
      barB.position.set(MIRROR_CX, mirrorY - MIRROR_SIZE / 2 + FRAME_T / 2, fz);
      scene.add(barB);
      const barG = new THREE.Mesh(new THREE.BoxGeometry(FRAME_T, MIRROR_SIZE, FRAME_D), frameMat);
      barG.position.set(MIRROR_CX - MIRROR_SIZE / 2 + FRAME_T / 2, mirrorY, fz);
      scene.add(barG);
      const barD = new THREE.Mesh(new THREE.BoxGeometry(FRAME_T, MIRROR_SIZE, FRAME_D), frameMat);
      barD.position.set(MIRROR_CX + MIRROR_SIZE / 2 - FRAME_T / 2, mirrorY, fz);
      scene.add(barD);
    }
  }

  // =============================================
  // 3x MIROIR IKEA NISSEDAL 40x150 - Mur A + 4e 70x160
  // =============================================
  {
    const MA_W = 4;
    const MA_H = 15;
    const MA_FRAME_T = 0.18;
    const MA_FRAME_D = 0.12;

    const K2_W_CALC = 1 * 3.3 + 2 * 0.15;
    const MA_START_Z = K2_W_CALC + 1;

    const MA_X = 0.02 + MA_FRAME_D / 2;
    const MA_BOTTOM_Y = 0.6;
    const frameMat2 = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3 });

    for (let i = 0; i < 3; i++) {
      const mz = MA_START_Z + MA_W / 2 + i * MA_W;
      const my = MA_BOTTOM_Y + MA_H / 2;
      const fx = MA_X;

      const mirGeo = new THREE.PlaneGeometry(MA_W - MA_FRAME_T * 2, MA_H - MA_FRAME_T * 2);
      const mir = new Reflector(mirGeo, {
        textureWidth: 512,
        textureHeight: 512,
        color: 0xbbbbbb,
      });
      mir.rotation.y = Math.PI / 2;
      mir.position.set(fx + 0.01, my, mz);
      scene.add(mir);

      const bH = new THREE.Mesh(new THREE.BoxGeometry(MA_FRAME_D, MA_FRAME_T, MA_W), frameMat2);
      bH.position.set(fx, my + MA_H / 2 - MA_FRAME_T / 2, mz);
      scene.add(bH);
      const bB = new THREE.Mesh(new THREE.BoxGeometry(MA_FRAME_D, MA_FRAME_T, MA_W), frameMat2);
      bB.position.set(fx, my - MA_H / 2 + MA_FRAME_T / 2, mz);
      scene.add(bB);
      const bG = new THREE.Mesh(new THREE.BoxGeometry(MA_FRAME_D, MA_H, MA_FRAME_T), frameMat2);
      bG.position.set(fx, my, mz - MA_W / 2 + MA_FRAME_T / 2);
      scene.add(bG);
      const bD = new THREE.Mesh(new THREE.BoxGeometry(MA_FRAME_D, MA_H, MA_FRAME_T), frameMat2);
      bD.position.set(fx, my, mz + MA_W / 2 - MA_FRAME_T / 2);
      scene.add(bD);
    }

    // 4e miroir NISSEDAL 70x160cm
    const M4_W = 7;
    const M4_H = 16;
    const m4z = MA_START_Z + 3 * MA_W + M4_W / 2;
    const m4y = MA_BOTTOM_Y + M4_H / 2;
    const m4x = MA_X;

    const mirGeo4 = new THREE.PlaneGeometry(M4_W - MA_FRAME_T * 2, M4_H - MA_FRAME_T * 2);
    const mir4 = new Reflector(mirGeo4, {
      textureWidth: 512,
      textureHeight: 512,
      color: 0xbbbbbb,
    });
    mir4.rotation.y = Math.PI / 2;
    mir4.position.set(m4x + 0.01, m4y, m4z);
    scene.add(mir4);

    const b4H = new THREE.Mesh(new THREE.BoxGeometry(MA_FRAME_D, MA_FRAME_T, M4_W), frameMat2);
    b4H.position.set(m4x, m4y + M4_H / 2 - MA_FRAME_T / 2, m4z);
    scene.add(b4H);
    const b4B = new THREE.Mesh(new THREE.BoxGeometry(MA_FRAME_D, MA_FRAME_T, M4_W), frameMat2);
    b4B.position.set(m4x, m4y - M4_H / 2 + MA_FRAME_T / 2, m4z);
    scene.add(b4B);
    const b4G = new THREE.Mesh(new THREE.BoxGeometry(MA_FRAME_D, M4_H, MA_FRAME_T), frameMat2);
    b4G.position.set(m4x, m4y, m4z - M4_W / 2 + MA_FRAME_T / 2);
    scene.add(b4G);
    const b4D = new THREE.Mesh(new THREE.BoxGeometry(MA_FRAME_D, M4_H, MA_FRAME_T), frameMat2);
    b4D.position.set(m4x, m4y, m4z + M4_W / 2 - MA_FRAME_T / 2);
    scene.add(b4D);
  }
}
