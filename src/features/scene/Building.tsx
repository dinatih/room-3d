/**
 * Building.tsx — Coque architecturale fixe : murs, sol/plafond, miroirs.
 *
 * Regroupe ce qui était dans Walls.tsx, Floor.tsx et Mirrors.tsx — éléments
 * définis en coordonnées monde (pas des items réutilisables).
 *
 * makeGrassTex est exporté car GrassRug (items/) le réutilise.
 */
import { useMemo, useRef, useEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { cameraState } from '@features/scene/cameraState';
import { NissedalFrame, NissedalGlbFrame, GLB_40x150, GLB_65x65 } from './items/NissedalMirror';
import { DoorLiving, DoorBath } from './items/DoorWhite';
import { DoorEntry }            from './items/DoorEntry';
import { GlassDoor }            from './items/GlassDoor';
import { NOOP_ITEM, NOOP_SIZE } from './sceneItem';
import { useFurnitureToggles } from './utils/useFurnitureToggles';
import { useSceneStore } from './store/useSceneStore';
import { GrassGround } from './GrassGround';

import {
  ROOM_W, ROOM_D, WALL_H,
  NICHE_X, NICHE_Z_START,
  DOOR_START, DOOR_END, DOOR_H,
  KITCHEN_X0, KITCHEN_X1, KITCHEN_Z,
  BATH_Z_END,
  DiagWall,
  LAYER_WALKER_DETAIL,
  LAYER_WALKER,
} from '@config';

const BLDG_X_MIN = -100;
const BLDG_X_MAX =  400;
const BLDG_Z_MIN =  -30;
const BLDG_Z_MAX =  800;

export const GROUND_COLOR = 0x3a7d44;

const COLORS = {
  wall:    0xeeeeee,
  floor:   0xd4a437,
  parquet: 0xC19A6B,
  accent:  0xcc0000,
  accentS: 0xaa0000,
  ground:  GROUND_COLOR,
  tile:    0xe8e8e8,
};

import { WALL_DEFS, PILLAR_DEFS, WALL_THICKNESS, PARTITION_THICKNESS, CORR_WALL_X, pEast, pWest, GARDEN_PANEL_DEFS } from './wallData';
import { WoodenFencePanel } from './items/WoodenFencePanel';

const FLOOR_Y = -5.25; // dalle béton : surface parquet à Y=0

// ═══════════════════════════════════════════════════════════════════════════════
// WALLS — murs de l'appartement
// ═══════════════════════════════════════════════════════════════════════════════


// ── Matériaux (module-level, instances uniques) ───────────────────────────────
const wallMat = new THREE.MeshStandardMaterial({ color: 0xe8e4dc, roughness: 0.9 });
const noCapMat = new THREE.MeshBasicMaterial({ visible: false });
const wallMatDiag = new THREE.MeshStandardMaterial({ color: 0xe8e4dc, roughness: 0.9 });
const skirtingMat   = new THREE.MeshStandardMaterial({ color: 0xf5f0e8, roughness: 0.4 });

// BoxGeometry face order : [+X(0), -X(1), +Y(2), -Y(3), +Z(4), -Z(5)]
type BoxFace = '+x' | '-x' | '+y' | '-y' | '+z' | '-z';
const BOX_FACE_ORDER: BoxFace[] = ['+x', '-x', '+y', '-y', '+z', '-z'];

function boxFaceMats(
  visibleFaces: Partial<Record<BoxFace, THREE.Material>>,
  fallback: THREE.Material = noCapMat,
): THREE.Material[] {
  return BOX_FACE_ORDER.map(face => visibleFaces[face] ?? fallback);
}

// Matériaux dalle béton décomposés (même principe que le plafond) :
//   - dessus (visible d'en haut)    = opaque
//   - dessous (visible d'en bas)    = absent → see-through depuis dessous
//   - côtés                          = opaques
const slabConcreteTop = new THREE.MeshStandardMaterial({
  color: COLORS.floor, roughness: 0.6,
});
const slabConcreteSide = new THREE.MeshStandardMaterial({
  color: COLORS.floor, roughness: 0.6, side: THREE.FrontSide,
});
const groundExteriorMat = new THREE.MeshStandardMaterial({ color: COLORS.ground, roughness: 0.9 });

// westMats : face -X (index 1) invisible ; eastMats : face +X (index 0) invisible
// northMats : face -Z (index 5) invisible (face extérieure nord, vue de Z<0)
const westMats  = boxFaceMats({ '+x': wallMat, '+y': wallMat, '-y': wallMat, '+z': wallMat, '-z': wallMat });
const eastMats  = boxFaceMats({ '-x': wallMat, '+y': wallMat, '-y': wallMat, '+z': wallMat, '-z': wallMat });
const northMats = boxFaceMats({ '+x': wallMat, '-x': wallMat, '+y': wallMat, '-y': wallMat, '+z': wallMat });

// Lookup matériau par nom (utilisé lors du rendu WALL_DEFS)
const MAT_MAP: Record<string, THREE.Material | THREE.Material[]> = {
  west:    westMats,
  east:    eastMats,
  north:   northMats,
  default: wallMat,
};

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Panneau box simple avec matériau optionnel (array ou simple). */
function P({ w, h, d, x, y, z, mat = wallMat, userData }: {
  w: number; h: number; d: number;
  x: number; y: number; z: number;
  mat?: THREE.Material | THREE.Material[];
  userData?: Record<string, unknown>;
}) {
  return (
    <mesh
      ref={(m) => { if (m) m.material = mat as any; }}
      position={[x, y, z]}
      userData={userData}
      castShadow receiveShadow
    >
      <boxGeometry args={[w, h, d]} />
    </mesh>
  );
}

// Face invisible pour les bouts de segments — BoxGeometry face indices :
//   0=+X  1=-X  2=+Y  3=-Y  4=+Z  5=-Z
// WZ : end caps = indices 4 et 5 (faces ⊥ Z)
// WX : end caps = indices 0 et 1 (faces ⊥ X)
function caplessZ(mat: THREE.Material | THREE.Material[]): THREE.Material[] {
  const m = Array.isArray(mat) ? mat : [mat, mat, mat, mat, mat, mat];
  return [m[0], m[1], m[2], m[3], noCapMat, noCapMat];
}
function caplessX(mat: THREE.Material | THREE.Material[]): THREE.Material[] {
  const m = Array.isArray(mat) ? mat : [mat, mat, mat, mat, mat, mat];
  return [noCapMat, noCapMat, m[2], m[3], m[4], m[5]];
}

// ── Quart de rond — moulure 1,8 cm devant chaque plinthe ───────────────────
// Section : disque quart en local (X,Y), corner à (0,0), rayon R_QR.
// Extrusion le long de local Z (depth=1, scale-z à appliquer = longueur du segment).
const R_QR = 1.8;
const qrGeo = (() => {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.lineTo(R_QR, 0);
  s.absarc(0, 0, R_QR, 0, Math.PI / 2, false);
  s.lineTo(0, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false, curveSegments: 8 });
  g.translate(0, 0, -0.5); // centré sur axe extrusion
  return g;
})();

// QR : moulure axis-alignée. (cx, cz) = coin du quart (face plinthe au sol),
// centre du segment le long de l'axe de longueur. `dir` = direction de la
// face plinthe (où le quart-de-rond saille dans la pièce).
function QR({ cx, cz, len, dir, mat }: {
  cx: number; cz: number;
  len: number;
  dir: '+X' | '-X' | '+Z' | '-Z';
  mat: THREE.Material;
}) {
  const ry = dir === '+X' ? 0
           : dir === '-Z' ? Math.PI / 2
           : dir === '-X' ? Math.PI
           : -Math.PI / 2; // '+Z'
  return (
    <mesh
      geometry={qrGeo}
      material={mat}
      position={[cx, 0, cz]}
      rotation-y={ry}
      scale-z={len}
      castShadow receiveShadow
    />
  );
}

/** Segment de mur axe Z — span de z1 à z2, centré sur x=xc. */
function WZ({ xc, z1, z2, t = WALL_THICKNESS, yBase = 0, h = WALL_H, mat = wallMat, userData }: {
  xc: number; z1: number; z2: number;
  t?: number; yBase?: number; h?: number;
  mat?: THREE.Material | THREE.Material[];
  userData?: Record<string, unknown>;
}) {
  return <P w={t} h={h} d={z2 - z1} x={xc} y={yBase + h / 2} z={(z1 + z2) / 2} mat={caplessZ(mat)} userData={userData} />;
}

/** Segment de mur axe X — span de x1 à x2, centré sur z=zc. */
function WX({ x1, x2, zc, t = WALL_THICKNESS, yBase = 0, h = WALL_H, mat = wallMat, userData }: {
  x1: number; x2: number; zc: number;
  t?: number; yBase?: number; h?: number;
  mat?: THREE.Material | THREE.Material[];
  userData?: Record<string, unknown>;
}) {
  return <P w={x2 - x1} h={h} d={t} x={(x1 + x2) / 2} y={yBase + h / 2} z={zc} mat={caplessX(mat)} userData={userData} />;
}

