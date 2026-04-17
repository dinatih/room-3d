/**
 * Évier BOHOLMEN 1 bac — géométrie fidèle à Kitchen.tsx.
 * Local coords : centré XZ, Y=0=niveau du plan de travail (rim affleurant).
 * Le bac descend vers Y<0 ; le robinet monte vers Y>0.
 */
import { useLayoutEffect } from 'react';
import * as THREE from 'three';
import type { SceneItemProps } from '../../../types';

const SINK_W    = 30;
const SINK_D    = 47;
const HOLE_W    = 28;
const HOLE_D    = 44.6;
const BASIN_W   = 23;
const BASIN_D   = 40;
const DEPTH     = 15;
const RIM_T     = 1.2;
const RIM_ZW    = (SINK_D  - HOLE_D) / 2;
const RIM_XW    = (SINK_W  - HOLE_W) / 2;
const WALL_T    = (HOLE_W  - BASIN_W) / 2;

const inoxMat   = new THREE.MeshStandardMaterial({ color: 0xc8c8c8, metalness: 0.75, roughness: 0.12 });
const faucetMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.7,  roughness: 0.1  });

export function SinkBoholmen({ onSize }: SceneItemProps) {
  useLayoutEffect(() => {
    // Height = basin depth + faucet height above rim
    onSize(new THREE.Vector3(SINK_W, DEPTH + 20, SINK_D));
  }, []);

  return (
    <group>
      {/* ── Rebord extérieur (4 bandes) ── */}
      {([
        [SINK_W, RIM_ZW,  0,                               -(HOLE_D / 2 + RIM_ZW / 2)],
        [SINK_W, RIM_ZW,  0,                                 HOLE_D / 2 + RIM_ZW / 2 ],
        [RIM_XW, HOLE_D, -(HOLE_W / 2 + RIM_XW / 2),        0                        ],
        [RIM_XW, HOLE_D,   HOLE_W / 2 + RIM_XW / 2,         0                        ],
      ] as [number, number, number, number][]).map(([w, d, px, pz], i) => (
        <mesh key={i} position={[px, RIM_T / 2, pz]} material={inoxMat}>
          <boxGeometry args={[w, RIM_T, d]} />
        </mesh>
      ))}

      {/* ── Parois du bac (4 côtés) ── */}
      {([
        { sx: HOLE_W, sz: WALL_T, px: 0,                        pz: -(BASIN_D + WALL_T) / 2 },
        { sx: HOLE_W, sz: WALL_T, px: 0,                        pz:  (BASIN_D + WALL_T) / 2 },
        { sx: WALL_T, sz: HOLE_D, px: -(BASIN_W + WALL_T) / 2, pz: 0                        },
        { sx: WALL_T, sz: HOLE_D, px:  (BASIN_W + WALL_T) / 2, pz: 0                        },
      ]).map((s, i) => (
        <mesh key={i} position={[s.px, -DEPTH / 2, s.pz]} material={inoxMat}>
          <boxGeometry args={[s.sx, DEPTH, s.sz]} />
        </mesh>
      ))}

      {/* Fond */}
      <mesh position={[0, -DEPTH + 0.25, 0]} material={inoxMat}>
        <boxGeometry args={[BASIN_W, 0.5, BASIN_D]} />
      </mesh>
      {/* Bonde */}
      <mesh position={[0, -DEPTH + 0.7, 0]} rotation={[Math.PI / 2, 0, 0]} material={inoxMat}>
        <cylinderGeometry args={[2.5, 2.5, 0.8, 16]} />
      </mesh>

      {/* ── Robinet ── */}
      {/* Colonne verticale */}
      <mesh position={[0, 10, SINK_D / 2 - 3]} rotation={[Math.PI / 2, 0, 0]} material={faucetMat}>
        <cylinderGeometry args={[1, 1, 20, 8]} />
      </mesh>
      {/* Bec horizontal */}
      <mesh position={[0, 19, SINK_D / 2 - 9]} rotation={[Math.PI / 2, 0, 0]} material={faucetMat}>
        <cylinderGeometry args={[0.8, 0.8, 12, 8]} />
      </mesh>
    </group>
  );
}
