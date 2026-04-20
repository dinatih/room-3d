/**
 * NissedalMirror.tsx — Miroir Nissedal IKEA (procédural).
 * Coordonnées locales : centré XZ, Y=0 = bas du cadre, face vers +Z.
 *
 * mirror-nissedal-a    : 40×150 cm (portrait, mur A ×3)
 * mirror-nissedal-wide : 70×160 cm (portrait, mur A ×1)
 * mirror-nissedal-d    : 60×60  cm (carré,   mur D ×3)
 *
 * NissedalFrame est exporté séparément pour être réutilisé dans Mirrors.tsx
 * (source unique de vérité, pas de duplication FrameA/FrameD).
 */
import { useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
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

// ── Composant inventaire ──────────────────────────────────────────────────────

export function NissedalMirror({ item, onSize }: SceneItemProps) {
  const groupRef = useRef<THREE.Group>(null!);

  const isD    = item.id === 'mirror-nissedal-d';
  const isWide = item.id === 'mirror-nissedal-wide';
  const W  = isD ? 60 : isWide ? 70 : 40;
  const H  = isD ? 60 : isWide ? 160 : 150;
  const FT = isD ? 2 : 1.8;
  const FD = isD ? 1.5 : 1.2;

  useLayoutEffect(() => {
    groupRef.current.updateMatrixWorld(true);
    onSize(new THREE.Box3().setFromObject(groupRef.current).getSize(new THREE.Vector3()));
  }, []);

  return (
    <group ref={groupRef}>
      {/* glace (plan silver pour l'inventaire — Reflector uniquement en scène) */}
      <mesh position={[0, H / 2, 0]} material={silverMat}>
        <boxGeometry args={[W - FT * 2, H - FT * 2, 0.3]} />
      </mesh>
      <NissedalFrame w={W} h={H} ft={FT} fd={FD} />
    </group>
  );
}
