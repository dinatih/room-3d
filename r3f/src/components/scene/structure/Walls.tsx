/**
 * Murs de l'appartement — port fidèle de js/structure/walls.js.
 *
 * Géométries complexes (mur diagonal, trapèze mur C) créées via useMemo
 * avec ExtrudeGeometry, comme dans le JS procédural.
 *
 * Les portes (dormants + panneaux animés) sont incluses ici pour rester
 * cohérentes avec le découpage d'origine. Un refactor ultérieur pourra
 * les extraire dans des composants dédiés.
 */
import { useMemo, useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// @ts-ignore
import {
  ROOM_W, ROOM_D, WALL_H,
  NICHE_DEPTH, NICHE_Z_START,
  GLASS_START, GLASS_END,
  DOOR_START, DOOR_END, DOOR_H,
  KITCHEN_X0, KITCHEN_X1, KITCHEN_DEPTH, KITCHEN_Z,
  SDB_Z_END,
  DIAG_AX, DIAG_AZ, DIAG_CX, DIAG_CZ,
} from '@config';

// ── Matériaux (module-level, instances uniques) ───────────────────────────────
const wallMat = new THREE.MeshStandardMaterial({ color: 0xe8e4dc, roughness: 0.9 });
const ghostMat = new THREE.MeshStandardMaterial({
  color: 0xe8e4dc, roughness: 0.9,
  transparent: true, opacity: 0.18, depthWrite: false,
});
const wallMatC = new THREE.MeshStandardMaterial({ color: 0xe8e4dc, roughness: 0.9 });
const wallMatDiag = new THREE.MeshStandardMaterial({ color: 0xe8e4dc, roughness: 0.9 });
const panelMat = new THREE.MeshStandardMaterial({ color: 0x8B6914, roughness: 0.6 });
const dormantMat = new THREE.MeshStandardMaterial({ color: 0xf0ede8, roughness: 0.35 });
const stopMat    = new THREE.MeshStandardMaterial({ color: 0xe8e5e0, roughness: 0.30 });
const pvcMat     = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.3 });
const sillMat    = new THREE.MeshStandardMaterial({ color: 0xb0a898, roughness: 0.8 });
const glassMat   = new THREE.MeshPhysicalMaterial({
  color: 0x88ccff, transparent: true, opacity: 0.25,
  roughness: 0.05, metalness: 0.1, side: THREE.DoubleSide,
});
const redFMat    = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.5 });
const whiteFMat  = new THREE.MeshStandardMaterial({ color: 0xf5f5f0, roughness: 0.3 });
const doorRedMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.5, metalness: 0.1 });
const doorWhtMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.4 });
const handleMat  = new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.85, roughness: 0.15 });

// BoxGeometry face order : [+X(0), -X(1), +Y(2), -Y(3), +Z(4), -Z(5)]
// westMats : face -X (index 1) fantôme ; eastMats : face +X (index 0) fantôme
const westMats = [wallMat, ghostMat, wallMat, wallMat, wallMat, wallMat];
const eastMats = [ghostMat, wallMat, wallMat, wallMat, wallMat, wallMat];

const W = 10; // épaisseur de mur

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Panneau box simple avec matériau optionnel (array ou simple). */
function P({ w, h, d, x, y, z, mat = wallMat }: {
  w: number; h: number; d: number;
  x: number; y: number; z: number;
  mat?: THREE.Material | THREE.Material[];
}) {
  return (
    <mesh
      ref={(m) => { if (m) m.material = mat as any; }}
      position={[x, y, z]}
      castShadow receiveShadow
    >
      <boxGeometry args={[w, h, d]} />
    </mesh>
  );
}

/** ExtrudeGeometry depuis une liste de points [worldX, worldZ]. */
function makeExtrudeGeo(
  pts: [number, number][],
  height: number,
  yBase = 0,
): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(pts[0][0], -pts[0][1]);
  for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i][0], -pts[i][1]);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false });
  geo.rotateX(-Math.PI / 2);
  if (yBase > 0) geo.translate(0, yBase, 0);
  return geo;
}

