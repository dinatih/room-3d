import * as THREE from 'three';
import wingLeftUrl from './assets/cha-tattoo-wing-left.png';
import wingRightUrl from './assets/cha-tattoo-wing-right.png';

let design: HTMLCanvasElement | undefined;
let designTexture: THREE.CanvasTexture | undefined;

const wingLeft = new Image();
wingLeft.onerror = () => { throw new Error('Cannot load Cha left wing tattoo'); };
wingLeft.src = wingLeftUrl;

const wingRight = new Image();
wingRight.onerror = () => { throw new Error('Cannot load Cha right wing tattoo'); };
wingRight.src = wingRightUrl;

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

    // Anatomical scapulae placement on Lara's back:
    // Right omoplate (character right, negative X, seen on left from behind):
    // Left wing of the butterfly (cut inner edge near spine, wingtip outward toward shoulder)
    const [rX1, rY1] = cmToPx(-13.0, 146);
    const [rX2, rY2] = cmToPx(-3.0, 135);
    if (wingLeft.complete && wingLeft.naturalWidth) {
      ctx.drawImage(wingLeft, rX1, rY1, rX2 - rX1, rY2 - rY1);
    }

    // Left omoplate (character left, positive X, seen on right from behind):
    // Right wing of the butterfly (cut inner edge near spine, wingtip outward toward shoulder)
    const [lX1, lY1] = cmToPx(3.0, 146);
    const [lX2, lY2] = cmToPx(13.0, 135);
    if (wingRight.complete && wingRight.naturalWidth) {
      ctx.drawImage(wingRight, lX1, lY1, lX2 - lX1, lY2 - lY1);
    }

    if (designTexture) designTexture.needsUpdate = true;
  };

  if (wingLeft.complete && wingLeft.naturalWidth && wingRight.complete && wingRight.naturalWidth) {
    stamp();
  } else {
    wingLeft.onload = stamp;
    wingRight.onload = stamp;
  }

  designTexture = new THREE.CanvasTexture(design);
  designTexture.flipY = true;
  return designTexture;
}

/**
 * Projects the split tribal butterfly wings onto Cha's shoulder blades (omoplates).
 * Applies seamlessly to torso skin (nude, bikini) and clothed top.
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
    if (!(n as THREE.Mesh).isMesh || !/^(body_(nude_)?torso|shirt)/.test(n.name)) return;
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
