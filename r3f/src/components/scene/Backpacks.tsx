/**
 * Backpacks.tsx — sacs à dos procéduraux + étagère à chaussures GREJIG.
 * Port de js/decor/backpacks.js et js/decor/grejig.js.
 */
import { useMemo } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

// @ts-ignore
import { KITCHEN_X1, DOOR_START, ROOM_D } from '@config';

// ── Matériaux ─────────────────────────────────────────────────────────────────

const bagMat  = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.83 });
const bagDark = new THREE.MeshStandardMaterial({ color: 0xaa0000, roughness: 0.88 });
const buckMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.5, metalness: 0.35 });
const silverMat = new THREE.MeshStandardMaterial({ color: 0x9a9a9a, roughness: 0.25, metalness: 0.9 });
const labelMat = new THREE.MeshStandardMaterial({ color: 0x0e0e0e, roughness: 0.8 });
const grejigMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.4, metalness: 0.7 });

// ── Sac à dos procédural ──────────────────────────────────────────────────────
// W=front width, H=total height, D=depth

function Bag({ W, H, D }: { W: number; H: number; D: number }) {
  const FLAP_H = H * 0.21;
  const BODY_H = H - FLAP_H;
  const PW = W * 0.82, PH = BODY_H * 0.43;
  const PY = BODY_H * 0.07 + PH / 2, PZ = D / 2 + 0.5;
  const SPW = D * 0.55, SPH = BODY_H * 0.32, SPT = 2.5;
  const HW = 2.8, HT = 0.9, HLEN = 11, HGAP = W * 0.17;
  const SW = 3.5, SLEN = FLAP_H * 0.65;
  const SSW = 4.8, SST = 1.8, SSSp = W * 0.22;
  const SS_TOP_Y = H * 0.88, SS_BOT_Y = 2.5;

  return (
    <group>
      {/* Corps principal */}
      <RoundedBox args={[W, BODY_H, D]} radius={1.2} smoothness={4} position={[0, BODY_H / 2, 0]} castShadow receiveShadow material={bagMat} />
      {/* Rabat roll-top */}
      <RoundedBox args={[W + 2, FLAP_H, D + 0.8]} radius={1.2} smoothness={4} position={[0, BODY_H + FLAP_H / 2, 0.4]} castShadow material={bagMat} />
      {/* Couture corps→rabat */}
      <mesh position={[0, BODY_H, 0.4]} material={bagDark}>
        <boxGeometry args={[W + 2.5, 0.9, D + 1.2]} />
      </mesh>
      {/* Grande poche frontale */}
      <RoundedBox args={[PW, PH, 2.0]} radius={0.7} smoothness={4} position={[0, PY, PZ]} castShadow material={bagMat} />
      <mesh position={[0, PY + PH / 2 - 0.2, D / 2 + 1.55]} material={bagDark}>
        <boxGeometry args={[PW, 0.7, 0.4]} />
      </mesh>
      <mesh position={[-PW / 2 + 3.5, PY + PH / 2 + 0.2, D / 2 + 1.7]} material={silverMat}>
        <boxGeometry args={[2.2, 1.4, 0.8]} />
      </mesh>
      <mesh position={[W * 0.1, PY - PH * 0.22, D / 2 + 2.1]} material={labelMat}>
        <boxGeometry args={[8.5, 5.5, 0.5]} />
      </mesh>
      {/* Poches latérales */}
      {([-1, 1] as const).map(s => (
        <RoundedBox key={s} args={[SPW, SPH, SPT]} radius={0.6} smoothness={3}
          position={[s * (W / 2 + SPT / 2 - 0.4), SPH / 2 + BODY_H * 0.06, 0]}
          castShadow material={bagMat} />
      ))}
      {/* Poignées */}
      {([-1, 1] as const).map(s => (
        <RoundedBox key={s} args={[HW, HLEN, HT]} radius={0.3} smoothness={2}
          position={[s * HGAP, H + HLEN / 2 - FLAP_H * 0.3, D / 2 - D * 0.18]}
          rotation={[0, 0, -s * 0.06]} material={bagMat} />
      ))}
      <RoundedBox args={[HGAP * 2 + HW, HW, HT]} radius={0.3} smoothness={2}
        position={[0, H + HLEN - FLAP_H * 0.28, D / 2 - D * 0.18]} material={bagMat} />
      <RoundedBox args={[3.5, 5, HT]} radius={0.3} smoothness={2}
        position={[0, H + 2.5, -(D / 2) + HT * 0.5]} material={bagMat} />
      {/* Sangle centrale + boucle */}
      <mesh position={[0, BODY_H + FLAP_H * 0.06 + SLEN / 2, D / 2 + 0.6]} material={bagMat}>
        <boxGeometry args={[SW, SLEN, HT]} />
      </mesh>
      <mesh position={[0, BODY_H + FLAP_H * 0.06 + SLEN + 1.9, D / 2 + 0.5]} material={buckMat}>
        <boxGeometry args={[6.5, 3.8, 2.2]} />
      </mesh>
      {/* Bretelles dos */}
      {([-1, 1] as const).map(s => {
        const ssH = SS_TOP_Y - SS_BOT_Y;
        return (
          <group key={s}>
            <RoundedBox args={[SSW, ssH, SST]} radius={0.5} smoothness={4}
              position={[s * SSSp, SS_BOT_Y + ssH / 2, -(D / 2) + SST / 2]}
              castShadow material={bagMat} />
            {([0, 1, 2, 3] as const).map(i => (
              <mesh key={i}
                position={[s * SSSp, SS_BOT_Y + ssH * (0.2 + i * 0.2), -(D / 2) + SST / 2]}
                material={bagDark}>
                <boxGeometry args={[SSW + 0.4, 0.5, SST + 0.2]} />
              </mesh>
            ))}
            <mesh position={[s * SSSp, SS_BOT_Y + ssH * 0.6, -(D / 2) + SST / 2]} material={silverMat}>
              <boxGeometry args={[SSW + 1.5, 1.8, SST + 0.6]} />
            </mesh>
            <mesh position={[s * SSSp, SS_BOT_Y - 1, -(D / 2) + 0.5]} material={buckMat}>
              <boxGeometry args={[SSW + 1.5, 3.2, 3]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// ── Étagère à chaussures GREJIG ───────────────────────────────────────────────

function Grejig() {
  const W = 60, D = 22, H = 50, TR = 0.4;
  const SHELF_YS = [3, 19, 35] as const;

  const MIRROR_CX = (KITCHEN_X1 + DOOR_START) / 2; // 160
  const cx = MIRROR_CX + 40 - 50 + 12;              // ≈ 162
  const px = cx - W / 2, pz = ROOM_D - D;

  function Tube({ p1, p2 }: { p1: [number,number,number]; p2: [number,number,number] }) {
    const [x1,y1,z1] = p1, [x2,y2,z2] = p2;
    const dx=x2-x1,dy=y2-y1,dz=z2-z1;
    const len = Math.sqrt(dx*dx+dy*dy+dz*dz);
    if (len < 0.01) return null;
    const mid: [number,number,number] = [(x1+x2)/2,(y1+y2)/2,(z1+z2)/2];
    const q = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0,1,0), new THREE.Vector3(dx,dy,dz).normalize(),
    );
    return (
      <mesh position={mid} quaternion={q} castShadow material={grejigMat}>
        <cylinderGeometry args={[TR, TR, len, 6]} />
      </mesh>
    );
  }

  return (
    <group position={[px, 0, pz]}>
      {/* 4 montants */}
      <Tube p1={[TR,0,TR]} p2={[TR,H,TR]} />
      <Tube p1={[W-TR,0,TR]} p2={[W-TR,H,TR]} />
      <Tube p1={[TR,0,D-TR]} p2={[TR,H,D-TR]} />
      <Tube p1={[W-TR,0,D-TR]} p2={[W-TR,H,D-TR]} />
      {/* Cadre bas */}
      <Tube p1={[TR,TR,TR]} p2={[W-TR,TR,TR]} />
      <Tube p1={[TR,TR,D-TR]} p2={[W-TR,TR,D-TR]} />
      <Tube p1={[TR,TR,TR]} p2={[TR,TR,D-TR]} />
      <Tube p1={[W-TR,TR,TR]} p2={[W-TR,TR,D-TR]} />
      {/* 3 niveaux d'étagère */}
      {SHELF_YS.map((y) => (
        <group key={y}>
          <Tube p1={[TR,y,TR]} p2={[W-TR,y,TR]} />
          <Tube p1={[TR,y,D-TR]} p2={[W-TR,y,D-TR]} />
          <Tube p1={[TR,y,TR]} p2={[TR,y,D-TR]} />
          <Tube p1={[W-TR,y,TR]} p2={[W-TR,y,D-TR]} />
          {([1,2,3,4,5] as const).map((k) => {
            const x = TR + (W - 2 * TR) * k / 6;
            return <Tube key={k} p1={[x,y,TR]} p2={[x,y,D-TR]} />;
          })}
        </group>
      ))}
      {/* Cadre supérieur */}
      <Tube p1={[TR,H,TR]} p2={[W-TR,H,TR]} />
      <Tube p1={[TR,H,D-TR]} p2={[W-TR,H,D-TR]} />
      <Tube p1={[TR,H,TR]} p2={[TR,H,D-TR]} />
      <Tube p1={[W-TR,H,TR]} p2={[W-TR,H,D-TR]} />
    </group>
  );
}

// ── Export principal ──────────────────────────────────────────────────────────

export function Backpacks() {
  return (
    <>
      {/* Sac S : mur B, Y=160 */}
      <group position={[300 - 15 / 2, 160, 155]} rotation={[0, -Math.PI / 2, 0]}>
        <Bag W={29} H={39} D={15} />
      </group>
      {/* Sac L : mur B */}
      <group position={[300 - 17 / 2, 160, 200]} rotation={[0, -Math.PI / 2, 0]}>
        <Bag W={32} H={43} D={17} />
      </group>
      {/* Sac L : mur A */}
      <group position={[17 / 2, 138, 258]} rotation={[0, Math.PI / 2, 0]}>
        <Bag W={32} H={43} D={17} />
      </group>
      <Grejig />
    </>
  );
}
