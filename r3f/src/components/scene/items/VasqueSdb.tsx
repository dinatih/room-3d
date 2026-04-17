/**
 * Meuble-vasque suspendu SDB — géométrie procédurale fidèle à js/structure/vasque.js.
 * Rendu en coordonnées locales : X/Z centrés sur le meuble, Y=0 = sol.
 * Utilisé dans Furniture.tsx (scène) et dans l'inventaire (SCENE_REGISTRY).
 *
 * Note : le miroir Reflector est rendu séparément par Mirrors.tsx (hors LayerGroup).
 */
import { useLayoutEffect } from 'react';
import * as THREE from 'three';
import type { SceneItemProps } from '../../../types';

// ── Constantes ────────────────────────────────────────────────────────────────

const VANITY_W  = 60;
const VANITY_D  = 47;
const VANITY_H  = 50;
const VANITY_Y0 = 30;
const T_CAB     = 1.8;
const counterH  = 4;
const counterW  = VANITY_W + 3;           // 63
const counterD  = VANITY_D + 1.5;         // 48.5
const counterTopY = VANITY_Y0 + VANITY_H + counterH; // 84
const basinW = 35, basinD = 25, basinH = 12;
const basinCZ = 3;

const counterCX = 0;
const counterCZ = 0.75;

const mirrorW = counterW;
const mirrorH = 90;
const mirrorY = counterTopY + mirrorH / 2;
const mirrorZ = -VANITY_D / 2 + 0.5;

const lampW = 40, lampD = 4, lampH = 2;
const lampY = counterTopY + mirrorH + lampH / 2 + 1;
const lampZ = mirrorZ + 7 + lampD / 2;

const sideW      = (counterW - basinW) / 2;
const frontStart = basinCZ + basinD / 2;
const frontEnd   = counterCZ + counterD / 2;
const actualFrontD = frontEnd - frontStart;

// ── Matériaux ─────────────────────────────────────────────────────────────────

const vanityMat    = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.3 });
const counterMat   = new THREE.MeshStandardMaterial({ color: 0xf8f8f8, roughness: 0.2 });
const basinMat     = new THREE.MeshStandardMaterial({ color: 0xe0e4e8, roughness: 0.15 });
const faucetMat    = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.8, roughness: 0.2 });
const lampMat      = new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.3, metalness: 0.5 });
const lightFaceMat = new THREE.MeshStandardMaterial({
  color: 0xffffff, emissive: 0xffeedd, emissiveIntensity: 1.5, roughness: 0.2,
});

// ── Composant ─────────────────────────────────────────────────────────────────

