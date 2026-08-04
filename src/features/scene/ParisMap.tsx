import { useGLTF } from '@react-three/drei';

/**
 * Affiche la maquette 3D du quartier (Paris 13) exportée depuis Blender/OSM.
 * Model is located at /models/paris_13e.glb
 */
export function ParisMap() {
  const { scene } = useGLTF('/models/paris_13e.glb');

  // Ajustement de la position pour compenser l'altitude réelle du terrain (ex: 26m au centre)
  return (
    <group position={[0, -2600, 0]} rotation={[0, 0, 0]} scale={100}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload('/models/paris_13e.glb');


useGLTF.preload('/models/paris_13e.glb');
