import * as THREE from 'three';
import { getProjectedLaraTattooTexture } from './LaraLimbTattoos';

let flowerCanvas: HTMLCanvasElement | undefined;

/** One flower design shared across the right shoulder, arm and chest UVs. */
export function getDelphinaShoulderTattooTexture(material: THREE.MeshStandardMaterial) {
  const projection = material.userData.lara_delphina_shoulder_projection as string | undefined;
  if (!projection) throw new Error(`Missing Delphina shoulder projection: ${material.name}`);
  if (!flowerCanvas) {
    flowerCanvas = document.createElement('canvas');
    flowerCanvas.width = 1024;
    flowerCanvas.height = 512;
    const ctx = flowerCanvas.getContext('2d');
    if (!ctx) throw new Error('Cannot draw Delphina shoulder flower');
    ctx.translate(225, 225);
    ctx.strokeStyle = '#251b29';
    ctx.lineWidth = 3;
    // A large pink bloom, with green leaves descending onto the upper chest.
    for (const [x, y, angle] of [[50, 142, -.55], [97, 170, .5]]) {
      ctx.save();ctx.translate(x, y);ctx.rotate(angle);
      ctx.beginPath();ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-58, 25, -40, 73, 0, 95);
      ctx.bezierCurveTo(40, 73, 58, 25, 0, 0);
      ctx.fillStyle = '#416f51';ctx.fill();ctx.stroke();
      ctx.beginPath();ctx.moveTo(0, 5);ctx.lineTo(0, 87);
      ctx.strokeStyle = '#b4bb7b';ctx.lineWidth = 2;ctx.stroke();ctx.restore();
    }
    for (let i = 0; i < 9; i++) {
      ctx.save();ctx.rotate(i * Math.PI * 2 / 9 + .2);
      const gradient = ctx.createLinearGradient(0, -30, 0, -177);
      gradient.addColorStop(0, '#9b234d');gradient.addColorStop(.5, '#e16a94');gradient.addColorStop(1, '#f4a6bb');
      ctx.beginPath();ctx.moveTo(-14, -25);
      ctx.bezierCurveTo(-77, -80, -76, -155, -24, -177);
      ctx.bezierCurveTo(21, -201, 78, -146, 49, -91);
      ctx.bezierCurveTo(35, -53, 16, -31, -14, -25);
      ctx.fillStyle = gradient;ctx.fill();ctx.stroke();
      ctx.strokeStyle = 'rgba(110, 27, 61, .65)';ctx.lineWidth = 2;
      ctx.beginPath();ctx.moveTo(0, -36);ctx.quadraticCurveTo(17, -97, -7, -158);ctx.stroke();
      ctx.restore();
    }
    ctx.beginPath();ctx.arc(0, 0, 44, 0, Math.PI * 2);ctx.fillStyle = '#392333';ctx.fill();ctx.stroke();
    ctx.fillStyle = '#e9b75c';
    for (let i = 0; i < 20; i++) {
      const angle = i * Math.PI * 2 / 20;
      ctx.beginPath();ctx.arc(Math.cos(angle) * 30, Math.sin(angle) * 30, 4, 0, Math.PI * 2);ctx.fill();
    }
    ctx.beginPath();ctx.arc(0, 0, 17, 0, Math.PI * 2);ctx.fillStyle = '#bb7643';ctx.fill();
  }
  return getProjectedLaraTattooTexture(material, 'delphina-shoulder', flowerCanvas, projection);
}