export function VasqueSdb({ onSize }: SceneItemProps) {
  useLayoutEffect(() => {
    onSize(new THREE.Vector3(counterW, lampY + lampH / 2, counterD));
  }, []);

  return (
    <group>

      {/* ── Caisson suspendu ── */}
      {/* Fond (dos) */}
      <mesh position={[0, VANITY_Y0 + VANITY_H / 2, VANITY_D / 2 - T_CAB / 2]} castShadow receiveShadow material={vanityMat}>
        <boxGeometry args={[VANITY_W, VANITY_H, T_CAB]} />
      </mesh>
      {/* Dessous */}
      <mesh position={[0, VANITY_Y0 + T_CAB / 2, 0]} castShadow receiveShadow material={vanityMat}>
        <boxGeometry args={[VANITY_W, T_CAB, VANITY_D]} />
      </mesh>
      {/* Côté gauche */}
      <mesh position={[-VANITY_W / 2 + T_CAB / 2, VANITY_Y0 + VANITY_H / 2, 0]} castShadow receiveShadow material={vanityMat}>
        <boxGeometry args={[T_CAB, VANITY_H, VANITY_D]} />
      </mesh>
      {/* Côté droit */}
      <mesh position={[VANITY_W / 2 - T_CAB / 2, VANITY_Y0 + VANITY_H / 2, 0]} castShadow receiveShadow material={vanityMat}>
        <boxGeometry args={[T_CAB, VANITY_H, VANITY_D]} />
      </mesh>
      {/* Façade */}
      <mesh position={[0, VANITY_Y0 + VANITY_H / 2, -VANITY_D / 2 + T_CAB / 2]} castShadow receiveShadow material={vanityMat}>
        <boxGeometry args={[VANITY_W, VANITY_H, T_CAB]} />
      </mesh>

      {/* ── Plan vasque ── */}
      {/* Dalle arrière */}
      {(() => {
        const bd = basinCZ - basinD / 2 - (counterCZ - counterD / 2);
        if (bd <= 0.1) return null;
        return (
          <mesh position={[counterCX, counterTopY - counterH / 2, counterCZ - counterD / 2 + bd / 2]} castShadow material={counterMat}>
            <boxGeometry args={[counterW, counterH, bd]} />
          </mesh>
        );
      })()}
      {/* Dalle avant */}
      {actualFrontD > 0.1 && (
        <mesh position={[counterCX, counterTopY - counterH / 2, counterCZ + counterD / 2 - actualFrontD / 2]} castShadow material={counterMat}>
          <boxGeometry args={[counterW, counterH, actualFrontD]} />
        </mesh>
      )}
      {/* Côté gauche plan */}
      <mesh position={[counterCX - counterW / 2 + sideW / 2, counterTopY - counterH / 2, basinCZ]} castShadow material={counterMat}>
        <boxGeometry args={[sideW, counterH, basinD]} />
      </mesh>
      {/* Côté droit plan */}
      <mesh position={[counterCX + counterW / 2 - sideW / 2, counterTopY - counterH / 2, basinCZ]} castShadow material={counterMat}>
        <boxGeometry args={[sideW, counterH, basinD]} />
      </mesh>

      {/* ── Vasque (boîte ouverte) ── */}
      <mesh position={[counterCX, counterTopY - basinH, basinCZ]} receiveShadow material={basinMat}>
        <boxGeometry args={[basinW, 1, basinD]} />
      </mesh>
      <mesh position={[counterCX, counterTopY - basinH / 2, basinCZ - basinD / 2 + 0.5]} material={basinMat}>
        <boxGeometry args={[basinW, basinH, 1]} />
      </mesh>
      <mesh position={[counterCX, counterTopY - basinH / 2, basinCZ + basinD / 2 - 0.5]} material={basinMat}>
        <boxGeometry args={[basinW, basinH, 1]} />
      </mesh>
      <mesh position={[counterCX - basinW / 2 + 0.5, counterTopY - basinH / 2, basinCZ]} material={basinMat}>
        <boxGeometry args={[1, basinH, basinD - 2]} />
      </mesh>
      <mesh position={[counterCX + basinW / 2 - 0.5, counterTopY - basinH / 2, basinCZ]} material={basinMat}>
        <boxGeometry args={[1, basinH, basinD - 2]} />
      </mesh>

      {/* ── Robinet ── */}
      <mesh position={[0, counterTopY + 10, -VANITY_D / 2 + 8]} material={faucetMat}>
        <cylinderGeometry args={[2, 2, 20, 8]} />
      </mesh>
      <mesh position={[0, counterTopY + 20, -VANITY_D / 2 + 14]} material={faucetMat}>
        <boxGeometry args={[1.5, 1.5, 12]} />
      </mesh>

      {/* Miroir — rendu par Mirrors.tsx (MirrorSDB) hors LayerGroup */}

      {/* ── Lampe LED ── */}
      <mesh position={[counterCX, lampY, lampZ]} material={lampMat}>
        <boxGeometry args={[lampW, lampH, lampD]} />
      </mesh>
      <mesh position={[counterCX, lampY - lampH / 2 - 0.01, lampZ]}
        rotation={[Math.PI / 2, 0, 0]} material={lightFaceMat}>
        <planeGeometry args={[lampW - 1, lampD - 0.5]} />
      </mesh>
      <pointLight position={[counterCX, lampY - lampH / 2 - 2, lampZ]}
        intensity={15} distance={120} decay={2} color={0xffeedd} />

    </group>
  );
}
