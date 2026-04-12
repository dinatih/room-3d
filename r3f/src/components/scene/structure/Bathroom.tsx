/**
 * Salle de bain — port fidèle de js/structure/bathroom.js + vasque.js + wc.js.
 *
 * Contenu : douche (base + vitrage), WC, vasque suspendue + plan + miroir + lampe,
 * ballon d'eau chaude, tapis pelouse synthétique.
 * Les meubles SDB (BathroomCabinetWest/East) sont placés par Furniture.tsx.
 */
import { useMemo, useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// @ts-ignore
import {
  NICHE_DEPTH, KITCHEN_Z, SDB_Z_END, DOOR_START, WALL_H,
} from '@config';

import { makeGrassTex } from './Floor';

// ── Constantes douche ─────────────────────────────────────────────────────────

const SHOWER_W  = 70;
const SHOWER_D  = 70;
const SHOWER_X0 = -NICHE_DEPTH;          // -10
const SHOWER_X1 = SHOWER_X0 + SHOWER_W; // 60
const SHOWER_Z0 = SDB_Z_END;            // 600
const SHOWER_Z1 = SHOWER_Z0 + SHOWER_D; // 670
const showerCX  = (SHOWER_X0 + SHOWER_X1) / 2; // 25
const showerCZ  = (SHOWER_Z0 + SHOWER_Z1) / 2; // 635

// ── Constantes WC ────────────────────────────────────────────────────────────

const WC_W   = 40;
const WC_X0  = -NICHE_DEPTH + 40;       // 30
const WC_Z0  = KITCHEN_Z + 11;          // 471
const WC_CX  = WC_X0 + WC_W / 2;       // 50
const R      = WC_W / 2;                // 20
const bowlOval = 1.15;
const bowlH  = 40;
const tankD  = 18;
const tankH  = 38;
const tankW  = WC_W - 2;               // 38
const tankLidH = 3.5;
const bowlCZ = WC_Z0 + tankD + R * bowlOval; // 512

// ── Constantes vasque ─────────────────────────────────────────────────────────

const VANITY_W  = 60;
const VANITY_D  = 47;
const VANITY_H  = 50;
const VANITY_Y0 = 30;
const VANITY_X1 = DOOR_START - 48;                    // 142
const VANITY_X0 = VANITY_X1 - VANITY_W;               // 82
const VANITY_CX = (VANITY_X0 + VANITY_X1) / 2;        // 112
const VANITY_CZ = KITCHEN_Z + 11 + VANITY_D / 2;      // 494.5
const T_CAB     = 1.8;
const counterH  = 4;
const counterW  = VANITY_W + 3;                        // 63
const counterD  = VANITY_D + 1.5;                      // 48.5
const counterTopY = VANITY_Y0 + VANITY_H + counterH;  // 84
const basinW = 35, basinD = 25, basinH = 12;
const basinCZ = 3; // local Z relative to vanity center

// ── Matériaux ─────────────────────────────────────────────────────────────────

const glassMat  = new THREE.MeshPhysicalMaterial({
  color: 0x88ccff, transparent: true, opacity: 0.2,
  roughness: 0.05, side: THREE.DoubleSide,
});
const frameMat  = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.3 });
const baseMat   = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.3 });
const wcMat     = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.12, metalness: 0.04 });
const wcInnerMat = new THREE.MeshStandardMaterial({ color: 0xdfdfdf, roughness: 0.07, side: THREE.DoubleSide });
const seatMat   = new THREE.MeshStandardMaterial({ color: 0xefefef, roughness: 0.18 });
const lidMat    = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.10, metalness: 0.02 });
const vanityMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.3 });
const counterMat = new THREE.MeshStandardMaterial({ color: 0xf8f8f8, roughness: 0.2 });
const basinMat  = new THREE.MeshStandardMaterial({ color: 0xe0e4e8, roughness: 0.15 });
const faucetMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.8, roughness: 0.2 });
const mirrorMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.9, roughness: 0.05 });
const lampMat   = new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.3, metalness: 0.5 });
const lightFaceMat = new THREE.MeshStandardMaterial({
  color: 0xffffff, emissive: 0xffeedd, emissiveIntensity: 1.5, roughness: 0.2,
});
const hwMat     = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.3 });
const hwCapMat  = new THREE.MeshStandardMaterial({ color: 0xd0d0d0, roughness: 0.4 });
const bracketMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.6, roughness: 0.3 });
const waterMat  = new THREE.MeshStandardMaterial({ color: 0x7ab8d4, roughness: 0.01, transparent: true, opacity: 0.55 });
const btnBaseMat  = new THREE.MeshStandardMaterial({ color: 0xbababa, roughness: 0.18, metalness: 0.55 });
const btnBigMat   = new THREE.MeshStandardMaterial({ color: 0xe2e2e2, roughness: 0.10, metalness: 0.50 });
const btnSmallMat = new THREE.MeshStandardMaterial({ color: 0xd0d0d0, roughness: 0.13, metalness: 0.48 });

