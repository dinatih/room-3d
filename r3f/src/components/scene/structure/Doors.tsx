/**
 * Doors.tsx — portes 3D (position fermée statique).
 * Port de js/structure/doors.js + params depuis walls.js.
 *
 * 3 portes :
 *   - Porte séjour (mur D, couloir) — blanche
 *   - Porte SDB — blanche
 *   - Porte entrée (mur diagonal) — rouge
 */
import { useMemo } from 'react';
import * as THREE from 'three';

// @ts-ignore
import {
  ROOM_D, WALL_H, DOOR_H,
  DOOR_START, DOOR_END,
  KITCHEN_Z, SDB_Z_END,
  DIAG_AX, DIAG_AZ, DIAG_CX, DIAG_CZ,
} from '@config';

// Door constants
const DOOR_W       = 83;
const ENTRY_DOOR_W = 90;
const WALL_W       = 10;
const DORMANT_T    = 2.5;
const STOP_T       = 1;
const STOP_W       = 3;

// Materials
const whiteMat   = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.4 });
const dormantMat = new THREE.MeshStandardMaterial({ color: 0xf0ede8, roughness: 0.35 });
const stopMat    = new THREE.MeshStandardMaterial({ color: 0xe8e5e0, roughness: 0.30 });
const handleMat  = new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.85, roughness: 0.15 });
const redDoorMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.5, metalness: 0.1 });
const redFrameMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.5 });
const whiteFrameMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f0, roughness: 0.3 });
const knobMat    = new THREE.MeshStandardMaterial({ color: 0xcc0000, metalness: 0.3, roughness: 0.4 });

// ── Canvas ruban mesureur ────────────────────────────────────────────────────