/** ExtrudeGeometry depuis une liste de points [worldX, worldZ]. */
export function makeExtrudeGeo(
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


// ── Labels piliers (mode pillarsOnly) ─────────────────────────────────────────

function makeSprite(text: string, color: string, worldSize: number): THREE.Sprite {
  const PX = 64;
  const w  = Math.ceil(text.length * PX * 0.58 + PX * 0.6);
  const h  = Math.ceil(PX * 1.3);
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  // Fond semi-opaque pour contraste lisible sur n'importe quel mur
  ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
  const pad = PX * 0.18;
  ctx.fillRect(0, h / 2 - PX * 0.55, w, PX * 1.1);
  ctx.font = `bold ${PX}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // Stroke noir pour outline supplémentaire
  ctx.lineWidth = PX * 0.18;
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.strokeText(text, w / 2, h / 2);
  ctx.fillStyle = color;
  ctx.fillText(text, w / 2, h / 2);
  const mat = new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(canvas),
    transparent: true, depthTest: false,
  });
  const sp = new THREE.Sprite(mat);
  sp.scale.set(worldSize * (w / h), worldSize, 1);
  return sp;
}

function PillarLabels() {
  const { scene } = useThree();

  useEffect(() => {
    const group = new THREE.Group();
    group.name = 'pillar-labels';
    const box = new THREE.Box3();

    // Traverse only the main walls group, not neighbor clones
    const root = wallsGroupRef.current ?? scene;
    root.traverse(obj => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh || mesh.userData?.type !== 'pillar') return;
      const id = mesh.userData.id as string;
      box.setFromObject(mesh);
      const cx = (box.min.x + box.max.x) / 2;
      const cz = (box.min.z + box.max.z) / 2;
      const sp = makeSprite(id, '#ffdd44', 14 / 3);
      sp.renderOrder = 999;
      sp.position.set(cx, WALL_H + 8, cz);
      group.add(sp);
    });

    scene.add(group);
    return () => {
      scene.remove(group);
      group.traverse(o => {
        const sp = o as THREE.Sprite;
        if (!sp.isSprite) return;
        sp.material.map?.dispose();
        sp.material.dispose();
      });
    };
  }, [scene]);

  return null;
}

/** Ref module-level vers le group Walls — consommé par Neighbors pour clone. */
export const wallsGroupRef = { current: null as THREE.Group | null };



// ── MergedStaticGroup ──────────────────────────────────────────────────────────
export function MergedStaticGroup({ children, name = 'merged-static', userData }: { children: React.ReactNode; name?: string; userData?: Record<string, any> }) {
  const sourceRef = useRef<THREE.Group>(null!);
  const mergedRef = useRef<THREE.Group>(null!);

  useEffect(() => {
    if (!sourceRef.current || !mergedRef.current) return;
    const src = sourceRef.current;
    const dst = mergedRef.current;

    dst.clear();
    const groups = new Map<string, { geos: THREE.BufferGeometry[]; mat: THREE.Material; userData: any }>();

    src.updateMatrixWorld(true);
    const invWorldMat = src.matrixWorld.clone().invert();

    const processedMeshes = new Set<THREE.Mesh>();

    src.traverse(node => {
      const mesh = node as THREE.Mesh;
      if (!mesh.isMesh || mesh.type !== 'Mesh' || (mesh as any).isInstancedMesh || mesh.userData?.isMergedStatic || mesh.userData?.skipMerge) return;

      // Skip merging if any ancestor has skipMerge: true
      let parent = mesh.parent;
      let skip = false;
      while (parent && parent !== src) {
        if (parent.userData?.skipMerge) {
          skip = true;
          break;
        }
        parent = parent.parent;
      }
      if (skip) return;

      if (processedMeshes.has(mesh)) return;

      // On cache l'original
      mesh.visible = false;
      mesh.userData.wasMerged = true;
      processedMeshes.add(mesh);

      const geom = mesh.geometry;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

      // Transformation RELATIVE au groupe source (évite le double transform)
      const relMat = mesh.matrixWorld.clone().premultiply(invWorldMat);

      const udKey = JSON.stringify({ brickType: mesh.userData?.brickType });

      if (!geom.groups || geom.groups.length === 0 || mats.length === 1) {
        const mat = mats[0];
        if (!mat || (mat as any).visible === false) return;

        let clone = geom.clone();
        clone = clone.index ? clone.toNonIndexed() : clone;
        clone.applyMatrix4(relMat);

        const key = `${mat.uuid}|${udKey}`;
        if (!groups.has(key)) groups.set(key, { geos: [], mat, userData: { brickType: mesh.userData?.brickType } });
        groups.get(key)!.geos.push(clone);
      } else {
        for (const group of geom.groups) {
          const mat = mats[group.materialIndex || 0] || mats[0];
          if (!mat || (mat as any).visible === false) continue;

          let clone = geom.clone();
          if (geom.index) {
            const newIndex = geom.index.array.slice(group.start, group.start + group.count);
            clone.setIndex(new THREE.BufferAttribute(newIndex, 1));
          }
          clone.groups = [];
          clone = clone.index ? clone.toNonIndexed() : clone;
          clone.applyMatrix4(relMat);

          const key = `${mat.uuid}|${udKey}`;
          if (!groups.has(key)) groups.set(key, { geos: [], mat, userData: { brickType: mesh.userData?.brickType } });
          groups.get(key)!.geos.push(clone);
        }
      }
    });

    for (const { geos, mat, userData } of groups.values()) {
      const allAttrs = new Set<string>();
      geos.forEach(g => Object.keys(g.attributes).forEach(k => allAttrs.add(k)));
      for (const a of allAttrs) {
        if (!geos.every(g => g.hasAttribute(a))) geos.forEach(g => g.deleteAttribute(a));
      }

      const merged = mergeGeometries(geos, false);
      geos.forEach(g => g.dispose());
      if (!merged) continue;

      const m = new THREE.Mesh(merged, mat);
      m.name = name;
      m.castShadow = true;
      m.receiveShadow = true;
      m.userData = { ...userData, isMergedStatic: true };

      // Héritage automatique du layer mask depuis le premier mesh source correspondant
      src.traverse(node => {
        if (m.layers.mask !== 1) return;
        const mesh = node as THREE.Mesh;
        if (!mesh.isMesh || mesh.userData.isMergedStatic) return;
        const ms = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        if (ms.some(sm => sm?.uuid === mat.uuid)) {
          m.layers.mask = mesh.layers.mask;
        }
      });

      dst.add(m);
    }

    return () => {
      // Nettoyage : restaurer la visibilité des originaux si le MergedStaticGroup est démonté
      processedMeshes.forEach(m => {
        if (m.userData.wasMerged) {
          m.visible = true;
          delete m.userData.wasMerged;
        }
      });
      dst.clear();
    };
  }, [children]);

  return (
    <group userData={userData}>
      <group ref={sourceRef}>{children}</group>
      <group ref={mergedRef} />
    </group>
  );
}

// ── Composant principal ────────────────────────────────────────────────────────
export function Walls({ pillarsOnly = false }: { pillarsOnly?: boolean }) {
  const wallEdges = useSceneStore(state => state.layers.wallEdges);
  const showLabels = pillarsOnly || wallEdges;
  // Géométries complexes via useMemo ──────────────────────────────────────────

  const diagGeos = useMemo(() => {
    // Linteau au-dessus de la porte d'entrée
    const linteau = makeExtrudeGeo(
      [
        DiagWall.p(DiagWall.door.start),
        DiagWall.p(DiagWall.door.end),
        DiagWall.p(DiagWall.door.end, DiagWall.depth),
        DiagWall.p(DiagWall.door.start, DiagWall.depth)
      ].map(p => [p.x, p.z]),
      WALL_H - DOOR_H,
      DOOR_H,
    );

    // Section SW — tronquée de WALL_THICKNESS cm côté SW pour le pilier
    const sw = makeExtrudeGeo(
      [
        DiagWall.p(DiagWall.door.end),
        DiagWall.p(DiagWall.len - WALL_THICKNESS),
        DiagWall.p(DiagWall.len - WALL_THICKNESS, DiagWall.depth),
        DiagWall.p(DiagWall.door.end, DiagWall.depth)
      ].map(p => [p.x, p.z]),
      WALL_H,
    );

    // diag-ne-kite — 4 côtés, angle en C = angle interne de la jonction (~120°).
    // C = intersection de X=DiagWall.A.x+WALL_THICKNESS avec la droite ext diagonale passant par eP(0).
    const eP0 = DiagWall.p(0, DiagWall.depth);
    const tC = (WALL_THICKNESS - (eP0.x - DiagWall.A.x)) / DiagWall.sin;
    const cX = DiagWall.A.x + WALL_THICKNESS;
    const cZ = eP0.z + tC * DiagWall.cos;

    const diagPillar = makeExtrudeGeo(
      [
        [eP0.x,          eP0.z],         // D = eP(0)
        [cX,             cZ],            // C = sommet ext
        [DiagWall.A.x + WALL_THICKNESS, DiagWall.A.z],  // B = coin ext Mur Est
        [DiagWall.A.x,     DiagWall.A.z],  // A = coin int
      ],
      WALL_H,
    );

    // diag-sw-kite — même principe que NE, côté Mur Ouest (X = DiagWall.C.x − WALL_THICKNESS).
    // C = intersection de X=DiagWall.C.x−WALL_THICKNESS avec la droite ext diagonale par eP(diagLen).
    const ePLen = DiagWall.p(DiagWall.len, DiagWall.depth);
    const tC_sw  = ((DiagWall.C.x - WALL_THICKNESS) - ePLen.x) / DiagWall.sin;
    const cX_sw  = DiagWall.C.x - WALL_THICKNESS;
    const cZ_sw  = ePLen.z + tC_sw * DiagWall.cos;

    const diagPillarSW = makeExtrudeGeo(
      [
        [DiagWall.C.x,     DiagWall.C.z],  // A = coin int
        [DiagWall.C.x - WALL_THICKNESS, DiagWall.C.z],  // B = coin ext Mur Ouest
        [cX_sw,            cZ_sw],         // C = sommet ext
        [ePLen.x,          ePLen.z],       // D = eP(diagLen)
      ],
      WALL_H,
    );

    return { linteau, sw, diagPillar, diagPillarSW };
  }, []);

  return (
    <>
      {!pillarsOnly && <DoorsPlaced />}

      <MergedStaticGroup name="merged-walls">
        <group ref={(g) => { wallsGroupRef.current = g; }}>

          {showLabels && <PillarLabels />}

          {/* ── Piliers ────────────────────────────────────────────────────────── */}
          {(
            <group>
              {PILLAR_DEFS.map((p) => {
                const pp = p as any;
                const pw = pp.w ?? WALL_THICKNESS;
                const pd = pp.d ?? WALL_THICKNESS;
                const rot = pp.rot ?? 0;
                if (rot) {
                  return (
                    <mesh key={pp.id} position={[pp.x, WALL_H / 2, pp.z]} rotation-y={rot}
                          material={wallMat} castShadow receiveShadow
                          userData={{ brickType: 'wall', type: 'pillar', id: pp.id }}>
                      <boxGeometry args={[pw, WALL_H, pd]} />
                    </mesh>
                  );
                }
                return (
                  <P key={pp.id} w={pw} h={WALL_H} d={pd} x={pp.x} y={WALL_H / 2} z={pp.z}
                    userData={{ brickType: 'wall', type: 'pillar', id: pp.id }} />
                );
              })}
              <mesh geometry={diagGeos.diagPillar}   material={wallMat} castShadow receiveShadow
                userData={{ brickType: 'wall', type: 'pillar', id: 'diag-ne-kite' }} />
              <mesh geometry={diagGeos.diagPillarSW} material={wallMat} castShadow receiveShadow
                userData={{ brickType: 'wall', type: 'pillar', id: 'diag-sw-kite' }} />
            </group>
          )}

          {/* ── Murs ─────────────────────────────────────────────────────────────── */}
          {!pillarsOnly && (
            <group>
              {WALL_DEFS.filter(d => d.segKind !== 'door').map((d, i) => {
                const mat = MAT_MAP[d.mat ?? 'default'];
                const uData = { brickType: 'wall', side: d.mat };
                if (d.axis === 'z')
                  return <WZ key={i} xc={d.xc} z1={d.z1} z2={d.z2} mat={mat} h={d.h} yBase={d.yBase} t={d.t} userData={uData} />;
                return <WX key={i} x1={d.x1} x2={d.x2} zc={d.zc} mat={mat} h={d.h} yBase={d.yBase} t={d.t} userData={uData} />;
              })}
              {/* Mur diagonal */}
              <mesh geometry={diagGeos.linteau} material={wallMatDiag} castShadow receiveShadow userData={{ brickType: 'wall' }} />
              <mesh geometry={diagGeos.sw}      material={wallMatDiag} castShadow receiveShadow userData={{ brickType: 'wall' }} />

              {/* Panneaux bois occultants jardin */}
              {GARDEN_PANEL_DEFS.map((p, i) => (
                <group key={i} position={[p.cx, p.cy, p.cz]} userData={{ skipMerge: true }}>
                  <WoodenFencePanel w={p.w} h={p.h} d={p.d} />
                </group>
              ))}

              {/* Mur en face du jardin (parallèle au Mur diag) */}
              <mesh
                position={[150, WALL_H / 2, -786.33]}
                rotation-y={DiagWall.rotY + Math.PI / 2}
                castShadow
                receiveShadow
                userData={{ brickType: 'wall' }}
                material={wallMat}
              >
                <boxGeometry args={[577.35, WALL_H, 40]} />
              </mesh>
            </group>
          )}
        </group>
      </MergedStaticGroup>


    </>
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

// ── Faces intérieures pour l'alignement précis des sols ─────────────────────────
// Convention : KITCHEN_X0, KITCHEN_X1, KITCHEN_Z, ROOM_D, NICHE_X = faces intérieures
// (les piliers sont placés à pos±W/2, donc la face interne du mur = la constante).
// Exception : NICHE_Z_START = centre du linteau niche-beam (pas une face).
const W_HALF = WALL_THICKNESS / 2; // 5 cm

// X intérieur
const INT_X_WEST = 0; // face intérieure mur Ouest (séjour)
const INT_X_NICHE = NICHE_X; // face intérieure mur Ouest (niche/SDB) = -10
const INT_X_KITCHEN_L = KITCHEN_X0; // 30 — face est mur ouest cuisine
const INT_X_KITCHEN_R = KITCHEN_X1; // 130 — face ouest mur est cuisine
const INT_X_DOOR_S = DOOR_START; // 200 (porte)
const INT_X_EAST = ROOM_W; // 316

// Z intérieur
const INT_Z_NORTH = 0; // face intérieure mur Nord
const INT_Z_NICHE_S = NICHE_Z_START + W_HALF; // 285 — face sud du linteau niche-beam (centré sur NICHE_Z_START)
const INT_Z_ROOM_S = ROOM_D; // 400 — face nord du mur sud
const INT_Z_KITCHEN_B = KITCHEN_Z; // 460 — face nord du mur SDB (sud cuisine)
const INT_Z_BATH_N = KITCHEN_Z + PARTITION_THICKNESS; // 467.2 — face sud du mur SDB (nord SDB)
const INT_Z_BATH_E = BATH_Z_END; // 610

// ── Matériaux plafond (module-level) ─────────────────────────────────────────
const ceilBottom = new THREE.MeshStandardMaterial({
  color: COLORS.wall, roughness: 0.35, envMapIntensity: 0.15,
});
const ceilBottomBack = new THREE.MeshStandardMaterial({
  color: COLORS.wall, roughness: 0.35, envMapIntensity: 0.15,
  side: THREE.BackSide,
});
const ceilMats = boxFaceMats({ '-y': ceilBottom });

// ── Texture parquet ────────────────────────────────────────────────────────────
// Light oak laminate inspired by real reference photo: warm beige planks,
// flowing grain, occasional knots, subtle per-plank color variation, satin sheen.
function makeParquetTex(): THREE.CanvasTexture {
  const CW = 256, CH = 1024, PW = CW / 2;
  const canvas = document.createElement('canvas');
  canvas.width = CW; canvas.height = CH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

  // seeded PRNG for stable look across reloads
  let seed = 0xC0FFEE;
  const rng = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0xffffffff;
  };

  // base background = subtle gap line color (faint, blends with plank avg)
  ctx.fillStyle = 'rgb(135, 105, 78)';
  ctx.fillRect(0, 0, CW, CH);

  function drawPlank(x0: number, y0: number, w: number, h: number) {
    // per-plank hue + luminance variation — warm brown, not grey
    const hueShift = (rng() - 0.5) * 14;
    const lumShift = (rng() - 0.5) * 26;
    const baseR = Math.max(155, Math.min(225, 190 + lumShift + hueShift * 0.5));
    const baseG = Math.max(120, Math.min(180, 155 + lumShift * 0.85));
    const baseB = Math.max(80,  Math.min(145, 118 + lumShift * 0.6 - hueShift * 0.6));

    // fill (leave 1px gap on all sides)
    ctx.fillStyle = `rgb(${baseR | 0},${baseG | 0},${baseB | 0})`;
    ctx.fillRect(x0 + 1, y0 + 1, w - 2, h - 2);

    // subtle cross-plank gradient for satin sheen
    const grad = ctx.createLinearGradient(x0, y0, x0 + w, y0);
    grad.addColorStop(0,    `rgba(255,240,210,${0.04 + rng() * 0.04})`);
    grad.addColorStop(0.5,  'rgba(0,0,0,0)');
    grad.addColorStop(1,    `rgba(50,28,10,${0.04 + rng() * 0.05})`);
    ctx.fillStyle = grad;
    ctx.fillRect(x0 + 1, y0 + 1, w - 2, h - 2);

    // base wood grain — many fine wavy lines along length
    const grainCount = 70 + Math.floor(rng() * 40);
    for (let i = 0; i < grainCount; i++) {
      const lx = x0 + 2 + rng() * (w - 4);
      const wave = 0.6 + rng() * 1.8;
      const waveFreq = 0.015 + rng() * 0.035;
      const phase = rng() * Math.PI * 2;
      const alpha = 0.04 + rng() * 0.10;
      const dark = rng() < 0.5;
      ctx.strokeStyle = dark
        ? `rgba(80,50,22,${alpha})`
        : `rgba(245,220,180,${alpha * 0.55})`;
      ctx.lineWidth = 0.4 + rng() * 0.8;
      ctx.beginPath();
      ctx.moveTo(lx + Math.sin(phase) * wave, y0 + 1);
      const steps = 36;
      for (let s = 1; s <= steps; s++) {
        const t = s / steps;
        const ly = y0 + 1 + t * (h - 2);
        const ox = Math.sin(phase + ly * waveFreq) * wave;
        ctx.lineTo(lx + ox, ly);
      }
      ctx.stroke();
    }

    // clip all subsequent drawing to plank rect (keeps arcs/knots inside)
    ctx.save();
    ctx.beginPath();
    ctx.rect(x0 + 1, y0 + 1, w - 2, h - 2);
    ctx.clip();

    // cathedral grain — 0-2 soft arcs (subtle, not stacked rings)
    const cathedralCount = rng() < 0.6 ? 1 + Math.floor(rng() * 2) : 0;
    for (let c = 0; c < cathedralCount; c++) {
      const cx = x0 + 4 + rng() * (w - 8);
      const cy = y0 + 8 + rng() * (h - 16);
      const baseW = 16 + rng() * 30;
      const baseH = 40 + rng() * 100;
      const rings = 2 + Math.floor(rng() * 3);
      const dir = rng() < 0.5 ? 1 : -1;
      for (let r = 0; r < rings; r++) {
        const rw = baseW * (1 - r * 0.18);
        const rh = baseH * (1 - r * 0.12);
        const alpha = 0.03 + (1 - r / rings) * 0.05;
        ctx.strokeStyle = `rgba(80,50,22,${alpha})`;
        ctx.lineWidth = 0.5 + rng() * 0.5;
        ctx.beginPath();
        ctx.moveTo(cx - rw / 2, cy);
        ctx.bezierCurveTo(
          cx - rw / 2, cy + dir * rh * 0.6,
          cx + rw / 2, cy + dir * rh * 0.6,
          cx + rw / 2, cy,
        );
        ctx.stroke();
      }
    }

    // sparse knots — 0-2, smaller, occasional
    const knots = rng() < 0.5 ? Math.floor(rng() * 3) : 0;
    for (let k = 0; k < knots; k++) {
      const kx = x0 + 8 + rng() * (w - 16);
      const ky = y0 + 16 + rng() * (h - 32);
      const krx = 1.5 + rng() * 3;
      const kry = krx * (0.6 + rng() * 0.5);
      const rot = rng() * Math.PI;
      ctx.save();
      ctx.translate(kx, ky); ctx.rotate(rot);
      for (let r = kry; r > 0.5; r -= 0.6) {
        ctx.beginPath();
        ctx.ellipse(0, 0, r * (krx / kry), r, 0, 0, Math.PI * 2);
        const alpha = 0.08 + (r / kry) * 0.15;
        ctx.strokeStyle = `rgba(55,32,12,${alpha})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.ellipse(0, 0, krx * 0.35, kry * 0.35, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(40,22,8,0.5)';
      ctx.fill();
      ctx.restore();
    }

    ctx.restore(); // end plank clip

    // fine speckle noise
    const img = ctx.getImageData(x0 + 1, y0 + 1, w - 2, h - 2);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (rng() - 0.5) * 12;
      d[i]     = Math.max(0, Math.min(255, d[i]     + n));
      d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n));
      d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n));
    }
    ctx.putImageData(img, x0 + 1, y0 + 1);
  }

  // brick-pattern layout: 2 plank columns, staggered offsets per column
  // column A (left): planks of varying length
  const colALens = [320, 460, 220, 380, 280];
  const colBLens = [400, 240, 350, 300, 420];

  function layoutColumn(x0: number, lens: number[], offset: number) {
    let y = -offset;
    while (y < CH) {
      const remaining = CH - y;
      // pick next length, wrapping list
      const idx = Math.floor(((y + offset) / 200)) % lens.length;
      const len = Math.min(lens[idx], remaining);
      drawPlank(x0, y, PW, len);
      y += len;
    }
    // also draw the wrapped piece at top if first plank started below 0
    if (offset > 0) drawPlank(x0, -offset, PW, offset);
  }

  layoutColumn(0,  colALens, 0);
  layoutColumn(PW, colBLens, 180); // stagger second column

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  // canvas X (256px) = 40cm world width  → 2 planks × 20cm wide
  // canvas Y (1024px) = 260cm world length → average plank ~110cm long
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

