import * as THREE from 'three';
import referenceUrl from './assets/cha-back-reference.png';

let design: HTMLCanvasElement | undefined;
let designTexture: THREE.CanvasTexture | undefined;

const reference = new Image();
reference.onerror = () => { throw new Error('Cannot load Cha back tattoo'); };
reference.src = referenceUrl;

const CANVAS_W = 1024;
const CANVAS_H = 768;

function cmToPx(x: number, y: number): [number, number] {
  // X spans [-16, 16] cm, Y spans [128, 152] cm (height 24 cm, width 32 cm)
  return [
    ((x + 16) / 32) * CANVAS_W,
    ((152 - y) / 24) * CANVAS_H,
  ];
}

function getDesignTexture(): THREE.CanvasTexture {
  if (designTexture) return designTexture;

  design = document.createElement('canvas');
  design.width = CANVAS_W;
  design.height = CANVAS_H;
  const ctx = design.getContext('2d');
  if (!ctx) throw new Error('Cannot draw Cha back tattoo');

  const stamp = () => {
    if (!ctx || !design) return;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Crop the two halves of the supplied 624 × 328 reference, without its margins.
    // Keep the source aspect ratio and a 2 cm gap along the spine.
    const width = 11;
    const height = width * 260 / 288;
    for (const [sourceX, x] of [[24, -12], [312, 1]]) {
      const [px, py] = cmToPx(x, 146);
      ctx.drawImage(reference, sourceX, 36, 288, 260, px, py, width * 32, height * 32);
    }
    // White paper becomes transparent; retain antialiased black ink.
    const pixels = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H);
    for (let i = 0; i < pixels.data.length; i += 4) {
      pixels.data[i + 3] *= 1 - pixels.data[i] / 255;
      pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = 0;
    }
    ctx.putImageData(pixels, 0, 0);

    if (designTexture) designTexture.needsUpdate = true;
  };

  if (reference.complete && reference.naturalWidth) {
    stamp();
  } else {
    reference.onload = stamp;
  }

  designTexture = new THREE.CanvasTexture(design);
  designTexture.flipY = true;
  return designTexture;
}

/**
 * Projects the split tribal butterfly wings onto Cha's shoulder blades (omoplates).
 * Applies to torso skin; clothing occludes the ink naturally.
 */
export function applyChaBackTattoo(model: THREE.Object3D) {
  model.updateWorldMatrix(true, false);
  model.updateMatrixWorld(true);

  const inverse = model.matrixWorld.clone().invert();
  const bounds = new THREE.Box3();
  model.traverse(n => {
    if ((n as THREE.Mesh).isMesh && (n.name === 'face' || n.name.startsWith('body_nude_feet'))) {
      const m = n as THREE.Mesh, p = m.geometry.attributes.position;
      for (let i = 0; i < p.count; i++) {
        bounds.expandByPoint(m.getVertexPosition(i, new THREE.Vector3()).applyMatrix4(m.matrixWorld).applyMatrix4(inverse));
      }
    }
  });

  if (bounds.isEmpty()) throw new Error('Missing Cha anatomical reference meshes');
  const scale = 173.4 / (bounds.max.y - bounds.min.y);
  const texture = getDesignTexture();

  model.traverse(n => {
    if (!(n as THREE.Mesh).isMesh || !/^body_(nude_)?torso/.test(n.name)) return;
    const mesh = n as THREE.Mesh;
    const geom = mesh.geometry;
    const pos = geom.attributes.position;
    const transform = new THREE.Matrix4().multiplyMatrices(inverse, mesh.matrixWorld);

    if (!geom.hasAttribute('chaBackInkPosition')) {
      const coords = new Float32Array(pos.count * 4);
      for (let i = 0; i < pos.count; i++) {
        const pt = mesh.getVertexPosition(i, new THREE.Vector3()).applyMatrix4(transform);
        const height = (pt.y - bounds.min.y) * scale;
        const x = pt.x * scale;
        const z = pt.z * scale;
        coords.set([x, height, z, 0], i * 4);
      }
      geom.setAttribute('chaBackInkPosition', new THREE.BufferAttribute(coords, 4));
    }

    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of mats) {
      const mat = material as THREE.MeshStandardMaterial;
      if (!mat.userData.__ownedCharacterMaterial) continue;

      mat.onBeforeCompile = shader => {
        shader.uniforms.chaTattoo = { value: texture };
        shader.vertexShader = 'attribute vec4 chaBackInkPosition; varying vec4 vChaInk;\n' + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace(
          '#include <begin_vertex>',
          '#include <begin_vertex>\nvChaInk = chaBackInkPosition;'
        );
        shader.fragmentShader = 'uniform sampler2D chaTattoo; varying vec4 vChaInk;\n' + shader.fragmentShader;
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <map_fragment>',
          `#include <map_fragment>
            if (vChaInk.z < -0.5) {
              vec2 inkUV = vec2((vChaInk.x + 16.0) / 32.0, (vChaInk.y - 128.0) / 24.0);
              if (inkUV.x >= 0.0 && inkUV.x <= 1.0 && inkUV.y >= 0.0 && inkUV.y <= 1.0) {
                vec4 ink = texture2D(chaTattoo, inkUV);
                diffuseColor.rgb = mix(diffuseColor.rgb, ink.rgb, ink.a * 0.94);
              }
            }
          `
        );
      };
      mat.customProgramCacheKey = () => 'cha-back-tattoo';
      mat.needsUpdate = true;
    }
  });
}
