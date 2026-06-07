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
import { useRef, useLayoutEffect, useEffect } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import {
  LAYER_STRUCTURE, LAYER_EQUIPMENT, LAYER_FURNITURE,
  LAYER_NEIGHBORS, LAYER_LIDAR, LAYER_MIRRORS,
} from '@config';

// ── Types ─────────────────────────────────────────────────────────────────────

/** Sous-ensemble de LayerState pertinent pour les layers Three.js. */
interface SceneLayers {
  structure:  boolean;
  equipment:  boolean;
  furniture:  boolean;
  neighbors:  boolean;
  lidar:      boolean;
  mirrors:    boolean;
}

// ── CategoryLayerGroup ────────────────────────────────────────────────────────

/**
 * Retire tous les descendants du layer 0 (défaut) et les place sur `layer`.
 * useLayoutEffect sans deps → ré-exécuté après chaque render pour couvrir
 * les GLBs chargés asynchronement.
 *
 * S'exécute APRÈS le useLayoutEffect des GlbLayerGroup enfants (React garantit
 * enfants avant parents), ce qui préserve le bit LAYER_GLB déjà posé.
 */
export function CategoryLayerGroup({
  layer, children,
}: { layer: number; children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null!);
  useLayoutEffect(() => {
    ref.current.traverse(obj => {
      const isDefault = (obj.layers.mask & 1) !== 0;
      const isTarget = (obj.layers.mask & (1 << layer)) !== 0;
      if (!isDefault && isTarget) return;

      obj.layers.disable(0);
      obj.layers.enable(layer);
    });
  });
  return <group ref={ref}>{children}</group>;
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
    // LAYER_GLB (4) est géré par React visible sur les groupes GLB, pas camera.layers
    // (camera.layers = OR : objet visible si partage n'importe quel bit → impossible
    //  de masquer un objet sur 2 layers en désactivant un seul bit)
    const toggles: [number, boolean][] = [
      [LAYER_STRUCTURE, layers.structure],
      [LAYER_EQUIPMENT, layers.equipment],
      [LAYER_FURNITURE, layers.furniture],
      [LAYER_NEIGHBORS, layers.neighbors],
      [LAYER_LIDAR,     layers.lidar],
      [LAYER_MIRRORS,   layers.mirrors],
    ];
    toggles.forEach(([l, visible]) => {
      if (visible) camera.layers.enable(l);
      else         camera.layers.disable(l);
    });
    invalidate();
  }, [layers, camera, invalidate]);

  return null;
}
