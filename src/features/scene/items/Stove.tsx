import { useGLTF } from '@react-three/drei';
import { GlbBridge } from '@features/scene/GlbBridge';
import type { SceneItemProps } from '@shared/types';

const GLB = 'media/glb/TILLREDA Plaque de cuisson induction mobile, 2 zones blanc.glb';

export function Stove(props: SceneItemProps) {
  return <GlbBridge glbPath={GLB} {...props} />;
}

useGLTF.preload(GLB);
