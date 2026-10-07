import * as THREE from 'three';

const textureCache = new Map<string, THREE.CanvasTexture>();
const ATLAS_WIDTH = 1024;
const ATLAS_HEIGHT = 512;
const SIDE_WIDTH = ATLAS_WIDTH / 2;

/** Skin atlases use anatomical left in the first tile, right in the second. */
export function getLaraLimbTattooTexture(
  material: THREE.MeshStandardMaterial,
  style: 'marissa' | 'delphina' | 'sara',
  draw: (ctx: CanvasRenderingContext2D) => void,
  projection = material.userData.lara_tattoo_projection as string | undefined,
): THREE.CanvasTexture {
  const base = material.map;
  if (!base?.image) throw new Error(`Missing Lara skin atlas: ${material.name}`);
  const image = base.image as CanvasImageSource & { width: number; height: number };
  if (image.width !== ATLAS_WIDTH || image.height !== ATLAS_HEIGHT) {
    throw new Error(`Unexpected Lara skin atlas size: ${material.name}`);
  }
  const cached = textureCache.get(`${style}:${base.uuid}:${projection ?? ''}`);
  if (cached) return cached;
  const overlay = document.createElement('canvas');
  overlay.width = ATLAS_WIDTH;
  overlay.height = ATLAS_HEIGHT;
  const ink = overlay.getContext('2d');
  if (!ink) throw new Error('Cannot create Lara tattoo overlay');
  const tiles = style === 'sara' ? [0, SIDE_WIDTH] : [style === 'marissa' ? 0 : SIDE_WIDTH];
  for (const tileX of tiles) {
    ink.save();
    ink.beginPath();
    ink.rect(tileX, 0, SIDE_WIDTH, ATLAS_HEIGHT);
    ink.clip();
    ink.translate(tileX, 0);
    draw(ink);
    ink.restore();
  }

  return getProjectedLaraTattooTexture(material, style, overlay, projection);
}

/** Project a shared tattoo design onto a material's own skin atlas. */
export function getProjectedLaraTattooTexture(
  material: THREE.MeshStandardMaterial,
  design: string,
  overlay: HTMLCanvasElement,
  projection?: string,
): THREE.CanvasTexture {
  const base = material.map;
  if (!base?.image) throw new Error(`Missing Lara skin atlas: ${material.name}`);
  const image = base.image as CanvasImageSource & { width: number; height: number };
  const key = `${design}:${base.uuid}:${projection ?? ''}`;
  const cached = textureCache.get(key);
  if (cached) return cached;
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d');
  const ink = overlay.getContext('2d');
  if (!ctx || !ink) throw new Error('Cannot create Lara tattoo canvas');
  ctx.drawImage(image, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.flipY = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, texture);
  if (!projection) {
    ctx.drawImage(overlay, 0, 0);
    texture.needsUpdate = true;
    return texture;
  }

  // Nude skin has a different UV layout. Map its texels to the dressed surface
  // without replacing the original skin texture.
  const lookup = new Image();
  lookup.onload = () => {
    if (lookup.width !== image.width || lookup.height !== image.height) {
      throw new Error(`Invalid Lara tattoo projection: ${projection}`);
    }
    const mappingCanvas = document.createElement('canvas');
    mappingCanvas.width = image.width;
    mappingCanvas.height = image.height;
    const mappingCtx = mappingCanvas.getContext('2d');
    if (!mappingCtx) throw new Error('Cannot read Lara tattoo projection');
    mappingCtx.drawImage(lookup, 0, 0);
    const mapping = mappingCtx.getImageData(0, 0, image.width, image.height).data;
    const source = ink.getImageData(0, 0, ATLAS_WIDTH, ATLAS_HEIGHT).data;
    const projected = mappingCtx.createImageData(image.width, image.height);
    for (let i = 0; i < mapping.length; i += 4) {
      if (mapping[i + 3] === 0) continue; // Texels outside the mesh UV islands.
      // R + the low 2 bits of G encode X; the other 6 bits + B encode Y.
      const x = mapping[i] + ((mapping[i + 1] & 3) << 8);
      const y = (mapping[i + 1] >> 2) + (mapping[i + 2] << 6);
      const offset = (y * ATLAS_WIDTH + x) * 4;
      projected.data.set(source.subarray(offset, offset + 4), i);
    }
    mappingCtx.putImageData(projected, 0, 0);
    ctx.drawImage(mappingCanvas, 0, 0);
    texture.needsUpdate = true;
  };
  lookup.onerror = () => { throw new Error(`Cannot load Lara tattoo projection: ${projection}`); };
  lookup.src = `characters/lara/textures/${projection}`;
  return texture;
}