// ── Mur C : trapèze nord + baie vitrée ────────────────────────────────────────
function WallC() {
  const WALL_DEPTH = 30;
  const NW_EXT = 20, NE_EXT = 10;
  const GLASS_TOP_Y = 210;
  const linteauH = WALL_H - GLASS_TOP_Y; // 40

  const leftGeo   = useMemo(() => makeExtrudeGeo([
    [0,           0          ],
    [GLASS_START, 0          ],
    [GLASS_START, -WALL_DEPTH],
    [-NW_EXT,     -WALL_DEPTH],
  ], WALL_H), []);

  const rightGeo  = useMemo(() => makeExtrudeGeo([
    [GLASS_END,        0          ],
    [ROOM_W,           0          ],
    [ROOM_W + NE_EXT,  -WALL_DEPTH],
    [GLASS_END,        -WALL_DEPTH],
  ], WALL_H), []);

  // Porte-fenêtre : battant gauche (fixe) + battant droit (animé)
  const glassRef  = useRef<THREE.Group>(null!);
  const eastOpen  = useRef(false);
  const { invalidate: invalidateWallC } = useThree();
  useEffect(() => {
    const onToggle = (e: Event) => {
      if ((e as CustomEvent).detail?.key !== 'eastDoor') return;
      eastOpen.current = !eastOpen.current;
      if (glassRef.current) glassRef.current.rotation.y = eastOpen.current ? Math.PI / 2 : 0;
      invalidateWallC();
    };
    document.addEventListener('furniture-toggle', onToggle);
    return () => document.removeEventListener('furniture-toggle', onToggle);
  }, [invalidateWallC]);

  const doorW     = (GLASS_END - GLASS_START) / 2; // 80
  const FRAME     = 8, FRAME_D = 5;
  const glassBase = 20, glassH = GLASS_TOP_Y - glassBase; // 190
  const innerH    = glassH - FRAME * 2;
  const Z         = -5;

  function DoorPanel({ cx }: { cx: number }) {
    return (
      <group position={[cx, glassBase, 0]}>
        {/* Traverse haute */}
        <mesh ref={(m) => { if (m) m.material = pvcMat; }} position={[0, glassH - FRAME / 2, Z]}>
          <boxGeometry args={[doorW, FRAME, FRAME_D]} />
        </mesh>
        {/* Traverse basse */}
        <mesh ref={(m) => { if (m) m.material = pvcMat; }} position={[0, FRAME / 2, Z]}>
          <boxGeometry args={[doorW, FRAME, FRAME_D]} />
        </mesh>
        {/* Montant gauche */}
        <mesh ref={(m) => { if (m) m.material = pvcMat; }}
          position={[-doorW / 2 + FRAME / 2, FRAME + innerH / 2, Z]}>
          <boxGeometry args={[FRAME, innerH, FRAME_D]} />
        </mesh>
        {/* Montant droit */}
        <mesh ref={(m) => { if (m) m.material = pvcMat; }}
          position={[doorW / 2 - FRAME / 2, FRAME + innerH / 2, Z]}>
          <boxGeometry args={[FRAME, innerH, FRAME_D]} />
        </mesh>
        {/* Vitrage */}
        <mesh ref={(m) => { if (m) m.material = glassMat; }}
          position={[0, FRAME + innerH / 2, Z]}>
          <planeGeometry args={[doorW - FRAME * 2, innerH]} />
        </mesh>
      </group>
    );
  }

  return (
    <>
      <mesh geometry={leftGeo}  material={wallMatC} castShadow receiveShadow />
      <mesh geometry={rightGeo} material={wallMatC} castShadow receiveShadow />

      {/* Linteau */}
      <P w={GLASS_END - GLASS_START} h={linteauH} d={WALL_DEPTH}
        x={(GLASS_START + GLASS_END) / 2}
        y={GLASS_TOP_Y + linteauH / 2}
        z={-WALL_DEPTH / 2}
      />

      {/* Seuil maçonné */}
      <mesh ref={(m) => { if (m) m.material = sillMat; }}
        position={[(GLASS_START + GLASS_END) / 2, 10, -15]}
        castShadow receiveShadow
      >
        <boxGeometry args={[GLASS_END - GLASS_START, 20, WALL_DEPTH]} />
      </mesh>

      {/* Battant gauche (fixe) */}
      <DoorPanel cx={GLASS_START + doorW / 2} />

      {/* Battant droit (pivot à GLASS_END) */}
      <group ref={glassRef} position={[GLASS_END, 0, 0]}
        userData={{ hoverAction: { label: 'Porte-fenêtre', actionId: 'eastDoor' } }}>
        <DoorPanel cx={-doorW / 2} />
        {/* Poignée */}
        <mesh ref={(m) => { if (m) m.material = handleMat; }}
          position={[-doorW + FRAME + 4, glassBase + glassH * 0.5, Z + FRAME_D / 2 + 0.5]}>
          <boxGeometry args={[3, 24, 1]} />
        </mesh>
        <mesh ref={(m) => { if (m) m.material = handleMat; }}
          position={[-doorW + FRAME + 4, glassBase + glassH * 0.5, Z + FRAME_D / 2 + 4.5]}>
          <boxGeometry args={[1.5, 1.5, 8]} />
        </mesh>
      </group>
    </>
  );
}

