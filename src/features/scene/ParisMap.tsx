import { useGLTF } from '@react-three/drei';
import { useLayoutEffect } from 'react';
import * as THREE from 'three';

/**
 * Affiche la maquette 3D du quartier (Paris 13) exportée depuis Blender/OSM.
 * Model is located at /models/paris_13e.glb
 */
export function ParisMap() {
  const { scene } = useGLTF('/models/paris_13e.glb');

  useLayoutEffect(() => {
    // Override materials based on OSM mesh names since Blosm node materials
    // don't always export base colors cleanly to glTF.
    scene.traverse((child: any) => {
      if (child.isMesh) {
        const name = child.name.toLowerCase();
        let color = '#dddddd'; // default buildings

        if (name.includes('water')) {
          color = '#1b5b82'; // Seine
        } else if (name.includes('forest') || name.includes('vegetation')) {
          color = '#2e7532'; // Parcs / Arbres
        } else if (name.includes('road') || name.includes('pedestrian') || name.includes('footway')) {
          color = '#555555'; // Routes / Trottoirs
        } else if (name.includes('railway')) {
          color = '#333333'; // Rails
        } else if (name.includes('building')) {
          color = '#d3cec4'; // Bâtiments
        }

        // Apply a new simple material
        child.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color(color),
          roughness: 0.8,
          metalness: 0.1,
        });
        
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene]);

  // Ajustement de la position / rotation si nécessaire (selon l'export d'origine)
  return (
    <group position={[0, 0, 0]} rotation={[0, 0, 0]} scale={100}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload('/models/paris_13e.glb');
