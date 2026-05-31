import { useGLTF } from '@react-three/drei';
import { GlbBridge } from '@features/scene/GlbBridge';
import type { SceneItemProps } from '@shared/types';

const GLB = 'media/glb/ÄNGSJÖN - BACKSJÖN Meuble avec tiroirs-vasque-mitigeur brillant blanc 60x48x69 cm.glb';

export function VasqueSdb(props: SceneItemProps) {
  return <GlbBridge glbPath={GLB} {...props} />;
}

useGLTF.preload(GLB);
