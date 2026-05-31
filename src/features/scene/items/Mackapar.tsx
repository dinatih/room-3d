import { useGLTF } from '@react-three/drei';
import { GlbBridge } from '@features/scene/GlbBridge';
import type { SceneItemProps } from '@shared/types';

const GLB = 'media/glb/MACKAPÄR.glb';

export function Mackapar(props: SceneItemProps) {
  // Le modèle IKEA original est tourné de 90° par rapport à notre axe X/Z.
  return <GlbBridge glbPath={GLB} rotation={[0, -Math.PI / 2, 0]} {...props} />;
}

useGLTF.preload(GLB);
