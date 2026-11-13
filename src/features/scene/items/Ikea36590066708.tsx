import { useLayoutEffect } from 'react';
import * as THREE from 'three';
import { glbLocalBBox } from '@features/scene/glbUtils';
import { useGLTFClone, preloadSceneGLTF } from '@features/scene/useGLTFClone';
import type { SceneModelProps } from '@shared/types';

const GLB = '/items/ikea36590066708/Ikea36590066708.glb';

export type Ikea365Contents = 'rice' | 'macaroni' | 'semolina';

interface Ikea365Props extends SceneModelProps {
  contents?: Ikea365Contents;
  fillLevel?: number;
}

const FILL_BASE_Y = 0.7;
const DEFAULT_FILL_LEVEL: Record<Ikea365Contents, number> = {
  rice: 0.25,
  macaroni: 0.75,
  semolina: 0.5,
};
const UV_TILE_CM = 10;

const cachedFillGeometries = new Map<number, THREE.BufferGeometry>();
const cachedMaterials = new Map<Ikea365Contents, THREE.MeshStandardMaterial>();

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function drawWrapped(
  size: number,
  cx: number,
  cy: number,
  margin: number,
  draw: (x: number, y: number) => void,
) {
  for (let ox = -1; ox <= 1; ox++) {
    const x = cx + ox * size;
    if (x < -margin || x > size + margin) continue;
    for (let oy = -1; oy <= 1; oy++) {
      const y = cy + oy * size;
      if (y < -margin || y > size + margin) continue;
      draw(x, y);
    }
  }
}