function Parquet() {
  const { geo, mat } = useMemo(() => {
    const parquetDiagZ = DiagWall.A.z + (INT_X_DOOR_S - DiagWall.A.x) * DiagWall.slope;

    // Découpe : exclut le rectangle sous le mur sud-est (segment 3, x=DOOR_END→ROOM_W, z=ROOM_D→ROOM_D+WALL_THICKNESS).
    const WALL_SE_W = DOOR_END;    // 280 — face ouest du pilier/mur SE
    const WALL_SOUTH_FACE = ROOM_D + PARTITION_THICKNESS; // 407.2 — face sud du mur sud

    const shape = new THREE.Shape([
      new THREE.Vector2(INT_X_WEST,      -INT_Z_NORTH),
      new THREE.Vector2(INT_X_WEST,      -INT_Z_NICHE_S),
      new THREE.Vector2(INT_X_NICHE,     -INT_Z_NICHE_S),
      new THREE.Vector2(INT_X_NICHE,     -INT_Z_ROOM_S),
      new THREE.Vector2(INT_X_WEST,      -INT_Z_ROOM_S),
      new THREE.Vector2(INT_X_KITCHEN_L, -INT_Z_ROOM_S),
      new THREE.Vector2(INT_X_KITCHEN_L, -INT_Z_KITCHEN_B),
      new THREE.Vector2(INT_X_KITCHEN_R, -INT_Z_KITCHEN_B),
      new THREE.Vector2(INT_X_KITCHEN_R, -INT_Z_ROOM_S),
      new THREE.Vector2(INT_X_DOOR_S,    -INT_Z_ROOM_S),
      new THREE.Vector2(INT_X_DOOR_S,    -parquetDiagZ),
      new THREE.Vector2(INT_X_EAST,      -DiagWall.A.z),
      new THREE.Vector2(INT_X_EAST,      -WALL_SOUTH_FACE),
      new THREE.Vector2(WALL_SE_W,       -WALL_SOUTH_FACE),
      new THREE.Vector2(WALL_SE_W,       -INT_Z_ROOM_S),
      new THREE.Vector2(INT_X_EAST,      -INT_Z_ROOM_S),
      new THREE.Vector2(INT_X_EAST,      -INT_Z_NORTH),
    ]);
    const g = new THREE.ShapeGeometry(shape);
    const tex = makeParquetTex();
    const m = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.55,
      metalness: 0.04,
      envMapIntensity: 0.6,
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

// ── Carrelage bath + couloir ───────────────────────────────────────────────────
function Tile() {
  // Placard couloir : tuile démarre APRÈS les murs sud séjour (kitchen-se → door-living-w)
  // et est cuisine (kitchen-ne → kitchen-se), pour ne pas déborder sous les murs.
  // Bornes : x: KITCHEN_X1+PARTITION_THICKNESS(137.2) → DOOR_START(200), z: ROOM_D+PARTITION_THICKNESS(407.2) → KITCHEN_Z(460).
  const CLOSET_W_REAL = DOOR_START - (KITCHEN_X1 + PARTITION_THICKNESS); // 62.8
  const CLOSET_D_REAL = KITCHEN_Z - (ROOM_D + PARTITION_THICKNESS);      // 52.8
  const CLOSET_X_REAL = ((KITCHEN_X1 + PARTITION_THICKNESS) + DOOR_START) / 2;
  const CLOSET_Z_REAL = ((ROOM_D + PARTITION_THICKNESS) + KITCHEN_Z) / 2;

  const { bathGeo, bathMat, closetMat } = useMemo(() => {
    const baseTex = makeTileTex();

    // Trapèze bath : coins alignés sur les faces intérieures
    const Ax = INT_X_NICHE,  Az = INT_Z_BATH_N;
    const Bx = INT_X_NICHE,  Bz = DiagWall.A.z + (INT_X_NICHE - DiagWall.A.x) * DiagWall.slope;
    const Cx = INT_X_DOOR_S, Cz = DiagWall.A.z + (INT_X_DOOR_S - DiagWall.A.x) * DiagWall.slope;
    const Dx = INT_X_DOOR_S, Dz = INT_Z_BATH_N;

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

    const tBath = baseTex.clone();
    tBath.wrapS = tBath.wrapT = THREE.RepeatWrapping;
    tBath.repeat.set(1, 1);
    tBath.needsUpdate = true;
    const mBath = new THREE.MeshStandardMaterial({
      map: tBath, roughness: 0.25, metalness: 0.05,
    });

    // Carrelage marron placard couloir
    const brownCanvas = document.createElement('canvas');
    brownCanvas.width = 128; brownCanvas.height = 128;
    const ctx = brownCanvas.getContext('2d', { willReadFrequently: true })!;
    ctx.fillStyle = '#7a5030'; ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = '#4a3020';
    ctx.fillRect(0, 0, 128, 3); ctx.fillRect(0, 125, 128, 3);
    ctx.fillRect(0, 0, 3, 128); ctx.fillRect(125, 0, 3, 128);
    const brownTex = new THREE.CanvasTexture(brownCanvas);
    brownTex.wrapS = brownTex.wrapT = THREE.RepeatWrapping;

    const tB = brownTex.clone();
    tB.repeat.set(CLOSET_W_REAL / 20, CLOSET_D_REAL / 20);
    tB.needsUpdate = true;
    const mB = new THREE.MeshStandardMaterial({
      map: tB, roughness: 0.25, metalness: 0.05,
    });

    return { bathGeo: g, bathMat: mBath, closetMat: mB };
  }, [CLOSET_W_REAL, CLOSET_D_REAL]);

  return (
    <>
      <mesh geometry={bathGeo} material={bathMat} receiveShadow userData={{ brickType: 'floor' }} />
      <mesh
        ref={(m) => { if (m) m.material = closetMat; }}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[CLOSET_X_REAL, 0, CLOSET_Z_REAL]}
        receiveShadow
        userData={{ brickType: 'floor' }}
      >
        <planeGeometry args={[CLOSET_W_REAL, CLOSET_D_REAL]} />
      </mesh>
    </>
  );
}

// ── Plinthes — 6 cm h × 1 cm prof autour du parquet ──────────────────────────
function Baseboards() {
  const SH = 6;
  const SD = 1;
  const y  = SH / 2;

  const parquetDiagZ = DiagWall.A.z + (DOOR_START - DiagWall.A.x) * DiagWall.slope;
  // Longueur de parquet le long du mur diagonal (offset 0 au coin NE).
  const diagParquetLen = Math.sqrt((ROOM_W - DOOR_START) ** 2 + (DiagWall.A.z - parquetDiagZ) ** 2);

  const CW_ENTRY = 5.5; // largeur chambranle porte entrée + marge
  const diagSegA = { ...DiagWall.p((0 + Math.max(0, DiagWall.door.start - CW_ENTRY)) / 2, -SD / 2), len: Math.max(0, DiagWall.door.start - CW_ENTRY) };
  const diagSegB = { ...DiagWall.p((DiagWall.door.end + CW_ENTRY + diagParquetLen) / 2, -SD / 2), len: diagParquetLen - (DiagWall.door.end + CW_ENTRY) };

  // Plinthe diagonale corridor (de X=200 à X=140)
  const corridorXEnd = INT_X_KITCHEN_R + PARTITION_THICKNESS; // 137.2
  const corridorZEnd = DiagWall.A.z + (corridorXEnd - DiagWall.A.x) * DiagWall.slope;
  const diagCorridorTotalLen = Math.sqrt((DiagWall.A.x - corridorXEnd) ** 2 + (DiagWall.A.z - corridorZEnd) ** 2);
  const diagSegC = { ...DiagWall.p((diagParquetLen + diagCorridorTotalLen) / 2, -SD / 2), len: diagCorridorTotalLen - diagParquetLen };

  const diagQRA = { ...DiagWall.p((0 + Math.max(0, DiagWall.door.start - CW_ENTRY)) / 2, -SD), len: Math.max(0, DiagWall.door.start - CW_ENTRY) };
  const diagQRB = { ...DiagWall.p((DiagWall.door.end + CW_ENTRY + diagParquetLen) / 2, -SD), len: diagParquetLen - (DiagWall.door.end + CW_ENTRY) };
  const diagQRC = { ...DiagWall.p((diagParquetLen + diagCorridorTotalLen) / 2, -SD), len: diagCorridorTotalLen - diagParquetLen };

  return (
    <MergedStaticGroup name="merged-skirting">
      <group userData={{ brickType: 'skirting' }}>
        {/* North wall Z=0, X: 0→316 */}
        <P w={INT_X_EAST - INT_X_WEST} h={SH} d={SD}
           x={(INT_X_WEST + INT_X_EAST) / 2} y={y} z={INT_Z_NORTH + SD / 2}
           mat={skirtingMat} />
        <QR cx={(INT_X_WEST + INT_X_EAST) / 2} cz={INT_Z_NORTH + SD}
            len={INT_X_EAST - INT_X_WEST} dir="+Z" mat={skirtingMat} />

        {/* East wall (north) X=316, Z: 0→ROOM_D */}
        <P w={SD} h={SH} d={INT_Z_ROOM_S - INT_Z_NORTH}
           x={INT_X_EAST - SD / 2} y={y} z={(INT_Z_NORTH + INT_Z_ROOM_S) / 2}
           mat={skirtingMat} />
        <QR cx={INT_X_EAST - SD} cz={(INT_Z_NORTH + INT_Z_ROOM_S) / 2}
            len={INT_Z_ROOM_S - INT_Z_NORTH} dir="-X" mat={skirtingMat} />

        {/* East wall (sud, après mur SE) X=316, Z: ROOM_D+PARTITION_THICKNESS→DiagWall.A.z */}
        <P w={SD} h={SH} d={DiagWall.A.z - (ROOM_D + PARTITION_THICKNESS)}
           x={INT_X_EAST - SD / 2} y={y} z={((ROOM_D + PARTITION_THICKNESS) + DiagWall.A.z) / 2}
           mat={skirtingMat} />
        <QR cx={INT_X_EAST - SD} cz={((ROOM_D + PARTITION_THICKNESS) + DiagWall.A.z) / 2}
            len={DiagWall.A.z - (ROOM_D + PARTITION_THICKNESS)} dir="-X" mat={skirtingMat} />

        {/* Mur SE — face nord (séjour) X: 287.5→316 (s'arrête à 1.5cm du bord du trou x=286), Z=ROOM_D */}
        <P w={28.5} h={SH} d={SD}
           x={301.75} y={y} z={INT_Z_ROOM_S - SD / 2}
           mat={skirtingMat} />
        <QR cx={301.75} cz={INT_Z_ROOM_S - SD}
            len={28.5} dir="-Z" mat={skirtingMat} />

        {/* Mur SE — face ouest (couloir/seuil) : pas de plinthe sur la face interne de l'ouverture */}

        {/* Mur SE — face sud (corridor droit) X: 287.5→316 (s'arrête à 1.5cm du bord du trou x=286), Z=ROOM_D+PARTITION_THICKNESS */}
        <P w={28.5} h={SH} d={SD}
           x={301.75} y={y} z={(ROOM_D + PARTITION_THICKNESS) + SD / 2}
           mat={skirtingMat} />
        <QR cx={301.75} cz={(ROOM_D + PARTITION_THICKNESS) + SD}
            len={28.5} dir="+Z" mat={skirtingMat} />

        {/* Mur diagonal (fractionné autour de la porte d'entrée) + Corridor */}
        {[diagSegA, diagSegB, diagSegC].map((s, i) => (
          <mesh key={`ds${i}`} position={[s.x, y, s.z]} rotation-y={DiagWall.rotY} castShadow receiveShadow
                material={skirtingMat}>
             <boxGeometry args={[SD, SH, s.len]} />
          </mesh>
        ))}
        {[diagQRA, diagQRB, diagQRC].map((s, i) => (
          <mesh key={`dqr${i}`} position={[s.x, y, s.z]} rotation-y={DiagWall.rotY} castShadow receiveShadow
                material={skirtingMat} scale={[1, 1, s.len]} geometry={qrGeo} />
        ))}

        {/* Corridor — face est du mur couloir (côté corridor, x = CORR_WALL_EAST + SD/2).
            Fractionnée pour éviter les ouvertures : placard (z=410→460) et porte
            SDB couloir (z=CORR_DOOR_S→CORR_DOOR_E), s'arrêtant à 1.5cm des bords de l'ouverture. */}
        {(() => {
          const CORR_WALL_EAST = CORR_WALL_X + PARTITION_THICKNESS / 2; // 199.2
          const CLOSET_N = ROOM_D + PARTITION_THICKNESS;      // 407.2
          const CLOSET_S = KITCHEN_Z;                        // 460
          const CORR_DOOR_S = 517;                           // 517
          const CORR_DOOR_E = 603;                           // 603
          const segs: [number, number][] = [
            [CLOSET_S,          CORR_DOOR_S - 1.5],
            [CORR_DOOR_E + 1.5, parquetDiagZ],
          ];
          return segs.flatMap(([z1, z2], i) => [
            <P key={`p${i}`} w={SD} h={SH} d={z2 - z1}
               x={CORR_WALL_EAST + SD / 2} y={y} z={(z1 + z2) / 2}
               mat={skirtingMat} />,
            <QR key={`qr${i}`} cx={CORR_WALL_EAST + SD} cz={(z1 + z2) / 2}
                len={z2 - z1} dir="+X" mat={skirtingMat} />,
          ]);
        })()}

        {/* Placard couloir — plinthes bois 3 côtés autour du carrelage placard.
            Tile spans x: KITCHEN_X1+PARTITION_THICKNESS(137.2) → DOOR_START(200), z: ROOM_D+PARTITION_THICKNESS(407.2) → KITCHEN_Z(460). */}
        {(() => {
          const CL_N = ROOM_D + PARTITION_THICKNESS;        // 407.2 (face sud mur sud séjour)
          const CL_S = KITCHEN_Z;                          // 460 (face nord mur sud SDB)
          const CL_W = KITCHEN_X1 + PARTITION_THICKNESS;   // 137.2 (face est mur est cuisine)
          const CL_E = CORR_WALL_X - PARTITION_THICKNESS / 2; // 192 (ouvert sur couloir, la plinthe s'arrête au bord ouest du mur du couloir à 192)
          const xCenter = (CL_W + CL_E + SD) / 2;
          const zCenter = (CL_N + CL_S) / 2;
          const W_LEN = CL_E + SD - CL_W;
          const D_LEN = CL_S - CL_N;
          return (
            <>
              {/* Nord placard — face +Z (plinthe contre face sud séjour) */}
              <P w={W_LEN} h={SH} d={SD}
                 x={xCenter} y={y} z={CL_N + SD / 2}
                 mat={skirtingMat} />
              <QR cx={xCenter} cz={CL_N + SD}
                  len={W_LEN} dir="+Z" mat={skirtingMat} />

              {/* Sud placard — face -Z (plinthe contre face nord SDB) */}
              <P w={W_LEN - SD} h={SH} d={SD}
                 x={xCenter - SD / 2} y={y} z={CL_S - SD / 2}
                 mat={skirtingMat} />
              <QR cx={xCenter - SD / 2} cz={CL_S - SD}
                  len={W_LEN - SD} dir="-Z" mat={skirtingMat} />

              {/* Ouest placard — face +X (plinthe contre face est cuisine) */}
              <P w={SD} h={SH} d={D_LEN}
                 x={CL_W + SD / 2} y={y} z={zCenter}
                 mat={skirtingMat} />
              <QR cx={CL_W + SD} cz={zCenter}
                  len={D_LEN} dir="+X" mat={skirtingMat} />
            </>
          );
        })()}

        {/* South wall segment 2: X: 125→198.5 (s'arrête à 1.5cm du bord du trou x=200), Z=395 */}
        <P w={73.5} h={SH} d={SD}
           x={161.75} y={y} z={INT_Z_ROOM_S - SD / 2}
           mat={skirtingMat} />
        <QR cx={161.75} cz={INT_Z_ROOM_S - SD}
            len={73.5} dir="-Z" mat={skirtingMat} />

        {/* Kitchen east wall X=125, Z: 395→455 */}
        <P w={SD} h={SH} d={INT_Z_KITCHEN_B - INT_Z_ROOM_S}
           x={INT_X_KITCHEN_R - SD / 2} y={y} z={(INT_Z_ROOM_S + INT_Z_KITCHEN_B) / 2}
           mat={skirtingMat} />
        <QR cx={INT_X_KITCHEN_R - SD} cz={(INT_Z_ROOM_S + INT_Z_KITCHEN_B) / 2}
            len={INT_Z_KITCHEN_B - INT_Z_ROOM_S} dir="-X" mat={skirtingMat} />

        {/* Kitchen south wall Z=455, X: 35→125 */}
        <P w={INT_X_KITCHEN_R - INT_X_KITCHEN_L} h={SH} d={SD}
           x={(INT_X_KITCHEN_L + INT_X_KITCHEN_R) / 2} y={y} z={INT_Z_KITCHEN_B - SD / 2}
           mat={skirtingMat} />
        <QR cx={(INT_X_KITCHEN_L + INT_X_KITCHEN_R) / 2} cz={INT_Z_KITCHEN_B - SD}
            len={INT_X_KITCHEN_R - INT_X_KITCHEN_L} dir="-Z" mat={skirtingMat} />

        {/* Kitchen west wall X=35, Z: 395→455 */}
        <P w={SD} h={SH} d={INT_Z_KITCHEN_B - INT_Z_ROOM_S}
           x={INT_X_KITCHEN_L + SD / 2} y={y} z={(INT_Z_ROOM_S + INT_Z_KITCHEN_B) / 2}
           mat={skirtingMat} />
        <QR cx={INT_X_KITCHEN_L + SD} cz={(INT_Z_ROOM_S + INT_Z_KITCHEN_B) / 2}
            len={INT_Z_KITCHEN_B - INT_Z_ROOM_S} dir="+X" mat={skirtingMat} />

        {/* South wall segment 1: X: -10→35, Z=395 */}
        <P w={INT_X_KITCHEN_L - INT_X_NICHE} h={SH} d={SD}
           x={(INT_X_NICHE + INT_X_KITCHEN_L) / 2} y={y} z={INT_Z_ROOM_S - SD / 2}
           mat={skirtingMat} />
        <QR cx={(INT_X_NICHE + INT_X_KITCHEN_L) / 2} cz={INT_Z_ROOM_S - SD}
            len={INT_X_KITCHEN_L - INT_X_NICHE} dir="-Z" mat={skirtingMat} />

        {/* Niche west wall X=-10, Z: 285→395 */}
        <P w={SD} h={SH} d={INT_Z_ROOM_S - INT_Z_NICHE_S}
           x={INT_X_NICHE + SD / 2} y={y} z={(INT_Z_NICHE_S + INT_Z_ROOM_S) / 2}
           mat={skirtingMat} />
        <QR cx={INT_X_NICHE + SD} cz={(INT_Z_NICHE_S + INT_Z_ROOM_S) / 2}
            len={INT_Z_ROOM_S - INT_Z_NICHE_S} dir="+X" mat={skirtingMat} />

        {/* Niche north face Z=285, X: -10→0 */}
        <P w={INT_X_WEST - INT_X_NICHE} h={SH} d={SD}
           x={(INT_X_NICHE + INT_X_WEST) / 2} y={y} z={INT_Z_NICHE_S + SD / 2}
           mat={skirtingMat} />
        <QR cx={(INT_X_NICHE + INT_X_WEST) / 2} cz={INT_Z_NICHE_S + SD}
            len={INT_X_WEST - INT_X_NICHE} dir="+Z" mat={skirtingMat} />

        {/* West wall X=0, Z: 0→285 */}
        <P w={SD} h={SH} d={INT_Z_NICHE_S - INT_Z_NORTH}
           x={INT_X_WEST + SD / 2} y={y} z={(INT_Z_NORTH + INT_Z_NICHE_S) / 2}
           mat={skirtingMat} />
        <QR cx={INT_X_WEST + SD} cz={(INT_Z_NORTH + INT_Z_NICHE_S) / 2}
            len={INT_Z_NICHE_S - INT_Z_NORTH} dir="+X" mat={skirtingMat} />
      </group>
    </MergedStaticGroup>
  );
}

// ── Plinthes carrelage SDB — H=10, D=1 cm sur tout le périmètre ────────────
function BathSkirting() {
  const SH_T = 10;
  const SD_T = 1;
  const y = SH_T / 2;

  const tileMat = useMemo(() => {
    const tex = makeTileTex();
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(0.5, 1); // un carreau ~20cm horizontal × 10cm vertical
    tex.needsUpdate = true;
    return new THREE.MeshStandardMaterial({
      map: tex, roughness: 0.25, metalness: 0.05,
    });
  }, []);

  // Faces intérieures SDB
  const BATH_E_FACE  = CORR_WALL_X - PARTITION_THICKNESS / 2; // 192 — face ouest du mur couloir = est de la SDB
  const BATH_S_FACE  = BATH_Z_END;                  // 610 — face nord des piliers shower-ne / bath-se
  const SHOWER_E_X   = 65 + PARTITION_THICKNESS / 2; // 68.6 — face est du mur shower-ne/se (côté SDB main)

  // Coins SDB (cf Tile())
  const Bz = DiagWall.A.z + (INT_X_NICHE  - DiagWall.A.x) * DiagWall.slope; // ≈ 727.5
  const corridorXEnd = KITCHEN_X1 + WALL_THICKNESS; // 140
  const Cz = DiagWall.A.z + (corridorXEnd - DiagWall.A.x) * DiagWall.slope; // ≈ 642.1 (Z à X=140)

  // Porte SDB sur mur est (CORR_WALL_X) : ouverture brute de 86cm centrée sur Z=560 (517 à 603)
  const CORR_DOOR_S = 517;  // 517
  const CORR_DOOR_E = 603;  // 603

  const showerWallZCenter1 = KITCHEN_Z + PARTITION_THICKNESS + 140 + PARTITION_THICKNESS / 2;
  const showerWallZCenter2 = showerWallZCenter1 + 70;
  const showerWallZ1 = showerWallZCenter1 + PARTITION_THICKNESS / 2;
  const showerWallZ2 = showerWallZCenter2 - PARTITION_THICKNESS / 2;

  // Segment diagonal SDB : de C (d=dC) à B (d=dB)
  const dC = Math.sqrt((corridorXEnd - DiagWall.A.x) ** 2 + (Cz - DiagWall.A.z) ** 2);
  const dB = Math.sqrt((INT_X_NICHE  - DiagWall.A.x) ** 2 + (Bz - DiagWall.A.z) ** 2);
  const dm = (dC + dB) / 2;
  const { x: diagX, z: diagZ } = DiagWall.p(dm, SD_T / 2);
  const diagLen = dB - dC;

  return (
    <MergedStaticGroup name="merged-skirting">
      <group userData={{ brickType: 'skirting' }}>
        {/* Mur nord SDB — Z=467.2, X: -10→200, face +Z */}
        <P w={INT_X_DOOR_S - INT_X_NICHE} h={SH_T} d={SD_T}
           x={(INT_X_NICHE + INT_X_DOOR_S) / 2} y={y} z={INT_Z_BATH_N + SD_T / 2}
           mat={tileMat} />

        {/* Mur ouest SDB — X=-10, Z: 467.2→Bz, face +X */}
        <P w={SD_T} h={SH_T} d={Bz - INT_Z_BATH_N}
           x={INT_X_NICHE + SD_T / 2} y={y} z={(INT_Z_BATH_N + Bz) / 2}
           mat={tileMat} />

        {/* Mur est SDB — segment nord (Z: 467.2→515.5, s'arrête à 1.5cm du bord du trou z=517), face -X */}
        <P w={SD_T} h={SH_T} d={(CORR_DOOR_S - 1.5) - INT_Z_BATH_N}
           x={BATH_E_FACE - SD_T / 2} y={y} z={(INT_Z_BATH_N + (CORR_DOOR_S - 1.5)) / 2}
           mat={tileMat} />
        {/* Mur est SDB — segment sud (Z: 604.5→610, s'arrête à 1.5cm du bord du trou z=603), face -X */}
        <P w={SD_T} h={SH_T} d={BATH_S_FACE - (CORR_DOOR_E + 1.5)}
           x={BATH_E_FACE - SD_T / 2} y={y} z={((CORR_DOOR_E + 1.5) + BATH_S_FACE) / 2}
           mat={tileMat} />

        {/* Mur sud SDB (entre shower-ne et bath-se) : pas de plinthe — rail
            du placard SDB coulissant occupe l'espace. */}

        {/* Pilier shower-ne — face nord (face -Z) */}
        <P w={PARTITION_THICKNESS} h={SH_T} d={SD_T}
           x={65} y={y} z={showerWallZCenter1 - PARTITION_THICKNESS / 2 - SD_T / 2}
           mat={tileMat} />

        {/* Pilier shower-ne — face est (face +X) */}
        <P w={SD_T} h={SH_T} d={PARTITION_THICKNESS}
           x={65 + PARTITION_THICKNESS / 2 + SD_T / 2} y={y} z={showerWallZCenter1}
           mat={tileMat} />

        {/* Mur est de la douche (x=65, z=620→680), côté SDB main (face +X) */}
        <P w={SD_T} h={SH_T} d={showerWallZ2 - showerWallZ1}
           x={SHOWER_E_X + SD_T / 2} y={y} z={(showerWallZ1 + showerWallZ2) / 2}
           mat={tileMat} />

        {/* Mur diagonal SDB — de C(140, Cz) à B(-10, Bz) */}
        <mesh position={[diagX, y, diagZ]} rotation-y={DiagWall.rotY}
              ref={(m) => { if (m) m.material = tileMat as any; }}
              castShadow receiveShadow>
          <boxGeometry args={[SD_T, SH_T, diagLen]} />
        </mesh>
      </group>
    </MergedStaticGroup>
  );
}

// ── Composant principal ────────────────────────────────────────────────────────
export function Floor() {
  const showGrass = useSceneStore(state => state.layers.grass);
  return (
    <>
      {/* Parquet séjour + cuisine */}
      <Parquet />

      {/* Carrelage bath + couloir */}
      <Tile />

      {/* Plinthes parquet */}
      <Baseboards />

      {/* Plinthes carrelage SDB */}
      <BathSkirting />

      {/* Dalle béton sous l'appartement (principale + voisins en épi) */}
      {(() => {
        const slabShape = useMemo(() => new THREE.Shape([
          new THREE.Vector2(-20, 30),
          new THREE.Vector2(316, 30),
          new THREE.Vector2(316, 230),   // étendu à 230 pour couvrir pilier garden-e (z=-225±5)
          new THREE.Vector2(326, 230),
          new THREE.Vector2(326, 220),
          new THREE.Vector2(326, -547.77),
          new THREE.Vector2(-20, -747.53),
        ]), []);

        // Plan top : ShapeGeometry plate, normale +Y, visible d'en haut.
        const slabTopGeo = useMemo(() => {
          const g = new THREE.ShapeGeometry(slabShape);
          g.rotateX(-Math.PI / 2);
          return g;
        }, [slabShape]);

        // Côtés : ExtrudeGeometry caps masqués (noCapMat).
        const slabSideGeo = useMemo(() => {
          const g = new THREE.ExtrudeGeometry(slabShape, { depth: 10, bevelEnabled: false });
          g.rotateX(-Math.PI / 2);
          g.translate(0, -10, 0);
          return g;
        }, [slabShape]);

        const SlabUnit = ({ x, z }: { x: number; z: number }) => (
          <group position={[x, -3.5, z]}>
            {/* Dessus opaque (visible d'en haut) */}
            <mesh
              geometry={slabTopGeo}
              material={slabConcreteTop}
              receiveShadow
              userData={{ brickType: 'floor' }}
            />
            {/* Côtés opaques, dessous absent (see-through depuis dessous) */}
            <mesh
              geometry={slabSideGeo}
              material={[noCapMat, slabConcreteSide]}
              receiveShadow
              userData={{ brickType: 'floor' }}
            />
          </group>
        );

        return (
          <>
            <SlabUnit x={0} z={0} />
            <SlabUnit x={ 346} z={-199.76} />
            <SlabUnit x={-346} z={ 199.76} />
          </>
        );
      })()}


      {/* Plafonds */}
      <group>
        {/* Plafond principal avec la même forme que la dalle en béton */}
        {(() => {
          const ceilShape = useMemo(() => {
            return new THREE.Shape([
              new THREE.Vector2(-20, 30),
              new THREE.Vector2(316, 30),
              new THREE.Vector2(316, 230),
              new THREE.Vector2(326, 230),
              new THREE.Vector2(326, 220),
              new THREE.Vector2(326, -547.77),
              new THREE.Vector2(-20, -747.53),
            ]);
          }, []);

          const ceilBottomGeo = useMemo(() => {
            const geo = new THREE.ShapeGeometry(ceilShape);
            geo.rotateX(-Math.PI / 2);
            return geo;
          }, [ceilShape]);

          return (
            <group position={[0, WALL_H - 1, 0]}>
              {/* Dessous opaque (visible d'en bas) */}
              <mesh
                geometry={ceilBottomGeo}
                material={ceilBottomBack}
                receiveShadow
                userData={{ brickType: 'ceiling' }}
              />
            </group>
          );
        })()}

        {/* Plafond terrasse (235×150cm côté Est) */}
        <mesh
          ref={(m) => { if (m) m.material = ceilMats as any; }}
          position={[300 - 235 / 2 + 16, WALL_H - 1 + CEIL_THICK / 2, BLDG_Z_MIN - 75]}
          userData={{ brickType: 'ceiling' }}
        >
          <boxGeometry args={[235, CEIL_THICK, 150]} />
        </mesh>
      </group>

      {/* Sol extérieur — correspond aux bornes de la grille X[-400,700] × Z[-1000,1000] */}
      <mesh
        ref={(m) => { if (m) m.material = groundExteriorMat; }}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[150, -10, 0]}
        receiveShadow
        userData={{ brickType: 'ground' }}
      >
        <planeGeometry args={[1100, 2000]} />
      </mesh>

      {/* Gazon 3D HD ciblé uniquement sur le jardin privatif */}
      {showGrass && <GrassGround yPos={-3.48} />}


    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MIRRORS — miroirs Nissedal avec THREE.Reflector
// ═══════════════════════════════════════════════════════════════════════════════


const kallaxW1 = 40.5; // kallaxW(1)

const MIRROR_BASE_MASK = (1 << 0) | (1 << LAYER_WALKER_DETAIL) | (1 << LAYER_WALKER);

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
    // Résolution de base basse pour sauver les FPS. Le mode HD est géré via cameraState.
    const res = cameraState.mirrorsHD ? 512 : 256;
    const mir = new Reflector(new THREE.PlaneGeometry(w, h), {
      textureWidth:  res,
      textureHeight: res,
      color: 0xbbbbbb,
    } as ConstructorParameters<typeof Reflector>[1]);
    mir.position.set(...position);
    mir.rotation.y = rotationY;
    mir.camera.layers.mask = MIRROR_BASE_MASK;

    const origOnBeforeRender = mir.onBeforeRender.bind(mir);
    mir.onBeforeRender = (renderer, scene, camera, geometry, material, group) => {
      if (_reflectionDepth >= 1) return;
      _reflectionDepth++;

      // Adaptation dynamique (résolution / layer mask)
      const targetRes = cameraState.mirrorsHD ? 512 : 256;
      const renderTarget = (mir as any).getRenderTarget();
      if (renderTarget && renderTarget.width !== targetRes) {
        renderTarget.setSize(targetRes, targetRes);
      }

      // En mode HD, on prend tout ce que voit la caméra principale + le Walker Detail
      mir.camera.layers.mask = cameraState.mirrorsHD ? (camera.layers.mask | MIRROR_BASE_MASK) : MIRROR_BASE_MASK;
      origOnBeforeRender(renderer, scene, camera, geometry, material, group);
      _reflectionDepth--;
    };

    return mir;
  }, []);

  return <primitive object={reflector} />;
}