// ── Porte séjour (mur D) ──────────────────────────────────────────────────────
function DoorLiving() {
  const panelRef = useRef<THREE.Group>(null!);
  // TODO : lier à un état global pour l'animation

  const WW = W, DORMANT_T = 2.5, STOP_T = 1, STOP_W = 3;
  const wallCZ = ROOM_D + WW / 2;
  const stopZ  = ROOM_D + STOP_T / 2;

  return (
    <group>
      {/* Dormant */}
      <P w={DORMANT_T} h={DOOR_H} d={WW}
        x={DOOR_START + DORMANT_T / 2} y={DOOR_H / 2} z={wallCZ} mat={dormantMat} />
      <P w={DORMANT_T} h={DOOR_H} d={WW}
        x={DOOR_END - DORMANT_T / 2} y={DOOR_H / 2} z={wallCZ} mat={dormantMat} />
      <P w={DOOR_END - DOOR_START - DORMANT_T * 2} h={DORMANT_T} d={WW}
        x={(DOOR_START + DOOR_END) / 2} y={DOOR_H + DORMANT_T / 2} z={wallCZ} mat={dormantMat} />
      {/* Arrêts */}
      <P w={STOP_T} h={DOOR_H} d={STOP_W}
        x={DOOR_START + DORMANT_T + STOP_T / 2} y={DOOR_H / 2} z={stopZ} mat={stopMat} />
      <P w={STOP_T} h={DOOR_H} d={STOP_W}
        x={DOOR_END - DORMANT_T - STOP_T / 2} y={DOOR_H / 2} z={stopZ} mat={stopMat} />
      <P w={DOOR_END - DOOR_START - DORMANT_T * 2 - STOP_T * 2} h={STOP_W} d={STOP_T}
        x={(DOOR_START + DOOR_END) / 2} y={DOOR_H - STOP_W / 2} z={stopZ} mat={stopMat} />

      {/* Panneau (pivot à DOOR_END) */}
      <group ref={panelRef} position={[DOOR_END, 0, ROOM_D + 3]}>
        <mesh ref={(m) => { if (m) m.material = doorWhtMat; }}
          position={[-(DOOR_END - DOOR_START) / 2, DOOR_H / 2, 0]} castShadow>
          <boxGeometry args={[DOOR_END - DOOR_START, DOOR_H, 4]} />
        </mesh>
        {/* Poignée L double face */}
        {([-2.5, 2.5] as const).map((zF) => {
          const sign = zF < 0 ? -1 : 1;
          const hx = -(DOOR_END - DOOR_START) + 15, hy = 100, R = 1.3;
          return (
            <group key={zF}>
              <mesh ref={(m) => { if (m) m.material = handleMat; }}
                rotation={[Math.PI / 2, 0, 0]} position={[hx, hy, zF]}>
                <cylinderGeometry args={[3, 3, 1, 12]} />
              </mesh>
              <mesh ref={(m) => { if (m) m.material = handleMat; }}
                rotation={[Math.PI / 2, 0, 0]}
                position={[hx, hy, zF + sign * 2.5]}>
                <cylinderGeometry args={[R, R, 5, 8]} />
              </mesh>
              <mesh ref={(m) => { if (m) m.material = handleMat; }}
                rotation={[0, 0, Math.PI / 2]}
                position={[hx + 7, hy, zF + sign * 5]}>
                <cylinderGeometry args={[R, R, 14, 8]} />
              </mesh>
              {([0, 14] as const).map((dx) => (
                <mesh key={dx} ref={(m) => { if (m) m.material = handleMat; }}
                  position={[hx + dx, hy, zF + sign * 5]}>
                  <sphereGeometry args={[R, 8, 6]} />
                </mesh>
              ))}
            </group>
          );
        })}
      </group>
    </group>
  );
}

