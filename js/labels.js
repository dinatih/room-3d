import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

const FONT_URL = 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/fonts/helvetiker_bold.typeface.json';

let _font = null;

export async function loadFont() {
  if (!_font) {
    const loader = new FontLoader();
    _font = await loader.loadAsync(FONT_URL);
  }
  return _font;
}

export function makeText(scene, text, { color = '#ffdd44', size = 1, x = 0, y = 0, z = 0, rotY = 0 } = {}) {
  if (!_font) throw new Error('Font not loaded — call loadFont() first');

  const geo = new TextGeometry(text, {
    font: _font,
    size,
    depth: 0.05,
    curveSegments: 3,
  });
  geo.computeBoundingBox();
  const bb = geo.boundingBox;
  // centrer horizontalement
  geo.translate(-(bb.max.x - bb.min.x) / 2, 0, 0);

  const mat = new THREE.MeshBasicMaterial({ color, depthTest: false });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  mesh.rotation.y = rotY;
  mesh.renderOrder = 999;
  scene.add(mesh);
  return mesh;
}
