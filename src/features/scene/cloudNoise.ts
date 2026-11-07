import { DataTexture, LinearFilter, RedFormat, RepeatWrapping } from 'three';

export const CLOUD_NOISE_PERIOD = 8;

/** Bake the three cloud octaves once into a seamless 256² single-channel texture. */
export function createCloudNoise() {
  const resolution = 256, period = CLOUD_NOISE_PERIOD;
  const pixels = new Uint8Array(resolution * resolution);
  const smooth = (f: number) => f * f * (3 - 2 * f);
  const hash = (a: number, b: number, size: number) => {
    const value = Math.sin(((a + size) % size) * 127.1 + ((b + size) % size) * 311.7) * 43758.5453;
    return value - Math.floor(value);
  };
  const noise = (x: number, y: number, size: number) => {
    const ix = Math.floor(x), iy = Math.floor(y);
    const fx = smooth(x - ix), fy = smooth(y - iy);
    return (hash(ix, iy, size) * (1 - fx) + hash(ix + 1, iy, size) * fx) * (1 - fy)
      + (hash(ix, iy + 1, size) * (1 - fx) + hash(ix + 1, iy + 1, size) * fx) * fy;
  };
  for (let y = 0; y < resolution; y++) for (let x = 0; x < resolution; x++) {
    const u = (x + 0.5) / resolution * period, v = (y + 0.5) / resolution * period;
    pixels[y * resolution + x] = Math.round(255 * (noise(u, v, period) * 0.57 + noise(u * 2, v * 2, period * 2) * 0.28 + noise(u * 4, v * 4, period * 4) * 0.15));
  }
  const texture = new DataTexture(pixels, resolution, resolution, RedFormat);
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.magFilter = texture.minFilter = LinearFilter;
  texture.needsUpdate = true;
  return texture;
}