// ── Porte SDB (mur couloir gauche) ────────────────────────────────────────────
function DoorSdb() {
  const WALL_X        = DOOR_START - 5;
  const LEFT_WALL_LEN = SDB_Z_END - KITCHEN_Z;
  const C_DOOR_W      = 83;
  const C_DOOR_START  = LEFT_WALL_LEN - 10 - C_DOOR_W;
  const C_DOOR_END    = C_DOOR_START + C_DOOR_W;
  const hingeZ        = KITCHEN_Z + C_DOOR_END;

  const panelRef = useRef<THREE.Group>(null!);
  const WW = W, DORMANT_T = 2.5, STOP_T = 1, STOP_W = 3;
  const wallCX = WALL_X;
  const stopX  = WALL_X - WW / 2 - STOP_T / 2;
  const FW = 3, FT = 1;

  return (
    <group>
      {/* Encadrement (2 faces) */}
      {([WALL_X - WW / 2 - FT / 2, WALL_X + WW / 2 + FT / 2] as const).map((xF) => (
        <group key={xF}>
          <P w={FT} h={DOOR_H} d={FW} x={xF} y={DOOR_H / 2}
            z={hingeZ - C_DOOR_W - FW / 2} mat={whiteFMat} />
          <P w={FT} h={DOOR_H} d={FW} x={xF} y={DOOR_H / 2}
            z={hingeZ + FW / 2} mat={whiteFMat} />
          <P w={FT} h={FW} d={C_DOOR_W + FW * 2} x={xF}
            y={DOOR_H + FW / 2} z={hingeZ - C_DOOR_W / 2} mat={whiteFMat} />
        </group>
      ))}
      {/* Dormant */}
      <P w={WW} h={DOOR_H} d={DORMANT_T}
        x={wallCX} y={DOOR_H / 2} z={hingeZ + DORMANT_T / 2} mat={dormantMat} />
      <P w={WW} h={DOOR_H} d={DORMANT_T}
        x={wallCX} y={DOOR_H / 2} z={hingeZ - C_DOOR_W - DORMANT_T / 2} mat={dormantMat} />
      <P w={WW} h={DORMANT_T} d={C_DOOR_W - DORMANT_T * 2}
        x={wallCX} y={DOOR_H + DORMANT_T / 2} z={hingeZ - C_DOOR_W / 2} mat={dormantMat} />
      {/* Arrêts */}
      <P w={STOP_T} h={DOOR_H} d={STOP_W}
        x={stopX} y={DOOR_H / 2} z={hingeZ - STOP_W / 2} mat={stopMat} />
      <P w={STOP_T} h={DOOR_H} d={STOP_W}
        x={stopX} y={DOOR_H / 2} z={hingeZ - C_DOOR_W + STOP_W / 2} mat={stopMat} />
      <P w={STOP_T} h={STOP_W} d={C_DOOR_W - STOP_W * 2}
        x={stopX} y={DOOR_H - STOP_W / 2} z={hingeZ - C_DOOR_W / 2} mat={stopMat} />

      {/* Panneau (pivot à hingeZ) */}
      <group ref={panelRef} position={[WALL_X, 0, hingeZ]}>
        <mesh ref={(m) => { if (m) m.material = doorWhtMat; }}
          position={[0, DOOR_H / 2, -C_DOOR_W / 2]} castShadow>
          <boxGeometry args={[4, DOOR_H, C_DOOR_W]} />
        </mesh>
      </group>
    </group>
  );
}