// ── Douche ────────────────────────────────────────────────────────────────────

function Shower() {
  const BASE_H  = 20;
  const GLASS_H = 180;
  return (
    <group>
      {/* Cuve */}
      <mesh position={[showerCX, BASE_H / 2, showerCZ]} castShadow receiveShadow material={baseMat}>
        <boxGeometry args={[SHOWER_W, BASE_H, SHOWER_D]} />
      </mesh>
      {/* Vitrage frontal */}
      <mesh position={[showerCX, BASE_H + GLASS_H / 2, SHOWER_Z0]} material={glassMat}>
        <planeGeometry args={[SHOWER_W, GLASS_H]} />
      </mesh>
      {/* Barre cadre haut */}
      <mesh position={[showerCX, BASE_H + GLASS_H, SHOWER_Z0]} material={frameMat}>
        <boxGeometry args={[SHOWER_W, 3, 1.5]} />
      </mesh>
    </group>
  );
}

// ── WC ────────────────────────────────────────────────────────────────────────

function WC() {
  const lidRef = useRef<THREE.Group>(null!);
  const lidOpen = useRef(false);
  const { invalidate } = useThree();
  useEffect(() => {
    const onToggle = (e: Event) => {
      if ((e as CustomEvent).detail?.key !== 'wcLid') return;
      lidOpen.current = !lidOpen.current;
      if (lidRef.current) lidRef.current.rotation.x = lidOpen.current ? -Math.PI / 2 : 0;
      invalidate();
    };
    document.addEventListener('furniture-toggle', onToggle);
    return () => document.removeEventListener('furniture-toggle', onToggle);
  }, [invalidate]);

  const { outerGeo, innerGeo, seatGeo } = useMemo(() => {
    const outerPts = [
      new THREE.Vector2(0.1,       0),
      new THREE.Vector2(R * 0.88,  0),
      new THREE.Vector2(R * 0.88,  2.5),
      new THREE.Vector2(R * 0.50,  6.0),
      new THREE.Vector2(R * 0.39,  10.0),
      new THREE.Vector2(R * 0.37,  19.0),
      new THREE.Vector2(R * 0.55,  27.0),
      new THREE.Vector2(R * 0.88,  33.5),
      new THREE.Vector2(R + 1.0,   37.5),
      new THREE.Vector2(R,         bowlH),
      new THREE.Vector2(R * 0.68,  bowlH),
    ];
    const innerPts = [
      new THREE.Vector2(R * 0.68,  bowlH),
      new THREE.Vector2(R * 0.62,  37.0),
      new THREE.Vector2(R * 0.50,  30.0),
      new THREE.Vector2(R * 0.30,  22.0),
      new THREE.Vector2(R * 0.16,  16.0),
      new THREE.Vector2(0.1,       13.5),
    ];
    const seatRX    = R * 0.90;
    const seatRZ    = seatRX * bowlOval;
    const seatOuter = new THREE.EllipseCurve(0, 0, seatRX,        seatRZ,        0, Math.PI * 2);
    const seatInner = new THREE.EllipseCurve(0, 0, seatRX * 0.70, seatRZ * 0.70, 0, Math.PI * 2);
    const seatShape = new THREE.Shape(seatOuter.getPoints(64));
    seatShape.holes.push(new THREE.Path(seatInner.getPoints(64)));
    const sGeo = new THREE.ExtrudeGeometry(seatShape, {
      depth: 2.8, bevelEnabled: true, bevelSize: 0.6, bevelThickness: 0.5, bevelSegments: 5,
    });
    sGeo.rotateX(Math.PI / 2);

    return {
      outerGeo: new THREE.LatheGeometry(outerPts, 40),
      innerGeo: new THREE.LatheGeometry(innerPts, 40),
      seatGeo:  sGeo,
    };
  }, []);

  const seatRX = R * 0.90;
  const seatRZ = seatRX * bowlOval;
  const lidRX  = seatRX - 0.5;
  const hingeZ = bowlCZ - seatRZ + 1.5;
  const btnY   = bowlH + tankH + tankLidH + 0.8;
  const btnCZ  = WC_Z0 + tankD / 2;

  return (
    <group userData={{ hoverAction: { label: 'WC abattant', actionId: 'wcLid' } }}>
      {/* Coque extérieure */}
      <mesh geometry={outerGeo} material={wcMat} castShadow receiveShadow
        position={[WC_CX, 0, bowlCZ]} scale={[1, 1, bowlOval]} />
      {/* Cavité intérieure */}
      <mesh geometry={innerGeo} material={wcInnerMat}
        position={[WC_CX, 0, bowlCZ]} scale={[1, 1, bowlOval]} />
      {/* Fond cuvette */}
      <mesh position={[WC_CX, 13.5, bowlCZ]} rotation={[-Math.PI / 2, 0, 0]}
        material={wcInnerMat} scale={[1, bowlOval, 1]}>
        <circleGeometry args={[R * 0.16, 36]} />
      </mesh>
      {/* Eau */}
      <mesh position={[WC_CX, 13.6, bowlCZ]} rotation={[-Math.PI / 2, 0, 0]}
        material={waterMat} scale={[1, bowlOval, 1]}>
        <circleGeometry args={[R * 0.16 * 0.88, 36]} />
      </mesh>

      {/* Siège */}
      <mesh geometry={seatGeo} material={seatMat} castShadow
        position={[WC_CX, bowlH + 2.8, bowlCZ]} />

      {/* Abattant (groupe charnière) */}
      <group ref={lidRef} position={[WC_CX, bowlH + 3.5, hingeZ]}>
        <mesh position={[0, 1, seatRZ - 0.5]} material={lidMat} castShadow scale={[1, 1, bowlOval]}>
          <cylinderGeometry args={[lidRX, lidRX, 2, 48]} />
        </mesh>
        <mesh position={[0, 1, -0.5]} rotation={[0, 0, Math.PI / 2]}
          material={new THREE.MeshStandardMaterial({ color: 0xd0d0d0, roughness: 0.25, metalness: 0.3 })}>
          <cylinderGeometry args={[2, 2, 3, 12]} />
        </mesh>
      </group>

      {/* Réservoir */}
      <mesh position={[WC_CX, bowlH + tankH / 2, WC_Z0 + tankD / 2]}
        material={wcMat} castShadow receiveShadow>
        <boxGeometry args={[tankW, tankH, tankD]} />
      </mesh>
      <mesh position={[WC_CX, bowlH + tankH / 2, WC_Z0 + tankD + 0.2]}
        material={new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.07, metalness: 0.04 })}>
        <boxGeometry args={[tankW - 4, tankH - 6, 0.8]} />
      </mesh>
      {/* Couvercle réservoir */}
      <mesh position={[WC_CX, bowlH + tankH + tankLidH / 2, WC_Z0 + tankD / 2]}
        material={wcMat} castShadow>
        <boxGeometry args={[tankW + 1.5, tankLidH, tankD + 1.5]} />
      </mesh>

      {/* Boutons chasse d'eau */}
      <mesh position={[WC_CX, btnY - 0.35, btnCZ]} material={btnBaseMat}>
        <cylinderGeometry args={[6, 6, 0.7, 48]} />
      </mesh>
      <mesh position={[WC_CX, btnY + 0.9, btnCZ + 0.8]} material={btnBigMat}>
        <cylinderGeometry args={[5.3, 5.3, 1.8, 48, 1, false, -Math.PI / 2, Math.PI]} />
      </mesh>
      <mesh position={[WC_CX, btnY + 0.7, btnCZ - 0.8]} material={btnSmallMat}>
        <cylinderGeometry args={[4.0, 4.0, 1.4, 48, 1, false, Math.PI / 2, Math.PI]} />
      </mesh>
      <mesh position={[WC_CX, btnY + 1.4, btnCZ]} material={btnBaseMat}>
        <boxGeometry args={[11.5, 0.5, 0.7]} />
      </mesh>

      {/* Raccord réservoir → cuvette */}
      <mesh position={[WC_CX, bowlH - 2.5, WC_Z0 + tankD + 3]} material={wcMat}>
        <cylinderGeometry args={[2.5, 3.5, 5, 16]} />
      </mesh>
      {/* Embase au sol */}
      <mesh position={[WC_CX, 1.75, WC_Z0 + 1.5]} material={wcMat}>
        <boxGeometry args={[tankW * 0.75, 3.5, 3]} />
      </mesh>
    </group>
  );
}

