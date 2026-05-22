import { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';

export function GrassGround() {
  const { scene } = useGLTF('media/patch_of_grass_joined.glb');

  // Trouver les meshes correspondants à l'herbe et au sol
  const { grassMesh, soilMesh } = useMemo(() => {
    let grass: THREE.Mesh | null = null;
    let soil: THREE.Mesh | null = null;
    scene.traverse((child) => {
      if (child.type === 'Mesh') {
        const mesh = child as THREE.Mesh;
        if (mesh.name.includes('grass')) {
          grass = mesh;
        } else if (mesh.name.includes('Soil')) {
          soil = mesh;
        }
      }
    });
    return { grassMesh: grass, soilMesh: soil };
  }, [scene]);

  if (!grassMesh || !soilMesh) return null;

  return <GrassInstances grassMesh={grassMesh} soilMesh={soilMesh} />;
}

function GrassInstances({ grassMesh, soilMesh }: { grassMesh: THREE.Mesh; soilMesh: THREE.Mesh }) {
  const grassRef = useRef<THREE.InstancedMesh>(null);
  const soilRef = useRef<THREE.InstancedMesh>(null);

  // Bornes de la grille : X[-400, 700] × Z[-600, 1000]
  // Le patch d'herbe d'origine fait 200x200 cm (2x2 mètres).
  // Pour paver uniformément la zone :
  // X: -300, -100, 100, 300, 500, 700 (6 colonnes)
  // Z: -500, -300, -100, 100, 300, 500, 700, 900 (8 lignes)
  const columns = [-300, -100, 100, 300, 500, 700];
  const rows = [-500, -300, -100, 100, 300, 500, 700, 900];
  const count = columns.length * rows.length;

  useEffect(() => {
    if (!grassRef.current || !soilRef.current) return;

    // S'assurer que les matrices locales des meshes d'origine sont à jour
    grassMesh.updateMatrix();
    soilMesh.updateMatrix();

    const mGrass = grassMesh.matrix.clone();
    const mSoil = soilMesh.matrix.clone();

    let idx = 0;

    for (const z of rows) {
      for (const x of columns) {
        // Translation vers la position de l'instance (à Y = -10 pour s'aligner avec le sol extérieur)
        const tMatGrass = new THREE.Matrix4().makeTranslation(x, -10, z).multiply(mGrass);
        const tMatSoil = new THREE.Matrix4().makeTranslation(x, -10, z).multiply(mSoil);

        grassRef.current.setMatrixAt(idx, tMatGrass);
        soilRef.current.setMatrixAt(idx, tMatSoil);

        idx++;
      }
    }

    grassRef.current.instanceMatrix.needsUpdate = true;
    soilRef.current.instanceMatrix.needsUpdate = true;
  }, [grassMesh, soilMesh, columns, rows]);

  return (
    <group>
      {/* Sol sous-jacent (terre) */}
      <instancedMesh
        ref={soilRef}
        args={[soilMesh.geometry, soilMesh.material, count]}
        receiveShadow
      />
      {/* Brins d'herbe 3D */}
      <instancedMesh
        ref={grassRef}
        args={[grassMesh.geometry, grassMesh.material, count]}
        castShadow
        receiveShadow
      />
    </group>
  );
}

useGLTF.preload('media/patch_of_grass_joined.glb');
