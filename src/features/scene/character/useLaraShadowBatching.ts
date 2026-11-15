import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import type { Object3D } from 'three';
import { registerLaraShadowBatching } from '../utils/laraShadowBatches';

/** Only the native clone is registered; external outfits stay on their normal path. */
export function useLaraShadowBatching(root: Object3D, enabled: boolean) {
  const { gl, scene } = useThree();
  useEffect(() => {
    if (!enabled) return;
    return registerLaraShadowBatching(gl, scene, root);
  }, [gl, scene, root, enabled]);
}
