/**
 * useGLTFClone — useGLTF + SkeletonUtils.clone() par instance.
 *
 * useGLTF retourne le même Object3D partagé entre tous les consommateurs.
 * Pour les modèles riggés (SkinnedMesh), un .clone() standard ne suffit pas :
 * les os sont clonés mais le mesh reste lié aux os d'origine.
 *
 * SkeletonUtils.clone() s'assure que les SkinnedMesh du clone pointent vers
 * les os clonés correspondants.
 */
import { createContext, useMemo, useContext, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import * as THREE from 'three';
import { CategoryLayerContext } from './sceneLayer';
import { LAYER_WALKER_DETAIL } from '@config';
import { enableAnimatedFrustumCulling } from './utils/animatedFrustumCulling';
import { shareSkeletons } from './utils/shareSkeletons';
import { sceneModelPath } from './sceneModelPaths';
import { disposeModelResources } from './utils/disposeModelResources';

export const SceneModelContext = createContext(false);
export function preloadSceneGLTF(path: string): void {
  useGLTF.preload(sceneModelPath(path));
}

const mountedClones = new Map<string, number>();
const fullPreviewSources = new Map<THREE.Object3D, number>();
export function hasMountedGLTFClones(path: string): boolean {
  return (mountedClones.get(path) ?? 0) > 0;
}

export function useGLTFClone(path: string, ownMaterials = false): { scene: THREE.Group; animations: THREE.AnimationClip[] } {
  const sourcePath = useContext(SceneModelContext) ? sceneModelPath(path) : path;
  const gltf = useGLTF(sourcePath);
  // Loading is complete; clones need the scenes and clips, not the parser's
  // cached binary buffers, decoded intermediates and extension graph.
  delete (gltf as { parser?: unknown }).parser;
  const categoryLayer = useContext(CategoryLayerContext);

  useEffect(() => {
    mountedClones.set(path, (mountedClones.get(path) ?? 0) + 1);
    const fullPreview = sourcePath === path && sceneModelPath(path) !== path;
    if (fullPreview) fullPreviewSources.set(gltf.scene, (fullPreviewSources.get(gltf.scene) ?? 0) + 1);
    return () => {
      const count = mountedClones.get(path)! - 1;
      if (count) mountedClones.set(path, count);
      else mountedClones.delete(path);
      if (fullPreview) {
        const users = fullPreviewSources.get(gltf.scene)! - 1;
        if (users) fullPreviewSources.set(gltf.scene, users);
        else {
          fullPreviewSources.delete(gltf.scene);
          useGLTF.clear(path);
          disposeModelResources(gltf.scene);
        }
      }
    };
  }, [path, sourcePath, gltf.scene]);

  const scene = useMemo(() => {
    const cloned = SkeletonUtils.clone(gltf.scene) as THREE.Group;
    shareSkeletons(cloned);
    const baseName = path.split('/').pop()?.replace(/\.glb$/i, '') || 'Model3D';
    if (!cloned.name || cloned.name === 'Scene' || cloned.name === 'Group') {
      cloned.name = baseName;
    }
    cloned.userData = { ...cloned.userData, gltfPath: path, loadedGltfPath: sourcePath, itemName: cloned.userData.itemName || baseName };
    cloned.traverse((child) => {
      if ((child as THREE.SkinnedMesh).isSkinnedMesh) {
        enableAnimatedFrustumCulling(child as THREE.SkinnedMesh);
      }
      if ((child as THREE.Mesh).isMesh) {
        if (ownMaterials) {
          const mesh = child as THREE.Mesh;
          mesh.material = Array.isArray(mesh.material)
            ? mesh.material.map(material => material.clone())
            : mesh.material.clone();
        }
        if (!child.userData.itemName) {
          child.userData.itemName = baseName;
        }
        if (categoryLayer !== null && categoryLayer !== undefined) {
          if ((child.layers.mask & (1 << LAYER_WALKER_DETAIL)) === 0) {
            child.layers.disable(0);
            child.layers.enable(categoryLayer);
          }
        }
      }
    });
    return cloned;
  }, [gltf.scene, path, sourcePath, categoryLayer, ownMaterials]);
  return { scene, animations: gltf.animations };
}
