/**
 * Walls.tsx — Murs, cloisons, découpes diagonales et piliers porteurs de la structure.
 */
import { useMemo, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useSceneStore } from '../store/useSceneStore';
import {
  WALL_DEFS, PILLAR_DEFS, WALL_THICKNESS, GARDEN_PANEL_DEFS
} from '../wallData';
import { WoodenFencePanel } from '../items/WoodenFencePanel';
import {
  WALL_H, DiagWall
} from '@config';
import {
  wallMat, northMats, southMats, MAT_MAP, caplessX, caplessZ, makeExtrudeGeo
} from './buildingCommon';
import { DoorsPlaced } from './DoorsPlaced';

/** Ref module-level vers le group Walls — consommé par Neighbors pour clone. */
export const wallsGroupRef = { current: null as THREE.Group | null };

/** Panneau box simple avec matériau optionnel. */
export function P({ w, h, d, x, y, z, mat = wallMat, userData }: {
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

/** Segment de mur axe Z — span de z1 à z2, centré sur x=xc. */
export function WZ({ xc, z1, z2, t = WALL_THICKNESS, yBase = 0, h = WALL_H, mat = wallMat, userData }: {
  xc: number; z1: number; z2: number;
  t?: number; yBase?: number; h?: number;
  mat?: THREE.Material | THREE.Material[];
  userData?: Record<string, unknown>;
}) {
  return <P w={t} h={h} d={z2 - z1} x={xc} y={yBase + h / 2} z={(z1 + z2) / 2} mat={caplessZ(mat)} userData={userData} />;
}

/** Segment de mur axe X — span de x1 à x2, centré sur z=zc. */
export function WX({ x1, x2, zc, t = WALL_THICKNESS, yBase = 0, h = WALL_H, mat = wallMat, userData }: {
  x1: number; x2: number; zc: number;
  t?: number; yBase?: number; h?: number;
  mat?: THREE.Material | THREE.Material[];
  userData?: Record<string, unknown>;
}) {
  return <P w={x2 - x1} h={h} d={t} x={(x1 + x2) / 2} y={yBase + h / 2} z={zc} mat={caplessX(mat)} userData={userData} />;
}

export function DiagBox({ d1, d2, yBase = 0, h = WALL_H, mat = southMats, userData }: {
  d1: number; d2: number; yBase?: number; h?: number; mat?: THREE.Material | THREE.Material[]; userData?: any;
}) {
  const len = d2 - d1;
  const cx = (d1 + d2) / 2;
  const center = DiagWall.p(cx, DiagWall.depth / 2);
  return (
    <mesh
      ref={(m) => { if (m) m.material = mat as any; }}
      position={[center.x, yBase + h / 2, center.z]}
      rotation-y={DiagWall.rotY + Math.PI / 2}
      castShadow receiveShadow
      userData={userData}
    >
      <boxGeometry args={[len, h, DiagWall.depth]} />
    </mesh>
  );
}

export function SplitDiagBox(props: {
  d1: number; d2: number; yBase?: number; h?: number; mat?: THREE.Material | THREE.Material[]; userData?: any;
}) {
  const MAX_LEN = 100;
  const len = props.d2 - props.d1;
  if (len <= MAX_LEN) return <DiagBox {...props} />;
  const count = Math.ceil(len / MAX_LEN);
  const step = len / count;
  const boxes = [];
  for (let i = 0; i < count; i++) {
    const d1 = props.d1 + i * step - (i > 0 ? 0.1 : 0);
    const d2 = props.d1 + (i + 1) * step + (i < count - 1 ? 0.1 : 0);
    boxes.push(<DiagBox key={i} {...props} d1={d1} d2={d2} />);
  }
  return <>{boxes}</>;
}

function makeSprite(text: string, color: string, worldSize: number): THREE.Sprite {
  const PX = 64;
  const w  = Math.ceil(text.length * PX * 0.58 + PX * 0.6);
  const h  = Math.ceil(PX * 1.3);
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
  ctx.fillRect(0, h / 2 - PX * 0.55, w, PX * 1.1);
  ctx.font = `bold ${PX}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
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

export function PillarLabels() {
  const { scene } = useThree();

  useEffect(() => {
    const group = new THREE.Group();
    group.name = 'pillar-labels';
    const box = new THREE.Box3();

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

export function Walls({ pillarsOnly = false }: { pillarsOnly?: boolean }) {
  const wallEdges = useSceneStore(state => state.layers.wallEdges);
  const showLabels = pillarsOnly || wallEdges;

  const diagGeos = useMemo(() => {
    const eP0 = DiagWall.p(0, DiagWall.depth);
    const tC = (WALL_THICKNESS - (eP0.x - DiagWall.A.x)) / DiagWall.sin;
    const cX = DiagWall.A.x + WALL_THICKNESS;
    const cZ = eP0.z + tC * DiagWall.cos;

    const diagPillar = makeExtrudeGeo(
      [
        [eP0.x,          eP0.z],
        [cX,             cZ],
        [DiagWall.A.x + WALL_THICKNESS, DiagWall.A.z],
        [DiagWall.A.x,     DiagWall.A.z],
      ],
      WALL_H,
    );

    const ePLen = DiagWall.p(DiagWall.len, DiagWall.depth);
    const tC_sw  = ((DiagWall.C.x - WALL_THICKNESS) - ePLen.x) / DiagWall.sin;
    const cX_sw  = DiagWall.C.x - WALL_THICKNESS;
    const cZ_sw  = ePLen.z + tC_sw * DiagWall.cos;

    const diagPillarSW = makeExtrudeGeo(
      [
        [DiagWall.C.x,     DiagWall.C.z],
        [DiagWall.C.x - WALL_THICKNESS, DiagWall.C.z],
        [cX_sw,            cZ_sw],
        [ePLen.x,          ePLen.z],
      ],
      WALL_H,
    );

    return { diagPillar, diagPillarSW };
  }, []);

  return (
    <>
      {!pillarsOnly && <DoorsPlaced />}

      <group ref={(g) => { wallsGroupRef.current = g; }} name="walls-group" userData={{ itemName: 'Murs & Structure' }}>
        {showLabels && <PillarLabels />}

        {/* ── Piliers ────────────────────────────────────────────────────────── */}
        <group name="pillars">
          {PILLAR_DEFS.map((p) => {
            const pp = p as any;
            const pw = pp.w ?? WALL_THICKNESS;
            const pd = pp.d ?? WALL_THICKNESS;
            const rot = pp.rot ?? 0;
            if (rot) {
              return (
                <mesh key={pp.id} position={[pp.x, WALL_H / 2, pp.z]} rotation-y={rot}
                      material={wallMat} castShadow receiveShadow
                      userData={{ animUnit: true, brickType: 'wall', type: 'pillar', id: pp.id }}>
                  <boxGeometry args={[pw, WALL_H, pd]} />
                </mesh>
              );
            }
            return (
              <P key={pp.id} w={pw} h={WALL_H} d={pd} x={pp.x} y={WALL_H / 2} z={pp.z}
                userData={{ animUnit: true, brickType: 'wall', type: 'pillar', id: pp.id }} />
            );
          })}
          <mesh geometry={diagGeos.diagPillar} material={wallMat} castShadow receiveShadow
            userData={{ animUnit: true, brickType: 'wall', type: 'pillar', id: 'diag-ne-kite' }} />
          <mesh geometry={diagGeos.diagPillarSW} material={wallMat} castShadow receiveShadow
            userData={{ animUnit: true, brickType: 'wall', type: 'pillar', id: 'diag-sw-kite' }} />
        </group>

        {/* ── Murs ─────────────────────────────────────────────────────────────── */}
        {!pillarsOnly && (
          <group name="walls">
            {WALL_DEFS.filter(d => d.segKind !== 'door').map((d, i) => {
              const mat = MAT_MAP[d.mat ?? 'default'];
              const uData = {
                animUnit: true,
                brickType: 'wall',
                side: d.mat ?? 'misc',
                itemName: d.yBase ? 'Linteau mur' : ((d.h ?? WALL_H) < 50 ? 'Muret bas' : 'Mur'),
              };
              if (d.axis === 'z')
                return <WZ key={i} xc={d.xc} z1={d.z1} z2={d.z2} mat={mat} h={d.h} yBase={d.yBase} t={d.t} userData={uData} />;
              return <WX key={i} x1={d.x1} x2={d.x2} zc={d.zc} mat={mat} h={d.h} yBase={d.yBase} t={d.t} userData={uData} />;
            })}
            {/* Mur diagonal (partie pleine après la porte d'entrée) */}
            <SplitDiagBox d1={DiagWall.door.end} d2={DiagWall.len - WALL_THICKNESS} userData={{ animUnit: true, brickType: 'wall', side: 'diag', itemName: 'Mur diagonal' }} />

            {/* Panneaux bois occultants jardin */}
            {GARDEN_PANEL_DEFS.map((p, i) => (
              <group key={i} position={[p.cx, p.cy, p.cz]} userData={{ skipMerge: true, animUnit: true, brickType: 'wall', side: 'garden' }}>
                <WoodenFencePanel w={p.w} h={p.h} d={p.d} />
              </group>
            ))}

            {/* Mur en face du jardin (parallèle au Mur diag) */}
            {(() => {
              const wallLen = 1200;
              const cx = 150;
              const cz = -786.33;
              const rotY = DiagWall.rotY + Math.PI / 2;
              return (
                <mesh
                  ref={(m) => { if (m) m.material = northMats as any; }}
                  position={[cx, WALL_H / 2, cz]}
                  rotation-y={rotY}
                  castShadow
                  receiveShadow
                  userData={{ animUnit: true, brickType: 'wall', side: 'gardenFront' }}
                >
                  <boxGeometry args={[wallLen, WALL_H, 40]} />
                </mesh>
              );
            })()}
          </group>
        )}
      </group>
    </>
  );
}
