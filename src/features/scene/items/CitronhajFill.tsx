import { useMemo } from 'react';
import * as THREE from 'three';

export type CitronhajContents = 'salt' | 'pepper';

const cachedMaterials = new Map<CitronhajContents, THREE.MeshStandardMaterial>();

function createSpiceMaterial(kind: CitronhajContents): THREE.MeshStandardMaterial {
  const existing = cachedMaterials.get(kind);
  if (existing) return existing;

  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = kind === 'salt' ? '#f2f2ef' : '#2a2521';
  ctx.fillRect(0, 0, size, size);

  let seed = kind === 'salt' ? 101 : 202;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let i = 0; i < 1800; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 0.6 + rand() * 1.4;
    if (kind === 'salt') {
      const v = Math.floor(220 + rand() * 35);
      ctx.fillStyle = `rgb(${v},${v},${v - 2})`;
    } else {
      const v = Math.floor(20 + rand() * 75);
      ctx.fillStyle = `rgb(${v + 8},${v + 3},${v})`;
    }
    ctx.fillRect(x, y, r, r);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;

  const material = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.92,
    metalness: 0.0,
  });
  cachedMaterials.set(kind, material);
  return material;
}

/** Remplissage simple (sel ou poivre) à l'intérieur d'un pot CITRONHAJ. */
export function CitronhajFill({ contents = 'salt', height }: { contents?: CitronhajContents; height: number }) {
  const material = useMemo(() => createSpiceMaterial(contents), [contents]);

  return (
    <mesh position={[0, 0.3 + height / 2, 0]} material={material}>
      <cylinderGeometry args={[1.85, 1.85, height, 20]} />
    </mesh>
  );
}