// ── Vasque suspendue ──────────────────────────────────────────────────────────

function Vasque() {
  const counterCX = 0;
  const counterCZ = 0.75;

  const mirrorW = counterW;
  const mirrorH = 90;
  const mirrorY = counterTopY + mirrorH / 2;
  const mirrorZ = -VANITY_D / 2 + 0.5;

  const lampW = 40, lampD = 4, lampH = 2;
  const lampY = counterTopY + mirrorH + lampH / 2 + 1;
  const lampZ = mirrorZ + 7 + lampD / 2;

  // Plan avant du lavabo
  const backD_val  = counterCZ - basinCZ / 2 - (counterCZ - counterD / 2);
  const frontStart = basinCZ + basinD / 2;
  const frontEnd   = counterCZ + counterD / 2;
  const actualFrontD = frontEnd - frontStart;
  const sideW = (counterW - basinW) / 2;

  return (
    <group position={[VANITY_CX, 0, VANITY_CZ]}>

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
      <mesh position={[0, counterTopY + 10, -VANITY_D / 2 + 8]} rotation={[Math.PI / 2, 0, 0]} material={faucetMat}>
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

// ── Ballon d'eau chaude ───────────────────────────────────────────────────────

function WaterHeater() {
  const HW_R = 28;
  const HW_H = 65;
  const HW_X = -NICHE_DEPTH + HW_R;
  const HW_Y = WALL_H - 10 - HW_H / 2;
  const HW_Z = KITCHEN_Z + 20 + HW_R;

  return (
    <group>
      <mesh position={[HW_X, HW_Y, HW_Z]} castShadow receiveShadow material={hwMat}>
        <cylinderGeometry args={[HW_R, HW_R, HW_H, 16]} />
      </mesh>
      <mesh position={[HW_X, HW_Y + HW_H / 2 + 1, HW_Z]} material={hwCapMat}>
        <cylinderGeometry args={[HW_R + 0.5, HW_R + 0.5, 2, 16]} />
      </mesh>
      <mesh position={[HW_X, HW_Y - HW_H / 2 - 1, HW_Z]} material={hwCapMat}>
        <cylinderGeometry args={[HW_R + 0.5, HW_R + 0.5, 2, 16]} />
      </mesh>
      {([-20, 20] as const).map((dy) => (
        <mesh key={dy} position={[-NICHE_DEPTH + (HW_R + 5) / 2, HW_Y + dy, HW_Z]} material={bracketMat}>
          <boxGeometry args={[HW_R + 5, 4, 5]} />
        </mesh>
      ))}
    </group>
  );
}

// ── Tapis pelouse synthétique ─────────────────────────────────────────────────

function GrassRug() {
  const RUG_W = 200, RUG_D = 100, RUG_H = 1.5;
  const rugCX = (-NICHE_DEPTH + DOOR_START) / 2; // ≈ 90
  const rugCZ = SDB_Z_END - RUG_D / 2 - 3;       // 547

  const mats = useMemo(() => {
    const topTex = makeGrassTex();
    topTex.repeat.set(10, 5);
    const topMat  = new THREE.MeshStandardMaterial({ map: topTex, roughness: 0.85 });
    const sideMat = new THREE.MeshStandardMaterial({ color: 0x2d6e30, roughness: 0.9 });
    return [sideMat, sideMat, topMat, sideMat, sideMat, sideMat];
  }, []);

  return (
    <mesh
      ref={(m) => { if (m) m.material = mats as any; }}
      position={[rugCX, RUG_H / 2, rugCZ]}
      receiveShadow
    >
      <boxGeometry args={[RUG_W, RUG_H, RUG_D]} />
    </mesh>
  );
}

// ── Export principal ──────────────────────────────────────────────────────────

export function Bathroom() {
  return (
    <>
      <Shower />
      <WC />
      <Vasque />
      <WaterHeater />
      <GrassRug />
    </>
  );
}
