/**
 * Decor.tsx — objets décoratifs procéduraux.
 * Port de js/decor/decor.js, js/furniture/meubleT.js,
 * js/furniture/airPerformer.js, js/decor/shoehatrack.js.
 */
import { useMemo } from 'react';
import * as THREE from 'three';

// @ts-ignore
import {
  ROOM_W, ROOM_D, WALL_H,
  NICHE_DEPTH, NICHE_Z_START,
  KALLAX_DEPTH,
} from '@config';

// Constantes issues de kallax.js
const kallaxW1 = 40.5;  // kallaxW(1)
const kallaxW2 = 75.5;  // kallaxW(2)
const kallaxH2 = 76.5;  // kallaxH(2)
const KALLAX_SE_Z   = ROOM_D - 60 - kallaxW1 / 2;  // 319.75
const KALLAX_SE_TOP = 2 * kallaxW2;                  // 151

// ── Matériaux ─────────────────────────────────────────────────────────────────

const lackMat    = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.3 });
const mulMat     = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.3 });
const bracketMat = new THREE.MeshStandardMaterial({ color: 0xd0d0d0, roughness: 0.3 });
const pantMat    = new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.7 });
const pantClipMat = new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.3 });
const fnMat      = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.4 });
const fnInnerMat = new THREE.MeshStandardMaterial({ color: 0xe0e0e0, roughness: 0.3, side: THREE.BackSide });
const mannMat    = new THREE.MeshStandardMaterial({ color: 0xf5f0eb, roughness: 0.5 });
const woodMat    = new THREE.MeshStandardMaterial({ color: 0xc8a46e, roughness: 0.85 });
const whitePlanMat = new THREE.MeshStandardMaterial({ color: 0xf5f0e8, roughness: 0.85 });
const darkMat    = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.7, side: THREE.DoubleSide });
const metalMat   = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.5, metalness: 0.8 });
const fabricMat  = new THREE.MeshStandardMaterial({ color: 0x7a7a7a, roughness: 0.95 });

// ── Étagère LACK ──────────────────────────────────────────────────────────────

function LackShelf() {
  const LACK_W = 110, LACK_D = 26, LACK_H = 5;
  const LACK_Y = 187.5 + LACK_H / 2;
  const LACK_CZ = NICHE_Z_START - LACK_W / 2; // 225
  const LACK_CX = LACK_D / 2;                  // 13
  return (
    <mesh position={[LACK_CX, LACK_Y, LACK_CZ]} castShadow receiveShadow material={lackMat}>
      <boxGeometry args={[LACK_D, LACK_H, LACK_W]} />
    </mesh>
  );
}

// ── Tringle MULIG + 3 pantalons ───────────────────────────────────────────────

