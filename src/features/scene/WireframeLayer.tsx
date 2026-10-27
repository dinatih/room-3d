/**
 * WireframeLayer.tsx — active le mode wireframe filaire sur tous les matériaux
 * de la scène tout en conservant leurs couleurs, textures et teintes d'origine.
 */
import { useEffect } from 'react';
import { useThree }  from '@react-three/fiber';
import { enableWireframe } from './utils/wireframe';

export function WireframeLayer() {
  const { scene, invalidate } = useThree();

  useEffect(() => enableWireframe(scene, invalidate), [scene, invalidate]);

  return null;
}