// ── Porte d'entrée (mur diagonal) ─────────────────────────────────────────────
function DoorEntry() {
  // Calculs identiques à walls.js
  const diagDX  = DIAG_CX - DIAG_AX;
  const diagDZ  = DIAG_CZ - DIAG_AZ;
  const diagLen = Math.sqrt(diagDX * diagDX + diagDZ * diagDZ);
  const sinθ    = diagDX / diagLen;
  const cosθ    = diagDZ / diagLen;
  const pX      = cosθ;
  const pZ      = -sinθ;
  const DIAG_DEPTH = 10;

  const perpX   = 5 * diagDZ / diagLen;
  const perpZ   = -5 * diagDX / diagLen;
  const originX = DIAG_AX + perpX;
  const originZ = DIAG_AZ + perpZ;

  const E_DOOR_START = 10, E_DOOR_W = 90;
  const hingeX  = originX + E_DOOR_START * sinθ;
  const hingeZ  = originZ + E_DOOR_START * cosθ;
  const rotY    = Math.atan2(diagDX, diagDZ);

  const iP = (d: number) => [DIAG_AX + d * sinθ, DIAG_AZ + d * cosθ] as [number, number];
  const eP = (d: number) => [
    DIAG_AX + d * sinθ + DIAG_DEPTH * pX,
    DIAG_AZ + d * cosθ + DIAG_DEPTH * pZ,
  ] as [number, number];
  const FW = 3, FT = 1;

  const chamberGeos = useMemo(() => {
    function makeChambSection(d0: number, d1: number, height: number, yBase: number, outward: boolean) {
      const base = outward ? eP : iP;
      const sign = outward ? 1 : -1;
      const pts: [number, number][] = [
        base(d0),
        base(d1),
        [base(d1)[0] + sign * FT * pX, base(d1)[1] + sign * FT * pZ],
        [base(d0)[0] + sign * FT * pX, base(d0)[1] + sign * FT * pZ],
      ];
      return makeExtrudeGeo(pts, height, yBase);
    }
    return {
      red: [
        makeChambSection(E_DOOR_START - FW, E_DOOR_START, DOOR_H, 0, true),
        makeChambSection(E_DOOR_START + E_DOOR_W, E_DOOR_START + E_DOOR_W + FW, DOOR_H, 0, true),
        makeChambSection(E_DOOR_START - FW, E_DOOR_START + E_DOOR_W + FW, FW, DOOR_H, true),
      ],
      white: [
        makeChambSection(E_DOOR_START - FW, E_DOOR_START, DOOR_H, 0, false),
        makeChambSection(E_DOOR_START + E_DOOR_W, E_DOOR_START + E_DOOR_W + FW, DOOR_H, 0, false),
        makeChambSection(E_DOOR_START - FW, E_DOOR_START + E_DOOR_W + FW, FW, DOOR_H, false),
      ],
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const panelRef = useRef<THREE.Group>(null!);

  return (
    <group>
      {chamberGeos.red.map((g, i) => (
        <mesh key={`r${i}`} geometry={g} material={redFMat} castShadow />
      ))}
      {chamberGeos.white.map((g, i) => (
        <mesh key={`w${i}`} geometry={g} material={whiteFMat} castShadow />
      ))}

      {/* Panneau rouge (pivot à hinge) */}
      <group ref={panelRef} position={[hingeX, 0, hingeZ]} rotation={[0, rotY, 0]}>
        <mesh ref={(m) => { if (m) m.material = doorRedMat; }}
          position={[0, DOOR_H / 2, E_DOOR_W / 2]} castShadow>
          <boxGeometry args={[4, DOOR_H, E_DOOR_W]} />
        </mesh>
        {/* Poignée intérieure L */}
        {(() => {
          const hz = 70, hy = 100, R = 1.3;
          return (
            <>
              <mesh ref={(m) => { if (m) m.material = handleMat; }}
                rotation={[0, 0, Math.PI / 2]} position={[-2.5, hy, hz]}>
                <cylinderGeometry args={[3, 3, 1, 12]} />
              </mesh>
              <mesh ref={(m) => { if (m) m.material = handleMat; }}
                rotation={[0, 0, Math.PI / 2]} position={[-5.5, hy, hz]}>
                <cylinderGeometry args={[R, R, 5, 8]} />
              </mesh>
              <mesh ref={(m) => { if (m) m.material = handleMat; }}
                rotation={[Math.PI / 2, 0, 0]} position={[-8, hy, hz - 7]}>
                <cylinderGeometry args={[R, R, 14, 8]} />
              </mesh>
              {([0, -14] as const).map((dz) => (
                <mesh key={dz} ref={(m) => { if (m) m.material = handleMat; }}
                  position={[-8, hy, hz + dz]}>
                  <sphereGeometry args={[R, 8, 6]} />
                </mesh>
              ))}
            </>
          );
        })()}
        {/* Boule extérieure rouge */}
        <mesh ref={(m) => { if (m) m.material = new THREE.MeshStandardMaterial({ color: 0xcc0000, metalness: 0.3, roughness: 0.4 }); }}
          position={[6, DOOR_H / 2, E_DOOR_W / 2]}>
          <sphereGeometry args={[5, 16, 12]} />
        </mesh>
      </group>
    </group>
  );
}

// ── Placard couloir ────────────────────────────────────────────────────────────
function CorridorCloset() {
  const CLOSET_X0 = KITCHEN_X1, CLOSET_X1 = DOOR_START;
  const CLOSET_Z0 = ROOM_D + W, CLOSET_Z1 = KITCHEN_Z;
  const CLOSET_W  = CLOSET_X1 - CLOSET_X0;
  const CLOSET_D  = CLOSET_Z1 - CLOSET_Z0;
  const CX = (CLOSET_X0 + CLOSET_X1) / 2;
  const CZ = (CLOSET_Z0 + CLOSET_Z1) / 2;
  const shelfMat  = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.4 });
  const doorMat   = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.3 });
  const closetRef = useRef<THREE.Group>(null!);
  const corrOpen  = useRef(false);
  const { invalidate: invalidateCloset } = useThree();
  useEffect(() => {
    const onToggle = (e: Event) => {
      if ((e as CustomEvent).detail?.key !== 'corrDoors') return;
      corrOpen.current = !corrOpen.current;
      if (closetRef.current) closetRef.current.rotation.y = corrOpen.current ? Math.PI / 2 : 0;
      invalidateCloset();
    };
    document.addEventListener('furniture-toggle', onToggle);
    return () => document.removeEventListener('furniture-toggle', onToggle);
  }, [invalidateCloset]);

  return (
    <group>
      {[60, 120, 180].map((y) => (
        <mesh key={y} ref={(m) => { if (m) m.material = shelfMat; }}
          position={[CX, y, CZ]} castShadow receiveShadow>
          <boxGeometry args={[CLOSET_W - 4, 3, CLOSET_D]} />
        </mesh>
      ))}
      <group ref={closetRef} position={[CLOSET_X1, 0, CLOSET_Z0]}
        userData={{ hoverAction: { label: 'Placard couloir', actionId: 'corrDoors' } }}>
        <mesh ref={(m) => { if (m) m.material = doorMat; }}
          position={[0, (WALL_H - 10) / 2, CLOSET_D / 2]} castShadow>
          <boxGeometry args={[2, WALL_H - 10, CLOSET_D - 2]} />
        </mesh>
        <mesh ref={(m) => { if (m) m.material = handleMat; }}
          position={[2, WALL_H / 2, CLOSET_D - 6]}>
          <boxGeometry args={[3, 20, 1.2]} />
        </mesh>
      </group>
    </group>
  );
}

