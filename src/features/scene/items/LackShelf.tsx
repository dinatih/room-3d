import { useGLTF } from '@react-three/drei';
import { GlbBridge } from '@features/scene/GlbBridge';
import type { SceneItemProps } from '@shared/types';

const GLB = 'media/glb/LACK étagère murale 110x26 blanc.glb';

export function LackShelf(props: SceneItemProps) {
  return <GlbBridge glbPath={GLB} rotation={[Math.PI / 2, 0, 0]} {...props} />;
}

useGLTF.preload(GLB);
