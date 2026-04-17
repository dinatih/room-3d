import * as THREE from 'three';

// No font loading needed — canvas text supports all Unicode
export async function loadFont() {}

export function makeText(scene, text, { color = '#ffdd44', size = 1, x = 0, y = 0, z = 0, rotY = 0 } = {}) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const fontSize = 96;
  const fontStr = `bold ${fontSize}px Arial, Helvetica, sans-serif`;
  ctx.font = fontStr;
  const tw = ctx.measureText(text).width;

  const pad = 4;
  canvas.width  = Math.ceil(tw) + pad * 2;
  canvas.height = Math.ceil(fontSize * 1.3) + pad * 2;

  ctx.font = fontStr;          // re-set after resize
  ctx.fillStyle = color;
  ctx.textBaseline = 'top';
  ctx.fillText(text, pad, pad);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;

  const aspect = canvas.width / canvas.height;
  const geo = new THREE.PlaneGeometry(size * aspect, size);
  const mat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  mesh.rotation.y = rotY;
  mesh.renderOrder = 999;
  scene.add(mesh);
  return mesh;
}
