import { createContext, useContext, useLayoutEffect } from 'react';
import type { Object3D } from 'three';
import { SceneModelContext } from '../useGLTFClone';
import { simplifySceneGlass } from './sceneGlass';

export const OptimizedGlassContext = createContext<boolean | undefined>(undefined);
export const SCENE_GLASS_ITEM_IDS = ['phone', 'ninja-sp101', 'air-performer', 'air-performer-remote'];

/** All scene presets use optimized glass; previews can compare both versions. */
export function useSceneGlass(root: Object3D): void {
  const inScene = useContext(SceneModelContext);
  const override = useContext(OptimizedGlassContext);
  const optimized = override ?? inScene;
  useLayoutEffect(() => optimized ? simplifySceneGlass(root) : undefined, [root, optimized]);
}