function MergedReflector({ planes, position, rotationY }: {
  planes: { w: number; h: number; x: number; y: number }[];
  position: [number, number, number];
  rotationY: number;
}) {
  const reflector = useMemo(() => {
    const geos = planes.map(p => {
      const geo = new THREE.PlaneGeometry(p.w, p.h);
      geo.translate(p.x, p.y, 0);
      return geo;
    });
    const mergedGeo = mergeGeometries(geos, false);

    const res = cameraState.mirrorsHD ? 512 : 256;
    const mir = new Reflector(mergedGeo, {
      textureWidth:  res,
      textureHeight: res,
      color: 0xbbbbbb,
    } as ConstructorParameters<typeof Reflector>[1]);
    mir.position.set(...position);
    mir.rotation.y = rotationY;
    mir.camera.layers.mask = MIRROR_BASE_MASK;

    const origOnBeforeRender = mir.onBeforeRender.bind(mir);
    mir.onBeforeRender = (renderer, scene, camera, geometry, material, group) => {
      if (_reflectionDepth >= 1) return;
      _reflectionDepth++;

      const targetRes = cameraState.mirrorsHD ? 512 : 256;
      const renderTarget = (mir as any).getRenderTarget();
      if (renderTarget && renderTarget.width !== targetRes) {
        renderTarget.setSize(targetRes, targetRes);
      }

      mir.camera.layers.mask = cameraState.mirrorsHD ? (camera.layers.mask | MIRROR_BASE_MASK) : MIRROR_BASE_MASK;
      origOnBeforeRender(renderer, scene, camera, geometry, material, group);
      _reflectionDepth--;
    };

    return mir;
  }, [planes]);

  return <primitive object={reflector} />;
}

