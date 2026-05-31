import { useGLTF } from '@react-three/drei';
import { GlbBridge } from '@features/scene/GlbBridge';
import type { SceneItemProps } from '@shared/types';

const GLB = 'media/glb/KALLAX etag 77x77 open-top blanc.glb';

export function Kallax2x2Spec(props: SceneItemProps) {
  return <GlbBridge glbPath={GLB} rotation={[0, Math.PI / 2, 0]} {...props} />;
}

useGLTF.preload(GLB);