function getFillGeometry(fillLevel: number): THREE.BufferGeometry {
  const ratio = Math.min(0.92, Math.max(0.05, fillLevel));
  const key = Math.round(ratio * 100);
  const existing = cachedFillGeometries.get(key);
  if (existing) return existing;

  const topY = ratio * 30;
  // Section elliptique évasée ajustée à l'intérieur mesuré du bocal (dégagement ~3-4 mm)
  const radSegs = 40;
  const heightSegs = 6;
  const hx0 = 6.3, hz0 = 2.7;
  const taperT = (topY - FILL_BASE_Y) / (25.0 - FILL_BASE_Y);
  const hx1 = hx0 + taperT * (7.12 - hx0);
  const hz1 = hz0 + taperT * (3.27 - hz0);

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const arcSteps: number[] = new Array(radSegs + 1).fill(0);
  const midHx = (hx0 + hx1) * 0.5;
  const midHz = (hz0 + hz1) * 0.5;
  for (let i = 1; i <= radSegs; i++) {
    const a0 = ((i - 1) / radSegs) * Math.PI * 2;
    const a1 = (i / radSegs) * Math.PI * 2;
    arcSteps[i] = arcSteps[i - 1] + Math.hypot(
      midHx * (Math.cos(a1) - Math.cos(a0)),
      midHz * (Math.sin(a1) - Math.sin(a0)),
    );
  }

  // Paroi latérale évasée
  for (let iy = 0; iy <= heightSegs; iy++) {
    const t = iy / heightSegs;
    const y = FILL_BASE_Y + t * (topY - FILL_BASE_Y);
    const hx = hx0 + t * (hx1 - hx0);
    const hz = hz0 + t * (hz1 - hz0);
    for (let ix = 0; ix <= radSegs; ix++) {
      const a = (ix / radSegs) * Math.PI * 2;
      const topRipple = iy === heightSegs ? 0.14 * Math.sin(a * 3) + 0.08 * Math.cos(a * 2) : 0;
      positions.push(hx * Math.cos(a), y + topRipple, hz * Math.sin(a));
      uvs.push(arcSteps[ix] / UV_TILE_CM, (y - FILL_BASE_Y) / UV_TILE_CM);
    }
  }

  const stride = radSegs + 1;
  for (let iy = 0; iy < heightSegs; iy++) {
    for (let ix = 0; ix < radSegs; ix++) {
      const a = iy * stride + ix;
      const b = a + stride;
      // Enroulement trigonométrique sortant (normales vers l'extérieur)
      indices.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }

  // Fond plat à y = FILL_BASE_Y (normale vers -Y)
  const botStart = positions.length / 3;
  positions.push(0, FILL_BASE_Y, 0);
  uvs.push(0, 0);
  for (let ix = 0; ix < radSegs; ix++) {
    indices.push(botStart, ix, ix + 1);
  }

  // Calotte supérieure légèrement bombée pour un aspect vrac naturel
  const capRings = 4;
  const capStart = positions.length / 3;
  positions.push(0, topY + 0.35, 0);
  uvs.push(0, 0);

  for (let ir = 1; ir <= capRings; ir++) {
    const rf = ir / capRings;
    const mound = 0.35 * (1 - rf * rf);
    for (let ix = 0; ix <= radSegs; ix++) {
      const a = (ix / radSegs) * Math.PI * 2;
      const edgeRipple = rf * (0.14 * Math.sin(a * 3) + 0.08 * Math.cos(a * 2));
      const x = rf * hx1 * Math.cos(a);
      const z = rf * hz1 * Math.sin(a);
      positions.push(x, topY + mound + edgeRipple, z);
      uvs.push(x / UV_TILE_CM, z / UV_TILE_CM);
    }
  }

  const ring0 = capStart + 1;
  for (let ix = 0; ix < radSegs; ix++) {
    indices.push(capStart, ring0 + ix, ring0 + ix + 1);
  }
  for (let ir = 1; ir < capRings; ir++) {
    const rA = capStart + 1 + (ir - 1) * stride;
    const rB = rA + stride;
    for (let ix = 0; ix < radSegs; ix++) {
      indices.push(rA + ix, rB + ix, rA + ix + 1, rA + ix + 1, rB + ix, rB + ix + 1);
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  cachedFillGeometries.set(key, geom);
  return geom;
}

function getFillMaterial(kind: Ikea365Contents): THREE.MeshStandardMaterial {
  const existing = cachedMaterials.get(kind);
  if (existing) return existing;

  const size = 512;
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = size;
  colorCanvas.height = size;
  const cCtx = colorCanvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d')!;

  if (kind === 'rice') {
    const rand = mulberry32(101);
    cCtx.fillStyle = '#ddd3b8';
    cCtx.fillRect(0, 0, size, size);
    bCtx.fillStyle = '#404040';
    bCtx.fillRect(0, 0, size, size);

    const shades = ['#fbf8ef', '#f6f1e2', '#efe7d2', '#fcfaf4'];
    for (let i = 0; i < 2200; i++) {
      const cx = rand() * size;
      const cy = rand() * size;
      const angle = rand() * Math.PI;
      const rx = 15 + rand() * 5;
      const ry = 5 + rand() * 1.8;
      const shade = shades[Math.floor(rand() * shades.length)];
      const bump = Math.round(170 + rand() * 75);

      drawWrapped(size, cx, cy, 24, (x, y) => {
        cCtx.save();
        cCtx.translate(x, y);
        cCtx.rotate(angle);
        cCtx.fillStyle = '#c4b89a';
        cCtx.beginPath();
        cCtx.ellipse(0, 1.5, rx + 1, ry + 1, 0, 0, Math.PI * 2);
        cCtx.fill();
        cCtx.fillStyle = shade;
        cCtx.beginPath();
        cCtx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        cCtx.fill();
        cCtx.restore();
      });

      drawWrapped(size, cx, cy, 24, (x, y) => {
        bCtx.save();
        bCtx.translate(x, y);
        bCtx.rotate(angle);
        bCtx.fillStyle = `rgb(${bump},${bump},${bump})`;
        bCtx.beginPath();
        bCtx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        bCtx.fill();
        bCtx.restore();
      });
    }
  } else if (kind === 'macaroni') {
    const rand = mulberry32(202);
    cCtx.fillStyle = '#8f631d';
    cCtx.fillRect(0, 0, size, size);
    bCtx.fillStyle = '#303030';
    bCtx.fillRect(0, 0, size, size);

    const shades = ['#f0c558', '#e5b342', '#f5d273', '#daa435'];
    for (let i = 0; i < 320; i++) {
      const cx = rand() * size;
      const cy = rand() * size;
      const rot = rand() * Math.PI * 2;
      const radius = 26 + rand() * 6;
      const span = 1.75 + rand() * 0.45;
      const tubeW = 24 + rand() * 5;
      const shade = shades[Math.floor(rand() * shades.length)];

      drawWrapped(size, cx, cy, 55, (x, y) => {
        cCtx.save();
        cCtx.translate(x, y);
        cCtx.rotate(rot);
        cCtx.lineCap = 'butt';
        cCtx.strokeStyle = '#6c4810';
        cCtx.lineWidth = tubeW + 4;
        cCtx.beginPath();
        cCtx.arc(0, 0, radius, -span * 0.5, span * 0.5);
        cCtx.stroke();

        cCtx.strokeStyle = shade;
        cCtx.lineWidth = tubeW;
        cCtx.beginPath();
        cCtx.arc(0, 0, radius, -span * 0.5, span * 0.5);
        cCtx.stroke();

        // Reflet longitudinal et extrémités creuses
        cCtx.strokeStyle = '#fae196';
        cCtx.lineWidth = tubeW * 0.28;
        cCtx.beginPath();
        cCtx.arc(0, 0, radius + tubeW * 0.14, -span * 0.44, span * 0.44);
        cCtx.stroke();

        cCtx.fillStyle = '#5c3c0d';
        for (const endA of [-span * 0.5, span * 0.5]) {
          cCtx.beginPath();
          cCtx.arc(radius * Math.cos(endA), radius * Math.sin(endA), tubeW * 0.24, 0, Math.PI * 2);
          cCtx.fill();
        }
        cCtx.restore();
      });

      drawWrapped(size, cx, cy, 55, (x, y) => {
        bCtx.save();
        bCtx.translate(x, y);
        bCtx.rotate(rot);
        bCtx.lineCap = 'butt';
        bCtx.strokeStyle = '#e8e8e8';
        bCtx.lineWidth = tubeW;
        bCtx.beginPath();
        bCtx.arc(0, 0, radius, -span * 0.5, span * 0.5);
        bCtx.stroke();
        bCtx.restore();
      });
    }
  } else {
    const rand = mulberry32(303);
    cCtx.fillStyle = '#cca147';
    cCtx.fillRect(0, 0, size, size);
    bCtx.fillStyle = '#606060';
    bCtx.fillRect(0, 0, size, size);

    const shades = ['#edd07c', '#e0ba5c', '#f3dc97', '#be8e36', '#d6ab4d'];
    for (let i = 0; i < 15000; i++) {
      const cx = rand() * size;
      const cy = rand() * size;
      const r = 1.8 + rand() * 2.4;
      const shade = shades[Math.floor(rand() * shades.length)];
      const bump = Math.round(110 + rand() * 130);

      drawWrapped(size, cx, cy, 6, (x, y) => {
        cCtx.fillStyle = shade;
        cCtx.beginPath();
        cCtx.arc(x, y, r, 0, Math.PI * 2);
        cCtx.fill();
      });

      drawWrapped(size, cx, cy, 6, (x, y) => {
        bCtx.fillStyle = `rgb(${bump},${bump},${bump})`;
        bCtx.beginPath();
        bCtx.arc(x, y, r, 0, Math.PI * 2);
        bCtx.fill();
      });
    }
  }

  const map = new THREE.CanvasTexture(colorCanvas);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;

  const mat = new THREE.MeshStandardMaterial({
    map,
    bumpMap,
    bumpScale: kind === 'macaroni' ? 0.45 : kind === 'rice' ? 0.25 : 0.14,
    roughness: kind === 'semolina' ? 0.92 : 0.72,
    metalness: 0,
  });
  cachedMaterials.set(kind, mat);
  return mat;
}

export function Ikea36590066708({ onSize, contents, fillLevel }: Ikea365Props) {
  const { scene } = useGLTFClone(GLB);

  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);
    scene.scale.setScalar(100);
    const box = glbLocalBBox(scene);
    scene.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.min.y,
      -(box.min.z + box.max.z) / 2,
    );
    onSize?.(box.getSize(new THREE.Vector3()));
  }, [scene, onSize]);

  return (
    <>
      <primitive object={scene} />
      {contents && (
        <mesh
          geometry={getFillGeometry(fillLevel ?? DEFAULT_FILL_LEVEL[contents])}
          material={getFillMaterial(contents)}
          userData={{ isContainerFill: true }}
        />
      )}
    </>
  );
}

preloadSceneGLTF(GLB);
