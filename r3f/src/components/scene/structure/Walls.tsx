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
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

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
const pvcMat     = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.3 });
const sillMat    = new THREE.MeshStandardMaterial({ color: 0xb0a898, roughness: 0.8 });
const glassMat   = new THREE.MeshPhysicalMaterial({
  color: 0x88ccff, transparent: true, opacity: 0.25,
  roughness: 0.05, metalness: 0.1, side: THREE.DoubleSide,
});
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
      {/* Montants porte séjour — droite élargie de 8cm pour le décalage +6 de la porte */}
      <P w={10} h={WALL_H} d={W} x={DOOR_START - 5}               y={WALL_H / 2} z={ROOM_D + W / 2} />
      <P w={2}  h={WALL_H} d={W} x={DOOR_END + 9}                  y={WALL_H / 2} z={ROOM_D + W / 2} />
      {/* Linteau */}
      <P w={DOOR_END - DOOR_START + 8} h={WALL_H - DOOR_H} d={W}
        x={(DOOR_START + DOOR_END + 8) / 2}
        y={DOOR_H + (WALL_H - DOOR_H) / 2}                                        z={ROOM_D + W / 2} />
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
        const E = 2; // élargissement 2cm de chaque côté → évite le z-fighting avec le dormant
        return (
          <>
            <P w={W} h={WALL_H} d={C_DOOR_START - E} x={WALL_X} y={WALL_H / 2}
              z={KITCHEN_Z + (C_DOOR_START - E) / 2} />
            <P w={W} h={WALL_H} d={SDB_Z_END - C_DOOR_END_ABS - E} x={WALL_X} y={WALL_H / 2}
              z={(C_DOOR_END_ABS + E + SDB_Z_END) / 2} />
            <P w={W} h={WALL_H - DOOR_H} d={C_DOOR_W + 2 * E} x={WALL_X}
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


    </group>
  );
}
