import * as THREE from 'three';

function makeFabricWeaveMap(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y += 2) {
    for (let x = 0; x < size; x += 2) {
      const warp = ((x + y) & 2) === 0 ? 22 : -18;
      const v = 128 + warp;
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(x, y, 2, 2);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(14, 14);
  return tex;
}

export const redFabricMat = new THREE.MeshPhysicalMaterial({
  color: 0xa21616,
  vertexColors: true,
  roughness: 0.9,
  bumpMap: typeof document !== 'undefined' ? makeFabricWeaveMap() : null,
  bumpScale: 0.35,
  clearcoat: 0.0,
  sheen: 1.0,
  sheenColor: new THREE.Color(0xff6666),
  sheenRoughness: 0.65,
  polygonOffset: true,
  polygonOffsetFactor: -1,
  polygonOffsetUnits: -1,
});
