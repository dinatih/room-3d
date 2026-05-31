import { useGLTF } from '@react-three/drei';
import { GlbBridge } from '@features/scene/GlbBridge';
import type { SceneItemProps } from '@shared/types';

const GLB = 'media/glb/DIMPA.glb';

export function Dimpa(props: SceneItemProps) {
  return <GlbBridge glbPath={GLB} {...props} />;
}

useGLTF.preload(GLB);
