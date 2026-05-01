/**
 * Building.tsx — Coque architecturale fixe : murs, sol/plafond, miroirs.
 *
 * Regroupe ce qui était dans Walls.tsx, Floor.tsx et Mirrors.tsx — éléments
 * définis en coordonnées monde (pas des items réutilisables).
 *
 * makeGrassTex est exporté car GrassRug (items/) le réutilise.
 */
import { useMemo, useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { cameraState } from '@features/camera/cameraState';
import { NissedalFrame, NissedalGlbFrame, GLB_40x150 } from './items/NissedalMirror';

import {
  ROOM_W, ROOM_D, WALL_H,
  NICHE_DEPTH, NICHE_Z_START,
  GLASS_START, GLASS_END,
  DOOR_START, DOOR_END, DOOR_H,
  KITCHEN_X0, KITCHEN_X1, KITCHEN_DEPTH, KITCHEN_Z,
  SDB_Z_END,
  DIAG_AX, DIAG_AZ, DIAG_CX, DIAG_CZ,
  FLOOR_Y,
  BLDG_X_MIN, BLDG_X_MAX, BLDG_Z_MIN, BLDG_Z_MAX,
  COLORS,
} from '@config';

// ═══════════════════════════════════════════════════════════════════════════════
// WALLS — murs de l'appartement (port de js/structure/walls.js)
// ═══════════════════════════════════════════════════════════════════════════════


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
    <group userData={{ brickType: 'wall' }}>

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

// ═══════════════════════════════════════════════════════════════════════════════
// FLOOR — sol, plafond, dalles, textures procédurales
// ═══════════════════════════════════════════════════════════════════════════════


const BLDG_W  = BLDG_X_MAX - BLDG_X_MIN;
const BLDG_D  = BLDG_Z_MAX - BLDG_Z_MIN;
const BLDG_CX = (BLDG_X_MIN + BLDG_X_MAX) / 2;
const BLDG_CZ = (BLDG_Z_MIN + BLDG_Z_MAX) / 2;
const CEIL_THICK = 20;

// ── Matériaux plafond (module-level) ─────────────────────────────────────────
const ceilBottom = new THREE.MeshStandardMaterial({
  color: COLORS.wall, roughness: 0.35, envMapIntensity: 0.15,
});
const ceilTop = new THREE.MeshStandardMaterial({
  color: COLORS.wall, roughness: 0.35,
  transparent: true, opacity: 0.18, depthWrite: false,
});
const ceilSide = new THREE.MeshStandardMaterial({ color: COLORS.wall, roughness: 0.35 });
// BoxGeometry face order: [+X, -X, +Y(top), -Y(bot), +Z, -Z]
const ceilMats = [ceilSide, ceilSide, ceilTop, ceilBottom, ceilSide, ceilSide];

// ── Texture parquet ────────────────────────────────────────────────────────────
function makeParquetTex(): THREE.CanvasTexture {
  const CW = 128, CH = 512, PW = CW / 2, PH = CH / 2;
  const canvas = document.createElement('canvas');
  canvas.width = CW; canvas.height = CH;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = 'rgb(122, 74, 30)';
  ctx.fillRect(0, 0, CW, CH);

  const PLANK_COLOR = 'rgb(122, 74, 30)';
  function drawPlank(x0: number, y0: number, w: number, h: number, skipTop = false) {
    ctx.fillStyle = PLANK_COLOR;
    ctx.fillRect(x0 + 1, y0 + 1, w - 2, h - 2);
    for (let i = 0; i < 10; i++) {
      const lx = x0 + 2 + Math.random() * (w - 4);
      ctx.strokeStyle = `rgba(0,0,0,${0.04 + Math.random() * 0.06})`;
      ctx.lineWidth = 0.5 + Math.random() * 0.8;
      ctx.beginPath(); ctx.moveTo(lx, y0 + 1); ctx.lineTo(lx, y0 + h - 1); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fillRect(x0, y0, 1, h);
    ctx.fillRect(x0 + w - 1, y0, 1, h);
    if (!skipTop) ctx.fillRect(x0, y0, w, 1);
  }

  drawPlank(0,  0,   PW, PH);
  drawPlank(0,  PH,  PW, PH);
  drawPlank(PW, 0,             PW, PH / 2, true);
  drawPlank(PW, PH / 2,        PW, PH);
  drawPlank(PW, PH + PH / 2,   PW, PH / 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1 / 40, 1 / 260);
  return tex;
}

// ── Texture carrelage ──────────────────────────────────────────────────────────
function makeTileTex(): THREE.CanvasTexture {
  const SIZE = 128;
  const canvas = document.createElement('canvas');
  canvas.width = SIZE; canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#f4f4f2';
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.fillStyle = '#c0c0c0';
  ctx.fillRect(0, 0, SIZE, 3);
  ctx.fillRect(0, SIZE - 3, SIZE, 3);
  ctx.fillRect(0, 0, 3, SIZE);
  ctx.fillRect(SIZE - 3, 0, 3, SIZE);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// ── Texture herbe ──────────────────────────────────────────────────────────────
export function makeGrassTex(): THREE.CanvasTexture {
  const SIZE = 256;
  const canvas = document.createElement('canvas');
  canvas.width = SIZE; canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#1e4a22';
  ctx.fillRect(0, 0, SIZE, SIZE);
  const rng = () => Math.random();
  for (let i = 0; i < 80; i++) {
    const x = rng() * SIZE, y = rng() * SIZE, r = 5 + rng() * 15;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(10,30,10,0.35)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  for (let i = 0; i < 9000; i++) {
    const x = rng() * SIZE, y = rng() * SIZE;
    const len = 5 + rng() * 14;
    const angle = -Math.PI / 2 + (rng() - 0.5) * 1.0;
    const g = Math.floor(60 + rng() * 100), r = Math.floor(10 + rng() * 30);
    ctx.strokeStyle = `rgb(${r},${g},${r})`;
    ctx.lineWidth = 0.8 + rng() * 1.6;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(25, 18);
  return tex;
}

// ── Parquet ────────────────────────────────────────────────────────────────────
function Parquet() {
  const { geo, mat } = useMemo(() => {
    const shape = new THREE.Shape([
      new THREE.Vector2(0,           0),
      new THREE.Vector2(0,           -NICHE_Z_START),
      new THREE.Vector2(-NICHE_DEPTH,-NICHE_Z_START),
      new THREE.Vector2(-NICHE_DEPTH,-ROOM_D),
      new THREE.Vector2(0,           -ROOM_D),
      new THREE.Vector2(KITCHEN_X0,  -ROOM_D),
      new THREE.Vector2(KITCHEN_X0,  -KITCHEN_Z),
      new THREE.Vector2(KITCHEN_X1,  -KITCHEN_Z),
      new THREE.Vector2(KITCHEN_X1,  -ROOM_D),
      new THREE.Vector2(DOOR_START,  -ROOM_D),
      new THREE.Vector2(DOOR_START,  -SDB_Z_END),
      new THREE.Vector2(ROOM_W,      -DIAG_AZ),
      new THREE.Vector2(ROOM_W,      0),
    ]);
    const g = new THREE.ShapeGeometry(shape);
    const tex = makeParquetTex();
    const m = new THREE.MeshStandardMaterial({
      map: tex, roughness: 0.45,
      polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
    });
    return { geo: g, mat: m };
  }, []);

  return (
    <mesh geometry={geo} material={mat}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      receiveShadow
      userData={{ brickType: 'floor' }}
    />
  );
}

// ── Carrelage SDB + couloir ────────────────────────────────────────────────────
function Tile() {
  const { sdbGeo, sdbMat, closetMat } = useMemo(() => {
    const baseTex = makeTileTex();

    // Trapèze SDB : coins A(-10,460) B(-10,727) C(190,600) D(190,460)
    const Ax = DIAG_CX, Az = KITCHEN_Z;
    const Bx = DIAG_CX, Bz = DIAG_CZ;
    const Cx = DOOR_START, Cz = SDB_Z_END;
    const Dx = DOOR_START, Dz = KITCHEN_Z;

    const positions = new Float32Array([
      Ax, 0, Az,  Bx, 0, Bz,  Cx, 0, Cz,
      Ax, 0, Az,  Cx, 0, Cz,  Dx, 0, Dz,
    ]);
    const uvs = new Float32Array([
      Ax / 20, Az / 20,  Bx / 20, Bz / 20,  Cx / 20, Cz / 20,
      Ax / 20, Az / 20,  Cx / 20, Cz / 20,  Dx / 20, Dz / 20,
    ]);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('uv',       new THREE.BufferAttribute(uvs, 2));
    g.computeVertexNormals();

    const tSdb = baseTex.clone();
    tSdb.wrapS = tSdb.wrapT = THREE.RepeatWrapping;
    tSdb.repeat.set(1, 1);
    tSdb.needsUpdate = true;
    const mSdb = new THREE.MeshStandardMaterial({
      map: tSdb, roughness: 0.25, metalness: 0.05,
      polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
    });

    // Carrelage marron placard couloir
    const brownCanvas = document.createElement('canvas');
    brownCanvas.width = 128; brownCanvas.height = 128;
    const ctx = brownCanvas.getContext('2d')!;
    ctx.fillStyle = '#7a5030'; ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = '#4a3020';
    ctx.fillRect(0, 0, 128, 3); ctx.fillRect(0, 125, 128, 3);
    ctx.fillRect(0, 0, 3, 128); ctx.fillRect(125, 0, 3, 128);
    const brownTex = new THREE.CanvasTexture(brownCanvas);
    brownTex.wrapS = brownTex.wrapT = THREE.RepeatWrapping;

    const CLOSET_W = DOOR_START - KITCHEN_X1;
    const CLOSET_D = KITCHEN_Z - ROOM_D;
    const tB = brownTex.clone();
    tB.repeat.set(CLOSET_W / 20, CLOSET_D / 20);
    tB.needsUpdate = true;
    const mB = new THREE.MeshStandardMaterial({
      map: tB, roughness: 0.25, metalness: 0.05,
      polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
    });

    return { sdbGeo: g, sdbMat: mSdb, closetMat: mB };
  }, []);

  const CLOSET_W = DOOR_START - KITCHEN_X1;
  const CLOSET_D = KITCHEN_Z - ROOM_D;

  return (
    <>
      <mesh geometry={sdbGeo} material={sdbMat} receiveShadow userData={{ brickType: 'floor' }} />
      <mesh
        ref={(m) => { if (m) m.material = closetMat; }}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[KITCHEN_X1 + CLOSET_W / 2, 0, ROOM_D + CLOSET_D / 2]}
        receiveShadow
        userData={{ brickType: 'floor' }}
      >
        <planeGeometry args={[CLOSET_W, CLOSET_D]} />
      </mesh>
    </>
  );
}

// ── Composant principal ────────────────────────────────────────────────────────
export function Floor({ showCeiling = true }: { showCeiling?: boolean }) {
  const slabY = FLOOR_Y + 1.75 - 10 / 2;

  const grassMat = useMemo(() => new THREE.MeshStandardMaterial({
    map: makeGrassTex(), roughness: 0.85, color: 0xffffff,
  }), []);
  const sideMat = new THREE.MeshStandardMaterial({ color: 0x1e4022, roughness: 0.9 });
  const gardenMats = [sideMat, sideMat, grassMat, sideMat, sideMat, sideMat];

  const gardenD = Math.abs(-400 - BLDG_Z_MIN); // BLDG_Z_MIN + 400

  return (
    <>
      {/* Parquet séjour + cuisine */}
      <Parquet />

      {/* Carrelage SDB + couloir */}
      <Tile />

      {/* Dalle béton */}
      <mesh
        ref={(m) => { if (m) m.material = new THREE.MeshStandardMaterial({ color: COLORS.floor, roughness: 0.6 }); }}
        position={[BLDG_CX, slabY, BLDG_CZ]}
        receiveShadow
        userData={{ brickType: 'floor' }}
      >
        <boxGeometry args={[BLDG_W, 10, BLDG_D]} />
      </mesh>

      {/* Dalle jardin herbe */}
      <mesh
        ref={(m) => { if (m) m.material = gardenMats as any; }}
        position={[BLDG_CX, slabY, (BLDG_Z_MIN + -400) / 2]}
        receiveShadow
        userData={{ brickType: 'floor' }}
      >
        <boxGeometry args={[BLDG_W, 10, gardenD]} />
      </mesh>

      {/* Plafonds — masquables via toggle "Plafond" */}
      <group visible={showCeiling}>
        {/* Plafond principal */}
        <mesh
          ref={(m) => { if (m) m.material = ceilMats as any; }}
          position={[BLDG_CX, WALL_H - 1 + CEIL_THICK / 2, BLDG_CZ]}
          userData={{ brickType: 'ceiling' }}
        >
          <boxGeometry args={[BLDG_W, CEIL_THICK, BLDG_D]} />
        </mesh>

        {/* Plafond terrasse (235×150cm côté Est) */}
        <mesh
          ref={(m) => { if (m) m.material = ceilMats as any; }}
          position={[300 - 235 / 2, WALL_H - 1 + CEIL_THICK / 2, BLDG_Z_MIN - 75]}
          userData={{ brickType: 'ceiling' }}
        >
          <boxGeometry args={[235, CEIL_THICK, 150]} />
        </mesh>
      </group>

      {/* Sol extérieur */}
      <mesh
        ref={(m) => { if (m) m.material = new THREE.MeshStandardMaterial({ color: COLORS.ground, roughness: 0.9 }); }}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -10, 0]}
        receiveShadow
        userData={{ brickType: 'ground' }}
      >
        <planeGeometry args={[2000, 2000]} />
      </mesh>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MIRRORS — miroirs Nissedal avec THREE.Reflector
// ═══════════════════════════════════════════════════════════════════════════════


const kallaxW1 = 40.5; // kallaxW(1)

// Compteur global de profondeur de réflexion.
// Empêche les miroirs perpendiculaires de se rendre mutuellement en boucle infinie :
// chaque Reflector vérifie la profondeur avant de lancer sa passe — si on est déjà
// en train de rendre un reflet (depth >= 1), on skippe.
let _reflectionDepth = 0;

// ── Composant miroir Reflector ────────────────────────────────────────────────

function ReflectorMirror({ w, h, position, rotationY }: {
  w: number; h: number;
  position: [number, number, number];
  rotationY: number;
}) {
  const reflector = useMemo(() => {
    const mir = new Reflector(new THREE.PlaneGeometry(w, h), {
      textureWidth:  512,
      textureHeight: 512,
      color: 0xbbbbbb,
    } as ConstructorParameters<typeof Reflector>[1]);
    mir.position.set(...position);
    mir.rotation.y = rotationY;
    mir.camera.layers.mask = 1;

    const origOnBeforeRender = mir.onBeforeRender.bind(mir);
    mir.onBeforeRender = (renderer, scene, camera, geometry, material, group) => {
      if (_reflectionDepth >= 1) return;
      _reflectionDepth++;
      mir.camera.layers.mask = cameraState.mirrorsHD ? camera.layers.mask : 1;
      origOnBeforeRender(renderer, scene, camera, geometry, material, group);
      _reflectionDepth--;
    };

    return mir;
  }, []);

  return <primitive object={reflector} />;
}

// ── 3× Nissedal 60×60 — Mur D ────────────────────────────────────────────────

function MirrorsD() {
  const W = 60, H = 60; // temporaire 60×60 — passage ROOM_W 300→314 en cours
  const FT = 1.8, FD = 1.2;
  const cx  = (KITCHEN_X1 + DOOR_START) / 2;
  const fz  = ROOM_D - 0.2 - FD / 2;
  const mirZ = fz - 0.1;

  return (
    <>
      {([0, 1, 2] as const).map((i) => {
        const cy = (WALL_H - 3.5) - H / 2 - i * (H + 0.5);
        return (
          <group key={i} userData={{ animUnit: true }}>
            <ReflectorMirror
              w={W - FT * 2} h={H - FT * 2}
              position={[cx, cy, mirZ]}
              rotationY={Math.PI}
            />
            <group position={[cx, cy - H / 2, fz]}>
              <NissedalFrame w={W} h={H} ft={FT} fd={FD} />
            </group>
          </group>
        );
      })}
    </>
  );
}

// ── 3× Nissedal 40×150 + 1× 70×160 — Mur A ──────────────────────────────────

function MirrorsA() {
  const MA_W = 40, MA_H = 150;
  const M4_W = 70, M4_H = 160;
  const FT = 1.8, FD = 1.2;
  const MA_START_Z  = kallaxW1 + 10;
  const MA_BOTTOM_Y = 6;
  const fx  = 0.2 + FD / 2;
  const mirX = fx + 0.1;

  return (
    <>
      {([0, 1, 2] as const).map((i) => {
        const mz = MA_START_Z + MA_W / 2 + i * MA_W;
        const cy = MA_BOTTOM_Y + MA_H / 2;
        return (
          <group key={i} userData={{ animUnit: true }}>
            <ReflectorMirror
              w={MA_W - FT * 2} h={MA_H - FT * 2}
              position={[mirX, cy, mz]}
              rotationY={Math.PI / 2}
            />
            {/* cadre GLB — rotation-y=-π/2 : glace locale -Z → monde +X (face pièce) */}
            <group position={[fx, MA_BOTTOM_Y, mz]} rotation-y={-Math.PI / 2}>
              <NissedalGlbFrame glb={GLB_40x150} />
            </group>
          </group>
        );
      })}

      {/* 4e miroir 70×160 */}
      {(() => {
        const mz = MA_START_Z + 3 * MA_W + M4_W / 2;
        const cy = MA_BOTTOM_Y + M4_H / 2;
        return (
          <group userData={{ animUnit: true }}>
            <ReflectorMirror
              w={M4_W - FT * 2} h={M4_H - FT * 2}
              position={[mirX, cy, mz]}
              rotationY={Math.PI / 2}
            />
            <group position={[fx, MA_BOTTOM_Y, mz]} rotation-y={Math.PI / 2}>
              <NissedalFrame w={M4_W} h={M4_H} ft={FT} fd={FD} />
            </group>
          </group>
        );
      })()}
    </>
  );
}

// ── Miroir vasque SDB ─────────────────────────────────────────────────────────

function MirrorSDB() {
  const VANITY_W    = 60, VANITY_D = 47, VANITY_Y0 = 30, VANITY_H = 50;
  const VANITY_CX   = DOOR_START - 84;
  const VANITY_CZ   = KITCHEN_Z + 11 + VANITY_D / 2;
  const counterTopY = VANITY_Y0 + VANITY_H + 4;
  const mirrorW     = VANITY_W + 3;
  const mirrorH     = 90;
  const mirrorY     = counterTopY + mirrorH / 2;
  const mirrorZ     = -VANITY_D / 2 + 0.5;

  return (
    <ReflectorMirror
      w={mirrorW} h={mirrorH}
      position={[VANITY_CX, mirrorY, VANITY_CZ + mirrorZ + 0.1]}
      rotationY={0}
    />
  );
}

// ── Export principal ──────────────────────────────────────────────────────────

export function Mirrors() {
  return (
    <>
      <MirrorsD />
      <MirrorsA />
      <MirrorSDB />
    </>
  );
}
