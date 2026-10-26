/**
 * sceneLayer.tsx — Système de layers Three.js pour la scène.
 *
 * Les catégories définies dans @config remplacent le layer 0 par défaut,
 * tout en préservant les autres bits du masque des objets.
 */
import { useRef, useLayoutEffect, createContext, useContext } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { LAYER_ENVIRONMENT, LAYER_WALKER_DETAIL } from '@config';
import { cameraState } from './cameraState';
import type { LayerState } from './sidepanel/types';
import {
  categoryLayerRegistry,
  LayerSmokeTransition,
} from './transitions/LayerSmokeTransition';

// ── Context ───────────────────────────────────────────────────────────────────

/** Contexte permettant aux hooks enfants (comme useGLTFClone) de connaître le layer de leur catégorie parente */
export const CategoryLayerContext = createContext<number | null>(null);
/** Keeps secondary canvases out of the main scene's layer transition registry. */
export const LayerRegistryContext = createContext(true);

// ── CategoryLayerGroup ────────────────────────────────────────────────────────

/**
 * Retire tous les descendants du layer 0 (défaut Three.js) et les place sur `layer`.
 * Enregistre également le groupe Three.js dans le registre pour les transitions d'animation.
 * Écoute également l'événement Three.js 'childadded' pour intercepter automatiquement
 * les modèles GLB chargés asynchronement par Suspense après le premier render.
 * Supporte le mode filaire localisé via la prop `wireframe`.
 */
export function CategoryLayerGroup({
  layer, children, visible = true, wireframe = false, register = true,
}: { layer: number; children: React.ReactNode; visible?: boolean; wireframe?: boolean; register?: boolean }) {
  const ref = useRef<THREE.Group>(null!);
  const allowRegistry = useContext(LayerRegistryContext);
  const shouldRegister = register && allowRegistry;

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
    if (shouldRegister) categoryLayerRegistry.set(layer, grp);
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
      if (shouldRegister && categoryLayerRegistry.get(layer) === grp) categoryLayerRegistry.delete(layer);
    };
  }, [layer, visible, shouldRegister]);

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
export function SceneLayerController({ layers }: { layers: LayerState }) {
  const { camera, invalidate } = useThree();

  useLayoutEffect(() => {
    camera.layers.enableAll();
    camera.layers.disable(LAYER_WALKER_DETAIL);
  }, [camera]);

  useLayoutEffect(() => {
    if (layers.environment) camera.layers.enable(LAYER_ENVIRONMENT);
    else camera.layers.disable(LAYER_ENVIRONMENT);
    invalidate();
  }, [camera, layers.environment, invalidate]);

  return <LayerSmokeTransition layers={layers} />;
}
