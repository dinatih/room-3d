import { useGLTF } from '@react-three/drei';
import { GlbBridge } from '@features/scene/GlbBridge';
import type { SceneItemProps } from '@shared/types';

const GLB = 'media/glb/toon_-_vacuum_cleaner.glb';

export function VacuumCleaner(props: SceneItemProps) {
  return <GlbBridge glbPath={GLB} targetHeight={100} {...props} />;
}

useGLTF.preload(GLB);
