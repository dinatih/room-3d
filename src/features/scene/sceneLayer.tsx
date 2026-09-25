/**
 * sceneLayer.tsx — Système de layers Three.js pour la scène.
 *
 * Layers (définis dans @config) :
 *   0 LAYER_STRUCTURE  — murs, sol, plafond, walker (reflétés dans les miroirs)
 *   1 LAYER_EQUIPMENT  — WC, douche, évier, chauffe-eau…
 *   2 LAYER_FURNITURE  — lit, tables, chaises, étagères, miroirs…
 *   3 LAYER_NETWORKS   — tuyauterie, électricité (optionnel)
 *   4 LAYER_GLB        — sous-filtre transversal : items GLB à l'intérieur d'une catégorie
 *   5 LAYER_NEIGHBORS  — appartements voisins
 *   6 LAYER_LIDAR      — scan LiDAR
 *
 * Règle fondamentale : tout objet appartient à exactement un layer de catégorie
 * (0-3, 5, 6) ET éventuellement au bit LAYER_GLB en supplément.
 *
 * Pourquoi disable(0)+enable(N) et non set(N) ?
 *   set(N) écrase tout le bitmask → impossible d'accumuler des layers.
 *   Avec disable(0)+enable(N), le parent CategoryLayerGroup retire le layer
 *   par défaut (0) et assigne la catégorie, sans toucher au bit GLB déjà posé
 *   par un GlbLayerGroup enfant (dont useLayoutEffect s'exécute avant).
 */
import { useRef, useLayoutEffect, useEffect, createContext } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import {
  LAYER_STRUCTURE, LAYER_EQUIPMENT, LAYER_FURNITURE, LAYER_FURNISHINGS, LAYER_DECOR,
  LAYER_NEIGHBORS, LAYER_LIDAR, LAYER_MIRRORS, LAYER_WALKER,
  LAYER_WALKER_DETAIL, LAYER_ANIMALS, LAYER_ENVIRONMENT,
  LAYER_WALL_STRUCTURE, LAYER_FLOOR_COVERINGS, LAYER_AI_ZONES,
  LAYER_DOORS, LAYER_GRASS,
} from '@config';

// ── Context ───────────────────────────────────────────────────────────────────

/** Contexte permettant aux hooks enfants (comme useGLTFClone) de connaître le layer de leur catégorie parente */
export const CategoryLayerContext = createContext<number | null>(null);

// ── Types ─────────────────────────────────────────────────────────────────────

/** Sous-ensemble de LayerState pertinent pour les layers Three.js. */
interface SceneLayers {
  structure:       boolean;
  wallStructure?:  boolean;
  floorCoverings?: boolean;
  doors?:          boolean;
  aiZones?:        boolean;
  environment?:    boolean;
  bermudaGrass?:   boolean;
  equipment:       boolean;
  furniture:       boolean;
  furnishings:     boolean;
  decor:           boolean;
  neighbors:       boolean;
  lidar:           boolean;
  mirrors:         boolean;
  walker:          boolean;
  animals?:        boolean;
}

// ── CategoryLayerGroup ────────────────────────────────────────────────────────

/**
 * Retire tous les descendants du layer 0 (défaut Three.js) et les place sur `layer`.
 * Écoute également l'événement Three.js 'childadded' pour intercepter automatiquement
 * les modèles GLB chargés asynchronement par Suspense après le premier render.
 */
export function CategoryLayerGroup({
  layer, children,
}: { layer: number; children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null!);

  const assignLayers = (root: THREE.Object3D) => {
    root.traverse(obj => {
      // Ne pas écraser les masques isolés spécifiquement sur LAYER_WALKER_DETAIL (tête walker en FPV)
      if ((obj.layers.mask & (1 << LAYER_WALKER_DETAIL)) !== 0) return;

      const isDefault = (obj.layers.mask & 1) !== 0;
      const isTarget = (obj.layers.mask & (1 << layer)) !== 0;
      if (!isDefault && isTarget) return;

      obj.layers.disable(0);
      obj.layers.enable(layer);
    });
  };

  useLayoutEffect(() => {
    const grp = ref.current;
    if (!grp) return;
    assignLayers(grp);

    const onChildAdded = (e: any) => {
      if (e?.child) assignLayers(e.child);
    };

    grp.addEventListener('childadded', onChildAdded);
    return () => {
      grp.removeEventListener('childadded', onChildAdded);
    };
  });

  return (
    <CategoryLayerContext.Provider value={layer}>
      <group ref={ref}>{children}</group>
    </CategoryLayerContext.Provider>
  );
}

// ── SceneLayerController ──────────────────────────────────────────────────────

/**
 * Composant R3F (enfant de Canvas) qui synchronise camera.layers
 * avec les toggles UI de LayerState.
 * Un seul composant remplace tous les <group visible={layers.X}> de catégorie.
 */
export function SceneLayerController({ layers }: { layers: SceneLayers }) {
  const { camera, invalidate } = useThree();

  useEffect(() => {
    // Le calque 0 (défaut Three.js) reste toujours activé pour les éléments système/caméras
    camera.layers.enable(0);

    // LAYER_GLB (4) est géré par React visible sur les groupes GLB, pas camera.layers
    // (camera.layers = OR : objet visible si partage n'importe quel bit → impossible
    //  de masquer un objet sur 2 layers en désactivant un seul bit)
    const toggles: [number, boolean][] = [
      [LAYER_STRUCTURE,       layers.structure],
      [LAYER_WALL_STRUCTURE,  layers.wallStructure ?? true],
      [LAYER_FLOOR_COVERINGS, layers.floorCoverings ?? true],
      [LAYER_DOORS,           layers.doors ?? true],
      [LAYER_AI_ZONES,        layers.aiZones ?? false],
      [LAYER_ENVIRONMENT,     layers.environment ?? true],
      [LAYER_GRASS,           layers.bermudaGrass ?? true],
      [LAYER_EQUIPMENT,       layers.equipment],
      [LAYER_FURNITURE,       layers.furniture],
      [LAYER_FURNISHINGS,     layers.furnishings],
      [LAYER_DECOR,           layers.decor],
      [LAYER_NEIGHBORS,       layers.neighbors],
      [LAYER_LIDAR,           layers.lidar],
      [LAYER_MIRRORS,         layers.mirrors],
      [LAYER_WALKER,          layers.walker],
      [LAYER_ANIMALS,         layers.animals ?? true],
    ];
    toggles.forEach(([l, visible]) => {
      if (visible) camera.layers.enable(l);
      else         camera.layers.disable(l);
    });
    invalidate();
  }, [layers, camera, invalidate]);

  return null;
}

