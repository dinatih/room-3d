/**
 * NissedalMirror.tsx — Miroir NISSEDAL IKEA.
 *
 * mirror-nissedal-a    : GLB NISSEDAL miroir 40x150 noir.glb
 * mirror-nissedal-d    : GLB NISSEDAL miroir 65x65 noir.glb
 * mirror-nissedal-wide : procédural 70×160 cm (pas de GLB officiel)
 *
 * NissedalFrame est exporté séparément pour Mirrors.tsx (Reflector en scène).
 * Les GLBs sont orientés debout avec Z=hauteur, Y=épaisseur → rotation.x=-π/2.
 * Coordonnées locales : centré X/Z, Y=0 = bas du cadre.
 */
import { useLayoutEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import * as THREE from 'three';
import { removeGlbLines, glbLocalBBox, mergeGlbByMaterial } from '@features/scene/glbUtils';
import type { SceneItemProps } from '@shared/types';

const frameMat  = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3 });
const silverMat = new THREE.MeshStandardMaterial({ color: 0xc0c0c0, roughness: 0.1, metalness: 0.8 });

// ── Cadre réutilisable ────────────────────────────────────────────────────────
// Coords locales : centré XZ, Y=0 = bas, face vers +Z.
// Pour orienter sur un mur : envelopper dans un <group rotation-y={...}>.
//   Mur Sud (face -Z) : rotationY = 0         (NissedalFrame face +Z = dos au mur)
//   Mur Ouest (face +X) : rotationY = Math.PI/2

export function NissedalFrame({ w, h, ft, fd }: { w: number; h: number; ft: number; fd: number }) {
  return (
    <>
      {/* barre haute */}
      <mesh position={[0, h - ft / 2, 0]} material={frameMat}>
        <boxGeometry args={[w, ft, fd]} />
      </mesh>
      {/* barre basse */}
      <mesh position={[0, ft / 2, 0]} material={frameMat}>
        <boxGeometry args={[w, ft, fd]} />
      </mesh>
      {/* montant gauche */}
      <mesh position={[-w / 2 + ft / 2, h / 2, 0]} material={frameMat}>
        <boxGeometry args={[ft, h, fd]} />
      </mesh>
      {/* montant droit */}
      <mesh position={[w / 2 - ft / 2, h / 2, 0]} material={frameMat}>
        <boxGeometry args={[ft, h, fd]} />
      </mesh>
    </>
  );
}

// ── Composant inventaire GLB ──────────────────────────────────────────────────

export const GLB_40x150 = 'media/glb/ikea-official/NISSEDAL miroir 40x150 noir.glb';
export const GLB_65x65  = 'media/glb/ikea-official/Nissedal50320320.glb';

/**
 * Cadre GLB pour la scène (Mirrors.tsx) : charge le GLB et masque la glace.
 * Coords locales : centré X/Z, Y=0 = bas du cadre.
 * targetH : si fourni, normalise la hauteur à cette valeur (cm) ; sinon scale×100 (GLB en mètres).
 */
export function NissedalGlbFrame({ glb, targetH }: { glb: string; targetH?: number }) {
  const { scene } = useGLTFClone(glb);

  useLayoutEffect(() => {
    removeGlbLines(scene);
    scene.scale.set(1, 1, 1);
    scene.rotation.x = -Math.PI / 2; // Z-up GLB : Z(hauteur)→Y, Y(épaisseur)→-Z, glace→-Z
    const rawBox  = glbLocalBBox(scene);
    const naturalH = rawBox.max.y - rawBox.min.y;
    const s = targetH !== undefined && naturalH > 0 ? targetH / naturalH : 100;
    scene.scale.setScalar(s);

    // Identifier la glace = mesh avec la plus grande surface XY (après rotation)
    // Le cadre est composé de petites barres ; la glace couvre presque toute la surface.
    const meshes: THREE.Mesh[] = [];
    scene.traverse(c => { if ((c as THREE.Mesh).isMesh) meshes.push(c as THREE.Mesh); });

    let glassMesh: THREE.Mesh | null = null;
    if (meshes.length > 1) {
      let maxArea = 0;
      for (const m of meshes) {
        const s = new THREE.Box3().setFromObject(m).getSize(new THREE.Vector3());
        const area = s.x * s.y;
        if (area > maxArea) { maxArea = area; glassMesh = m; }
      }
    }

    for (const m of meshes) {
      if (m === glassMesh) {
        m.visible = false; // glace masquée — remplacée par Reflector
      }
    }

    mergeGlbByMaterial(scene);
    const box = glbLocalBBox(scene);
    makeNissedalBackTransparent(scene, box);
    scene.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.min.y,
      -(box.min.z + box.max.z) / 2,
    );
  }, [scene]);

  return <primitive object={scene} />;
}

