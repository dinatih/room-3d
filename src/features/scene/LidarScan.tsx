/**
 * LidarScan.tsx — Scan LiDAR iPhone 13 de l'appartement (04/07/2026).
 *
 * Modes :
 *   0 Photo    — textures originales semi-transparentes (ghost overlay)
 *   1 Filaire  — wireframe blanc
 *   2 Points   — nuage de points coloré par hauteur Y
 *   3 Hauteur  — mesh plein coloré par hauteur Y (heatmap sol→plafond)
 *
 * Le GLB est en mètres, la scène en cm → scale=100.
 */
import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { LidarMode } from '@features/scene/SidePanel';

const SCAN_PATH = 'media/4_7_2026_chevaleret.glb';

// ── Alignement ───────────────────────────────────────────────────────────────
const POS_X = 158;
const POS_Y = 83;   // −Y_min du scan (−0.83m × 100)
const POS_Z = 230;

// Y scan après scale×100 : min=−83, max=183 → hauteur totale 266cm
const Y_MIN_WORLD = -83;
const Y_MAX_WORLD =  183;

// ── Matériaux ────────────────────────────────────────────────────────────────
function heightColor(y: number): THREE.Color {
  const t = Math.max(0, Math.min(1, (y - Y_MIN_WORLD) / (Y_MAX_WORLD - Y_MIN_WORLD)));
  // bleu → cyan → vert → jaune → rouge
  return new THREE.Color().setHSL(0.66 - t * 0.66, 1, 0.5);
}

function makePhotoMaterials(src: THREE.Material | THREE.Material[], opacity: number): THREE.Material | THREE.Material[] {
  const apply = (m: THREE.Material) => {
    const c = (m as THREE.MeshStandardMaterial).clone();
    c.transparent = opacity < 1;
    c.opacity     = opacity;
    c.depthWrite  = opacity >= 1;
    c.side        = THREE.FrontSide;
    return c;
  };
  return Array.isArray(src) ? src.map(apply) : apply(src);
}

const wireMat = new THREE.MeshBasicMaterial({
  color:       0xffffff,
  wireframe:   true,
  transparent: true,
  opacity:     0.35,
  depthWrite:  false,
});

// ── Nuage de points par hauteur Y ────────────────────────────────────────────
function buildPointCloud(scene: THREE.Group): THREE.Points {
  const positions: number[] = [];
  const colors:    number[] = [];

  scene.traverse(obj => {
    if (!(obj instanceof THREE.Mesh)) return;
    const geo = obj.geometry as THREE.BufferGeometry;
    const pos = geo.attributes.position;
    if (!pos) return;
    const mat = obj.matrixWorld;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(mat);
      positions.push(v.x, v.y, v.z);
      const c = heightColor(v.y);
      colors.push(c.r, c.g, c.b);
    }
  });

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('color',    new THREE.Float32BufferAttribute(colors,    3));
  return new THREE.Points(
    geo,
    new THREE.PointsMaterial({ size: 3, vertexColors: true, sizeAttenuation: true, depthWrite: false }),
  );
}

// ── Composant ────────────────────────────────────────────────────────────────
export function LidarScan({ mode, opacity }: { mode: LidarMode; opacity: number }) {
  const { scene } = useGLTF(SCAN_PATH);

  // Mode 0 : photo ghost
  const photoClone = useMemo(() => {
    const c = scene.clone(true);
    c.traverse(obj => {
      if (obj instanceof THREE.Mesh)
        obj.material = makePhotoMaterials(obj.material, opacity);
    });
    return c;
  }, [scene, opacity]);

  // Mode 1 : wireframe
  const wireClone = useMemo(() => {
    const c = scene.clone(true);
    c.traverse(obj => { if (obj instanceof THREE.Mesh) obj.material = wireMat; });
    return c;
  }, [scene]);

  // Mode 2 : nuage de points (calculé en world space → scale=1, position=[0,0,0])
  const pointCloud = useMemo(() => {
    // Clone temporaire mis à l'échelle pour récupérer les positions réelles
    const tmp = scene.clone(true);
    tmp.scale.setScalar(100);
    tmp.position.set(POS_X, POS_Y, POS_Z);
    tmp.rotation.y = Math.PI;
    tmp.updateWorldMatrix(true, true);
    return buildPointCloud(tmp);
  }, [scene]);

  // Mode 3 : mesh plein gradient hauteur
  const heightClone = useMemo(() => {
    const c = scene.clone(true);
    c.traverse(obj => {
      if (!(obj instanceof THREE.Mesh)) return;
      const geo = obj.geometry as THREE.BufferGeometry;
      const pos = geo.attributes.position;
      if (!pos) return;
      const colorData = new Float32Array(pos.count * 3);
      for (let i = 0; i < pos.count; i++) {
        const yWorld = pos.getY(i) * 100 + POS_Y;
        const col = heightColor(yWorld);
        colorData[i * 3]     = col.r;
        colorData[i * 3 + 1] = col.g;
        colorData[i * 3 + 2] = col.b;
      }
      const g = geo.clone();
      g.setAttribute('color', new THREE.Float32BufferAttribute(colorData, 3));
      obj.geometry = g;
      obj.material = new THREE.MeshBasicMaterial({
        vertexColors: true,
        transparent:  opacity < 1,
        opacity,
        depthWrite:   opacity >= 1,
        side:         THREE.FrontSide,
      });
    });
    return c;
  }, [scene, opacity]);

  const sharedProps = {
    scale:      100,
    position:   [POS_X, POS_Y, POS_Z] as [number, number, number],
    'rotation-y': Math.PI,
  };

  if (mode === 2) {
    // Points : déjà en world space, pas de scale/position
    return <primitive object={pointCloud} />;
  }

  return (
    <primitive
      object={mode === 0 ? photoClone : mode === 1 ? wireClone : heightClone}
      {...sharedProps}
    />
  );
}

useGLTF.preload(SCAN_PATH);
