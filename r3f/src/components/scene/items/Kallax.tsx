/**
 * Étagère KALLAX IKEA — géométrie procédurale paramétrique.
 * Fidèle à js/furniture/kallax.js (même constantes, même positions).
 *
 * Variantes enregistrées dans le registry :
 *   2×1 (NE, SE, NW base), 2×2 (NE, SW), 1×1 (NW milieu/haut), 2×1 SW haut
 */
import { useLayoutEffect } from 'react';
import * as THREE from 'three';
import type { SceneItemProps } from '../../../types';

// ── Constantes fidèles à kallax.js ────────────────────────────────────────────
const TF  = 3.5;   // THICK_FRAME
const TI  = 1.5;   // THICK_INNER
const DEP = 39;    // D_H_EXT (profondeur)
const NH  = 34;    // NICHE_H
const NW  = 33.5;  // NICHE_W

function totalW(cols: number) { return cols * NW + 2 * TF + (cols - 1) * TI; }
function totalH(rows: number) { return rows * NH + 2 * TF + (rows - 1) * TI; }

// ── Table des variantes ────────────────────────────────────────────────────────
const VARIANTS: Record<string, { cols: number; rows: number; dronas: boolean }> = {
  'kallax-ne-2x1':   { cols: 2, rows: 1, dronas: true  },
  'kallax-ne-2x2':   { cols: 2, rows: 2, dronas: true  },
  'kallax-se-2x1':   { cols: 2, rows: 1, dronas: true  },
  'kallax-nw-2x1':   { cols: 2, rows: 1, dronas: true  },
  'kallax-nw-1x1-a': { cols: 1, rows: 1, dronas: true  },
  'kallax-nw-1x1-b': { cols: 1, rows: 1, dronas: true  },
  'kallax-sw-2x2':   { cols: 2, rows: 2, dronas: true  },
  'kallax-sw-2x1':   { cols: 2, rows: 1, dronas: false },
};

// ── Panneau bois ───────────────────────────────────────────────────────────────
function Panel({ sx, sy, sz, x, y, z }: {
  sx: number; sy: number; sz: number;
  x: number; y: number; z: number;
}) {
  return (
    <mesh position={[x, y, z]}>
      <boxGeometry args={[sx, sy, sz]} />
      <meshStandardMaterial color="#ffffff" roughness={0.7} />
    </mesh>
  );
}

// ── Composant principal ────────────────────────────────────────────────────────
export function Kallax({ item, onSize }: SceneItemProps) {
  const v = VARIANTS[item.id] ?? { cols: 2, rows: 1, dronas: false };
  const W = totalW(v.cols);
  const H = totalH(v.rows);

  useLayoutEffect(() => {
    onSize(new THREE.Vector3(W, H, DEP));
  }, []);

  const sH = H - 2 * TF;
  const sX = W / 2 - TF / 2 - 0.1;

  return (
    <group position={[0, -H / 2, 0]}>

      {/* ── Structure ── */}

      {/* Tablette haute */}
      <Panel sx={W}  sy={TF}  sz={DEP}   x={0}   y={ H/2 - TF/2}  z={0} />
      {/* Tablette basse */}
      <Panel sx={W}  sy={TF}  sz={DEP}   x={0}   y={-H/2 + TF/2}  z={0} />
      {/* Côté gauche */}
      <Panel sx={TF} sy={sH}  sz={38.8}  x={-sX} y={0}             z={0} />
      {/* Côté droit */}
      <Panel sx={TF} sy={sH}  sz={38.8}  x={ sX} y={0}             z={0} />

      {/* Séparateurs horizontaux (entre rangées) */}
      {Array.from({ length: v.rows - 1 }, (_, i) => {
        const y = H/2 - TF - (i+1)*NH - (i+0.5)*TI;
        return (
          <Panel key={`h${i}`}
            sx={W - 2*TF - 0.2} sy={TI} sz={38.6}
            x={0} y={y} z={0}
          />
        );
      })}

      {/* Séparateurs verticaux (entre colonnes) */}
      {Array.from({ length: v.cols - 1 }, (_, c) => {
        const x = -W/2 + TF + (c+1)*NW + (c+0.5)*TI;
        return Array.from({ length: v.rows }, (_, r) => {
          const y = H/2 - TF - NH/2 - r*(NH+TI);
          return (
            <Panel key={`v${c}${r}`}
              sx={TI} sy={NH} sz={38.4}
              x={x} y={y} z={0}
            />
          );
        });
      })}

      {/* ── Boîtes Drona ── */}
      {v.dronas && Array.from({ length: v.rows }, (_, r) =>
        Array.from({ length: v.cols }, (_, c) => {
          const x = -W/2 + TF + NW/2 + c*(NW+TI);
          const y =  H/2 - TF - NH/2 - r*(NH+TI);
          return (
            <mesh key={`drona${r}${c}`} position={[x, y, 0]}>
              <boxGeometry args={[NW - 1, NH - 1, 33]} />
              <meshStandardMaterial color="#c4a882" roughness={0.8} />
            </mesh>
          );
        })
      )}

    </group>
  );
}
