/**
 * KallaxNW.tsx — Tour Kallax nord-ouest (mur Ouest + mur Nord).
 * Composant auto-contenu : 2×1 + 1×1 + 1×1 pivotés + 4 boîtes Drona.
 *
 * Les Kallax sont pivotés rotZ=π/2 (largeur devient hauteur).
 * Coordonnées locales : Y=0 = sol, centré XZ.
 * Placement monde : wrapper group dans Furniture.tsx  → rotY=−π/2
 * Utilisé aussi dans l'inventaire via registry.ts.
 */
import { useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { Kallax2x1 }      from './Kallax2x1';
import { Kallax1x1 }      from './Kallax1x1';
import { MannequinHead }  from './MannequinHead';
import { DroneCell } from './Drona';
import { Variera80136622 } from './Variera80136622';
import { MeubleT }        from './MeubleT';
import type { SceneItemProps } from '@shared/types';
import { SlidingDrona } from './SlidingDrona';
import { KALLAX_NW_DRONA_POSITIONS, DRONA_SPECIAL_ITEMS, SPECIAL_DRONA_SLIDE_DURATION } from './dronaStorage';

// ── Constantes Kallax ─────────────────────────────────────────────────────────
const TF = 3.5, TI = 1.5, NH = 34, NW_K = 33.5;
const th = (rows: number) => rows * NH + 2 * TF + (rows - 1) * TI;
const tw = (cols: number) => cols * NW_K + 2 * TF + (cols - 1) * TI;
const w1 = tw(1); // 40.5
const w2 = tw(2); // 75.5
const h1 = th(1); // 41  ← devient la profondeur visuelle une fois pivoté
const DEP = 39;   // Kallax depth (KALLAX_DEPTH)
const VAR_W = 32, VAR_D = 13; // VARIERA demi-étag dims (L × P)

// Positions en espace root (rotY=π/2 — même orientation que KallaxNE).
// nwB (2×1) cells ±17.5 → Y = w2/2 ∓ 17.5
// nwM (1×1) centre = w2 + w1/2 = 95.75
// nwT (1×1) centre = w2 + w1 + w1/2 = 136.25

const DRONA_ITEMS = Object.entries(DRONA_SPECIAL_ITEMS).filter(([, item]) => item.shelf === 'nw');

export function KallaxNWDrona({ isPreview = false, actionState = {} }: { isPreview?: boolean; actionState?: Record<string, any> } = {}) {
  return (
    <>
      {/* DRONA Instances individuelles pour animation */}
      {KALLAX_NW_DRONA_POSITIONS.map((position, i) => {
        const target = DRONA_ITEMS.find(([, item]) => item.index === i);
        return (
          <group key={i} name={`drona-nw-cell-${i}`} position={position} userData={{ sceneItemRoot: true }}>
          {target
            ? <SlidingDrona objectId={target[0]} label={target[1].label} actionId={target[1].action} duration={SPECIAL_DRONA_SLIDE_DURATION} isPreview={isPreview} actionState={actionState} />
            : <DroneCell />}
          </group>
        );
      })}
    </>
  );
}

export function KallaxNWMannequins() {
  return (
    <>
      {/* MannequinHead centré sur sommet tour, pivoté 45° vers centre pièce.
          Head forward = +Z local. rotY=3π/4 → world +X+Z (diagonale corner→centre). */}
      <group
        position={[0, w2 + 2 * w1, 6]}
        rotation-y={(3 * Math.PI) / 4}
        userData={{ skipMerge: true, hoverAction: { label: 'Tête de mannequin 1', actions: ['mannequin-kallax-nw-random', 'mannequin-kallax-nw-wig', 'mannequin-kallax-nw-color', 'mannequin-kallax-nw-wind'] } }}
      >
        <MannequinHead mannequinId="kallax-nw" />
      </group>

      {/* Tête de mannequin 3 sur MeubleT */}
      <group position={[59.5, 0, 0.75]} rotation-y={Math.PI}>
        <group position={[0, 55, 0]} rotation-y={-Math.PI / 8} userData={{ skipMerge: true, hoverAction: { label: 'Tête de mannequin 3', actions: ['mannequin-meubleT-random', 'mannequin-meubleT-wig', 'mannequin-meubleT-color', 'mannequin-meubleT-wind'] } }}>
          <MannequinHead mannequinId="meubleT" />
        </group>
      </group>
    </>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

export function KallaxNW({ onSize, noDrona, noMannequins, isPreview = false, actionState }: SceneItemProps & { noDrona?: boolean; noMannequins?: boolean }) {
  const ref = useRef<THREE.Group>(null!);
  const px = -h1 / 2; // -20.5 : center the pivoted Kallax at X=0

  useLayoutEffect(() => {
    ref.current.updateMatrixWorld(true);
    onSize(new THREE.Box3().setFromObject(ref.current).getSize(new THREE.Vector3()));
  }, []);

  return (
    <group ref={ref} rotation-y={isPreview ? Math.PI : 0}>
      {/* Sous-groupe GLB — masqué par le toggle GLB, visible par défaut */}
      {/* nwB 2×1 pivoté, Y ∈ [0, w2] */}
      <group position={[px, w2 / 2, 0]} rotation={[0, 0, Math.PI / 2]} userData={{ sceneItemRoot: true }}>
        <Kallax2x1 />
      </group>
      {/* nwM 1×1 pivoté, Y ∈ [w2, w2+w1] */}
      <group position={[px, w2 + w1 / 2, 0]} rotation={[0, 0, Math.PI / 2]} userData={{ sceneItemRoot: true }}>
        <Kallax1x1 />
      </group>
      {/* nwT 1×1 pivoté, Y ∈ [w2+w1, w2+2×w1] */}
      <group position={[px, w2 + w1 + w1 / 2, 0]} rotation={[0, 0, Math.PI / 2]} userData={{ sceneItemRoot: true }}>
        <Kallax1x1 />
      </group>

      {!noDrona && <KallaxNWDrona isPreview={isPreview} actionState={actionState} />}
      {!noMannequins && <KallaxNWMannequins />}

      {/* VARIERA demi-étagère sur sommet tour, longueur plaquée contre mur Nord.
          rotY=-π/2 : grand axe (32) le long de Z, profondeur (13) le long de X.
          Back panel contre mur Nord en local -X. Opening face pièce (+Z). */}
      <group
        position={[-h1 / 2 + VAR_D / 2, w2 + 2 * w1 + .5, DEP / 2 - VAR_W / 2]}
        rotation-y={-Math.PI / 2}
      >
        <Variera80136622 />
      </group>

      {/* MeubleT — au sol (Y = 0) à gauche des meubles Kallax, plaqué contre la glace des miroirs */}
      <group position={[59.5, 0, 0.75]} rotation-y={Math.PI}>
        <MeubleT />
      </group>

    </group>
  );
}