// ── Composant principal ────────────────────────────────────────────────────────
export function Walls() {
  // Géométries complexes via useMemo ──────────────────────────────────────────

  // Mur diagonal : constantes dérivées
  const diagGeos = useMemo(() => {
    const diagDX  = DIAG_CX - DIAG_AX;
    const diagDZ  = DIAG_CZ - DIAG_AZ;
    const diagLen = Math.sqrt(diagDX * diagDX + diagDZ * diagDZ);
    const sinθ    = diagDX / diagLen;
    const cosθ    = diagDZ / diagLen;
    const pX      = cosθ;
    const pZ      = -sinθ;
    const DIAG_DEPTH = 10;

    const iP = (d: number): [number, number] => [DIAG_AX + d * sinθ, DIAG_AZ + d * cosθ];
    const eP = (d: number): [number, number] => [
      DIAG_AX + d * sinθ + DIAG_DEPTH * pX,
      DIAG_AZ + d * cosθ + DIAG_DEPTH * pZ,
    ];

    const E_DOOR_START = 10, E_DOOR_W = 90, E_DOOR_END = E_DOOR_START + E_DOOR_W;

    const B_EXT_X    = ROOM_W + W;
    const d_start_cut = (B_EXT_X - DIAG_AX - DIAG_DEPTH * pX) / sinθ;
    const A_EXT_X    = -NICHE_DEPTH - W;
    const d_ext_cut  = (A_EXT_X - DIAG_AX - DIAG_DEPTH * pX) / sinθ;

    // Section NE biseautée (de 0 à E_DOOR_START, face ext de d_start_cut)
    const ne = makeExtrudeGeo(
      [iP(0), iP(E_DOOR_START), eP(E_DOOR_START), eP(d_start_cut)],
      WALL_H,
    );

    // Linteau au-dessus de la porte d'entrée
    const linteau = makeExtrudeGeo(
      [iP(E_DOOR_START), iP(E_DOOR_END), eP(E_DOOR_END), eP(E_DOOR_START)],
      WALL_H - DOOR_H,
      DOOR_H,
    );

    // Section SW biseautée
    const sw = makeExtrudeGeo(
      [iP(E_DOOR_END), iP(diagLen), eP(d_ext_cut), eP(E_DOOR_END)],
      WALL_H,
    );

    // Triangle prism A2 biseau SW
    const A2_Z_EXT = DIAG_AZ + d_ext_cut * cosθ + DIAG_DEPTH * pZ;
    const a2Shape = new THREE.Shape();
    a2Shape.moveTo(-NICHE_DEPTH, -DIAG_CZ);
    a2Shape.lineTo(A_EXT_X,     -DIAG_CZ);
    a2Shape.lineTo(A_EXT_X,     -A2_Z_EXT);
    a2Shape.closePath();
    const a2Geo = new THREE.ExtrudeGeometry(a2Shape, { depth: WALL_H, bevelEnabled: false });
    a2Geo.rotateX(-Math.PI / 2);

    // Triangle SE mur B couloir
    const Z_se_ext = DIAG_AZ + d_start_cut * cosθ + DIAG_DEPTH * pZ;
    const bShape = new THREE.Shape();
    bShape.moveTo(ROOM_W,     -DIAG_AZ);
    bShape.lineTo(ROOM_W + W, -DIAG_AZ);
    bShape.lineTo(ROOM_W + W, -Z_se_ext);
    bShape.closePath();
    const bGeo = new THREE.ExtrudeGeometry(bShape, { depth: WALL_H, bevelEnabled: false });
    bGeo.rotateX(-Math.PI / 2);

    return { ne, linteau, sw, a2: a2Geo, bSE: bGeo };
  }, []);

  return (
    <group>

      {/* ── MUR A (ouest, X=0) ─────────────────────────────────────────────── */}
      {/* A1 : Z=-30 → Z=NICHE_Z_START=280 */}
      <mesh
        ref={(m) => { if (m) m.material = westMats as any; }}
        position={[-W / 2, WALL_H / 2, (-30 + NICHE_Z_START) / 2]}
        castShadow receiveShadow
      >
        <boxGeometry args={[W, WALL_H, 310]} />
      </mesh>
      {/* A2 : X=-10-W/2, Z=-30 → Z=DIAG_CZ */}
      <mesh
        ref={(m) => { if (m) m.material = westMats as any; }}
        position={[-NICHE_DEPTH - W / 2, WALL_H / 2, (-30 + DIAG_CZ) / 2]}
        castShadow receiveShadow
      >
        <boxGeometry args={[W, WALL_H, DIAG_CZ + 30]} />
      </mesh>

      {/* ── MUR B (est, X=300) ─────────────────────────────────────────────── */}
      {/* B1 : Z=-30 → Z=410 */}
      <mesh
        ref={(m) => { if (m) m.material = eastMats as any; }}
        position={[ROOM_W + W / 2, WALL_H / 2, (-30 + ROOM_D + 10) / 2]}
        castShadow receiveShadow
      >
        <boxGeometry args={[W, WALL_H, ROOM_D + 10 + 30]} />
      </mesh>
      {/* B2 extension jardin : Z=-230 → Z=-30 */}
      <mesh
        ref={(m) => { if (m) m.material = eastMats as any; }}
        position={[ROOM_W + W / 2, WALL_H / 2, (-230 + -30) / 2]}
        castShadow receiveShadow
      >
        <boxGeometry args={[W, WALL_H, 200]} />
      </mesh>
      {/* Panneaux bois occultants 2×90cm */}
      {[0, 1].map((i) => (
        <P key={i}
          w={10} h={190} d={90}
          x={ROOM_W + 5}
          y={95}
          z={-230 - i * 90 - 45}
          mat={panelMat}
        />
      ))}

      {/* ── MUR C (nord, Z=0) ──────────────────────────────────────────────── */}
      <WallC />

      {/* ── MUR D (sud, Z=400) ─────────────────────────────────────────────── */}
      {/* Extension niche côté A */}
      <P w={NICHE_DEPTH} h={WALL_H} d={W} x={-NICHE_DEPTH / 2}   y={WALL_H / 2} z={ROOM_D + W / 2} />
      {/* Gauche (X=0→30) */}
      <P w={KITCHEN_X0}  h={WALL_H} d={W} x={KITCHEN_X0 / 2}     y={WALL_H / 2} z={ROOM_D + W / 2} />
      {/* Milieu (X=130→180) */}
      <P w={DOOR_START - 10 - KITCHEN_X1} h={WALL_H} d={W}
        x={(KITCHEN_X1 + DOOR_START - 10) / 2}                    y={WALL_H / 2} z={ROOM_D + W / 2} />
      {/* Montants porte séjour */}
      <P w={10} h={WALL_H} d={W} x={DOOR_START - 5}               y={WALL_H / 2} z={ROOM_D + W / 2} />
      <P w={10} h={WALL_H} d={W} x={DOOR_END + 5}                 y={WALL_H / 2} z={ROOM_D + W / 2} />
      {/* Linteau */}
      <P w={DOOR_END - DOOR_START} h={WALL_H - DOOR_H} d={W}
        x={(DOOR_START + DOOR_END) / 2}
        y={DOOR_H + (WALL_H - DOOR_H) / 2}                                       z={ROOM_D + W / 2} />
      {/* Droite (X=280→300) */}
      <P w={ROOM_W - DOOR_END - 10} h={WALL_H} d={W}
        x={(DOOR_END + 10 + ROOM_W) / 2}                          y={WALL_H / 2} z={ROOM_D + W / 2} />

      {/* ── Cuisine (renfoncement) ──────────────────────────────────────────── */}
      <P w={W} h={WALL_H} d={KITCHEN_DEPTH}
        x={KITCHEN_X0 - W / 2} y={WALL_H / 2} z={ROOM_D + KITCHEN_DEPTH / 2} />
      <P w={W} h={WALL_H} d={KITCHEN_DEPTH}
        x={KITCHEN_X1 + W / 2} y={WALL_H / 2} z={ROOM_D + KITCHEN_DEPTH / 2} />
      {/* Mur nord SDB / fond cuisine */}
      <P w={DOOR_START + NICHE_DEPTH} h={WALL_H} d={W}
        x={(DOOR_START - NICHE_DEPTH) / 2} y={WALL_H / 2} z={KITCHEN_Z + W / 2} />

      {/* ── Couloir gauche (X=185, Z=460→600) ─────────────────────────────── */}
      {(() => {
        const WALL_X        = DOOR_START - 5;
        const LEFT_WALL_LEN = SDB_Z_END - KITCHEN_Z;
        const C_DOOR_W      = 83;
        const C_DOOR_START  = LEFT_WALL_LEN - 10 - C_DOOR_W;
        const C_DOOR_END    = C_DOOR_START + C_DOOR_W;
        const C_DOOR_START_ABS = KITCHEN_Z + C_DOOR_START;
        const C_DOOR_END_ABS   = KITCHEN_Z + C_DOOR_END;
        return (
          <>
            <P w={W} h={WALL_H} d={C_DOOR_START_ABS - KITCHEN_Z} x={WALL_X} y={WALL_H / 2}
              z={(KITCHEN_Z + C_DOOR_START_ABS) / 2} />
            <P w={W} h={WALL_H} d={SDB_Z_END - C_DOOR_END_ABS} x={WALL_X} y={WALL_H / 2}
              z={(C_DOOR_END_ABS + SDB_Z_END) / 2} />
            <P w={W} h={WALL_H - DOOR_H} d={C_DOOR_W} x={WALL_X}
              y={DOOR_H + (WALL_H - DOOR_H) / 2} z={(C_DOOR_START_ABS + C_DOOR_END_ABS) / 2} />
          </>
        );
      })()}

      {/* ── Douche (au-delà de SDB_Z_END=600) ─────────────────────────────── */}
      {/* Mur est douche (X=60, Z=600→670) */}
      <P w={W} h={WALL_H} d={70}
        x={-NICHE_DEPTH + 70 + W / 2} y={WALL_H / 2} z={SDB_Z_END + 35} />
      {/* Mur fond douche (Z=670) */}
      <P w={70} h={WALL_H} d={W}
        x={-NICHE_DEPTH + 35} y={WALL_H / 2} z={SDB_Z_END + 70 + W / 2} />

      {/* ── Couloir droit (X=305, Z=410→530) ──────────────────────────────── */}
      <mesh
        ref={(m) => { if (m) m.material = eastMats as any; }}
        position={[ROOM_W + W / 2, WALL_H / 2, (ROOM_D + W + DIAG_AZ) / 2]}
        castShadow receiveShadow
      >
        <boxGeometry args={[W, WALL_H, DIAG_AZ - ROOM_D - W]} />
      </mesh>

      {/* ── Mur diagonal ────────────────────────────────────────────────────── */}
      <mesh geometry={diagGeos.ne}     material={wallMatDiag} castShadow receiveShadow />
      <mesh geometry={diagGeos.linteau} material={wallMatDiag} castShadow receiveShadow />
      <mesh geometry={diagGeos.sw}     material={wallMatDiag} castShadow receiveShadow />
      <mesh geometry={diagGeos.a2}     material={wallMat}     castShadow receiveShadow />
      <mesh geometry={diagGeos.bSE}    material={wallMat}     castShadow receiveShadow />

      {/* ── Portes ──────────────────────────────────────────────────────────── */}
      <DoorLiving />
      <DoorSdb />
      <DoorEntry />
      <CorridorCloset />

    </group>
  );
}
