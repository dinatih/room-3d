/**
 * ShoeHatRack.tsx — Range-chaussures / porte-chapeaux tubulaire.
 * Port fidèle de js/decor/shoehatrack.js.
 *
 * Géométrie locale : X=largeur (0→W), Y=hauteur (0→H), Z=profondeur (0→D).
 * Origine = coin bas-gauche avant.
 * Placement monde dans Decor.tsx.
 */
import { useLayoutEffect } from 'react';
import * as THREE from 'three';
import type { SceneItemProps } from '@shared/types';
import { BaseballCap } from './BaseballCap';

const W  = 60;    // largeur
const D  = 26;    // profondeur
const H  = 154;   // hauteur totale
const TR = 0.8;   // rayon tube

const H_BACK  = 72;
const SHELF_YS = [5, 21, 37, 53] as const;
const Y_MID   = 105;
const Y_TOP   = 140;
const HOOK_XS = [W * 0.12, W * 0.37, W * 0.63, W * 0.88] as const;

const metalMat  = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.5, metalness: 0.8 });
const fabricMat = new THREE.MeshStandardMaterial({ color: 0x7a7a7a, roughness: 0.95 });

// ── Cylindre entre deux points 3D ─────────────────────────────────────────────
function Tube({ p1, p2 }: { p1: [number,number,number]; p2: [number,number,number] }) {
  const [x1,y1,z1] = p1, [x2,y2,z2] = p2;
  const dx=x2-x1, dy=y2-y1, dz=z2-z1;
  const len = Math.sqrt(dx*dx+dy*dy+dz*dz);
  if (len < 0.01) return null;
  const mid: [number,number,number] = [(x1+x2)/2, (y1+y2)/2, (z1+z2)/2];
  const q = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0,1,0),
    new THREE.Vector3(dx,dy,dz).normalize(),
  );
  return (
    <mesh position={mid} quaternion={q} castShadow material={metalMat}>
      <cylinderGeometry args={[TR, TR, len, 8]} />
    </mesh>
  );
}

// ── Composant ─────────────────────────────────────────────────────────────────
export function ShoeHatRack({ onSize }: SceneItemProps) {
  useLayoutEffect(() => {
    onSize(new THREE.Vector3(W, H, D));
  }, []);

  return (
    <group userData={{ animUnit: true }}>
      {/* ── Montants avant (pleine hauteur) ── */}
      <Tube p1={[TR,   0, TR]}   p2={[TR,   H,      TR]}   />
      <Tube p1={[W-TR, 0, TR]}   p2={[W-TR, H,      TR]}   />
      {/* ── Montants arrière (zone étagères seulement) ── */}
      <Tube p1={[TR,   0, D-TR]} p2={[TR,   H_BACK, D-TR]} />
      <Tube p1={[W-TR, 0, D-TR]} p2={[W-TR, H_BACK, D-TR]} />

      {/* ── Cadre bas ── */}
      <Tube p1={[TR,   TR, TR]}   p2={[W-TR, TR, TR]}   />
      <Tube p1={[TR,   TR, D-TR]} p2={[W-TR, TR, D-TR]} />
      <Tube p1={[TR,   TR, TR]}   p2={[TR,   TR, D-TR]} />
      <Tube p1={[W-TR, TR, TR]}   p2={[W-TR, TR, D-TR]} />

      {/* ── Transition haut arrière → avant ── */}
      <Tube p1={[TR,   H_BACK, D-TR]} p2={[TR,   H_BACK, TR]} />
      <Tube p1={[W-TR, H_BACK, D-TR]} p2={[W-TR, H_BACK, TR]} />

      {/* ── 4 étagères ── */}
      {SHELF_YS.map(y => (
        <group key={y}>
          <Tube p1={[TR,   y, TR]}   p2={[W-TR, y, TR]}   />
          <Tube p1={[TR,   y, D-TR]} p2={[W-TR, y, D-TR]} />
          <Tube p1={[TR,   y, TR]}   p2={[TR,   y, D-TR]} />
          <Tube p1={[W-TR, y, TR]}   p2={[W-TR, y, D-TR]} />
          <mesh position={[W/2, y+0.75, D/2]} castShadow receiveShadow material={fabricMat}>
            <boxGeometry args={[W-2*TR-0.5, 1.5, D-2*TR-0.5]} />
          </mesh>
        </group>
      ))}

      {/* ── Barres porte-manteaux / chapeaux ── */}
      <Tube p1={[TR, Y_MID, TR]} p2={[W-TR, Y_MID, TR]} />
      <Tube p1={[TR, Y_TOP, TR]} p2={[W-TR, Y_TOP, TR]} />

      {/* ── Crochets doubles (4 positions × 2 barres) ── */}
      {HOOK_XS.flatMap(x => ([Y_MID, Y_TOP] as const).map(barY => (
        <group key={`${x}-${barY}`}>
          {/* Poteau vertical */}
          <Tube p1={[x, barY,        TR]} p2={[x, barY+7,        TR]}     />
          {/* Crochet haut */}
          <Tube p1={[x, barY+7,      TR]} p2={[x, barY+11.5, TR+5.5]}    />
          {/* Crochet bas */}
          <Tube p1={[x, barY+3.85,   TR]} p2={[x, barY+6.85,  TR+4]}     />
          
          {/* Casquette sur le crochet haut */}
          <group position={[x, barY+8, TR+5.5]} rotation={[-Math.PI/6, 0, 0]}>
            <BaseballCap onSize={() => {}} actionState={{}} item={{} as any} />
          </group>
        </group>
      )))}
    </group>
  );
}
