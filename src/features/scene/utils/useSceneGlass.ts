import { useContext, useLayoutEffect } from 'react';
import type { Object3D } from 'three';
import { SceneModelContext } from '../useGLTFClone';
import { simplifySceneGlass } from './sceneGlass';
import { useSceneStore } from '../store/useSceneStore';

/** Only audited small objects opt in; detailed previews keep their original materials. */
export function useSceneGlass(root: Object3D): void {
  const inScene = useContext(SceneModelContext);
  const refraction = useSceneStore(state => state.graphicsQualityPreset === 'high');
  useLayoutEffect(() => inScene && !refraction ? simplifySceneGlass(root) : undefined, [root, inScene, refraction]);
}