// ── 3× Nissedal 60×60 — Mur Sud ────────────────────────────────────────────────

function MirrorsD() {
  const W_M = 65, H_M = 65;
  const FT = 1.8, FD = 1.2;
  const cx  = (KITCHEN_X1 + DOOR_START) / 2;
  const fz  = ROOM_D - 2 - FD / 2;
  const mirZ = fz - 0.1;

  const planes = useMemo(() => [0, 1, 2].map(i => {
    const cy = (WALL_H - 3.5) - H_M / 2 - i * (H_M + 0.5);
    // rotationY = Math.PI -> local X = World -X.
    // worldX = cx -> localX = -cx
    return { w: W_M - FT * 2, h: H_M - FT * 2, x: -cx, y: cy };
  }), []);

  return (
    <>
      <MergedReflector planes={planes} position={[0, 0, mirZ]} rotationY={Math.PI} />
      {([0, 1, 2] as const).map((i) => {
        const cy = (WALL_H - 3.5) - H_M / 2 - i * (H_M + 0.5);
        return (
          <group key={i} userData={{ animUnit: true }}>
            <group position={[cx, cy - H_M / 2, fz]}>
              <NissedalGlbFrame glb={GLB_65x65} />
            </group>
          </group>
        );
      })}
    </>
  );
}