function makeNissedalBackTransparent(scene: THREE.Object3D, box: THREE.Box3) {
  scene.traverse(node => {
    const mesh = node as THREE.Mesh;
    if (!mesh.isMesh) return;
    const geo = mesh.geometry;
    const indexAttr = geo.getIndex();
    const posAttr = geo.getAttribute('position');
    if (!posAttr) return;

    const pos = posAttr.array;
    const indices = indexAttr ? indexAttr.array : null;
    const border = 1.0; // cm (le cadre GLB mesure ~1.4cm de large, 1.0cm capture toute la glace et le dos)

    const isCenter = (vx: number, vy: number) => {
      return (
        vx > box.min.x + border &&
        vx < box.max.x - border &&
        vy > box.min.y + border &&
        vy < box.max.y - border
      );
    };

    if (indices) {
      const newIndices: number[] = [];
      for (let i = 0; i < indices.length; i += 3) {
        const i0 = indices[i];
        const i1 = indices[i + 1];
        const i2 = indices[i + 2];

        const v0x = pos[i0 * 3], v0y = pos[i0 * 3 + 1];
        const v1x = pos[i1 * 3], v1y = pos[i1 * 3 + 1];
        const v2x = pos[i2 * 3], v2y = pos[i2 * 3 + 1];

        if (isCenter(v0x, v0y) && isCenter(v1x, v1y) && isCenter(v2x, v2y)) {
          continue;
        }
        newIndices.push(i0, i1, i2);
      }

      const newIndexAttr = new (indices.constructor as any)(newIndices);
      geo.setIndex(new THREE.BufferAttribute(newIndexAttr, 1));
      if (geo.index) geo.index.needsUpdate = true;
    } else {
      const newPos: number[] = [];
      const normAttr = geo.getAttribute('normal');
      const uvAttr = geo.getAttribute('uv');
      const newNorm: number[] = [];
      const newUv: number[] = [];

      const posArr = posAttr.array;
      const normArr = normAttr ? normAttr.array : null;
      const uvArr = uvAttr ? uvAttr.array : null;

      for (let i = 0; i < posArr.length; i += 9) {
        const v0x = posArr[i], v0y = posArr[i + 1];
        const v1x = posArr[i + 3], v1y = posArr[i + 4];
        const v2x = posArr[i + 6], v2y = posArr[i + 7];

        if (isCenter(v0x, v0y) && isCenter(v1x, v1y) && isCenter(v2x, v2y)) {
          continue;
        }

        for (let j = 0; j < 9; j++) newPos.push(posArr[i + j]);
        if (normArr) {
          for (let j = 0; j < 9; j++) newNorm.push(normArr[i + j]);
        }
        if (uvArr) {
          for (let j = 0; j < 6; j++) newUv.push(uvArr[(i / 9) * 6 + j]);
        }
      }

      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(newPos), 3));
      if (normArr) {
        geo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(newNorm), 3));
      }
      if (uvArr) {
        geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(newUv), 2));
      }
      geo.attributes.position.needsUpdate = true;
    }
  });
}

function NissedalMirrorGlb({ glb, onSize }: { glb: string; onSize: SceneItemProps['onSize'] }) {
  const { scene } = useGLTFClone(glb);

  useLayoutEffect(() => {
    removeGlbLines(scene);
    scene.scale.setScalar(100);
    scene.rotation.x = -Math.PI / 2; // Z(hauteur)→Y, Y(épaisseur)→-Z
    mergeGlbByMaterial(scene);
    const box = glbLocalBBox(scene);
    makeNissedalBackTransparent(scene, box);
    scene.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.min.y,
      -(box.min.z + box.max.z) / 2,
    );
    onSize(box.getSize(new THREE.Vector3()));
  }, [scene]);

  return <primitive object={scene} />;
}

useGLTF.preload(GLB_40x150);
useGLTF.preload(GLB_65x65);

export function NissedalMirror({ item, onSize }: SceneItemProps) {
  // mirror-nissedal-a   → GLB 40×150
  // mirror-nissedal-d   → GLB 65×65
  // mirror-nissedal-wide → procédural (pas de GLB officiel)
  if (item.id === 'mirror-nissedal-a') {
    return <NissedalMirrorGlb glb={GLB_40x150} onSize={onSize} />;
  }
  if (item.id === 'mirror-nissedal-d' || item.id === 'nissedal50320320') {
    return <NissedalMirrorGlb glb={GLB_65x65} onSize={onSize} />;
  }

  // Fallback procédural pour mirror-nissedal-wide (70×160)
  const W = 70, H = 160, FT = 1.8, FD = 1.2;
  return <NissedalMirrorWide w={W} h={H} ft={FT} fd={FD} onSize={onSize} />;
}

function NissedalMirrorWide({ w, h, ft, fd, onSize }: {
  w: number; h: number; ft: number; fd: number;
  onSize: SceneItemProps['onSize'];
}) {
  const groupRef = useRef<THREE.Group>(null!);

  useLayoutEffect(() => {
    groupRef.current.updateMatrixWorld(true);
    onSize(new THREE.Box3().setFromObject(groupRef.current).getSize(new THREE.Vector3()));
  }, []);

  return (
    <group ref={groupRef}>
      <mesh position={[0, h / 2, 0]} material={silverMat}>
        <boxGeometry args={[w - ft * 2, h - ft * 2, 0.3]} />
      </mesh>
      <NissedalFrame w={w} h={h} ft={ft} fd={fd} />
    </group>
  );
}
