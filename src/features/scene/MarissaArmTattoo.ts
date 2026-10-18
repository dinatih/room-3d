import * as THREE from 'three';
import lionUrl from './assets/marissa-lion.png';

const textures = new Map<string, THREE.CanvasTexture>();

/** Place the supplied lion on the anatomical left forearm's skin atlas. */
export function getMarissaArmTattooTexture(material: THREE.MeshStandardMaterial) {
  const base = material.map;
  if (!base?.image) throw new Error(`Missing Marissa arm skin: ${material.name}`);
  const cached = textures.get(base.uuid);
  if (cached) return cached;
  const image = base.image as HTMLImageElement;
  const canvas = document.createElement('canvas');
  const resolution = 4;
  canvas.width = image.width * resolution;
  canvas.height = image.height * resolution;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Cannot draw Marissa lion tattoo');
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.flipY = base.flipY;
  texture.colorSpace = THREE.SRGBColorSpace;
  textures.set(base.uuid, texture);
  const lion = new Image();
  lion.onload = () => {
    const stamp = document.createElement('canvas');
    stamp.width = lion.naturalWidth;
    stamp.height = lion.naturalHeight;
    const ink = stamp.getContext('2d');
    if (!ink) throw new Error('Cannot prepare Marissa lion ink');
    ink.drawImage(lion, 0, 0);
    const pixels = ink.getImageData(0, 0, stamp.width, stamp.height);
    for (let i = 0; i < pixels.data.length; i += 4) {
      const grey = (pixels.data[i] + pixels.data[i + 1] + pixels.data[i + 2]) / 3;
      pixels.data[i + 3] *= 1 - grey / 255;
      pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = 9;
    }
    ink.putImageData(pixels, 0, 0);
    const height = 64;
    const width = height * lion.naturalWidth / lion.naturalHeight;
    ctx.save();
    ctx.scale(resolution, resolution);
    ctx.translate(240, 205);
    // Across the forearm, then toward the wrist (measured UV tangent axes).
    ctx.transform(-0.12435, 1.02124, 0.96822, -0.05235, 0, 0);
    ctx.drawImage(stamp, -width / 2, -height / 2, width, height);
    ctx.restore();
    texture.needsUpdate = true;
  };
  lion.onerror = () => { throw new Error('Cannot load Marissa lion tattoo'); };
  lion.src = lionUrl;
  return texture;
}
