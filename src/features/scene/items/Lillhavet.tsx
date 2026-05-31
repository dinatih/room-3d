import { useGLTF } from '@react-three/drei';
import { GlbBridge } from '@features/scene/GlbBridge';
import type { SceneItemProps } from '@shared/types';

const GLB = 'media/glb/LILLHAVET.glb';

export function Lillhavet(props: SceneItemProps) {
  return <GlbBridge glbPath={GLB} {...props} />;
}

useGLTF.preload(GLB);
