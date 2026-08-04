import { useGLTF } from '@react-three/drei';
import { useLayoutEffect, useState, useEffect } from 'react';
import * as THREE from 'three';

/**
 * Affiche la maquette 3D du quartier (Paris 13) exportée depuis Blender/OSM.
 * Model is located at /models/paris_13e.glb
 */
export function ParisMap() {
  const { scene } = useGLTF('/models/paris_13e.glb');
  
  // State for manual adjustments
  const [pos, setPos] = useState<[number, number, number]>([0, -2600, 0]);

  useLayoutEffect(() => {
    scene.traverse((child: any) => {
      if (child.isMesh) {
        const name = child.name.toLowerCase();
        let color = '#d3cec4'; // default buildings

        if (name.includes('water')) color = '#1b5b82';
        else if (name.includes('forest') || name.includes('vegetation') || name.includes('terrain')) color = '#2e7532';
        else if (name.includes('road') || name.includes('pedestrian') || name.includes('footway')) color = '#555555';
        else if (name.includes('railway')) color = '#333333';
        else if (name.includes('building')) color = '#d3cec4';

        child.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color(color),
          roughness: 0.9,
          metalness: 0.0,
        });
        
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey) {
        setPos(p => {
          let np = [...p] as [number, number, number];
          if (e.key === 'ArrowUp') np[2] -= 100;
          if (e.key === 'ArrowDown') np[2] += 100;
          if (e.key === 'ArrowLeft') np[0] -= 100;
          if (e.key === 'ArrowRight') np[0] += 100;
          if (e.key === 'PageUp') np[1] += 100;
          if (e.key === 'PageDown') np[1] -= 100;
          console.log('Map position:', np);
          return np;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <group position={pos} rotation={[0, 0, 0]} scale={100}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload('/models/paris_13e.glb');



useGLTF.preload('/models/paris_13e.glb');
