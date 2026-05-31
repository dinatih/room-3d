import { useGLTF } from '@react-three/drei';
import { GlbBridge } from '@features/scene/GlbBridge';
import type { SceneItemProps } from '@shared/types';

const GLB = 'media/glb/TRÅDFRI Ampoule LED E27 1055 lumen connecté sans fil variateur intensité-spectre blanc globe.glb';

export function TradfriBulb(props: SceneItemProps) {
  return <GlbBridge glbPath={GLB} {...props} />;
}

useGLTF.preload(GLB);
