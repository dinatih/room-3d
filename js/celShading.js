import * as THREE from 'three';
import { requestRender } from './cameraManager.js';

let celActive = false;
let gradientMap = null;

function getGradientMap() {
  if (gradientMap) return gradientMap;
  // 3 bandes : ombre / mi-teinte / lumière
  const data = new Uint8Array([0x40, 0x90, 0xE8]);
  gradientMap = new THREE.DataTexture(data, 3, 1, THREE.RedFormat);
  gradientMap.minFilter = THREE.NearestFilter;
  gradientMap.magFilter = THREE.NearestFilter;
  gradientMap.generateMipmaps = false;
  gradientMap.needsUpdate = true;
  return gradientMap;
}

function toToon(origMat) {
  if (!origMat.visible) return new THREE.MeshToonMaterial({ visible: false });
  return new THREE.MeshToonMaterial({
    color:        origMat.color?.clone() ?? new THREE.Color(0x888888),
    map:          origMat.map          ?? null,
    side:         origMat.side         ?? THREE.FrontSide,
    transparent:  origMat.transparent  ?? false,
    opacity:      origMat.opacity      ?? 1,
    gradientMap:  getGradientMap(),
  });
}

export function toggleCelShading(scene) {
  celActive = !celActive;

  scene.traverse(obj => {
    if (!obj.isMesh) return;

    if (celActive) {
      obj.userData._celOrig = obj.material;
      obj.material = Array.isArray(obj.material)
        ? obj.material.map(toToon)
        : toToon(obj.material);
    } else {
      if (obj.userData._celOrig !== undefined) {
        const toon = obj.material;
        (Array.isArray(toon) ? toon : [toon]).forEach(m => m.dispose());
        obj.material = obj.userData._celOrig;
        delete obj.userData._celOrig;
      }
    }
  });

  requestRender();
  return celActive;
}
