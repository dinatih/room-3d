import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { GlbBridge } from '@features/scene/GlbBridge';
import type { SceneItemProps } from '@shared/types';
import { useGLTFClone } from '../useGLTFClone';
import { removeGlbLines, mergeGlbByMaterial } from '../glbUtils';

export const GLB_40x150 = 'media/glb/NISSEDAL miroir 40x150 noir.glb';
export const GLB_65x65  = 'media/glb/NISSEDAL miroir 65x65 noir.glb';
const GLB_65x150 = 'media/glb/NISSEDAL Miroir, noir, 65x150 cm.glb';

export function NissedalMirror(props: SceneItemProps) {
  return <GlbBridge glbPath={GLB_65x150} {...props} />;
}

export function NissedalGlbFrame({ glb }: { glb: string }) {
  const { scene } = useGLTFClone(glb);
  useMemo(() => {
    removeGlbLines(scene);
    scene.scale.setScalar(100);
    mergeGlbByMaterial(scene);
  }, [scene]);
  return <primitive object={scene} />;
}

export function NissedalFrame({ w, h, ft, fd }: { w: number, h: number, ft?: number, fd?: number }) {
  const glb = w === 40 ? GLB_40x150 : GLB_65x150;
  return <NissedalGlbFrame glb={glb} />;
}

useGLTF.preload(GLB_65x150);
useGLTF.preload(GLB_40x150);
useGLTF.preload(GLB_65x65);
