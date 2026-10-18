import * as THREE from 'three';
import dressedUrl from './assets/sara-nape-body_torso-0.png';
import nudeSkinUrl from './assets/sara-nape-body_nude_torso-0.png';
import nudeNeckUrl from './assets/sara-nape-body_nude_torso-1.png';

const textures = new Map<string, THREE.CanvasTexture>();

/** The same supplied design baked across the dressed and nude nape UV seams. */
export function getSaraNapeTattooTexture(
  material: THREE.MeshStandardMaterial,
  nude: boolean,
): THREE.CanvasTexture {
  const base = material.map;
  if (!base?.image) throw new Error(`Missing Sara skin atlas: ${material.name}`);
  const skinPart = material.name.match(/body_nude_torso_(\d+)/)?.[1];
  const url = nude ? ({ '0': nudeSkinUrl, '2': nudeNeckUrl } as Record<string, string>)[skinPart ?? ''] : dressedUrl;
  if (!url) throw new Error(`Missing Sara nape overlay: ${material.name}`);
  const key = `${base.uuid}:${url}`;
  const cached = textures.get(key);
  if (cached) return cached;
  const image = base.image as HTMLImageElement;
  const canvas = document.createElement('canvas');
  canvas.width = 4096;
  canvas.height = 2048;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Cannot draw Sara nape tattoo');
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.flipY = base.flipY;
  texture.colorSpace = THREE.SRGBColorSpace;
  textures.set(key, texture);
  const overlay = new Image();
  overlay.onload = () => {
    if (overlay.width !== canvas.width || overlay.height !== canvas.height) {
      throw new Error(`Invalid Sara nape overlay: ${material.name}`);
    }
    ctx.drawImage(overlay, 0, 0);
    texture.needsUpdate = true;
  };
  overlay.onerror = () => { throw new Error(`Cannot load Sara nape tattoo: ${url}`); };
  overlay.src = url;
  return texture;
}