// ── 3× Nissedal 40×150 + 1× 70×160 — Mur Ouest ──────────────────────────────────

function MirrorsA() {
  const MA_W = 40, MA_H = 150;
  const M4_W = 70, M4_H = 160;
  const FT = 1.8, FD = 5.0; // épaisseur standard Nissedal 5cm
  const MA_START_Z  = kallaxW1 + 10;
  const MA_BOTTOM_Y = 6;
  const fx  = FD / 2; // centré pour être flush au mur à X=0
  const mirX = FD - 0.5; // glace à 0.5cm du bord avant

  const planes = useMemo(() => {
    const p: { w: number; h: number; x: number; y: number }[] = [];
    // 3 petits miroirs
    for (let i = 0; i < 3; i++) {
      const mz = MA_START_Z + MA_W / 2 + i * MA_W;
      const cy = MA_BOTTOM_Y + MA_H / 2;
      // rotationY = Math.PI/2 -> local X = World -Z.
      // worldZ = mz -> localX = -mz
      p.push({ w: MA_W - FT * 2, h: MA_H - FT * 2, x: -mz, y: cy });
    }
    // 4e grand miroir
    const mz4 = MA_START_Z + 3 * MA_W + M4_W / 2;
    const cy4 = MA_BOTTOM_Y + M4_H / 2;
    p.push({ w: M4_W - FT * 2, h: M4_H - FT * 2, x: -mz4, y: cy4 });
    return p;
  }, []);

  return (
    <>
      <MergedReflector planes={planes} position={[mirX, 0, 0]} rotationY={Math.PI / 2} />

      {([0, 1, 2] as const).map((i) => {
        const mz = MA_START_Z + MA_W / 2 + i * MA_W;
        const cy = MA_BOTTOM_Y + MA_H / 2;
        return (
          <group key={i} userData={{ animUnit: true }}>
            {/* cadre GLB — rotation-y=-π/2 : glace locale -Z → monde +X (face pièce) */}
            <group position={[fx, MA_BOTTOM_Y, mz]} rotation-y={-Math.PI / 2}>
              <NissedalGlbFrame glb={GLB_40x150} />
            </group>
          </group>
        );
      })}

      {/* 4e miroir 70×160 (procédural) */}
      {(() => {
        const mz = MA_START_Z + 3 * MA_W + M4_W / 2;
        const cy = MA_BOTTOM_Y + M4_H / 2;
        return (
          <group userData={{ animUnit: true }}>
            <group position={[fx, MA_BOTTOM_Y, mz]} rotation-y={Math.PI / 2}>
              <NissedalFrame w={M4_W} h={M4_H} ft={FT} fd={FD} />
            </group>
          </group>
        );
      })()}
    </>
  );
}

