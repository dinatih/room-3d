import { useGLTF } from '@react-three/drei';
import { GlbBridge } from '@features/scene/GlbBridge';
import type { SceneItemProps } from '@shared/types';

const GLB = 'media/glb/flat-screen_tv.glb';

export function TV(props: SceneItemProps) {
  return <GlbBridge glbPath={GLB} targetHeight={43} {...props} />;
}

export const TV_H = 43;
useGLTF.preload(GLB);
