/**
 * Backpacks.tsx — sacs à dos procéduraux + étagère à chaussures GREJIG.
 * Port de js/decor/backpacks.js et js/decor/grejig.js.
 */
import { useMemo } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

// ── Matériaux ─────────────────────────────────────────────────────────────────

const bagMat  = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.83 });
const bagDark = new THREE.MeshStandardMaterial({ color: 0xaa0000, roughness: 0.88 });
const buckMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.5, metalness: 0.35 });
const silverMat = new THREE.MeshStandardMaterial({ color: 0x9a9a9a, roughness: 0.25, metalness: 0.9 });
const labelMat = new THREE.MeshStandardMaterial({ color: 0x0e0e0e, roughness: 0.8 });

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
    </>
  );
}