function MuligRail() {
  const MUL_W = 80, MUL_D = 26;
  const MUL_MOUNT_Y = WALL_H - 20; // 230
  const mulCZ = NICHE_Z_START - 110 - MUL_W / 2; // 130

  return (
    <group>
      {/* Barre */}
      <mesh position={[MUL_D, MUL_MOUNT_Y, mulCZ]} rotation={[Math.PI / 2, 0, 0]} material={mulMat}>
        <cylinderGeometry args={[1.5, 1.5, MUL_W, 8]} />
      </mesh>
      {/* 2 supports */}
      {([-MUL_W / 2 + 5, MUL_W / 2 - 5] as const).map((dz) => (
        <group key={dz}>
          <mesh position={[MUL_D / 2, MUL_MOUNT_Y, mulCZ + dz]} material={bracketMat}>
            <boxGeometry args={[MUL_D, 2, 2]} />
          </mesh>
          <mesh position={[0.75, MUL_MOUNT_Y, mulCZ + dz]} material={bracketMat}>
            <boxGeometry args={[1.5, 10, 8]} />
          </mesh>
        </group>
      ))}
      {/* 3 pantalons */}
      {([mulCZ - 25, mulCZ, mulCZ + 25] as const).map((pz) => (
        <group key={pz}>
          <mesh position={[MUL_D, MUL_MOUNT_Y + 1.5, pz]} material={pantClipMat}>
            <boxGeometry args={[3, 5, 4]} />
          </mesh>
          {([-7, 7] as const).map((dx) => (
            <mesh key={dx} position={[MUL_D + dx, MUL_MOUNT_Y - 30, pz]} castShadow material={pantMat}>
              <boxGeometry args={[16.5, 60, 2.5]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

// ── Corbeilles FNISS (×2) ────────────────────────────────────────────────────

function Fniss({ x, z }: { x: number; z: number }) {
  const R_TOP = 14, R_BOT = 9.5, H = 28, T = 0.6;
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, H / 2, 0]} castShadow material={fnMat}>
        <cylinderGeometry args={[R_TOP, R_BOT, H, 24, 1, true]} />
      </mesh>
      <mesh position={[0, H / 2, 0]} material={fnInnerMat}>
        <cylinderGeometry args={[R_TOP - T, R_BOT - T, H, 24, 1, true]} />
      </mesh>
      <mesh position={[0, 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]} material={fnMat}>
        <circleGeometry args={[R_BOT - T, 24]} />
      </mesh>
      <mesh position={[0, H, 0]} rotation={[Math.PI / 2, 0, 0]} material={fnMat}>
        <torusGeometry args={[R_TOP - T / 2, T, 8, 24]} />
      </mesh>
    </group>
  );
}

// ── Tête de mannequin ─────────────────────────────────────────────────────────

function MannequinHead({ position, rotY }: {
  position: [number, number, number]; rotY: number;
}) {
  const SHOULDER_W = 41, SHOULDER_H = 8, SHOULDER_D = 22;
  const NECK_R = 4, NECK_H = 8;
  const HEAD_R = 8.9;
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <mesh position={[0, SHOULDER_H / 2, 0]} castShadow material={mannMat}
        scale={[SHOULDER_W / 2, SHOULDER_H / 2, SHOULDER_D / 2]}>
        <sphereGeometry args={[1, 16, 8]} />
      </mesh>
      <mesh position={[0, SHOULDER_H + NECK_H / 2, 0]} castShadow material={mannMat}>
        <cylinderGeometry args={[NECK_R, NECK_R * 1.1, NECK_H, 12]} />
      </mesh>
      <mesh position={[0, SHOULDER_H + NECK_H + HEAD_R, 0]} castShadow material={mannMat}
        scale={[1, 1.15, 1]}>
        <sphereGeometry args={[HEAD_R, 16, 12]} />
      </mesh>
      <mesh position={[0, SHOULDER_H + NECK_H + HEAD_R, HEAD_R + 0.5]}
        rotation={[-Math.PI / 2, 0, 0]} material={mannMat}>
        <coneGeometry args={[1.2, 2.5, 6]} />
      </mesh>
    </group>
  );
}

// ── Meuble TV (BESTÅ bloc) — posé sur Kallax SE ───────────────────────────────
// Coords world : position (274.75, KALLAX_SE_TOP, KALLAX_SE_Z), rotY=-π/2

function MeubleTV() {
  const W = 22.5, H = 55, D = 27.5, T = 1.5;
  const PL = 80, PT = 3.7, PD = 23.5;
  const plankY = 33 + PT / 2;
  const plankZ = -D / 2 + PD / 2; // local Z dans le meuble

  // World position: against mur B (X=ROOM_W), back face flush with wall
  const wx = ROOM_W - D / 2;  // 286.25
  const wy = KALLAX_SE_TOP;
  const wz = KALLAX_SE_Z;

  return (
    <group position={[wx, wy, wz]} rotation={[0, -Math.PI / 2, 0]}>
      {/* Dessus */}
      <mesh position={[0, H - T / 2, 0]} castShadow receiveShadow material={woodMat}>
        <boxGeometry args={[W, T, D]} />
      </mesh>
      {/* Dessous */}
      <mesh position={[0, T / 2, 0]} castShadow receiveShadow material={woodMat}>
        <boxGeometry args={[W, T, D]} />
      </mesh>
      {/* Côté gauche */}
      <mesh position={[-W / 2 + T / 2, H / 2, 0]} castShadow receiveShadow material={woodMat}>
        <boxGeometry args={[T, H, D]} />
      </mesh>
      {/* Côté droit */}
      <mesh position={[W / 2 - T / 2, H / 2, 0]} castShadow receiveShadow material={woodMat}>
        <boxGeometry args={[T, H, D]} />
      </mesh>
      {/* Planche blanche */}
      <mesh position={[0, plankY, plankZ]} castShadow material={whitePlanMat}>
        <boxGeometry args={[PL, PT, PD]} />
      </mesh>
    </group>
  );
}

// ── Purificateur d'air (Dyson Air Performer) ──────────────────────────────────

function AirPerformer() {
  const towerGeo = useMemo(() => {
    const h = 70, r = 10, holeR = 6;
    const shape = new THREE.Shape();
    shape.absarc(0, h - r, r, Math.PI, 0, true);
    shape.absarc(0, r, r, 0, Math.PI, true);

    const hole = new THREE.Path();
    hole.absarc(0, h - 20 - holeR + 10, holeR, Math.PI, 0, true);
    hole.absarc(0, holeR + 10, holeR, 0, Math.PI, true);
    shape.holes.push(hole);

    return new THREE.ExtrudeGeometry(shape, { depth: 10, bevelEnabled: false });
  }, []);

  const AP_X = 287.5, AP_Z = 230;
  return (
    <group position={[AP_X, 0, AP_Z]}>
      {/* Base cylindrique */}
      <mesh position={[0, 17.5, 0]} material={darkMat}>
        <cylinderGeometry args={[12.5, 12.5, 35, 32]} />
      </mesh>
      {/* Tour */}
      <mesh geometry={towerGeo} material={darkMat} position={[0, 35, -5]} />
    </group>
  );
}

// ── Range-chaussures/chapeaux (Svalnäs-like) ──────────────────────────────────
// Position monde : (300, 0, 340), rotY=-π/2

function ShoeHatRack() {
  const W = 60, D = 27, H = 154, TR = 0.8;
  const H_BACK = 72;
  const SHELF_YS = [5, 21, 37, 53];
  const Y_MID = 105, Y_TOP = 140;
  const HOOK_XS = [W * 0.12, W * 0.37, W * 0.63, W * 0.88];

  /** Cylindre entre deux points 3D. */
  function Tube({ p1, p2 }: { p1: [number,number,number]; p2: [number,number,number] }) {
    const [x1,y1,z1] = p1, [x2,y2,z2] = p2;
    const dx=x2-x1,dy=y2-y1,dz=z2-z1;
    const len = Math.sqrt(dx*dx+dy*dy+dz*dz);
    if (len < 0.01) return null;
    const mid: [number,number,number] = [(x1+x2)/2,(y1+y2)/2,(z1+z2)/2];
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

  return (
    <group position={[300, 0, 340]} rotation={[0, -Math.PI / 2, 0]}>
      {/* Montants avant */}
      <Tube p1={[TR,0,TR]} p2={[TR,H,TR]} />
      <Tube p1={[W-TR,0,TR]} p2={[W-TR,H,TR]} />
      {/* Montants arrière (zone étagères) */}
      <Tube p1={[TR,0,D-TR]} p2={[TR,H_BACK,D-TR]} />
      <Tube p1={[W-TR,0,D-TR]} p2={[W-TR,H_BACK,D-TR]} />
      {/* Cadre bas */}
      <Tube p1={[TR,TR,TR]} p2={[W-TR,TR,TR]} />
      <Tube p1={[TR,TR,D-TR]} p2={[W-TR,TR,D-TR]} />
      <Tube p1={[TR,TR,TR]} p2={[TR,TR,D-TR]} />
      <Tube p1={[W-TR,TR,TR]} p2={[W-TR,TR,D-TR]} />
      {/* Transition haut arrière → avant */}
      <Tube p1={[TR,H_BACK,D-TR]} p2={[TR,H_BACK,TR]} />
      <Tube p1={[W-TR,H_BACK,D-TR]} p2={[W-TR,H_BACK,TR]} />
      {/* 4 étagères */}
      {SHELF_YS.map((y) => (
        <group key={y}>
          <Tube p1={[TR,y,TR]} p2={[W-TR,y,TR]} />
          <Tube p1={[TR,y,D-TR]} p2={[W-TR,y,D-TR]} />
          <Tube p1={[TR,y,TR]} p2={[TR,y,D-TR]} />
          <Tube p1={[W-TR,y,TR]} p2={[W-TR,y,D-TR]} />
          <mesh position={[W/2, y+0.75, D/2]} castShadow receiveShadow material={fabricMat}>
            <boxGeometry args={[W-2*TR-0.5, 1.5, D-2*TR-0.5]} />
          </mesh>
        </group>
      ))}
      {/* Barres porte-manteaux */}
      <Tube p1={[TR,Y_MID,TR]} p2={[W-TR,Y_MID,TR]} />
      <Tube p1={[TR,Y_TOP,TR]} p2={[W-TR,Y_TOP,TR]} />
      {/* Crochets doubles */}
      {HOOK_XS.flatMap((x) => [Y_MID, Y_TOP].map((barY) => (
        <group key={`${x}-${barY}`}>
          <Tube p1={[x,barY,TR]} p2={[x,barY+7,TR]} />
          <Tube p1={[x,barY+7,TR]} p2={[x,barY+11.5,TR+5.5]} />
          <Tube p1={[x,barY+3.85,TR]} p2={[x,barY+6.85,TR+4]} />
        </group>
      )))}
    </group>
  );
}

// ── Export principal ──────────────────────────────────────────────────────────

export function Decor() {
  // Mannequin sur LACK (mur A): cx=13, cz=225, top≈192.5
  const lackTopY = 187.5 + 5;
  const lackCX = 26 / 2;
  const lackCZ = NICHE_Z_START - 110 / 2;
  const mannRot = Math.atan2(150 - lackCX, 200 - lackCZ);

  // Mannequin sur Kallax NW (top ≈ kallaxW2 + 2*kallaxW1 = 121.5)
  const k14Top = kallaxW2 + kallaxW1 * 2; // 121.5
  const k14CX = KALLAX_DEPTH / 2;
  const k14CZ = kallaxW1 / 2;
  const nwMannRot = Math.atan2(150 - k14CX, 200 - k14CZ) + Math.PI / 2;
  // Convert Kallax NW world position: group at (DEP/2=19.5,0,w1/2=20.25) rotY=-π/2
  // NW child (k14CX,k14Top,k14CZ) → world:
  // rotY=-π/2: new_x=-child.z, new_z=child.x → world=(19.5-k14CZ, k14Top, 20.25+k14CX)
  const nwMannWorld: [number,number,number] = [
    KALLAX_DEPTH / 2 - k14CZ,
    k14Top,
    kallaxW1 / 2 + k14CX,
  ];

  // Mannequin sur Sunnersta: surface center ≈ (282, 90, 271.5)
  // JS: sunnerstaSurface at (ROOM_W - depthX/2, 90, 271.5) where depthX≈36cm

  return (
    <>
      <LackShelf />
      <MuligRail />
      <Fniss x={110} z={500} />
      <Fniss x={286} z={202} />
      <MannequinHead position={[lackCX, lackTopY, lackCZ]} rotY={mannRot} />
      <MannequinHead position={nwMannWorld} rotY={nwMannRot} />
      <MannequinHead position={[282, 90, 271.5]} rotY={0} />
      <MeubleTV />
      <AirPerformer />
      <ShoeHatRack />
    </>
  );
}
