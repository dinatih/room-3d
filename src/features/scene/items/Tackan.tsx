import { useLayoutEffect } from 'react';
import { useGLTFClone, preloadSceneGLTF } from '@features/scene/useGLTFClone';
import * as THREE from 'three';
import { removeGlbLines, glbLocalBBox } from '@features/scene/glbUtils';
import type { SceneModelProps } from '@shared/types';

const GLB = 'items/tackan distributeur savon blanc/TACKAN distributeur savon blanc.glb';

// Inner bottle: 5.4 cm diameter, 10.4 cm usable height above its 3 mm base.
const SOAP_RADIUS = 2.7;
const SOAP_HEIGHT = 10.4;
const SOAP_BASE = 0.3;

export function Tackan({ onSize, fillLevel = 0, soapColor = '#ef7d16' }: SceneModelProps & {
  fillLevel?: number;
  soapColor?: THREE.ColorRepresentation;
}) {
  const { scene } = useGLTFClone(GLB, true);

  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);
    removeGlbLines(scene);
    // A simple translucent bottle keeps the coloured soap visible without refraction.
    scene.traverse(object => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;
      for (const material of (Array.isArray(mesh.material) ? mesh.material : [mesh.material])) {
        if (material.name !== 'SimplygonCastMaterial_4') continue;
        const glass = material as THREE.MeshPhysicalMaterial;
        glass.color.set('#ffffff');
        glass.map = null;
        glass.transmission = 0;
        glass.transparent = true;
        glass.opacity = 0.22;
        glass.depthWrite = false;
        glass.needsUpdate = true;
      }
    });
    scene.scale.setScalar(100);
    const box = glbLocalBBox(scene);
    scene.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.min.y,
      -(box.min.z + box.max.z) / 2,
    );
    onSize?.(box.getSize(new THREE.Vector3()));
  }, [scene, onSize]);

  const soapHeight = SOAP_HEIGHT * fillLevel;
  return <group>
    <primitive object={scene} />
    {fillLevel > 0 && <mesh position={[-0.95, SOAP_BASE + soapHeight / 2, 0]}>
      <cylinderGeometry args={[SOAP_RADIUS, SOAP_RADIUS, soapHeight, 32]} />
      <meshStandardMaterial color={soapColor} roughness={0.3} />
    </mesh>}
  </group>;
}

preloadSceneGLTF(GLB);
