import { useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { glbLocalBBox, mergeGlbByMaterial, removeGlbLines } from '@features/scene/glbUtils';
import type { SceneItemProps } from '@shared/types';
import { useGLTFClone, preloadSceneGLTF } from '@features/scene/useGLTFClone';

type BlaskataProps = Partial<Pick<SceneItemProps, 'onSize' | 'isPreview'>>;

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** Applique une déformation organique unique (courbure, tassement, creux et plis) au polochon. */
function deformBolsterGeometry(geometry: THREE.BufferGeometry, seed: number) {
  if (geometry.userData.bolsterDeformed) return;
  geometry.userData.bolsterDeformed = true;
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  if (!box) return;

  const rand = mulberry32(seed);
  const cx = (box.min.x + box.max.x) / 2;
  const cy = (box.min.y + box.max.y) / 2;
  const cz = (box.min.z + box.max.z) / 2;
  const halfX = Math.max((box.max.x - box.min.x) / 2, 1e-4);
  const halfY = Math.max((box.max.y - box.min.y) / 2, 1e-4);
  const halfZ = Math.max((box.max.z - box.min.z) / 2, 1e-4);
  const height = Math.max(box.max.y - box.min.y, 1e-4);

  const bendAmp = (rand() * 2 - 1) * 0.022;
  const sCurveAmp = (rand() * 2 - 1) * 0.016;
  const sagAmp = (rand() * 2 - 1) * 0.008;
  const phase1 = rand() * Math.PI * 2;
  const phase2 = rand() * Math.PI * 2;
  const phase3 = rand() * Math.PI * 2;
  const freq1 = 5 + rand() * 4;
  const freq2 = 9 + rand() * 5;
  const wrinkleAmp = 0.0045 + rand() * 0.0035;

  const dents = Array.from({ length: 2 }, () => ({
    u: (rand() * 2 - 1) * 0.65,
    theta: (rand() * 2 - 1) * Math.PI,
    sigma: 0.2 + rand() * 0.16,
    depth: 0.012 + rand() * 0.014,
  }));

  const pos = geometry.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);

    const u = (x - cx) / halfX;
    const v = (y - box.min.y) / height;
    const ny = (y - cy) / halfY;
    const nz = (z - cz) / halfZ;
    const theta = Math.atan2(nz, ny);
    const tipFade = 1 - 0.35 * Math.pow(Math.min(Math.abs(u), 1), 4);

    // Courbure latérale et légère ondulation en S le long de l'axe X
    z += (bendAmp * (u * u - 0.35) + sCurveAmp * Math.sin(Math.PI * u + phase1)) * tipFade;
    y += sagAmp * (1 - u * u);

    // Tassement sur la zone d'appui inférieure
    if (v < 0.38) {
      const weight = 1 - v / 0.38;
      y -= weight * 0.012;
      z += nz * weight * 0.014;
    }

    // Creux localisés + plis basse fréquence du tissu
    let radialOffset = wrinkleAmp * tipFade * (
      0.6 * Math.sin(u * freq1 + theta * 2 + phase2) +
      0.4 * Math.sin(u * freq2 - theta * 3 + phase3)
    );
    for (const dent of dents) {
      const du = u - dent.u;
      const axial = Math.exp(-(du * du) / (2 * dent.sigma * dent.sigma));
      const angular = 0.25 + 0.75 * Math.max(0, Math.cos(theta - dent.theta));
      radialOffset -= dent.depth * axial * angular;
    }

    const r = Math.hypot(ny, nz);
    if (r > 1e-4) {
      y += (ny / r) * radialOffset;
      z += (nz / r) * radialOffset;
    }

    pos.setXYZ(i, x, y, z);
  }

  pos.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
}

/**
 * BLÅSKATA coussin, cylindrique/gris clair, 80 cm
 * Price: 24,99
 * URL: https://www.ikea.com/fr/fr/p/blaskata-coussin-cylindrique-gris-clair-50569513/
 */
export function Blaskata50569513({ onSize, isPreview }: BlaskataProps) {
  const { scene } = useGLTFClone('/items/blaskata50569513/Blaskata50569513.glb');
  const seedRef = useRef<number>(Math.floor(Math.random() * 0xffffffff));

  useLayoutEffect(() => {
    removeGlbLines(scene);
    scene.scale.setScalar(1);
    scene.updateMatrixWorld(true);
    
    // Override material to red
    scene.traverse(c => {
      if ((c as THREE.Mesh).isMesh) {
        const m = c as THREE.Mesh;
        if (m.material) {
          const mat = m.material as THREE.MeshStandardMaterial;
          mat.color = new THREE.Color(0xff2222); // Rouge vif
          mat.roughness = 0.8;
        }
      }
    });

    mergeGlbByMaterial(scene);

    if (!isPreview) {
      scene.traverse(c => {
        if ((c as THREE.Mesh).isMesh) {
          const m = c as THREE.Mesh;
          if (!m.geometry.userData.bolsterDeformed) {
            m.geometry = m.geometry.clone();
            deformBolsterGeometry(m.geometry, seedRef.current);
          }
        }
      });
    }

    let box = glbLocalBBox(scene);
    let size = box.getSize(new THREE.Vector3());
    
    // Force dimensions: 100cm length, 20cm diameter
    const sx = size.x > size.y && size.x > size.z ? 100 / size.x : 20 / size.x;
    const sy = size.y > size.x && size.y > size.z ? 100 / size.y : 20 / size.y;
    const sz = size.z > size.x && size.z > size.y ? 100 / size.z : 20 / size.z;
    scene.scale.set(sx, sy, sz);
    
    scene.updateMatrixWorld(true);
    box = glbLocalBBox(scene);
    
    scene.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.min.y,
      -(box.min.z + box.max.z) / 2,
    );
    onSize?.(box.getSize(new THREE.Vector3()));
  }, [scene, onSize, isPreview]);

  return (
    <group>
      <primitive object={scene} />
    </group>
  );
}

preloadSceneGLTF('/items/blaskata50569513/Blaskata50569513.glb');
