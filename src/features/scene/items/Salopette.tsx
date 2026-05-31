import { useGLTF } from '@react-three/drei';
import { GlbBridge } from '@features/scene/GlbBridge';
import type { SceneItemProps } from '@shared/types';

const GLB = 'media/glb/salopette-noir.glb';

export function Salopette(props: SceneItemProps) {
  return <GlbBridge glbPath={GLB} targetHeight={150} {...props} />;
}

useGLTF.preload(GLB);
