import { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';

interface GrassGroundProps {
  yPos?: number;
}

export function GrassGround({ yPos = -3.48 }: GrassGroundProps) {
  const { scene } = useGLTF('media/glb/patch_of_grass_joined.glb');

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

  return <GrassInstances grassMesh={grassMesh} soilMesh={soilMesh} yPos={yPos} />;
}

function GrassInstances({
  grassMesh,
  soilMesh,
  yPos,
}: {
  grassMesh: THREE.Mesh;
  soilMesh: THREE.Mesh;
  yPos: number;
}) {
  const grassRef = useRef<THREE.InstancedMesh>(null);
  const soilRef = useRef<THREE.InstancedMesh>(null);

  // Pavage ciblé pour le jardin privatif : X[-100, 400] × Z[-400, -30] (largeur 500, profondeur 370)
  // Le patch d'herbe d'origine fait 200x200 cm.
  // 3 instances en X (de largeur 166.67 cm chacune) -> échelle X = 166.67 / 200 = 0.833333
  // Centres en X : -16.67, 150, 316.67
  // 2 instances en Z (de profondeur 185 cm chacune) -> échelle Z = 185 / 200 = 0.925
  // Centres en Z : -307.5, -122.5
  const columns = [-16.67, 150, 316.67];
  const rows = [-307.5, -122.5];
  const count = columns.length * rows.length;

  const scaleX = 166.67 / 200;
  const scaleZ = 185 / 200;

  useEffect(() => {
    if (!grassRef.current || !soilRef.current) return;

    // S'assurer que les matrices locales des meshes d'origine sont à jour
    grassMesh.updateMatrix();
    soilMesh.updateMatrix();

    const mGrass = grassMesh.matrix.clone();
    const mSoil = soilMesh.matrix.clone();

    // Matrice d'échelle supplémentaire pour adapter le patch
    const scaleMat = new THREE.Matrix4().makeScale(scaleX, 1, scaleZ);

    let idx = 0;

    for (const z of rows) {
      for (const x of columns) {
        // Translation + Échelle + Matrice locale d'origine
        const tMatGrass = new THREE.Matrix4()
          .makeTranslation(x, yPos, z)
          .multiply(scaleMat)
          .multiply(mGrass);
        const tMatSoil = new THREE.Matrix4()
          .makeTranslation(x, yPos, z)
          .multiply(scaleMat)
          .multiply(mSoil);

        grassRef.current.setMatrixAt(idx, tMatGrass);
        soilRef.current.setMatrixAt(idx, tMatSoil);

        idx++;
      }
    }

    grassRef.current.instanceMatrix.needsUpdate = true;
    soilRef.current.instanceMatrix.needsUpdate = true;
  }, [grassMesh, soilMesh, columns, rows, scaleX, scaleZ, yPos]);

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

useGLTF.preload('media/glb/patch_of_grass_joined.glb');
