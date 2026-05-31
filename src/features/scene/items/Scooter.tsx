import { useGLTF } from '@react-three/drei';
import { GlbBridge } from '@features/scene/GlbBridge';
import type { SceneItemProps } from '@shared/types';

const GLB = 'media/glb/xiaomi_electric_scooter_4.glb';

export function Scooter(props: SceneItemProps) {
  return <GlbBridge glbPath={GLB} targetHeight={113} {...props} />;
}

useGLTF.preload(GLB);
