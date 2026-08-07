import { useLayoutEffect } from 'react';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import { SceneItemProps } from '@shared/types';
import { Box3, Vector3 } from 'three';

export function BimDoubleDoor({ onSize }: SceneItemProps) {
  const { scene } = useGLTFClone('/media/S9000_Double_Door.glb');

  useLayoutEffect(() => {
    if (!scene) return;
    // IFC often uses meters (1 = 1m) or millimeters (1 = 1mm). 
    // Usually assimp converts to scene units depending on the importer, let's try scale 100 (meters to cm).
    scene.scale.set(100, 100, 100);
    // Adjust rotation if needed (BIM models might be rotated)
    scene.rotation.set(0, 0, 0);
    
    const box = new Box3().setFromObject(scene);
    const size = new Vector3();
    box.getSize(size);
    if (onSize) onSize(size);
  }, [scene, onSize]);

  // Translate down slightly if it has a weird pivot
  return <primitive object={scene} position={[0, -105, 0]} />;
}