// ── Miroir vasque bath ────────────────────────────────────────────────────────

function MirrorBath() {
  const VANITY_W    = 60, VANITY_D = 47, VANITY_Y0 = 30, VANITY_H = 50;
  const VANITY_CX   = DOOR_START - 84;
  const VANITY_CZ   = KITCHEN_Z + PARTITION_THICKNESS + 1 + VANITY_D / 2;
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
  const showMirrors = useSceneStore(state => state.layers.mirrors);
  if (!showMirrors) return null;

  return (
    <MergedStaticGroup name="merged-mirror-frames">
      <MirrorsD />
      <MirrorsA />
      <MirrorBath />
    </MergedStaticGroup>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DOORS — portes placées en coordonnées monde
// ═══════════════════════════════════════════════════════════════════════════════
//
// Calcul de placement (wrapper rotY=θ, item pivot local = [px, -H/2, 0]) :
//   world_hinge = wrapper_pos + R_y(θ) * [px, -H/2, 0]
//   → wrapper_pos = [hx - px·cosθ, H/2, hz - px·sinθ]
//
//   DoorLiving : pivotX=+W/2, θ=0          → wrapper=(DOOR_START + W/2, H/2, ROOM_D + 4.5) — bord ouest flush DOOR_START
//   DoorBath    : pivotX=−W/2, θ=+π/2       → wrapper=(WALL_X, H/2, hingeZ − W/2)
//   DoorEntry  : pivotX=−W/2, θ=diagRotY−π/2 (panneau items/ s'étend en +X local,
//                structure attendue +Z → correction −π/2)


const DOOR_W_WHITE = 83;
const DOOR_W_ENTRY = 90;
const DOOR_HEIGHT  = 204;

export function DoorsPlaced() {
  const layers = useSceneStore(state => state.layers);
  const as = useFurnitureToggles({
    eastGlassDoor:         'east-glass-door-toggle',
    livingDoor:            'living-door-toggle',
    bathroomDoor:          'bathroom-door-toggle',
    entryDoor:             'entry-door-toggle',
    glassDoorV2LeftOpen:   'glass-door-v2-left-open',
    glassDoorV2ShutterPos: 'glass-door-v2-shutter-pos',
  });

  const bathHingeZ = BATH_Z_END - 10;

  const entry = useMemo(() => {
    // origin = point A avec un offset de 5cm vers l'extérieur (off=5)
    const hinge = DiagWall.p(DiagWall.door.start, 5);
    const center = DiagWall.p(DiagWall.door.start + DOOR_W_ENTRY / 2, 5);

    return {
      wx:       center.x,
      wy:       DOOR_HEIGHT / 2,
      wz:       center.z,
      diagRotY: DiagWall.rotY - Math.PI / 2,
    };
  }, []);

  return (
    <group visible={layers.doors}>
      <group
        position={[(pEast('glass-west') + pWest('glass-east')) / 2, 105, 0]}
        userData={{
          animUnit: true,
          hoverAction: {
            label: 'Porte-fenêtre',
            actions: ['eastGlassDoor', 'glassDoorLeftOpen', 'glassDoorShutter']
          }
        }}>
        <GlassDoor item={NOOP_ITEM} actionState={as} onSize={NOOP_SIZE} />
      </group>
      <group
        position={[(DOOR_START + DOOR_END) / 2, DOOR_HEIGHT / 2, ROOM_D + PARTITION_THICKNESS / 2]}
        userData={{ animUnit: true, hoverAction: { label: 'Porte séjour', actionId: 'livingDoor' } }}>
        <DoorLiving item={NOOP_ITEM} actionState={as} onSize={NOOP_SIZE} />
      </group>
      <group
        position={[CORR_WALL_X, DOOR_HEIGHT / 2, 560]}
        rotation-y={Math.PI / 2}
        userData={{ animUnit: true, hoverAction: { label: 'Porte SDB', actionId: 'bathroomDoor' } }}>
        <DoorBath item={NOOP_ITEM} actionState={as} onSize={NOOP_SIZE} />
      </group>
      <group
        position={[entry.wx, entry.wy, entry.wz]}
        rotation-y={entry.diagRotY}
        userData={{ animUnit: true, hoverAction: { label: 'Porte entrée', actionId: 'entryDoor' } }}>
        <DoorEntry item={NOOP_ITEM} actionState={as} onSize={NOOP_SIZE} />
      </group>
    </group>
  );
}
