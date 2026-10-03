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
import { useRef, useLayoutEffect, createContext } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { LAYER_WALKER_DETAIL } from '@config';
import { cameraState } from './cameraState';
import {
  categoryLayerRegistry,
  LayerSmokeTransition,
} from './transitions/LayerSmokeTransition';

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
  smokeTransition?: boolean;
}

// ── CategoryLayerGroup ────────────────────────────────────────────────────────

/**
 * Retire tous les descendants du layer 0 (défaut Three.js) et les place sur `layer`.
 * Enregistre également le groupe Three.js dans le registre pour les transitions d'animation.
 * Écoute également l'événement Three.js 'childadded' pour intercepter automatiquement
 * les modèles GLB chargés asynchronement par Suspense après le premier render.
 * Supporte le mode filaire localisé via la prop `wireframe`.
 */
export function CategoryLayerGroup({
  layer, children, visible = true, wireframe = false,
}: { layer: number; children: React.ReactNode; visible?: boolean; wireframe?: boolean }) {
  const ref = useRef<THREE.Group>(null!);

  const assignLayers = (root: THREE.Object3D) => {
    root.traverse(obj => {
      // Ne pas écraser les masques isolés spécifiquement sur LAYER_WALKER_DETAIL (tête walker en FPV)
      if ((obj.layers.mask & (1 << 16)) !== 0) return;

      const isDefault = (obj.layers.mask & 1) !== 0;
      const isTarget = (obj.layers.mask & (1 << layer)) !== 0;
      if (!isDefault && isTarget) return;

      obj.layers.disable(0);
      obj.layers.enable(layer);
    });
  };

  const applyWireframe = (root: THREE.Object3D, wf: boolean) => {
    root.traverse(obj => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh || !mesh.material) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach(mat => {
        if ('wireframe' in mat) {
          (mat as any).wireframe = wf;
          mat.needsUpdate = true;
        }
      });
    });
  };

  useLayoutEffect(() => {
    const grp = ref.current;
    if (!grp) return;
    categoryLayerRegistry.set(layer, grp);
    if (visible !== undefined) {
      grp.visible = visible;
    }
    assignLayers(grp);
    if (wireframe) {
      applyWireframe(grp, true);
    }

    const onChildAdded = (e: any) => {
      if (e?.child) {
        assignLayers(e.child);
        if (wireframe) {
          applyWireframe(e.child, true);
        }
      }
    };

    grp.addEventListener('childadded', onChildAdded);
    return () => {
      grp.removeEventListener('childadded', onChildAdded);
      categoryLayerRegistry.delete(layer);
    };
  }, [layer, visible]);

  useLayoutEffect(() => {
    const grp = ref.current;
    if (!grp) return;
    applyWireframe(grp, !!wireframe);
    cameraState.invalidate?.();
    return () => {
      if (wireframe && grp) {
        applyWireframe(grp, false);
        cameraState.invalidate?.();
      }
    };
  }, [wireframe]);

  return (
    <CategoryLayerContext.Provider value={layer}>
      <group ref={ref} visible={visible}>{children}</group>
    </CategoryLayerContext.Provider>
  );
}

// ── SceneLayerController ──────────────────────────────────────────────────────

/**
 * Composant R3F (enfant de Canvas) qui synchronise camera.layers
 * avec les toggles UI de LayerState et orchestre les transitions de fumée Cartoon "Poof!".
 */
export function SceneLayerController({ layers }: { layers: SceneLayers }) {
  const { camera } = useThree();

  useLayoutEffect(() => {
    camera.layers.enableAll();
    camera.layers.disable(LAYER_WALKER_DETAIL);
    if (layers.mirrors === false) camera.layers.disable(17);
  }, [camera, layers.mirrors]);

  return <LayerSmokeTransition layers={layers as any} />;
}