function TapeMesh({ rotY, posX, posY, posZ }: { rotY: number; posX: number; posY: number; posZ: number }) {
  const mat = useMemo(() => {
    const totalCm = 200, pxPerCm = 8;
    const cw = 40, ch = totalCm * pxPerCm;
    const canvas = document.createElement('canvas');
    canvas.width = cw; canvas.height = ch;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#f5e6a0';
    ctx.fillRect(0, 0, cw, ch);
    for (let cm = 0; cm <= totalCm; cm++) {
      const y = (totalCm - cm) * pxPerCm;
      const isMaj = cm % 10 === 0, isMid = cm % 5 === 0;
      const tickLen = isMaj ? 18 : isMid ? 12 : 6;
      ctx.strokeStyle = '#3a2a00';
      ctx.lineWidth = isMaj ? 1.5 : isMid ? 1 : 0.5;
      ctx.beginPath(); ctx.moveTo(1, y);      ctx.lineTo(1 + tickLen, y);      ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cw - 1, y); ctx.lineTo(cw - 1 - tickLen, y); ctx.stroke();
      if (isMaj && cm > 0) {
        ctx.fillStyle = '#3a2a00';
        ctx.font = `bold ${Math.round(pxPerCm * 0.85)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(`${cm}`, cw / 2, y - 2);
      }
    }
    ctx.strokeStyle = '#8a6900'; ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, cw - 2, ch - 2);
    return new THREE.MeshBasicMaterial({
      map: new THREE.CanvasTexture(canvas),
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  }, []);
  return (
    <mesh rotation={[0, rotY, 0]} position={[posX, posY, posZ]} material={mat}>
      <planeGeometry args={[5, 200]} />
    </mesh>
  );
}

// ── Poignée en L ─────────────────────────────────────────────────────────────
// Porte fine en Z : disc en face Z, levier le long de X vers la charnière.
// Pour une porte fine en X, envelopper dans <group rotation={[0, -PI/2, 0]}>.

function HandleH({ x, y, z, sign }: { x: number; y: number; z: number; sign: 1 | -1 }) {
  const R = 1.3;
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[x, y, z]} material={handleMat}>
        <cylinderGeometry args={[3, 3, 1, 12]} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[x, y, z + sign * 2.5]} material={handleMat}>
        <cylinderGeometry args={[R, R, 5, 8]} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]} position={[x + 7, y, z + sign * 5]} material={handleMat}>
        <cylinderGeometry args={[R, R, 14, 8]} />
      </mesh>
      <mesh position={[x, y, z + sign * 5]} material={handleMat}>
        <sphereGeometry args={[R, 8, 6]} />
      </mesh>
      <mesh position={[x + 14, y, z + sign * 5]} material={handleMat}>
        <sphereGeometry args={[R, 8, 6]} />
      </mesh>
    </group>
  );
}

// Pour porte entrée (levier vertical, axe Z)
function HandleV({ x, y, z }: { x: number; y: number; z: number }) {
  const R = 1.3;
  return (
    <group>
      <mesh rotation={[0, 0, Math.PI / 2]} position={[-2.5, y, z]} material={handleMat}>
        <cylinderGeometry args={[3, 3, 1, 12]} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]} position={[-3 - 5 / 2, y, z]} material={handleMat}>
        <cylinderGeometry args={[R, R, 5, 8]} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[-3 - 5, y, z - 14 / 2]} material={handleMat}>
        <cylinderGeometry args={[R, R, 14, 8]} />
      </mesh>
      <mesh position={[-3 - 5, y, z]} material={handleMat}>
        <sphereGeometry args={[R, 8, 6]} />
      </mesh>
      <mesh position={[-3 - 5, y, z - 14]} material={handleMat}>
        <sphereGeometry args={[R, 8, 6]} />
      </mesh>
    </group>
  );
}

// ── Porte séjour ─────────────────────────────────────────────────────────────

function LivingDoor() {
  const wallCZ = ROOM_D + WALL_W / 2;
  const stopZ  = ROOM_D + STOP_T / 2;
  const hx = -DOOR_W + 15, hy = 100;
  return (
    <group>
      {/* Panneau — fermé (rotation=0) */}
      <group position={[DOOR_END, 0, ROOM_D + 3]}>
        <mesh position={[-DOOR_W / 2, DOOR_H / 2, 0]} castShadow material={whiteMat}>
          <boxGeometry args={[DOOR_W, DOOR_H, 4]} />
        </mesh>
        <TapeMesh rotY={Math.PI}    posX={-DOOR_W + 15} posY={100} posZ={-2.5} />
        <TapeMesh rotY={0}          posX={-DOOR_W + 15} posY={100} posZ={2.5}  />
        <HandleH x={hx} y={hy} z={-2.5} sign={-1} />
        <HandleH x={hx} y={hy} z={2.5}  sign={1}  />
      </group>
      {/* Dormant */}
      <mesh position={[DOOR_START + DORMANT_T / 2, DOOR_H / 2, wallCZ]} material={dormantMat}>
        <boxGeometry args={[DORMANT_T, DOOR_H, WALL_W]} />
      </mesh>
      <mesh position={[DOOR_END - DORMANT_T / 2, DOOR_H / 2, wallCZ]} material={dormantMat}>
        <boxGeometry args={[DORMANT_T, DOOR_H, WALL_W]} />
      </mesh>
      <mesh position={[(DOOR_START + DOOR_END) / 2, DOOR_H + DORMANT_T / 2, wallCZ]} material={dormantMat}>
        <boxGeometry args={[DOOR_W - DORMANT_T * 2, DORMANT_T, WALL_W]} />
      </mesh>
      {/* Arrêts */}
      <mesh position={[DOOR_START + DORMANT_T + STOP_T / 2, DOOR_H / 2, stopZ]} material={stopMat}>
        <boxGeometry args={[STOP_T, DOOR_H, STOP_W]} />
      </mesh>
      <mesh position={[DOOR_END - DORMANT_T - STOP_T / 2, DOOR_H / 2, stopZ]} material={stopMat}>
        <boxGeometry args={[STOP_T, DOOR_H, STOP_W]} />
      </mesh>
      <mesh position={[(DOOR_START + DOOR_END) / 2, DOOR_H - STOP_W / 2, stopZ]} material={stopMat}>
        <boxGeometry args={[DOOR_W - DORMANT_T * 2 - STOP_T * 2, STOP_W, STOP_T]} />
      </mesh>
    </group>
  );
}

// ── Porte SDB ─────────────────────────────────────────────────────────────────

function BathroomDoor() {
  const WALL_X = DOOR_START - 5; // 185
  const LEFT_WALL_LEN = SDB_Z_END - KITCHEN_Z;
  const C_DOOR_START  = LEFT_WALL_LEN - 10 - DOOR_W;
  const C_DOOR_END    = C_DOOR_START + DOOR_W;
  const hingeZ = KITCHEN_Z + C_DOOR_END;
  const hingeX = WALL_X;

  const FW = 3, FT = 1;
  const doorStartZ = hingeZ - DOOR_W;
  const doorEndZ   = hingeZ;
  const CZ = (doorStartZ + doorEndZ) / 2;
  const wallCX = hingeX;
  const stopX  = hingeX - WALL_W / 2 - STOP_T / 2;

  const hy = 100, hz = -DOOR_W + 15;

  return (
    <group>
      {/* Encadrement */}
      {([hingeX - WALL_W / 2 - FT / 2, hingeX + WALL_W / 2 + FT / 2] as const).map((xF, i) => (
        <group key={i}>
          <mesh position={[xF, DOOR_H / 2, doorStartZ - FW / 2]} material={whiteFrameMat}>
            <boxGeometry args={[FT, DOOR_H, FW]} />
          </mesh>
          <mesh position={[xF, DOOR_H / 2, doorEndZ + FW / 2]} material={whiteFrameMat}>
            <boxGeometry args={[FT, DOOR_H, FW]} />
          </mesh>
          <mesh position={[xF, DOOR_H + FW / 2, CZ]} material={whiteFrameMat}>
            <boxGeometry args={[FT, FW, DOOR_W + FW * 2]} />
          </mesh>
        </group>
      ))}
      {/* Panneau — fermé */}
      <group position={[hingeX, 0, hingeZ]}>
        <mesh position={[0, DOOR_H / 2, -DOOR_W / 2]} castShadow material={whiteMat}>
          <boxGeometry args={[4, DOOR_H, DOOR_W]} />
        </mesh>
        <TapeMesh rotY={Math.PI / 2}  posX={2.5}  posY={100} posZ={hz} />
        <TapeMesh rotY={-Math.PI / 2} posX={-2.5} posY={100} posZ={hz} />
        {/* Même poignée que LivingDoor, rotée -PI/2 autour de Y */}
        <group rotation={[0, -Math.PI / 2, 0]}>
          <HandleH x={hz} y={hy} z={-2.5} sign={-1} />
          <HandleH x={hz} y={hy} z={2.5}  sign={1}  />
        </group>
      </group>
      {/* Dormant */}
      <mesh position={[wallCX, DOOR_H / 2, doorEndZ  + DORMANT_T / 2]} material={dormantMat}>
        <boxGeometry args={[WALL_W, DOOR_H, DORMANT_T]} />
      </mesh>
      <mesh position={[wallCX, DOOR_H / 2, doorStartZ - DORMANT_T / 2]} material={dormantMat}>
        <boxGeometry args={[WALL_W, DOOR_H, DORMANT_T]} />
      </mesh>
      <mesh position={[wallCX, DOOR_H + DORMANT_T / 2, (doorEndZ + doorStartZ) / 2]} material={dormantMat}>
        <boxGeometry args={[WALL_W, DORMANT_T, DOOR_W - DORMANT_T * 2]} />
      </mesh>
      {/* Arrêts */}
      <mesh position={[stopX, DOOR_H / 2, doorEndZ   - STOP_W / 2]} material={stopMat}>
        <boxGeometry args={[STOP_T, DOOR_H, STOP_W]} />
      </mesh>
      <mesh position={[stopX, DOOR_H / 2, doorStartZ + STOP_W / 2]} material={stopMat}>
        <boxGeometry args={[STOP_T, DOOR_H, STOP_W]} />
      </mesh>
      <mesh position={[stopX, DOOR_H - STOP_W / 2, (doorEndZ + doorStartZ) / 2]} material={stopMat}>
        <boxGeometry args={[STOP_T, STOP_W, DOOR_W - STOP_W * 2]} />
      </mesh>
    </group>
  );
}

// ── Porte entrée (mur diagonal) ───────────────────────────────────────────────

function EntryDoor() {
  const { hingeX, hingeZ, diagRotY, iP, eP, pX, pZ, E_DOOR_START, E_DOOR_END } = useMemo(() => {
    const diagDX = DIAG_CX - DIAG_AX;
    const diagDZ = DIAG_CZ - DIAG_AZ;
    const diagLen = Math.sqrt(diagDX * diagDX + diagDZ * diagDZ);
    const sinθ = diagDX / diagLen;
    const cosθ = diagDZ / diagLen;
    const perpX = 5 * diagDZ / diagLen;
    const perpZ = -5 * diagDX / diagLen;
    const originX = DIAG_AX + perpX;
    const originZ = DIAG_AZ + perpZ;
    const diagRotY = Math.atan2(diagDX, diagDZ);
    const pX = cosθ, pZ = -sinθ;
    const E_DOOR_START = 10, E_DOOR_END = 100;
    const iP = (dist: number): [number, number] => [DIAG_AX + dist * sinθ, DIAG_AZ + dist * cosθ];
    const eP = (dist: number): [number, number] => [DIAG_AX + dist * sinθ + 10 * pX, DIAG_AZ + dist * cosθ + 10 * pZ];
    return {
      hingeX: originX + E_DOOR_START * sinθ,
      hingeZ: originZ + E_DOOR_START * cosθ,
      diagRotY, iP, eP, pX, pZ, E_DOOR_START, E_DOOR_END,
    };
  }, []);

  const FW = 3, FT = 1;
  const doorH = DOOR_H;

  // Encadrements (extrudés le long du mur diagonal)
  const frames = useMemo(() => {
    const geos: THREE.BufferGeometry[] = [];
    function chambSection(d0: number, d1: number, height: number, yBase: number, outward: boolean, isRed: boolean) {
      const base = outward ? eP : iP;
      const sign = outward ? 1 : -1;
      const pts: [number, number][] = [
        base(d0),
        base(d1),
        [base(d1)[0] + sign * FT * pX, base(d1)[1] + sign * FT * pZ],
        [base(d0)[0] + sign * FT * pX, base(d0)[1] + sign * FT * pZ],
      ];
      const shape = new THREE.Shape();
      shape.moveTo(pts[0][0], -pts[0][1]);
      for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i][0], -pts[i][1]);
      shape.closePath();
      const g = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false });
      g.rotateX(-Math.PI / 2);
      if (yBase > 0) g.translate(0, yBase, 0);
      geos.push(g);
    }
    for (const [outward] of [[true], [false]]) {
      const ow = outward as boolean;
      chambSection(E_DOOR_START - FW, E_DOOR_START, doorH, 0, ow, ow);
      chambSection(E_DOOR_END, E_DOOR_END + FW, doorH, 0, ow, ow);
      chambSection(E_DOOR_START - FW, E_DOOR_END + FW, FW, doorH, ow, ow);
    }
    return geos;
  }, []);

  return (
    <group>
      {frames.slice(0, 3).map((g, i) => (
        <mesh key={`r${i}`} geometry={g} material={redFrameMat} castShadow />
      ))}
      {frames.slice(3).map((g, i) => (
        <mesh key={`w${i}`} geometry={g} material={whiteFrameMat} castShadow />
      ))}
      {/* Panneau — fermé */}
      <group position={[hingeX, 0, hingeZ]} rotation={[0, diagRotY, 0]}>
        <mesh position={[0, doorH / 2, ENTRY_DOOR_W / 2]} castShadow material={redDoorMat}>
          <boxGeometry args={[4, doorH, ENTRY_DOOR_W]} />
        </mesh>
        {/* Bouton extérieur */}
        <mesh position={[6, doorH / 2, ENTRY_DOOR_W / 2]} material={knobMat}>
          <sphereGeometry args={[5, 16, 12]} />
        </mesh>
        <HandleV x={0} y={100} z={70} />
      </group>
    </group>
  );
}

// ── Export principal ──────────────────────────────────────────────────────────

export function Doors() {
  return (
    <>
      <LivingDoor />
      <BathroomDoor />
      <EntryDoor />
    </>
  );
}
