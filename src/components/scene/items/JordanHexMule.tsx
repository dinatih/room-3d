/**
 * JordanHexMule.tsx — Jordan Hex Mule SP, semelle seule (University Red, FJ0603-600).
 * Forme en prisme hexagonal (6 faces latérales = "coffin shape") :
 *   2 faces longues (flancs) + 2 épaulements diagonaux (≈60° de l'axe long) + 1 face bout + 1 face talon.
 * Dimensions taille 44.5 EU : L=285, W=98, H_sole=42.
 * Coordonnées locales : centré XZ, Y=0 = sol. Paire côte à côte.
 *
 * Angles mesurés (photo) :
 *   - Épaulements : 60° depuis l'axe longitudinal → ΔZ = (W-Wt)/2 / tan(60°) ≈ 17
 */
import { useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import type { SceneItemProps } from '../../../types';

// Materials
const matRed  = new THREE.MeshStandardMaterial({ color: 0xb31c1c, roughness: 0.75 });
const matDark = new THREE.MeshStandardMaterial({ color: 0x7d1212, roughness: 0.85 });
const matBed  = new THREE.MeshStandardMaterial({ color: 0xc44444, roughness: 0.55 });

// ── Dimensions (1 unit = 1 cm) ────────────────────────────────────────────────
const L   = 285   // longueur totale (axe Z scène)
const W   = 98    // largeur max au talon (axe X)
const Wt  = 40    // largeur de la face bout (toe)
const SH  = 42    // épaisseur de la semelle (axe Y)
const D   = Math.round((W - Wt) / 2 / Math.tan((60 * Math.PI) / 180)) // ≈ 17
const GAP = 6     // écartement entre les deux semelles de la paire

// ── Empreinte hexagonale (vue de dessus, plan XY local) ──────────────────────
// Après rotation Rx(-π/2) : local.x→scène.x, local.y→−scène.z, local.z→scène.y
// Bout au local.y=+L/2 → scène.z=−L/2 (avant), talon au local.y=−L/2 → scène.z=+L/2
// Sens CCW requis par THREE.Shape pour que les normales sortent côté +local.Z (+scène.Y)
const footprintShape = (() => {
  const s = new THREE.Shape();
  s.moveTo(-Wt / 2,  L / 2);         // bout gauche
  s.lineTo( Wt / 2,  L / 2);         // bout droit
  s.lineTo( W  / 2,  L / 2 - D);     // épaulement droit
  s.lineTo( W  / 2, -L / 2);         // talon droit
  s.lineTo(-W  / 2, -L / 2);         // talon gauche
  s.lineTo(-W  / 2,  L / 2 - D);     // épaulement gauche
  s.closePath();
  return s;
})();

// Semelle extrudée (SH vers le haut depuis Y=0)
const soleGeo = new THREE.ExtrudeGeometry(footprintShape, { depth: SH, bevelEnabled: false });

// Footbed plat : même empreinte hexagonale, posé au dessus de la semelle
const footbedGeo = new THREE.ShapeGeometry(footprintShape);

// ── Composant "une semelle" ───────────────────────────────────────────────────
// xOff : décalage sur X pour la paire
// mirror : true = semelle droite (scale.x = −1 = détails latéraux inversés)
function ShoeSole({ xOff, mirror }: { xOff: number; mirror: boolean }) {
  const toeZ = -L / 2;

  return (
    <group position={[xOff, 0, 0]} scale={[mirror ? -1 : 1, 1, 1]}>

      {/* ── Corps de la semelle (prisme hexagonal) ── */}
      {/* Rotation Rx(-π/2) : plan XY local → plan XZ scène ; extrusion local.z → scène.y */}
      <mesh
        geometry={soleGeo}
        material={matRed}
        rotation={[-Math.PI / 2, 0, 0]}
        castShadow
        receiveShadow
      />

      {/* ── Semelle extérieure : rainures verticales (vue dessous) ── */}
      {Array.from({ length: 9 }, (_, i) => {
        const z = toeZ + 18 + (i / 8) * (L - 30);
        return (
          <mesh key={i} position={[0, 1.2, z]} material={matDark} receiveShadow>
            <boxGeometry args={[W - 2, 3, 4]} />
          </mesh>
        );
      })}

      {/* ── Fentes latérales de ventilation (flanc extérieur, 2 encoches) ── */}
      {/* Positionnées sur le flanc droit (face extérieure du flanc long) */}
      <mesh position={[W / 2 - 2, SH * 0.5, toeZ + L * 0.36]} material={matDark}>
        <boxGeometry args={[6, SH * 0.28, 14]} />
      </mesh>
      <mesh position={[W / 2 - 2, SH * 0.5, toeZ + L * 0.52]} material={matDark}>
        <boxGeometry args={[6, SH * 0.28, 14]} />
      </mesh>

      {/* ── Semelle intérieure (footbed) — même empreinte hexagonale ── */}
      <mesh
        geometry={footbedGeo}
        material={matBed}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, SH + 0.5, 0]}
        receiveShadow
      />

      {/* ── Logo Jumpman (cercle embossé sur la semelle intérieure) ── */}
      <mesh
        position={[0, SH + 1.3, toeZ + L * 0.52]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={matDark}
      >
        <circleGeometry args={[6, 20]} />
      </mesh>
    </group>
  );
}

// ── Export : paire de semelles ─────────────────────────────────────────────────
export function JordanHexMule({ onSize }: SceneItemProps) {
  const groupRef = useRef<THREE.Group>(null!);

  useLayoutEffect(() => {
    groupRef.current.updateMatrixWorld(true);
    onSize(new THREE.Box3().setFromObject(groupRef.current).getSize(new THREE.Vector3()));
  }, []);

  const xOff = W / 2 + GAP / 2;

  return (
    <group ref={groupRef}>
      <ShoeSole xOff={+xOff} mirror={false} />
      <ShoeSole xOff={-xOff} mirror={true} />
    </group>
  );
}
