/**
 * Backpack.tsx — Sac à dos de voyage procédural rouge (version vide).
 * Dimensions finales : 40cm (H) x 32cm (L) x 8.5cm (P).
 * Profil triangulaire (dos plat, devant incliné).
 */
import { useLayoutEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import type { SceneItemProps } from '@shared/types';

// Matériaux partagés
const bagMat    = new THREE.MeshStandardMaterial({ color: 0xd32f2f, roughness: 0.6 });
const strapMat  = new THREE.MeshStandardMaterial({ color: 0xd32f2f, roughness: 0.8 });
const zipperMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4 });
const logoMat   = new THREE.MeshStandardMaterial({ color: 0x333333 });

function BackpackGeom({ W, H, D, groupRef }: { W: number; H: number; D: number; groupRef: React.RefObject<THREE.Group> }) {
  // Profondeur au sommet (40% de la base pour le profil triangulaire)
  const dTop = D * 0.47; 

  // Géométrie du corps avec face avant inclinée
  const bodyGeo = useMemo(() => {
    const geo = new THREE.BoxGeometry(W, H, D, 1, 1, 1);
    const pos = geo.attributes.position;
    // Z: Arrière est -D/2, Avant est +D/2
    // Top est Y: H/2, Bottom est Y: -H/2
    for (let i = 0; i < pos.count; i++) {
      if (pos.getY(i) > 0 && pos.getZ(i) > 0) {
        // Déplace les sommets avant-haut vers l'arrière pour créer la pente
        pos.setZ(i, -D/2 + dTop);
      }
    }
    geo.computeVertexNormals();
    return geo;
  }, [W, H, D, dTop]);

  // Calcul de la pente pour l'inclinaison des éléments frontaux
  const slopeAngle = Math.atan((D - dTop) / H);
  const pY = 12;
  const pZ = (D/2) - (pY/H) * (D - dTop) + 1.5; // +1.5 pour l'épaisseur de la poche

  return (
    <group ref={groupRef}>
      {/* Corps Principal */}
      <mesh geometry={bodyGeo} material={bagMat} position={[0, H / 2, 0]} castShadow receiveShadow />

      {/* Anse (Demi-cercle) */}
      <mesh position={[0, H, -D/2 + dTop/2]} rotation={[0, 0, 0]}>
        <torusGeometry args={[5, 1, 12, 24, Math.PI]} />
        <primitive object={strapMat} attach="material" />
      </mesh>

      {/* Poche Avant fixée */}
      <group position={[0, pY, pZ]} rotation={[-slopeAngle, 0, 0]}>
        <mesh castShadow material={bagMat}>
          <boxGeometry args={[W * 0.8, 25, 3]} />
        </mesh>
        {/* Zip de la poche */}
        <mesh position={[0, 8, 1.5]} material={zipperMat}>
          <boxGeometry args={[W * 0.7, 0.5, 0.5]} />
        </mesh>
        {/* Logo */}
        <mesh position={[0, 2, 1.5]} material={logoMat}>
          <boxGeometry args={[5, 3, 0.2]} />
        </mesh>
      </group>

      {/* Bretelles (Dos plat) */}
      {([-1, 1] as const).map(s => (
        <mesh key={s} position={[s * 8, H - 19, -D/2 - 0.6]} castShadow material={strapMat}>
          <boxGeometry args={[6, 38, 1.2]} />
        </mesh>
      ))}
    </group>
  );
}

/** Grand sac à dos — 40×32×8.5 cm (version vide pour accroche) */
export function Backpack({ onSize }: SceneItemProps) {
  const groupRef = useRef<THREE.Group>(null!);
  
  useLayoutEffect(() => {
    // Calcul précis des dimensions pour le système de placement
    const box = new THREE.Box3().setFromObject(groupRef.current);
    const size = new THREE.Vector3();
    box.getSize(size);
    onSize(size);
  }, [onSize]);

  return <BackpackGeom W={32} H={40} D={8.5} groupRef={groupRef} />;
}

/** Petit sac à dos — Conservé pour la compatibilité (utilisera les mêmes proportions) */
export function BackpackSmall({ onSize }: SceneItemProps) {
  const groupRef = useRef<THREE.Group>(null!);
  
  useLayoutEffect(() => {
    const box = new THREE.Box3().setFromObject(groupRef.current);
    const size = new THREE.Vector3();
    box.getSize(size);
    onSize(size);
  }, [onSize]);

  // Version 20% plus petite
  return <BackpackGeom W={26} H={32} D={7} groupRef={groupRef} />;
}
