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
import { useGLTFClone } from '../../../utils/useGLTFClone';
import * as THREE from 'three';
import { removeGlbLines } from '../../../utils/glbUtils';
import type { SceneItemProps } from '../../../types';

const frameMat  = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3 });
const silverMat = new THREE.MeshStandardMaterial({ color: 0xc0c0c0, roughness: 0.1, metalness: 0.8 });

// ── Cadre réutilisable ────────────────────────────────────────────────────────
// Coords locales : centré XZ, Y=0 = bas, face vers +Z.
// Pour orienter sur un mur : envelopper dans un <group rotation-y={...}>.
//   Mur D (face -Z) : rotationY = 0         (NissedalFrame face +Z = dos au mur)
//   Mur A (face +X) : rotationY = Math.PI/2

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

const GLB_40x150 = 'media/NISSEDAL miroir 40x150 noir.glb';
const GLB_65x65  = 'media/NISSEDAL miroir 65x65 noir.glb';

function NissedalMirrorGlb({ glb, onSize }: { glb: string; onSize: SceneItemProps['onSize'] }) {
  const { scene } = useGLTFClone(glb);

  useLayoutEffect(() => {
    removeGlbLines(scene);
    scene.scale.setScalar(100);
    scene.rotation.x = -Math.PI / 2; // Z(hauteur)→Y, Y(épaisseur)→-Z
    scene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(scene);
    scene.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.min.y,
      -(box.min.z + box.max.z) / 2,
    );
    scene.traverse(c => {
      if ((c as THREE.Mesh).isMesh) { c.castShadow = true; c.receiveShadow = true; }
    });
    onSize(new THREE.Box3().setFromObject(scene).getSize(new THREE.Vector3()));
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
  if (item.id === 'mirror-nissedal-d') {
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
